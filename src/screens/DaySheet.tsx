import { useEffect, useRef, useState } from "react";
import { dayKind, dayOt, rateOn, type Day, type PayFacts } from "../pay";
import { saveDay } from "../supabase";
import { dayLabel, ErrorAlert, hours, money, Plus } from "../ui";

/** One OT range as typed: two HH:MM times, either may still be empty. */
interface Range {
  from: string;
  to: string;
}

const rangeOf = (range: string): Range => {
  const [from = "", to = ""] = range.split("-");
  return { from, to };
};

/** Both times filled in and the range starts before it ends (HH:MM sorts like time). */
const isValid = (range: Range) => range.from !== "" && range.to !== "" && range.from < range.to;
const textOf = (range: Range) => `${range.from}-${range.to}`;

/** What is wrong with the first range that is not valid, or null if they all are. */
function rangesProblem(ranges: Range[]): string | null {
  const index = ranges.findIndex((range) => !isValid(range));
  const range = ranges[index];
  if (range === undefined) return null;
  const n = (index + 1).toString();
  return range.from === "" || range.to === ""
    ? `Fill in both times of range ${n}, or remove it.`
    : `Range ${n} must start before it ends (a range can’t cross midnight).`;
}

/** Admin only: a bottom sheet to record a day's OT ranges. */
export function DaySheet(props: {
  date: string;
  facts: PayFacts;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { date, facts } = props;
  const day = facts.days.find((d) => d.date === date);
  const [ranges, setRanges] = useState<Range[]>(() => day?.ot.map(rangeOf) ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const title = dayLabel(date);
  const kind = dayKind(date, facts.holidays);
  const draft: Day = {
    date,
    ot: ranges.map(textOf),
    leave: day?.leave ?? false,
    note: day?.note ?? null,
  };
  // The OT so far, from the ranges filled in correctly.
  const ot = dayOt(
    { ...draft, ot: ranges.filter(isValid).map(textOf) },
    facts.rates,
    facts.holidays,
  );

  function setRange(index: number, range: Range) {
    setRanges(ranges.map((r, i) => (i === index ? range : r)));
  }

  async function save() {
    const problem = rangesProblem(ranges);
    if (problem !== null) {
      setError(problem);
      return;
    }
    setSaving(true);
    try {
      await saveDay(draft);
      props.onSaved();
    } catch {
      setError("Couldn’t save the day. Check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="sheet"
      aria-label={title}
      onClose={props.onClose}
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current.close(); // tap outside the sheet
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="grab" />
        <div>
          <h4>{title}</h4>
          <div className="sub">
            {kind === "normal"
              ? "Normal day 09:00–18:00 · add anything extra"
              : `${kind === "holiday" ? "Holiday" : "Weekend"} · any time is overtime`}
          </div>
        </div>
        <div className="field">
          <span>Overtime</span>
          {ranges.map((range, i) => {
            const n = (i + 1).toString();
            return (
              <div className="range" key={i}>
                <input
                  className="inp"
                  type="time"
                  aria-label={`Range ${n} from`}
                  value={range.from}
                  onChange={(event) => {
                    setRange(i, { ...range, from: event.target.value });
                  }}
                />
                <span className="arrow">→</span>
                <input
                  className="inp"
                  type="time"
                  aria-label={`Range ${n} to`}
                  value={range.to}
                  onChange={(event) => {
                    setRange(i, { ...range, to: event.target.value });
                  }}
                />
                <button
                  className="x"
                  type="button"
                  aria-label={`Remove range ${n}`}
                  onClick={() => {
                    setRanges(ranges.filter((_, j) => j !== i));
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    aria-hidden="true"
                  >
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            );
          })}
          <button
            className="btn dash"
            type="button"
            onClick={() => {
              setRanges([...ranges, { from: "", to: "" }]);
            }}
          >
            <Plus />
            {ranges.length === 0 ? "Add a time" : "Add another time"}
          </button>
        </div>
        {ot.paidMinutes > 0 && (
          <div className="calc">
            {/* THB, not ฿: the self-hosted fonts are latin only. */}
            <span>
              {hours(ot.paidMinutes)} × {money(rateOn(date, facts.rates).ot_rate)} THB
              <br />
              <small>Day total rounded up to 30 min</small>
            </span>
            <b>{money(ot.pay)} THB</b>
          </div>
        )}
        <ErrorAlert message={error} />
        <button className="btn pri" type="submit" disabled={saving}>
          Save day
        </button>
      </form>
    </dialog>
  );
}
