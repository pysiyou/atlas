/**
 * Date Utility Functions for Data Generation
 */

import { faker } from '@faker-js/faker';

/**
 * Get a date within the past N days
 */
export function getRecentDate(daysBack: number): Date {
  const now = new Date();
  const pastDate = new Date(now);
  pastDate.setDate(now.getDate() - faker.number.int({ min: 0, max: daysBack }));
  return pastDate;
}

/**
 * Get a date range for generating data
 * Returns dates spread across the past N days
 */
export function getDateInRange(startDaysBack: number, endDaysBack: number): Date {
  const now = new Date();
  const daysBack = faker.number.int({ min: endDaysBack, max: startDaysBack });
  const date = new Date(now);
  date.setDate(now.getDate() - daysBack);
  return date;
}

/**
 * Add hours to a date
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Get date of birth for a specific age
 */
export function getDateOfBirthForAge(age: number): Date {
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  const birthMonth = faker.number.int({ min: 0, max: 11 });
  const birthDay = faker.number.int({ min: 1, max: 28 });
  return new Date(birthYear, birthMonth, birthDay);
}

/**
 * Generate age within a range
 */
export function generateAge(minAge: number, maxAge: number): number {
  return faker.number.int({ min: minAge, max: maxAge });
}

/**
 * Format date as ISO string
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Get a random time during working hours (8 AM - 6 PM)
 */
export function getWorkingHoursTime(date: Date): Date {
  const result = new Date(date);
  result.setHours(faker.number.int({ min: 8, max: 17 }));
  result.setMinutes(faker.number.int({ min: 0, max: 59 }));
  result.setSeconds(0);
  result.setMilliseconds(0);
  return result;
}

/**
 * Check if date is before another date
 */
export function isBefore(date1: Date, date2: Date): boolean {
  return date1.getTime() < date2.getTime();
}

/**
 * Check if date is after another date
 */
export function isAfter(date1: Date, date2: Date): boolean {
  return date1.getTime() > date2.getTime();
}
