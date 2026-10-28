import { z } from 'zod';

/** Build a Zod enum schema from a contract-generated `*_VALUES` tuple. */
export function zEnumFromValues<const T extends readonly [string, ...string[]]>(values: T) {
  return z.enum(values);
}
