// Pure date words shared by the screens and the CSV export.
import { weekdayOf } from "./pay";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Tue" for a Tuesday. */
export const weekdayName = (date: string) => WEEKDAYS[weekdayOf(date)] ?? "";
