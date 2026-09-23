/**
 * Badge color tokens (semantic + extended palette).
 */

export type BadgeColor =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'pink'
  | 'teal'
  | 'orange'
  | 'indigo'
  | 'cyan'
  | 'muted';

export type BadgeVariant = BadgeColor | 'default' | `container-${string}`;
