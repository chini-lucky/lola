import { useCallback, useEffect, useState } from "react";
import { DaySheet } from "./DaySheet";
import { PaymentSheet } from "./PaymentSheet";
import {
  currentPeriod,
  nextPeriod,
  payDayOf,
  paymentsIn,
  prevPeriod,
  snapshotOf,
  summarize,
  type PayFacts,
  type Payment,
} from "../pay";
import { receiptName } from "../receipts";
import {
  confirm,
  confirmations,
  holidays,
  payFacts,
  receiptDownloadLink,
  receiptLinks,
  type Confirmation,
  type Person,
} from "../supabase";
import {
  Bear,
  Calendar,
  ConfirmationBadge,
  ConfirmButton,
  Copy,
  dayMonth,
  Download,
  ErrorAlert,
  OtLeaveList,
  Payments,
  periodTitle,
  Plus,
  summaryText,
  todayInBangkok,
  Totals,
  weekdayName,
} from "../ui";

const capitalised = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

/** The main screen for admin and nanny: one pay period at a time, ‹ › to move. */
export function PeriodView({ person }: { person: Person }) {
  const isAdmin = person.role === "admin";
  const [today] = useState(todayInBangkok);
  const [period, setPeriod] = useState(() => currentPeriod(today));
  const [facts, setFacts] = useState<PayFacts | null>(null);
  // Newest first: the first one for a pay period is the one that counts.
  const [allConfirmations, setAllConfirmations] = useState<Confirmation[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [makingPayslip, setMakingPayslip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // The date in the day sheet, or no sheet.
  const [editing, setEditing] = useState<string | null>(null);
  // The payment in the sheet: a new one, one to edit, or no sheet.
  const [sheet, setSheet] = useState<{ payment: Payment | null } | null>(null);

  const load = useCallback(() => {
    Promise.all([payFacts(), confirmations()]).then(
      ([loadedFacts, loadedConfirmations]) => {
        setFacts(loadedFacts);
        setAllConfirmations(loadedConfirmations);
      },
      () => {
        setError("Couldn’t load the pay data. Check your connection and reload.");
      },
    );
  }, []);
  useEffect(load, [load]);

  useEffect(() => {
    if (toast === null) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 1800);
    return () => {
      clearTimeout(timer);
    };
  }, [toast]);

  const summary = facts === null ? null : summarize(period, facts);
  const confirmation = allConfirmations.find((c) => c.period_end === period.end) ?? null;

  function onConfirm() {
    if (summary === null) return;
    setConfirming(true);
    setError(null);
    confirm(period.end, snapshotOf(summary)).then(
      () => {
        setConfirming(false);
        load();
      },
      () => {
        setConfirming(false);
        setError("Couldn’t save your confirmation. Check your connection and try again.");
      },
    );
  }

  function onCopySummary() {
    if (summary === null) return;
    const link = `${window.location.origin}${window.location.pathname}`;
    navigator.clipboard.writeText(summaryText(period, summary, link)).then(
      () => {
        setToast("Summary copied");
      },
      () => {
        setToast("Couldn’t copy the summary");
      },
    );
  }

  // Links to view the shown period's receipts, made again when its receipts change. The paths
  // are joined into one string so the effect can depend on their values, not a new array.
  const [links, setLinks] = useState(new Map<string, string>());
  const shownReceiptsKey =
    facts === null
      ? ""
      : paymentsIn(period, facts.payments)
          .flatMap((p) => p.receipts)
          .join("\n");
  useEffect(() => {
    if (shownReceiptsKey === "") return;
    void receiptLinks(shownReceiptsKey.split("\n")).then(setLinks, () => {
      setError("Couldn’t load the receipts. Check your connection and reload.");
    });
  }, [shownReceiptsKey]);

  function download(path: string) {
    void receiptDownloadLink(path, receiptName(path)).then(
      (link) => {
        window.location.assign(link); // the link answers with a download, so the page stays
      },
      () => {
        setError("Couldn’t download the receipt. Check your connection and try again.");
      },
    );
  }

  function downloadPayslip() {
    if (facts === null) return;
    setError(null);
    setMakingPayslip(true);
    // The footer names the app as the address bar shows it: "chini-lucky.github.io/lola".
    const site = `${window.location.host}${window.location.pathname}`.replace(/\/$/, "");
    Promise.all([import("../payslip"), holidays()])
      .then(([payslip, loadedHolidays]) =>
        payslip.downloadPayslip({
          period,
          facts,
          holidays: loadedHolidays,
          today,
          site,
        }),
      )
      .catch(() => {
        setError("Couldn’t make the payslip. Check your connection and try again.");
      })
      .finally(() => {
        setMakingPayslip(false);
      });
  }

  const prev = prevPeriod(period);
  const payDay = payDayOf(period);
  const payDayYear = payDay.slice(0, 4) === today.slice(0, 4) ? "" : ` ${payDay.slice(0, 4)}`;

  return (
    <div className="screen">
      {isAdmin ? (
        <div className="top">
          <div className="hi">
            <h1>
              <b>Lola’s pay</b>
            </h1>
            <small>Signed in as {person.username}</small>
          </div>
          <span className="pill">Admin</span>
          <a className="iconbtn" href="#/settings" aria-label="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3.2" />
              <path
                d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"
                strokeLinecap="round"
              />
            </svg>
          </a>
        </div>
      ) : (
        <div className="top">
          <Bear className="bearsm" />
          <div className="hi">
            <h1>
              <b>Hi {capitalised(person.username)} 👋</b>
            </h1>
            <small>Pooh’s pay period so far</small>
          </div>
          <a className="iconbtn" href="#/account" aria-label="Account">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <circle cx="12" cy="8.5" r="3.8" />
              <path d="M4.5 20c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6" strokeLinecap="round" />
            </svg>
          </a>
        </div>
      )}
      <section className="periodview" aria-label={periodTitle(period)}>
        <div className="period">
          <button
            type="button"
            aria-label="Previous pay period"
            disabled={prev === null}
            onClick={() => {
              if (prev !== null) setPeriod(prev);
            }}
          >
            ‹
          </button>
          <div>
            <b>{periodTitle(period)}</b>
            <small>
              Pay day {weekdayName(payDay)} {dayMonth(payDay)}
              {payDayYear}
            </small>
          </div>
          <button
            type="button"
            aria-label="Next pay period"
            onClick={() => {
              setPeriod(nextPeriod(period));
            }}
          >
            ›
          </button>
        </div>
        <ErrorAlert message={error} />
        {facts !== null && summary !== null && (
          <>
            <Totals period={period} facts={facts} />
            {isAdmin && (
              <>
                <ConfirmationBadge confirmation={confirmation} summary={summary} />
                <div className="duo">
                  <button className="btn sec" type="button" onClick={onCopySummary}>
                    <Copy />
                    Copy summary
                  </button>
                  <button
                    className="btn pri"
                    type="button"
                    onClick={() => {
                      setSheet({ payment: null });
                    }}
                  >
                    <Plus />
                    Add payment
                  </button>
                </div>
              </>
            )}
            <Calendar
              period={period}
              facts={facts}
              today={today}
              onEditDay={isAdmin ? setEditing : null}
            />
            <OtLeaveList period={period} facts={facts} onEditDay={isAdmin ? setEditing : null} />
            <Payments
              period={period}
              facts={facts}
              links={links}
              onDownload={download}
              onEdit={
                isAdmin
                  ? (payment) => {
                      setSheet({ payment });
                    }
                  : null
              }
            />
            <button
              className="btn sec"
              type="button"
              disabled={makingPayslip}
              onClick={downloadPayslip}
            >
              <Download />
              Download payslip
            </button>
            {!isAdmin && (
              <ConfirmButton
                confirmation={confirmation}
                summary={summary}
                saving={confirming}
                onConfirm={onConfirm}
              />
            )}
          </>
        )}
      </section>
      {toast !== null && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      {editing !== null && facts !== null && (
        <DaySheet
          date={editing}
          facts={facts}
          onClose={() => {
            setEditing(null);
          }}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {sheet !== null && facts !== null && (
        <PaymentSheet
          payment={sheet.payment}
          today={today}
          facts={facts}
          onClose={() => {
            setSheet(null);
          }}
          onSaved={() => {
            setSheet(null);
            load();
          }}
        />
      )}
    </div>
  );
}
