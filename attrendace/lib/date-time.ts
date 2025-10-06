import { Days } from '@prisma/client';
import {
  addMinutes,
  addDays,
  subDays,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  getDay,
  format
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const TIME_ZONE = 'Africa/Kigali';

const DateTimeHelper = {
  // ===== BASE UTILS =====
  formatInZone: (date: Date, formatStr: string) => {
    return formatInTimeZone(date, TIME_ZONE, formatStr);
  },
  now: () => new Date(),
  getTimeFromDate: (date: Date | string) => {
    return format(date, 'HH:mm:ss');
  },

  // ===== CURRENT DATE/TIME =====  
  getCurrentUTCTimestamp: () => new Date().toISOString(),

  getCurrentUTCDate: () => {
    return formatInTimeZone(new Date(), TIME_ZONE, 'yyyy-MM-dd');
  },

  getCurrentUTCTime: () => {
    return formatInTimeZone(new Date(), TIME_ZONE, 'HH:mm:ss');
  },

  getCurrentUTCDateTime: () => {
    return formatInTimeZone(new Date(), TIME_ZONE, 'yyyy-MM-dd HH:mm:ss');
  },

  // ===== DATE ARITHMETIC =====
  addDays: (days: number, formatStr = 'yyyy-MM-dd') => {
    const now = new Date();
    const added = addDays(now, days);
    return {
      daysAdded: days,
      date: formatInTimeZone(added, TIME_ZONE, formatStr),
    };
  },

  // add minutes on time
  addMinutes: (minutes: number, formatStr = 'yyyy-MM-dd HH:mm:ss') => {
    const now = new Date();
    const added = addMinutes(now, minutes);
    return {
      minutesAdded: minutes,
      date: formatInTimeZone(added, TIME_ZONE, formatStr),
    };
  },

  removeDays: (days: number, formatStr = 'yyyy-MM-dd') => {
    const now = new Date();
    const removed = subDays(now, days);
    return {
      daysRemoved: days,
      date: formatInTimeZone(removed, TIME_ZONE, formatStr),
    };
  },

  // ===== DIFFERENCES =====
  daysBetween: (date1: Date | string, date2: Date | string) => {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    return differenceInDays(d2, d1);
  },

  remainTime: (futureDate: Date | string) => {
    const now = new Date();
    const target = typeof futureDate === 'string' ? new Date(futureDate) : futureDate;

    return {
      days: differenceInDays(target, now),
      hours: differenceInHours(target, now) % 24,
      minutes: differenceInMinutes(target, now) % 60,
      seconds: differenceInSeconds(target, now) % 60,
    };
  },

  dateToISOString: (date: string) => {
    return new Date(date).toISOString();
  },
  // Convert 'HH:mm' to a Date object in the current time zone
  timeToTodayInZone: (time: string, formatStr = 'yyyy-MM-dd HH:mm:ss') => {
    const now = new Date();
    // Get today's date in the target time zone
    const todayStr = formatInTimeZone(now, TIME_ZONE, 'yyyy-MM-dd');
    // Create a date string with today's date and the provided time
    const dateTimeStr = `${todayStr}T${time}:00`;
    // Parse as local time in the target time zone
    const dateInZone = new Date(`${dateTimeStr}${DateTimeHelper.getTimeZoneOffsetString(TIME_ZONE, now)}`);
    return {
      date: dateInZone,
      formatted: formatInTimeZone(dateInZone, TIME_ZONE, formatStr),
    };
  },
// Helper to get the time zone offset string (e.g., "+02:00")
 getTimeZoneOffsetString(timeZone: string, date: Date): string {
  const tzDate = formatInTimeZone(date, timeZone, "xxx"); // e.g. "+02:00"
  return tzDate;
},
getThisDay(){
  return getDay(this.getCurrentUTCDateTime())
}, 
DayHelper: (day: number) => {
  switch (day) {
    case 0:  // Sunday
      return Days.Sunday;
    case 1:
      return Days.Monday;
    case 2:
      return Days.Tuesday;
    case 3:
      return Days.Wednesday;
    case 4:
      return Days.Thursday;
    case 5:
      return Days.Friday;
    case 6:  // Saturday
      return Days.Saturday;
    default:
      break;
  }
},
dateFormateter: (date: string | Date) => {
  return format(new Date(date),  "MMM dd, yyyy hh:mm a");
},
// get current month in format of 'yyyy-MM'
getCurrentMonth: () => {
  return formatInTimeZone(new Date(), TIME_ZONE, 'yyyy-MM');
}

};

export default DateTimeHelper;
