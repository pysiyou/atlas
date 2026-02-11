/**
 * LoginBackground Component
 * Renders the animated background with floating icons and atmospheric effects
 */

import React from 'react';

interface FloatingIconConfig {
  icon: string;
  left: string;
  top: string;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
  opacity: number;
}

const FLOATING_ICONS_CONFIG: FloatingIconConfig[] = [
  {
    icon: 'microscope-landing-page',
    left: '5%',
    top: '8%',
    size: 120,
    delay: 0,
    duration: 12,
    rotation: -15,
    opacity: 0.22,
  },
  {
    icon: 'atom-landing-page',
    left: '50%',
    top: '5%',
    size: 110,
    delay: 2.5,
    duration: 14,
    rotation: 12,
    opacity: 0.2,
  },
  {
    icon: 'dna-landing-page',
    left: '92%',
    top: '12%',
    size: 115,
    delay: 1,
    duration: 13,
    rotation: -10,
    opacity: 0.21,
  },
  {
    icon: 'beaker-landing-page',
    left: '3%',
    top: '35%',
    size: 100,
    delay: 1.5,
    duration: 14,
    rotation: 8,
    opacity: 0.18,
  },
  {
    icon: 'thermometer-landing-page',
    left: '88%',
    top: '32%',
    size: 105,
    delay: 3,
    duration: 15,
    rotation: 15,
    opacity: 0.19,
  },
  {
    icon: 'drops-droplet-landing-page',
    left: '8%',
    top: '58%',
    size: 95,
    delay: 2.5,
    duration: 11,
    rotation: 5,
    opacity: 0.2,
  },
  {
    icon: 'bond-molecule-landing-page',
    left: '90%',
    top: '55%',
    size: 110,
    delay: 0.5,
    duration: 12,
    rotation: 22,
    opacity: 0.18,
  },
  {
    icon: 'test-tube-landing-page',
    left: '4%',
    top: '82%',
    size: 105,
    delay: 2,
    duration: 15,
    rotation: -25,
    opacity: 0.19,
  },
  {
    icon: 'flask-chemical-landing-page',
    left: '30%',
    top: '88%',
    size: 100,
    delay: 0,
    duration: 14,
    rotation: 18,
    opacity: 0.17,
  },
  {
    icon: 'vial-landing-page',
    left: '60%',
    top: '85%',
    size: 95,
    delay: 3.5,
    duration: 13,
    rotation: -12,
    opacity: 0.2,
  },
  {
    icon: 'syringe-landing-page',
    left: '92%',
    top: '80%',
    size: 90,
    delay: 1,
    duration: 16,
    rotation: 16,
    opacity: 0.18,
  },
  {
    icon: 'flask-education-landing-page',
    left: '18%',
    top: '18%',
    size: 85,
    delay: 4,
    duration: 13,
    rotation: -18,
    opacity: 0.16,
  },
  {
    icon: 'medicines-medicine-landing-page',
    left: '78%',
    top: '70%',
    size: 95,
    delay: 2,
    duration: 14,
    rotation: -6,
    opacity: 0.17,
  },
];

const FloatingIcon: React.FC<FloatingIconConfig> = ({
  icon,
  left,
  top,
  size,
  delay,
  duration,
  rotation,
  opacity,
}) => (
  <div
    className="absolute pointer-events-none select-none"
    style={{
      left,
      top,
      width: size,
      height: size,
      opacity,
      transform: `rotate(${rotation}deg)`,
      animation: `floatIcon ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
    }}
  >
    <img
      src={`/icons/${icon}.svg`}
      alt=""
      className="w-full h-full object-contain"
      style={{
        filter: 'brightness(0.8) saturate(0.7)',
      }}
      aria-hidden="true"
    />
  </div>
);

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
          font-family: var(--font-sans);
        }
        .font-body {
          font-family: var(--font-sans);
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
