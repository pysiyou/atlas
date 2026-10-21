/**
 * Single-line quality-issue warning — warning icon + text only (no alert surface).
 */
import { Icon } from '@/components/primitives';
import { text as textRecipe, TONE } from '@/theme/recipes';

export function QualityIssueInlineWarning({ message }: { message: string }) {
  const trimmed = message.trim();
  if (!trimmed) return null;

  return (
    <p
      className={`flex min-w-0 items-center gap-space-2 ${textRecipe({ role: 'body' })} ${TONE.warning.fg}`}
      role="status"
    >
      <Icon name="warning" className="h-4 w-4 shrink-0" aria-hidden />
      <span className="min-w-0">{trimmed}</span>
    </p>
  );
};
