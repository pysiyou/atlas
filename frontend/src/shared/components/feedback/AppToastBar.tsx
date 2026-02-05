/**
 * AppToastBar – dark notification card.
 * Row 1: status icon, title, circle-close button. Row 2: secondary text (subtitle).
 * Supports message as string (title only) or ToastMessageObject. Colors from theme --toast-* vars.
 */

import React from 'react';
import toastLib from 'react-hot-toast';
import { resolveValue, type Toast } from 'react-hot-toast';

/** Rich toast payload: optional title (default per variant if omitted), optional subtitle, actions, variant. */
export interface ToastMessageObject {
  title?: string;
  subtitle?: string;
  actions?: { label: string; onClick: () => void }[];
  variant?: 'info' | 'warning';
}

function isToastMessageObject(m: unknown): m is ToastMessageObject {
  if (typeof m !== 'object' || m === null) return false;
  const o = m as Record<string, unknown>;
  return (
    typeof o.title === 'string' ||
    typeof o.subtitle === 'string' ||
    Array.isArray(o.actions) ||
    o.variant === 'info' ||
    o.variant === 'warning'
  );
}

const DEFAULT_TITLES: Record<ToastVariant, string> = {
  success: 'Success',
  error: 'Error',
  info: 'Informational',
  warning: 'Warning',
  loading: 'Loading',
};

type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'loading';

const barStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 0,
  minWidth: 320,
  maxWidth: 380,
  padding: 14,
  background: 'var(--toast-bg)',
  color: 'var(--toast-fg)',
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
  lineHeight: 1.4,
  pointerEvents: 'auto',
  fontFamily: 'inherit',
};

/** Row 1: icon, title, close (circle-close icon). */
const row1Style: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const titleWrapStyle: React.CSSProperties = {
  flex: '1 1 auto',
  minWidth: 0,
};

const closeStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  margin: 0,
  background: 'none',
  border: 'none',
  borderRadius: 6,
  color: 'var(--toast-close)',
  cursor: 'pointer',
  flexShrink: 0,
};

const closeHoverStyle = (
  e: React.MouseEvent<HTMLButtonElement>,
  over: boolean
): void => {
  const t = e.currentTarget;
  t.style.color = over ? 'var(--toast-fg)' : 'var(--toast-close)';
  t.style.background = over ? 'rgba(255,255,255,0.1)' : 'none';
};

const titleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '0.875rem',
  color: 'var(--toast-fg)',
  whiteSpace: 'pre-line',
  margin: 0,
};

/** Row 2: secondary text. */
const subtitleStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--toast-fg-muted)',
  margin: '6px 0 0 0',
  paddingLeft: 36,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
};

const actionsRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '8px 16px',
  marginTop: 8,
  paddingLeft: 36,
};

const actionButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: 'var(--toast-fg-muted)',
  fontSize: '0.875rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
  lineHeight: 1.4,
};

/** Circle-close icon for dismiss button. */
function CloseCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={24} height={24}>
      <circle cx="12" cy="12" r="10" />
      <path d="M14.5 9.5L9.5 14.5M9.5 9.5l5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatusIconSvg({
  colorVar,
  children,
}: {
  colorVar: string;
  children: React.ReactNode;
}) {
  return (
    <span
      role="img"
      aria-hidden
      style={{
        width: 24,
        height: 24,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: `var(${colorVar})`,
      }}
    >
      {children}
    </span>
  );
}

/** Outlined circle + checkmark; interior transparent/white, stroke green. */
function SuccessIconSvg() {
  return (
    <StatusIconSvg colorVar="--toast-success">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={24} height={24}>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </StatusIconSvg>
  );
}

/** Outlined circle + i; interior transparent. */
function InfoIconSvg() {
  return (
    <StatusIconSvg colorVar="--toast-info">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={24} height={24}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </StatusIconSvg>
  );
}

