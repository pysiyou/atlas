/**
 * Catalog (test) presentation helpers — no React.
 */

export function formatSynonymsPreview(
  synonyms: string[] | undefined,
  max = 2
): string | null {
  if (!synonyms?.length) {
    return null;
  }
  const preview = synonyms.slice(0, max).join(', ');
  if (synonyms.length > max) {
    return `${preview} +${synonyms.length - max} more`;
  }
  return preview;
}
