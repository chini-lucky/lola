import { describe, expect, test } from "vitest";
import {
  currentPeriod,
  datesIn,
  dayKind,
  dayOt,
  nextPeriod,
  otReason,
  payDayOf,
  periodOf,
  prevPeriod,
  salaryOf,
  summarize,
  type Rate,
} from "./pay";

const firstRate: Rate = { effective_from: "2026-09-14", salary: 20000, ot_rate: 150 };

describe("pay period", () => {
  test("27 Oct is the last day of Oct pay (28 Sep – 27 Oct)", () => {
    expect(periodOf("2026-10-27")).toEqual({ start: "2026-09-28", end: "2026-10-27" });
  });

  test("28 Oct is the first day of Nov pay (28 Oct – 27 Nov)", () => {
    expect(periodOf("2026-10-28")).toEqual({ start: "2026-10-28", end: "2026-11-27" });
  });

  test("the first pay period starts on the start date, 14 Sep 2026", () => {
    expect(periodOf("2026-09-14")).toEqual({ start: "2026-09-14", end: "2026-09-27" });
  });

  test("13 Sep 2026 is before the start date, so it is in no pay period", () => {
    expect(periodOf("2026-09-13")).toBeNull();
  });

  test("28 Dec 2026 is in Jan pay 2027 (28 Dec – 27 Jan)", () => {
    expect(periodOf("2026-12-28")).toEqual({ start: "2026-12-28", end: "2027-01-27" });
  });

  test("Feb pay runs 28 Jan – 27 Feb", () => {
    expect(periodOf("2027-02-27")).toEqual({ start: "2027-01-28", end: "2027-02-27" });
  });

  test("28 Feb starts Mar pay", () => {
    expect(periodOf("2027-02-28")).toEqual({ start: "2027-02-28", end: "2027-03-27" });
  });

  test("29 Feb in leap year 2028 is in Mar pay (28 Feb – 27 Mar)", () => {
    expect(periodOf("2028-02-29")).toEqual({ start: "2028-02-28", end: "2028-03-27" });
  });
});

describe("current pay period", () => {
  test("before the start date the current pay period is the first one", () => {
    expect(currentPeriod("2026-09-01")).toEqual({ start: "2026-09-14", end: "2026-09-27" });
  });
});

describe("pay day", () => {
  test("Oct pay is paid on 28 Oct", () => {
    expect(payDayOf({ start: "2026-09-28", end: "2026-10-27" })).toBe("2026-10-28");
  });
});

describe("moving between pay periods", () => {
  test("before Oct pay comes the first pay period", () => {
    expect(prevPeriod({ start: "2026-09-28", end: "2026-10-27" })).toEqual({
      start: "2026-09-14",
      end: "2026-09-27",
    });
  });

  test("nothing comes before the first pay period", () => {
    expect(prevPeriod({ start: "2026-09-14", end: "2026-09-27" })).toBeNull();
  });

  test("after Dec pay comes Jan pay 2027", () => {
    expect(nextPeriod({ start: "2026-11-28", end: "2026-12-27" })).toEqual({
      start: "2026-12-28",
      end: "2027-01-27",
    });
  });
});

describe("salary", () => {
  test("the first pay period's salary is the agreed 11,000 override", () => {
    const sepPay = { start: "2026-09-14", end: "2026-09-27" };
    expect(
      salaryOf(sepPay, [firstRate], [{ period_end: "2026-09-27", salary: 11000, note: null }]),
    ).toBe(11000);
  });

  test("a raise during a pay period applies from the next pay period", () => {
    const raise: Rate = { effective_from: "2026-10-15", salary: 22000, ot_rate: 150 };
    const octPay = { start: "2026-09-28", end: "2026-10-27" };
    expect(salaryOf(octPay, [firstRate, raise], [])).toBe(20000);
  });

  test("a later pay period uses the salary in effect on its start", () => {
    const raise: Rate = { effective_from: "2026-10-15", salary: 22000, ot_rate: 150 };
    const novPay = { start: "2026-10-28", end: "2026-11-27" };
    expect(salaryOf(novPay, [raise, firstRate], [])).toBe(22000);
  });
});

