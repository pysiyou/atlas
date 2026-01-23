/**
 * LoginBackground Component
 * Renders the animated background with floating icons and atmospheric effects
 */

import React from 'react';
import { FloatingIcon, FLOATING_ICONS_CONFIG } from './FloatingIcon';

/**
 * LoginBackground Component
 * Renders background effects including floating icons, color accents, and grid pattern
 */
export const LoginBackground: React.FC = () => {
  return (
    <>
      {/* CSS Keyframes for custom animations */}
      <style>{`
        @keyframes floatIcon {
          0%, 100% { 
            transform: translateY(0) rotate(var(--rotation, 0deg)); 
          }
          25% { 
            transform: translateY(-15px) rotate(calc(var(--rotation, 0deg) + 3deg)); 
          }
          50% { 
            transform: translateY(-25px) rotate(calc(var(--rotation, 0deg) - 2deg)); 
          }
          75% { 
            transform: translateY(-10px) rotate(calc(var(--rotation, 0deg) + 2deg)); 
          }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
        .font-display {
          font-family: 'Nunito', sans-serif;
        }
        .font-body {
          font-family: 'Nunito', sans-serif;
        }
      `}</style>

      {/* Subtle matte color accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top-right muted teal accent */}
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(94, 129, 138, 0.25) 0%, transparent 70%)',
          }}
        />
        {/* Bottom-left muted slate accent */}
        <div
          className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(100, 116, 139, 0.2) 0%, transparent 70%)',
          }}
        />
        {/* Center subtle matte glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(120, 130, 150, 0.12) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating SVG icons */}
      {FLOATING_ICONS_CONFIG.map((config, index) => (
        <FloatingIcon key={`${config.icon}-${index}`} {...config} />
      ))}
    </>
  );
};
