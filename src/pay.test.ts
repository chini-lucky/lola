import { describe, expect, test } from "vitest";
import { periodOf } from "./pay";

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
