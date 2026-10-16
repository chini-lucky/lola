import { useEffect, useRef, useState } from "react";
import {
  currentPeriod,
  nextPeriod,
  periodOf,
  periodsThrough,
  summarize,
  type PayFacts,
  type Payment,
} from "../pay";
import { RECEIPT_TYPES, receiptName, receiptPath } from "../receipts";
import { addPayment, deletePayment, editPayment, removeReceipts, uploadReceipt } from "../supabase";
import { ErrorAlert, money, periodTitle, Plus, Receipt } from "../ui";

/** Whole baht, commas allowed ("22,250"); null if it is not a whole number above 0. */
function wholeBaht(text: string): number | null {
  const digits = text.replaceAll(",", "").trim();
  if (!/^\d+$/.test(digits)) return null;
  const amount = Number(digits);
  return amount > 0 ? amount : null;
}

function RemoveButton(props: { name: string; onClick: () => void }) {
  return (
    <button className="x" type="button" aria-label={`Remove ${props.name}`} onClick={props.onClick}>
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
  );
}

/** Admin only: a bottom sheet to record money already sent to the nanny, or edit a payment. */
export function PaymentSheet(props: {
  payment: Payment | null;
  today: string;
  facts: PayFacts;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { payment } = props;
  const title = payment === null ? "Add payment" : "Edit payment";
  const current = currentPeriod(props.today);
  const next = nextPeriod(current);
  const paymentPeriod = payment === null ? null : periodOf(payment.period_end);
  const periods = periodsThrough(
    paymentPeriod !== null && paymentPeriod.end > next.end ? paymentPeriod : next,
  );
  const [paidOn, setPaidOn] = useState(payment?.paid_on ?? props.today);
  const [amount, setAmount] = useState(payment === null ? "" : money(payment.amount));
  const [periodEnd, setPeriodEnd] = useState(payment?.period_end ?? current.end);
  const [note, setNote] = useState(payment?.note ?? "");
  const [stored, setStored] = useState(payment?.receipts ?? []); // receipts already saved
  const [added, setAdded] = useState<File[]>([]); // files picked, not uploaded yet
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const period = periods.find((p) => p.end === periodEnd) ?? current;
  const { balance } = summarize(period, props.facts);

  async function save() {
    const baht = wholeBaht(amount);
    if (baht === null) {
      setError("Amount must be whole baht, more than 0.");
      return;
    }
    if (paidOn === "") {
      setError("Pick the date paid.");
      return;
    }
    setSaving(true);
    try {
      const id = payment?.id ?? crypto.randomUUID();
      const uploaded = await Promise.all(
        added.map(async (file) => {
          const path = receiptPath(periodEnd, id, file.name);
          await uploadReceipt(path, file);
          return path;
        }),
      );
      const saved: Payment = {
        id,
        period_end: periodEnd,
        paid_on: paidOn,
        amount: baht,
        note: note.trim() === "" ? null : note.trim(),
        receipts: [...stored, ...uploaded],
      };
      await (payment === null ? addPayment(saved) : editPayment(saved));
      const unlisted = (payment?.receipts ?? []).filter((path) => !stored.includes(path));
      // The payment no longer lists them, so a file left behind by a failed remove is harmless.
      await removeReceipts(unlisted).catch(() => undefined);
      props.onSaved();
    } catch {
      setError("Couldn’t save the payment. Check your connection and try again.");
      setSaving(false);
    }
  }

  async function remove(saved: Payment) {
    if (!window.confirm("Delete this payment?")) return;
    setSaving(true);
    try {
      await deletePayment(saved);
      props.onSaved();
    } catch {
      setError("Couldn’t delete the payment. Check your connection and try again.");
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
          <div className="sub">Record money already sent to Lola</div>
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor="pay-date">Date paid</label>
            <input
              className="inp"
              id="pay-date"
              type="date"
              value={paidOn}
              onChange={(event) => {
                setPaidOn(event.target.value);
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="pay-amount">Amount</label>
            <div className="affix">
              <input
                className="inp"
                id="pay-amount"
                inputMode="numeric"
                autoComplete="off"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                }}
              />
              <span>THB</span>
            </div>
          </div>
        </div>
        {payment === null && balance > 0 && (
          <div className="quick">
            <button
              type="button"
              onClick={() => {
                setAmount(money(balance));
              }}
            >
              Balance {money(balance)}
            </button>
          </div>
        )}
        <div className="field">
          <label htmlFor="pay-period">Pay period</label>
          <select
            className="inp"
            id="pay-period"
            value={periodEnd}
            onChange={(event) => {
              setPeriodEnd(event.target.value);
            }}
          >
            {periods.map((p) => (
              <option key={p.end} value={p.end}>
                {periodTitle(p)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pay-note">Note</label>
          <input
            className="inp"
            id="pay-note"
            placeholder="Bank transfer"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
            }}
          />
        </div>
        <div className="field" role="group" aria-labelledby="pay-receipts">
          <span className="lbl" id="pay-receipts">
            Receipts
          </span>
          <div className="rcs">
            {stored.map((path) => (
              <Receipt key={path} name={receiptName(path)} link={null}>
                <RemoveButton
                  name={receiptName(path)}
                  onClick={() => {
                    setStored((paths) => paths.filter((p) => p !== path));
                  }}
                />
              </Receipt>
            ))}
            {added.map((file, i) => (
              <Receipt key={`${i.toString()}-${file.name}`} name={file.name} link={null}>
                <RemoveButton
                  name={file.name}
                  onClick={() => {
                    setAdded((files) => files.filter((f) => f !== file));
                  }}
                />
              </Receipt>
            ))}
            <div className="rcw">
              <label className="rc add">
                <Plus />
                Add
                <input
                  type="file"
                  multiple
                  accept={RECEIPT_TYPES}
                  aria-label="Add receipts"
                  onChange={(event) => {
                    const picked = Array.from(event.target.files ?? []);
                    setAdded((files) => [...files, ...picked]);
                    event.target.value = ""; // the same file can be picked again
                  }}
                />
              </label>
              <span>JPG PNG HEIC PDF</span>
            </div>
          </div>
        </div>
        <ErrorAlert message={error} />
        <button className="btn pri" type="submit" disabled={saving}>
          Save payment
        </button>
        {payment !== null && (
          <button
            className="del"
            type="button"
            disabled={saving}
            onClick={() => void remove(payment)}
          >
            Delete payment
          </button>
        )}
      </form>
    </dialog>
  );
}
