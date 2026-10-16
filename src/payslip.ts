// The payslip PDF, drawn with jsPDF. Loaded only when someone downloads a payslip (import()),
// so jsPDF and the fonts stay out of the main app.
import { GState, jsPDF } from "jspdf";
import {
  dayOt,
  daysIn,
  isDraft,
  overrideOf,
  paymentsIn,
  summarize,
  type PayFacts,
  type Period,
} from "./pay";
import type { Confirmation, Holiday } from "./supabase";
import {
  bangkokDate,
  confirmationState,
  dayLabel,
  dayMonth,
  fullDate,
  hours,
  money,
  periodName,
} from "./ui";

/** What a payslip shows: the pay period, its facts, the holiday names, the confirmation. */
export interface Payslip {
  period: Period;
  facts: PayFacts;
  holidays: Holiday[];
  confirmation: Confirmation | null;
  today: string;
  /** Where the app lives, for the footer: "chini-lucky.github.io/lola". */
  site: string;
}

// Option A colours (docs/design/final.html).
const INK = "#24384a";
const MUTED = "#6f7f8c";
const LINE = "#dce6ee";
const CARD = "#fffbf3";
const TOTALS = "#cfe6f7";
const TOTALS_INK = "#1f3b52";
const LEAVE = "#fce3c9";
const LEAVE_INK = "#7a4214";
const OK = "#e0f2e4";
const OK_INK = "#2f6b3f";
const DANGER = "#c2554a";

// A4 portrait in points.
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const RIGHT = PAGE_W - MARGIN;
const WIDTH = RIGHT - MARGIN;
const BOTTOM = PAGE_H - MARGIN;
const ROW = 18;

const FONTS = [
  { file: "baloo-2-extrabold.ttf", name: "Baloo", style: "bold" },
  { file: "nunito-regular.ttf", name: "Nunito", style: "normal" },
  { file: "nunito-extrabold.ttf", name: "Nunito", style: "bold" },
] as const;

const asset = (file: string) => `${import.meta.env.BASE_URL}${file}`;

async function bytesOf(file: string): Promise<Uint8Array> {
  const response = await fetch(asset(file));
  if (!response.ok) throw new Error(`Couldn’t load ${file}`);
  return new Uint8Array(await response.arrayBuffer());
}

function base64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** "(28 Sep – 27 Oct 2026)" */
const span = (period: Period) =>
  `(${dayMonth(period.start)} – ${dayMonth(period.end)} ${period.end.slice(0, 4)})`;

/** The payslip's title: "Payslip · Oct pay (28 Sep – 27 Oct 2026)". */
const titleOf = (period: Period) => `Payslip · ${periodName(period)} ${span(period)}`;

/** The confirmation line in the footer, with its pill colours. */
function confirmationLine(slip: Payslip): { text: string; fill: string; ink: string } {
  const summary = summarize(slip.period, slip.facts);
  const state = confirmationState(slip.confirmation, summary);
  switch (state.kind) {
    case "waiting":
      return { text: "Not yet confirmed by Lola", fill: LEAVE, ink: LEAVE_INK };
    case "confirmed":
      return {
        text: `Confirmed by Lola on ${fullDate(bangkokDate(new Date(state.confirmation.confirmed_at)))}`,
        fill: OK,
        ink: OK_INK,
      };
    case "stale": {
      const { total, paid } = state.confirmation.snapshot;
      const on = dayMonth(bangkokDate(new Date(state.confirmation.confirmed_at)));
      return {
        text: `Changed since Lola confirmed (total ${money(total)} · paid ${money(paid)} on ${on})`,
        fill: LEAVE,
        ink: LEAVE_INK,
      };
    }
    default: {
      const unreachable: never = state;
      return unreachable;
    }
  }
}

/** Draws the payslip top to bottom, adding a page when a row would run off the end. */
class Sheet {
  y = MARGIN;
  constructor(readonly doc: jsPDF) {}

