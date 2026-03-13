import { eachDayOfInterval, getDay, parseISO } from 'date-fns';

export function isValidISODate(dateString: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  
  if (!isoDateRegex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function isDateInAllowedRange(dateString: string): boolean {
  const date = new Date(dateString);
  const currentYear = new Date().getFullYear();
  const dateYear = date.getFullYear();
  
  return dateYear >= currentYear && dateYear <= currentYear + 5;
}

export function isStartDateBeforeOrEqualEndDate(startDateString: string, endDateString: string): boolean {
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  
  return startDate <= endDate;
}

export function calculateBusinessDays(startDateString: string, endDateString: string): number {
  const startDate = parseISO(startDateString);
  const endDate = parseISO(endDateString);
  
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  const businessDays = allDays.filter((date) => {
    const dayOfWeek = getDay(date);
    return dayOfWeek !== 0 && dayOfWeek !== 6;
  });
  
  return businessDays.length;
}
