/**
 * AppToastBar – card layout, icon left, title, close top-right.
 * All non-color styles are inline; colors use theme vars (theme.css).
 */

import React from 'react';
import toastLib from 'react-hot-toast';
import { resolveValue, type Toast } from 'react-hot-toast';

const iconTheme = {
  success: { primary: 'var(--success)', secondary: 'var(--neutral)' },
  error: { primary: 'var(--danger)', secondary: 'var(--neutral)' },
} as const;

const barStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 0,
  minWidth: 320,
  maxWidth: 380,
  padding: '36px 14px 12px 14px',
  background: 'var(--surface)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  boxShadow: 'var(--shadow-2)',
  lineHeight: 1.4,
  pointerEvents: 'auto',
  fontFamily: 'inherit',
};

const closeStyle: React.CSSProperties = {
  position: 'absolute',
  top: 10,
  right: 10,
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  margin: 0,
  background: 'none',
  border: 'none',
  borderRadius: 6,
  color: 'var(--text-muted)',
  fontSize: 20,
  lineHeight: 1,
  cursor: 'pointer',
};

const closeHoverStyle = (
  e: React.MouseEvent<HTMLButtonElement>,
  over: boolean
): void => {
  const t = e.currentTarget;
  t.style.color = over ? 'var(--text)' : 'var(--text-muted)';
  t.style.background = over ? 'var(--surface-hover)' : 'none';
};

const bodyStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
};

const contentStyle: React.CSSProperties = {
  flex: '1 1 auto',
  minWidth: 0,
};

const titleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '0.9375rem',
  color: 'var(--text)',
  whiteSpace: 'pre-line',
  margin: 0,
};

function SuccessIcon({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div
      role="img"
      aria-hidden
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        background: primary,
        border: `2px solid ${primary}`,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          width: 6,
          height: 12,
          borderRight: `2px solid ${secondary}`,
          borderBottom: `2px solid ${secondary}`,
          transform: 'rotate(45deg)',
          marginBottom: 4,
          marginLeft: 2,
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function ErrorIcon({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div
      role="img"
      aria-hidden
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        background: primary,
        border: `2px solid ${primary}`,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 12,
          height: 2,
          background: secondary,
          transform: 'translate(-50%, -50%) rotate(45deg)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 12,
          height: 2,
          background: secondary,
          transform: 'translate(-50%, -50%) rotate(-45deg)',
        }}
      />
    </div>
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
        border: '2px solid var(--border-strong)',
        borderRightColor: 'var(--text-muted)',
        borderRadius: '50%',
        flexShrink: 0,
        animation: 'app-toast-spin 1s linear infinite',
      }}
    />
  );
}

function ToastIcon({ t }: { t: Toast }) {
  const { icon, type, iconTheme: custom } = t;
  if (icon !== undefined) {
    return typeof icon === 'string' ? <span style={{ flexShrink: 0 }}>{icon}</span> : icon;
  }
  if (type === 'blank') return null;
  if (type === 'loading') return <LoadingIcon />;
  const theme = custom ?? (type === 'error' ? iconTheme.error : iconTheme.success);
  return type === 'error' ? (
    <ErrorIcon primary={theme.primary} secondary={theme.secondary} />
  ) : (
    <SuccessIcon primary={theme.primary} secondary={theme.secondary} />
  );
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

export interface AppToastBarProps {
  toast: Toast;
}

export const AppToastBar: React.FC<AppToastBarProps> = ({ toast }) => {
  ensureSpinKeyframes();
  const message = resolveValue(toast.message, toast);

  return (
    <div style={{ ...barStyle, ...toast.style }} {...toast.ariaProps}>
        <button
          type="button"
          aria-label="Dismiss"
          style={closeStyle}
          onMouseEnter={(e) => closeHoverStyle(e, true)}
          onMouseLeave={(e) => closeHoverStyle(e, false)}
          onClick={() => toastLib.dismiss(toast.id)}
        >
          ×
        </button>
        <div style={bodyStyle}>
          <ToastIcon t={toast} />
          <div style={contentStyle}>
            <div style={titleStyle}>{message}</div>
          </div>
        </div>
      </div>
  );
};