  font(name: "Baloo" | "Nunito", style: "normal" | "bold", size: number, color: string) {
    this.doc.setFont(name, style);
    this.doc.setFontSize(size);
    this.doc.setTextColor(color);
  }

  /** Room for this many points, or a new page. */
  room(height: number) {
    if (this.y + height <= BOTTOM) return;
    this.doc.addPage();
    this.y = MARGIN;
  }

  heading(text: string) {
    this.room(ROW * 3);
    this.y += 22;
    this.font("Baloo", "bold", 13, INK);
    this.doc.text(text, MARGIN, this.y);
    this.y += 6;
  }

  /** A table row: cells at the given x positions; a negative x aligns that cell right of -x. */
  row(
    cells: { text: string; x: number }[],
    options: { header?: boolean; bold?: boolean; muted?: boolean } = {},
  ) {
    this.room(ROW);
    this.y += ROW;
    const header = options.header === true;
    if (header) this.font("Nunito", "bold", 7.5, MUTED);
    else {
      const style = options.bold === true ? "bold" : "normal";
      this.font("Nunito", style, 10, options.muted === true ? MUTED : INK);
    }
    for (const cell of cells) {
      const text = header ? cell.text.toUpperCase() : cell.text;
      if (cell.x < 0) this.doc.text(text, -cell.x, this.y - 5, { align: "right" });
      else this.doc.text(text, cell.x, this.y - 5);
    }
    if (options.bold === true) return;
    this.doc.setDrawColor(LINE);
    this.doc.setLineWidth(header ? 1.2 : 0.7);
    this.doc.line(MARGIN, this.y, RIGHT, this.y);
  }

  muted(text: string, amount?: string) {
    this.row(
      [{ text, x: MARGIN + 3 }, ...(amount === undefined ? [] : [{ text: amount, x: -RIGHT }])],
      { muted: true },
    );
  }
}

function drawHeader(sheet: Sheet, slip: Payslip, bear: Uint8Array) {
  const { doc } = sheet;
  const size = 46;
  doc.saveGraphicsState();
  doc.roundedRect(MARGIN, MARGIN, size, size, 12, 12, null);
  doc.clip();
  doc.discardPath();
  doc.addImage(bear, "PNG", MARGIN, MARGIN, size, size);
  doc.restoreGraphicsState();
  sheet.font("Baloo", "bold", 18, INK);
  doc.text(titleOf(slip.period), MARGIN + size + 12, MARGIN + size / 2 + 6);
  sheet.y = MARGIN + size + 10;
  doc.setDrawColor(TOTALS);
  doc.setLineWidth(2);
  doc.line(MARGIN, sheet.y, RIGHT, sheet.y);
}

function drawWho(sheet: Sheet) {
  const { doc } = sheet;
  const top = sheet.y + 12;
  const half = (WIDTH - 8) / 2;
  const people = [
    { label: "Employee", name: "Lola", x: MARGIN },
    { label: "Employer", name: "Chini Lucky", x: MARGIN + half + 8 },
  ];
  for (const person of people) {
    doc.setFillColor(CARD);
    doc.roundedRect(person.x, top, half, 40, 8, 8, "F");
    sheet.font("Nunito", "bold", 7.5, MUTED);
    doc.text(person.label.toUpperCase(), person.x + 10, top + 15);
    sheet.font("Nunito", "bold", 12, INK);
    doc.text(person.name, person.x + 10, top + 31);
  }
  sheet.y = top + 40;
}

function drawSalary(sheet: Sheet, slip: Payslip) {
  const override = overrideOf(slip.period, slip.facts.overrides);
  const label =
    override === null
      ? "Monthly salary (Mon–Fri 09:00–18:00)"
      : `Salary (${override.note ?? "agreed amount"})`;
  const { salary } = summarize(slip.period, slip.facts);
  sheet.heading("Salary");
  sheet.row([
    { text: label, x: MARGIN + 3 },
    { text: money(salary), x: -RIGHT },
  ]);
}