describe("days of a pay period", () => {
  test("the first pay period has the days 14 Sep to 27 Sep", () => {
    expect(datesIn({ start: "2026-09-14", end: "2026-09-27" })).toEqual([
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
      "2026-09-18",
      "2026-09-19",
      "2026-09-20",
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
      "2026-09-25",
      "2026-09-26",
      "2026-09-27",
    ]);
  });
});

describe("day kind", () => {
  test("OT on a holiday shows as OT", () => {
    const day = { date: "2026-10-13", ot: ["10:00-12:00"], leave: false, note: null };
    expect(dayKind("2026-10-13", ["2026-10-13"], day)).toBe("ot");
  });

  test("a leave day with OT shows as OT", () => {
    const day = { date: "2026-10-19", ot: ["18:00-19:00"], leave: true, note: null };
    expect(dayKind("2026-10-19", [], day)).toBe("ot");
  });

  test("leave on a holiday shows as leave", () => {
    const day = { date: "2026-10-13", ot: [], leave: true, note: null };
    expect(dayKind("2026-10-13", ["2026-10-13"], day)).toBe("leave");
  });

  test("Saturday is a weekend", () => {
    expect(dayKind("2026-10-17", [])).toBe("weekend");
  });

  test("a weekday is a normal day", () => {
    expect(dayKind("2026-10-16", [])).toBe("normal");
  });

  test("a holiday on a weekday is a holiday", () => {
    expect(dayKind("2026-10-13", ["2026-10-13"])).toBe("holiday");
  });

  test("a holiday on a weekend shows as a holiday", () => {
    expect(dayKind("2026-12-05", ["2026-12-05"])).toBe("holiday");
  });
});

describe("OT", () => {
  const holidays = ["2026-10-13", "2026-12-05"];
  const otOn = (date: string, ot: string[]) =>
    dayOt({ date, ot, leave: false, note: null }, [firstRate], holidays);

  test("a day's OT is rounded up to the next 30 minutes: 18:00–18:01 is 30 min", () => {
    expect(otOn("2026-10-05", ["18:00-18:01"]).paidMinutes).toBe(30);
  });

  test("a day's OT keeps the minutes counted before rounding: 18:00–19:10 is 70 min", () => {
    expect(otOn("2026-10-07", ["18:00-19:10"]).countedMinutes).toBe(70);
  });

  test("exactly half an hour stays as is: 18:00–18:30 is 30 min", () => {
    expect(otOn("2026-10-05", ["18:00-18:30"]).paidMinutes).toBe(30);
  });

  test("18:00–18:31 rounds up to 60 min", () => {
    expect(otOn("2026-10-05", ["18:00-18:31"]).paidMinutes).toBe(60);
  });

  test("18:00–20:30 is 150 min, paid 375 THB at 150 THB/h", () => {
    expect(otOn("2026-10-05", ["18:00-20:30"])).toMatchObject({ paidMinutes: 150, pay: 375 });
  });

  test("several ranges add up before the day is rounded: 07:00–08:10 + 18:00–18:20 is 90 min", () => {
    expect(otOn("2026-10-05", ["07:00-08:10", "18:00-18:20"]).paidMinutes).toBe(90);
  });

  test("weekday OT counts only time before 09:00 or after 18:00: 08:00–19:00 is 120 min", () => {
    expect(otOn("2026-10-05", ["08:00-19:00"]).paidMinutes).toBe(120);
  });

  test("rounding is per day, not per range: 07:30–08:00 + 18:00–18:10 is 40 → 60 min", () => {
    expect(otOn("2026-10-05", ["07:30-08:00", "18:00-18:10"]).paidMinutes).toBe(60);
  });

  test("weekday OT counts only the part before 09:00: 08:00–10:00 is 60 min", () => {
    expect(otOn("2026-10-05", ["08:00-10:00"]).paidMinutes).toBe(60);
  });

  test("weekday OT counts only the part after 18:00: 17:00–19:00 is 60 min", () => {
    expect(otOn("2026-10-05", ["17:00-19:00"]).paidMinutes).toBe(60);
  });

  test("weekday OT inside 09:00–18:00 is no OT: 10:00–17:00 is 0 min", () => {
    expect(otOn("2026-10-05", ["10:00-17:00"]).paidMinutes).toBe(0);
  });

  test("all hours on a Saturday are OT: 10:00–14:00 is 240 min", () => {
    expect(otOn("2026-10-10", ["10:00-14:00"]).paidMinutes).toBe(240);
  });

  test("all hours on a Sunday are OT: 09:00–09:10 rounds up to 30 min", () => {
    expect(otOn("2026-10-11", ["09:00-09:10"]).paidMinutes).toBe(30);
  });

  test("all hours on a weekday holiday are OT: 09:00–18:00 is 540 min", () => {
    expect(otOn("2026-10-13", ["09:00-18:00"]).paidMinutes).toBe(540);
  });

  test("a holiday on a weekend is counted once: Sat 10:00–14:00 is 240 min", () => {
    expect(otOn("2026-12-05", ["10:00-14:00"]).paidMinutes).toBe(240);
  });
});

