import { DateTime } from "luxon";

// utcOffsetInMinutes is +120 for Kigali
export const getUtcDateOffset = (offsetMinutes: number): Date => {
  return DateTime.utc().plus({ minutes: offsetMinutes }).toJSDate();
};

export const getUtcNow = (): Date => {
  return DateTime.utc().toJSDate();
};
