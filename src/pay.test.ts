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
});
