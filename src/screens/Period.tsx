import { useCallback, useEffect, useState } from "react";
import { PaymentSheet } from "./PaymentSheet";
import {
  currentPeriod,
  nextPeriod,
  payDayOf,
  paymentsIn,
  prevPeriod,
  type PayFacts,
  type Payment,
} from "../pay";
import { receiptName } from "../receipts";
import { payFacts, receiptDownloadLink, receiptLinks, type Person } from "../supabase";
import {
  Bear,
  Calendar,
  dayMonth,
  ErrorAlert,
  OtLeaveList,
  Payments,
  periodTitle,
  Plus,
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
  const [error, setError] = useState<string | null>(null);
  // The payment in the sheet: a new one, one to edit, or no sheet.
  const [sheet, setSheet] = useState<{ payment: Payment | null } | null>(null);

  const load = useCallback(() => {
    payFacts().then(setFacts, () => {
      setError("Couldn’t load the pay data. Check your connection and reload.");
    });
  }, []);
  useEffect(load, [load]);

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
        {facts !== null && (
          <>
            <Totals period={period} facts={facts} />
            {isAdmin && (
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
            )}
            <Calendar period={period} facts={facts} today={today} />
            <OtLeaveList period={period} facts={facts} />
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
          </>
        )}
      </section>
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
