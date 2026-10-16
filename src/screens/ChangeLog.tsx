import { useEffect, useState } from "react";
import type { Json } from "../db.types";
import { periodOf } from "../pay";
import {
  approvedPeople,
  changeLog,
  waitingPeople,
  type Change,
  type LoggedTable,
} from "../supabase";
import {
  BackBar,
  dayLabel,
  dayMonth,
  ErrorAlert,
  fullDate,
  money,
  periodName,
  roleLabel,
  todayInBangkok,
} from "../ui";

/** A field of a logged row, or undefined when the row has none. */
function get(row: Json | null, key: string): Json | undefined {
  return row !== null && typeof row === "object" && !Array.isArray(row) ? row[key] : undefined;
}

const text = (value: Json | undefined) => (typeof value === "string" ? value : null);
const amount = (value: Json | undefined) => (typeof value === "number" ? money(value) : null);
const date = (value: Json | undefined) => {
  const day = text(value);
  return day === null ? null : fullDate(day);
};
const periodOfEnd = (value: Json | undefined) => {
  const end = text(value);
  const period = end === null ? null : periodOf(end);
  return period === null ? null : periodName(period);
};
/** OT ranges "18:00-20:30" as "18:00–20:30, …"; no ranges = nothing to show. */
const ranges = (value: Json | undefined) =>
  Array.isArray(value) && value.length > 0
    ? value.map((range) => (text(range) ?? "").replace("-", "–")).join(", ")
    : null;
const count = (value: Json | undefined) =>
  Array.isArray(value) && value.length > 0 ? value.length.toString() : null;
const yes = (value: Json | undefined) => (value === true ? "yes" : null);
const role = (value: Json | undefined) => {
  switch (value) {
    case "admin":
    case "nanny":
    case "waiting":
      return roleLabel(value);
    default:
      return null;
  }
};

/** A shown field of a logged row: its label and its value in readable form (null = none). */
interface Field {
  label: string;
  show: (row: Json | null) => string | null;
}
const field = (label: string, key: string, format: (value: Json | undefined) => string | null) => ({
  label,
  show: (row: Json | null) => format(get(row, key)),
});
const snapshotField = (label: string, key: string): Field => ({
  label,
  show: (row) => amount(get(get(row, "snapshot") ?? null, key)),
});

/** What a row is ("Day Tue 17 Nov") and which of its fields the log shows. */
function describe(tbl: LoggedTable, row: Json | null): { subject: string; fields: Field[] } {
  switch (tbl) {
    case "days":
      return {
        subject: `Day ${dayLabel(text(get(row, "date")) ?? "")}`,
        fields: [
          field("OT", "ot", ranges),
          field("Leave", "leave", yes),
          field("Note", "note", text),
        ],
      };
    case "payments":
      return {
        subject: "Payment",
        fields: [
          field("Amount", "amount", amount),
          field("Paid on", "paid_on", date),
          field("For", "period_end", periodOfEnd),
          field("Note", "note", text),
          field("Receipts", "receipts", count),
        ],
      };
    case "rates":
      return {
        subject: `Pay rate from ${date(get(row, "effective_from")) ?? "?"}`,
        fields: [field("Salary", "salary", amount), field("OT / hour", "ot_rate", amount)],
      };
    case "holidays":
      return {
        subject: `Holiday ${date(get(row, "date")) ?? "?"}`,
        fields: [field("Name", "name", text)],
      };
    case "period_overrides":
      return {
        subject: `Fixed salary for ${periodOfEnd(get(row, "period_end")) ?? "?"}`,
        fields: [field("Salary", "salary", amount), field("Note", "note", text)],
      };
    case "confirmations":
      return {
        subject: `Confirmation of ${periodOfEnd(get(row, "period_end")) ?? "?"}`,
        fields: [snapshotField("Total", "total"), snapshotField("Paid", "paid")],
      };
    case "people":
      return {
        subject: `Person ${text(get(row, "username")) ?? "?"}`,
        fields: [field("Role", "role", role)],
      };
    default: {
      const unreachable: never = tbl;
      return unreachable;
    }
  }
}