describe("pay period totals", () => {
  const octPay = { start: "2026-09-28", end: "2026-10-27" };
  const otDay = (date: string, ot: string[]) => ({ date, ot, leave: false, note: null });

  test("an OT rate change during a pay period pays each day at its own rate", () => {
    const newOtRate: Rate = { effective_from: "2026-10-15", salary: 20000, ot_rate: 200 };
    const facts = {
      rates: [firstRate, newOtRate],
      overrides: [],
      holidays: [],
      days: [otDay("2026-10-05", ["18:00-19:00"]), otDay("2026-10-20", ["18:00-19:00"])],
    };
    expect(summarize(octPay, facts).otPay).toBe(350);
  });

  test("leave never deducts from salary", () => {
    const facts = {
      rates: [firstRate],
      overrides: [],
      holidays: [],
      days: [{ date: "2026-10-19", ot: [], leave: true, note: "Sick day" }],
    };
    expect(summarize(octPay, facts).total).toBe(20000);
  });

  test("seeded Oct pay: 15 h OT = 2,250, total 22,250", () => {
    const facts = {
      rates: [firstRate],
      overrides: [],
      holidays: ["2026-10-13", "2026-10-23"],
      days: [
        otDay("2026-09-30", ["18:00-20:15"]),
        otDay("2026-10-05", ["18:00-20:30"]),
        otDay("2026-10-07", ["18:00-19:10"]),
        otDay("2026-10-10", ["10:00-14:00"]),
        otDay("2026-10-15", ["07:30-09:00"]),
        { date: "2026-10-19", ot: [], leave: true, note: "Sick day" },
        otDay("2026-10-20", ["07:00-08:00", "18:00-20:00"]),
      ],
    };
    expect(summarize(octPay, facts)).toEqual({
      salary: 20000,
      otMinutes: 900,
      otPay: 2250,
      total: 22250,
    });
  });

  test("a holiday with no OT leaves the salary unchanged", () => {
    const facts = { rates: [firstRate], overrides: [], holidays: ["2026-10-13"], days: [] };
    expect(summarize(octPay, facts).total).toBe(20000);
  });

  test("OT on a leave day is still paid", () => {
    const facts = {
      rates: [firstRate],
      overrides: [],
      holidays: [],
      days: [{ date: "2026-10-19", ot: ["18:00-19:00"], leave: true, note: null }],
    };
    expect(summarize(octPay, facts).otPay).toBe(150);
  });

  test("OT on 28 Oct counts in Nov pay, not Oct pay", () => {
    const facts = {
      rates: [firstRate],
      overrides: [],
      holidays: [],
      days: [otDay("2026-10-28", ["18:00-19:00"])],
    };
    expect(summarize(octPay, facts).otPay).toBe(0);
  });
});

describe("why a day's OT counts", () => {
  const holidays = ["2026-10-13", "2026-12-05"];
  const reasonOn = (date: string, ot: string[]) =>
    otReason({ date, ot, leave: false, note: null }, holidays);

  test("weekday OT before 09:00 and after 18:00 says both", () => {
    expect(reasonOn("2026-10-20", ["07:00-08:00", "18:00-20:00"])).toBe(
      "Before 09:00 + After 18:00",
    );
  });

  test("OT on a weekday holiday counts because it is a holiday", () => {
    expect(reasonOn("2026-10-13", ["10:00-12:00"])).toBe("Holiday");
  });

  test("OT on a holiday that falls on a Saturday says Saturday", () => {
    expect(reasonOn("2026-12-05", ["10:00-12:00"])).toBe("Saturday");
  });
});
