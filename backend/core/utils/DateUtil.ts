import * as moment from 'moment-timezone';

export function addDays(date: Date, days: number): Date {
  return moment(date).add(days, 'days').toDate();
}

export function addWeeks(date: Date, weeks: number): Date {
  return moment(date).add(weeks, 'weeks').toDate();
}

export function addMonths(date: Date, months: number): Date {
  return moment(date).add(months, 'months').toDate();
}

export function addQuarters(date: Date, quarters: number): Date {
  return moment(date).add(quarters, 'quarters').toDate();
}

export function addYears(date: Date, years: number): Date {
  return moment(date).add(years, 'years').toDate();
}

function convertSystemDayOfWeekToJsDay(systemDayOfWeek: number): number {
  return systemDayOfWeek === 6 ? 0 : systemDayOfWeek + 1;
}

export function findNextDayOfWeek(
  startDate: Date,
  systemDayOfWeek: number,
): Date {
  const date = moment(startDate).isAfter(moment()) ? startDate : new Date();
  const m = moment(date);
  const currentJsDay = m.day(); // 0: CN, 1: T2, ..., 6: T7
  const targetJsDay = convertSystemDayOfWeekToJsDay(systemDayOfWeek);

  let daysToAdd = targetJsDay - currentJsDay;
  if (daysToAdd < 0) {
    daysToAdd += 7;
  }
  console.log(
    `Initialize schedules: currentJsDay: ${currentJsDay}, targetJsDay: ${targetJsDay}, daysToAdd: ${daysToAdd}`,
  );

  return m.add(daysToAdd, 'days').toDate();
}