/** "Day Tue 17 Nov: OT 18:00–19:00 → 18:00–19:10": an edit shows only what changed. */
function summary(change: Change): string {
  const { subject, fields } = describe(change.tbl, change.new ?? change.old);
  const parts = fields.flatMap(({ label, show }) => {
    const before = show(change.old);
    const after = show(change.new);
    switch (change.op) {
      case "insert":
        return after === null ? [] : [`${label} ${after}`];
      case "delete":
        return before === null ? [] : [`${label} ${before}`];
      case "update":
        return before === after ? [] : [`${label} ${before ?? "none"} → ${after ?? "none"}`];
      default: {
        const unreachable: never = change.op;
        return unreachable;
      }
    }
  });
  return parts.length === 0 ? subject : `${subject}: ${parts.join(" · ")}`;
}

function opLabel(op: Change["op"]): string {
  switch (op) {
    case "insert":
      return "Added";
    case "update":
      return "Changed";
    case "delete":
      return "Removed";
    default: {
      const unreachable: never = op;
      return unreachable;
    }
  }
}

function opClass(op: Change["op"]): string {
  switch (op) {
    case "insert":
      return "add";
    case "update":
      return "edit";
    case "delete":
      return "del";
    default: {
      const unreachable: never = op;
      return unreachable;
    }
  }
}

const bangkokDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" });
const bangkokTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Bangkok",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "Today, 16 Oct", "15 Oct", or "15 Oct 2026" in another year. */
function dayHeading(day: string, today: string): string {
  if (day === today) return `Today, ${dayMonth(day)}`;
  return day.slice(0, 4) === today.slice(0, 4) ? dayMonth(day) : fullDate(day);
}

/** Changes grouped by the Bangkok day they were made, keeping newest first. */
function byDay(changes: Change[]): [string, Change[]][] {
  const days = new Map<string, Change[]>();
  for (const change of changes) {
    const day = bangkokDate.format(new Date(change.at));
    days.set(day, [...(days.get(day) ?? []), change]);
  }
  return [...days];
}

/** Usernames by id: everyone there now, plus removed people (their removal is logged). */
async function names(changes: Change[]): Promise<Map<string, string>> {
  const [waiting, approved] = await Promise.all([waitingPeople(), approvedPeople()]);
  const logged = changes.flatMap((change) => {
    const row = change.tbl === "people" ? (change.old ?? change.new) : null;
    const id = text(get(row, "id"));
    const username = text(get(row, "username"));
    return id === null || username === null ? [] : [[id, username] as const];
  });
  return new Map([...logged, ...[...waiting, ...approved].map((p) => [p.id, p.username] as const)]);
}

interface Log {
  changes: Change[];
  names: Map<string, string>;
}

async function fetchLog(): Promise<Log> {
  const changes = await changeLog();
  return { changes, names: await names(changes) };
}

// Admin only (RLS returns nothing to anyone else).
export function ChangeLog() {
  const [today] = useState(todayInBangkok);
  const [log, setLog] = useState<Log | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchLog().then(setLog, () => {
      setError("Couldn’t load the change log. Check your connection and reload.");
    });
  }, []);

  const by = (actor: string | null) =>
    actor === null ? "setup" : (log?.names.get(actor) ?? "a removed account");

  return (
    <div className="screen">
      <BackBar title="Change log" />
      <ErrorAlert message={error} />
      <div className="log">
        {log?.changes.length === 0 && <div className="empty">No changes yet.</div>}
        {log !== null &&
          byDay(log.changes).map(([day, changes]) => {
            const heading = dayHeading(day, today);
            return (
              <section key={day} aria-label={heading}>
                <h4>{heading}</h4>
                <ul aria-label={`Changes ${heading}`}>
                  {changes.map((change) => {
                    const time = bangkokTime.format(new Date(change.at));
                    const what = summary(change);
                    const who = by(change.actor);
                    return (
                      <li
                        className="lg"
                        key={change.id}
                        aria-label={`${time}, ${opLabel(change.op)} ${what}, by ${who}`}
                      >
                        <time dateTime={change.at}>{time}</time>
                        <span>
                          <span className={`op ${opClass(change.op)}`}>{opLabel(change.op)}</span>
                          {what}
                        </span>
                        <small>by {who}</small>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
      </div>
      <div className="note">Admins only. Every add, change and removal is kept.</div>
    </div>
  );
}