function drawOvertime(sheet: Sheet, slip: Payslip) {
  const { facts, period } = slip;
  const days = daysIn(period, facts.days)
    .filter((day) => day.ot.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const { otMinutes, otPay } = summarize(period, facts);
  const columns = [MARGIN + 3, MARGIN + 110, -(RIGHT - 80), -RIGHT];
  const at = (i: number) => columns[i] ?? MARGIN;
  sheet.heading("Overtime");
  sheet.row(
    ["Day", "Times", "Hours", "Pay"].map((text, i) => ({ text, x: at(i) })),
    { header: true },
  );
  if (days.length === 0) sheet.muted("No overtime this period");
  for (const day of days) {
    const ot = dayOt(day, facts.rates, facts.holidays);
    const times = day.ot.map((range) => range.replace("-", "–")).join(", ");
    sheet.row(
      [dayLabel(day.date), times, hours(ot.paidMinutes), money(ot.pay)].map((text, i) => ({
        text,
        x: at(i),
      })),
    );
  }
  sheet.row(
    [
      { text: "Total overtime", x: at(0) },
      { text: hours(otMinutes), x: at(2) },
      { text: money(otPay), x: at(3) },
    ],
    { bold: true },
  );
}

function drawLeaveAndHolidays(sheet: Sheet, slip: Payslip) {
  const { period, facts } = slip;
  const leave = daysIn(period, facts.days)
    .filter((day) => day.leave)
    .map((day) => ({
      date: day.date,
      text: day.note === null || day.note === "" ? "Leave" : `Leave · ${day.note}`,
    }));
  const holidays = slip.holidays
    .filter((holiday) => holiday.date >= period.start && holiday.date <= period.end)
    .map((holiday) => ({ date: holiday.date, text: `Holiday · ${holiday.name}` }));
  const rows = [...leave, ...holidays].sort((a, b) => a.date.localeCompare(b.date));
  sheet.heading("Leave and holidays (no deduction)");
  if (rows.length === 0) sheet.muted("None this period");
  for (const row of rows) {
    sheet.row([
      { text: dayLabel(row.date), x: MARGIN + 3 },
      { text: row.text, x: MARGIN + 110 },
    ]);
  }
}

function drawPayments(sheet: Sheet, slip: Payslip) {
  const payments = paymentsIn(slip.period, slip.facts.payments);
  sheet.heading("Payments");
  if (payments.length === 0) sheet.muted("No payments yet", "0");
  for (const payment of payments) {
    const paidOn = `${dayLabel(payment.paid_on)} ${payment.paid_on.slice(0, 4)}`;
    const note = payment.note === null || payment.note === "" ? "" : ` · ${payment.note}`;
    sheet.row([
      { text: `${paidOn}${note}`, x: MARGIN + 3 },
      { text: money(payment.amount), x: -RIGHT },
    ]);
  }
}

/** The totals box and the footer, at the foot of the last page. */
function drawTotalsAndFooter(sheet: Sheet, slip: Payslip) {
  const { doc } = sheet;
  const boxHeight = 74;
  const footerHeight = 30;
  sheet.room(boxHeight + footerHeight + 16);
  const top = BOTTOM - footerHeight - boxHeight;
  const { total, paid, balance } = summarize(slip.period, slip.facts);
  doc.setFillColor(TOTALS);
  doc.roundedRect(MARGIN, top, WIDTH, boxHeight, 10, 10, "F");
  const lines = [
    { label: "Total due", value: money(total), y: top + 20 },
    { label: "Paid", value: money(paid), y: top + 36 },
  ];
  for (const line of lines) {
    sheet.font("Nunito", "normal", 10, TOTALS_INK);
    doc.text(line.label, MARGIN + 12, line.y);
    sheet.font("Nunito", "bold", 10, TOTALS_INK);
    doc.text(line.value, RIGHT - 12, line.y, { align: "right" });
  }
  sheet.font("Baloo", "bold", 15, TOTALS_INK);
  doc.text("Balance", MARGIN + 12, top + 60);
  doc.text(`${money(balance)} THB`, RIGHT - 12, top + 60, { align: "right" });

  const footerY = BOTTOM - 8;
  doc.setDrawColor(LINE);
  doc.setLineWidth(0.7);
  doc.line(MARGIN, BOTTOM - footerHeight + 6, RIGHT, BOTTOM - footerHeight + 6);
  const confirmation = confirmationLine(slip);
  sheet.font("Nunito", "bold", 8.5, confirmation.ink);
  const pillWidth = doc.getTextWidth(confirmation.text) + 16;
  doc.setFillColor(confirmation.fill);
  doc.roundedRect(MARGIN, footerY - 10, pillWidth, 14, 7, 7, "F");
  doc.text(confirmation.text, MARGIN + 8, footerY);
  sheet.font("Nunito", "normal", 8.5, MUTED);
  doc.text(`Generated ${fullDate(slip.today)} · ${slip.site}`, RIGHT, footerY, { align: "right" });
}

/** "DRAFT" across the top third of the first page, tilted, faint, in a frame. */
function drawDraftStamp(doc: jsPDF) {
  doc.setPage(1);
  const size = 84;
  const pad = 14;
  const tilt = (18 * Math.PI) / 180;
  const center = { x: PAGE_W / 2, y: PAGE_H * 0.34 };
  doc.setFont("Baloo", "bold");
  doc.setFontSize(size);
  const halfW = doc.getTextWidth("DRAFT") / 2;
  const halfH = size * 0.3;
  // A point given from the stamp's centre, tilted up to the right like the design's stamp.
  const at = (dx: number, dy: number) => ({
    x: center.x + dx * Math.cos(tilt) + dy * Math.sin(tilt),
    y: center.y - dx * Math.sin(tilt) + dy * Math.cos(tilt),
  });
  doc.saveGraphicsState();
  doc.setGState(new GState({ opacity: 0.16, "stroke-opacity": 0.16 }));
  doc.setTextColor(DANGER);
  const origin = at(-halfW, halfH);
  doc.text("DRAFT", origin.x, origin.y, { angle: 18 });
  const corners = [
    at(-halfW - pad, -halfH - pad),
    at(halfW + pad, -halfH - pad),
    at(halfW + pad, halfH + pad),
    at(-halfW - pad, halfH + pad),
  ];
  const [first] = corners;
  if (first !== undefined) {
    const steps = corners.slice(1).map((corner, i): [number, number] => {
      const from = corners[i] ?? first;
      return [corner.x - from.x, corner.y - from.y];
    });
    doc.setDrawColor(DANGER);
    doc.setLineWidth(5);
    doc.lines(steps, first.x, first.y, [1, 1], "S", true);
  }
  doc.restoreGraphicsState();
}

/** Builds the pay period's payslip and hands it to the browser as a download. */
export async function downloadPayslip(slip: Payslip): Promise<void> {
  const [bear, fonts] = await Promise.all([
    bytesOf("icon-192.png"),
    Promise.all(
      FONTS.map(async (font) => ({ ...font, data: await bytesOf(`fonts/${font.file}`) })),
    ),
  ]);
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  for (const font of fonts) {
    doc.addFileToVFS(font.file, base64(font.data));
    doc.addFont(font.file, font.name, font.style);
  }
  doc.setProperties({ title: titleOf(slip.period), author: "Chini Lucky" });

  const sheet = new Sheet(doc);
  drawHeader(sheet, slip, bear);
  drawWho(sheet);
  drawSalary(sheet, slip);
  drawOvertime(sheet, slip);
  drawLeaveAndHolidays(sheet, slip);
  drawPayments(sheet, slip);
  drawTotalsAndFooter(sheet, slip);
  const { balance } = summarize(slip.period, slip.facts);
  if (isDraft(slip.period, balance, slip.today)) drawDraftStamp(doc);

  doc.save(`Lola payslip ${periodName(slip.period)} ${slip.period.end.slice(0, 4)}.pdf`);
}
