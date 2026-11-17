/**
 * Build API paths with encoded clinical id segments.
 */
import type { z } from 'zod';

export function clinicalPathSegment(id: string, schema?: z.ZodType<string>): string {
  const trimmed = id.trim();
  if (schema) {
    const parsed = schema.safeParse(trimmed);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? 'Invalid identifier');
    }
  }
  return encodeURIComponent(trimmed);
}

export function clinicalPath(base: string, segment: string, schema?: z.ZodType<string>): string {
  const encoded = clinicalPathSegment(segment, schema);
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${normalizedBase}/${encoded}`;
}