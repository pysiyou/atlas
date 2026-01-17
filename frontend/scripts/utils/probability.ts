/**
 * Probability and Random Selection Utilities
 */

import { faker } from '@faker-js/faker';

/**
 * Weighted random selection
 * @param options Array of [value, weight] tuples
 * @returns Selected value
 */
export function weightedRandom<T>(options: [T, number][]): T {
  const totalWeight = options.reduce((sum, [, weight]) => sum + weight, 0);
  let random = faker.number.float({ min: 0, max: totalWeight });

  for (const [value, weight] of options) {
    random -= weight;
    if (random <= 0) {
      return value;
    }
  }

  // Fallback to last option
  return options[options.length - 1][0];
}

/**
 * Return true with given probability (0-100)
 */
export function chance(probability: number): boolean {
  return faker.number.int({ min: 1, max: 100 }) <= probability;
}

/**
 * Pick random items from array
 */
export function pickRandom<T>(array: T[], count: number): T[] {
  const shuffled = faker.helpers.shuffle([...array]);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Pick single random item from array
 */
export function pickOne<T>(array: T[]): T {
  return faker.helpers.arrayElement(array);
}

/**
 * Pick random number of items (between min and max)
 */
export function pickRandomCount<T>(array: T[], min: number, max: number): T[] {
  const count = faker.number.int({ min, max });
  return pickRandom(array, count);
}

/**
 * Distribution helper - ensures coverage of all options
 */
export function distributeEvenly<T>(options: T[], totalCount: number): T[] {
  const result: T[] = [];
  const perOption = Math.floor(totalCount / options.length);
  const remainder = totalCount % options.length;

  options.forEach((option, index) => {
    const count = perOption + (index < remainder ? 1 : 0);
    for (let i = 0; i < count; i++) {
      result.push(option);
    }
  });

  return faker.helpers.shuffle(result);
}