/** Outlined circle + i; interior transparent. */
function WarningIconSvg() {
  return (
    <StatusIconSvg colorVar="--toast-warning">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={24} height={24}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
      </svg>
    </StatusIconSvg>
  );
}

/** Outlined circle + X; interior transparent. */
function ErrorIconSvg() {
  return (
    <StatusIconSvg colorVar="--toast-danger">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={24} height={24}>
        <circle cx="12" cy="12" r="10" />
        <path d="M14.5 9.5L9.5 14.5M9.5 9.5l5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </StatusIconSvg>
  );
}

function LoadingIcon() {
  return (
    <div
      role="img"
      aria-hidden
      style={{
        width: 24,
        height: 24,
        border: '2px solid var(--toast-fg-muted)',
        borderRightColor: 'var(--toast-fg)',
        borderRadius: '50%',
        flexShrink: 0,
        animation: 'app-toast-spin 1s linear infinite',
      }}
    />
  );
}

function ToastIconBlock({
  variant,
  customIcon,
}: {
  variant: ToastVariant;
  customIcon?: React.ReactNode;
}) {
  if (customIcon !== undefined) {
    return typeof customIcon === 'string' ? (
      <span style={{ flexShrink: 0 }}>{customIcon}</span>
    ) : (
      <>{customIcon}</>
    );
  }
  if (variant === 'loading') {
    return <LoadingIcon />;
  }
  if (variant === 'success') return <SuccessIconSvg />;
  if (variant === 'error') return <ErrorIconSvg />;
  if (variant === 'info') return <InfoIconSvg />;
  if (variant === 'warning') return <WarningIconSvg />;
  return null;
}

const SPIN_KEYFRAMES = `@keyframes app-toast-spin { to { transform: rotate(360deg); } }`;
const STYLE_ID = 'app-toast-spin-keyframes';

function ensureSpinKeyframes(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = SPIN_KEYFRAMES;
  document.head.appendChild(el);
}

function getEffectiveVariant(toast: Toast, raw: unknown): ToastVariant {
  if (isToastMessageObject(raw) && raw.variant === 'info') return 'info';
  if (isToastMessageObject(raw) && raw.variant === 'warning') return 'warning';
  if (toast.type === 'success') return 'success';
  if (toast.type === 'error') return 'error';
  if (toast.type === 'loading') return 'loading';
  return 'success';
}

export interface AppToastBarProps {
  toast: Toast;
}

export const AppToastBar: React.FC<AppToastBarProps> = ({ toast }) => {
  ensureSpinKeyframes();
  const raw = resolveValue(toast.message, toast);
  const variant = getEffectiveVariant(toast, raw);
  const isObj = isToastMessageObject(raw);
  const resolvedTitle = isObj
    ? (raw.title?.trim() || DEFAULT_TITLES[variant])
    : String(raw ?? DEFAULT_TITLES[variant]);
  const subtitle = isObj ? raw.subtitle : undefined;
  const actions = isObj ? raw.actions : undefined;

  return (
    <div style={{ ...barStyle, ...toast.style }} {...toast.ariaProps}>
      <div style={row1Style}>
        <ToastIconBlock variant={variant} customIcon={toast.icon} />
        <div style={titleWrapStyle}>
          <div style={titleStyle}>{resolvedTitle}</div>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          style={closeStyle}
          onMouseEnter={(e) => closeHoverStyle(e, true)}
          onMouseLeave={(e) => closeHoverStyle(e, false)}
          onClick={() => toastLib.dismiss(toast.id)}
        >
          <CloseCircleIcon />
        </button>
      </div>
      {subtitle != null && subtitle !== '' && (
        <div style={subtitleStyle}>{subtitle}</div>
      )}
      {actions != null && actions.length > 0 && (
        <div style={actionsRowStyle}>
          {actions.map((a, i) => (
            <button
              key={i}
              type="button"
              style={actionButtonStyle}
              onClick={() => {
                a.onClick();
                toastLib.dismiss(toast.id);
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
