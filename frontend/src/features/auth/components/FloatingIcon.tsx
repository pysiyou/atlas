/**
 * FloatingIcon Component
 * Renders an animated floating SVG icon for background decoration
 */

/* eslint-disable react-refresh/only-export-components */

import React from 'react';

export interface FloatingIconConfig {
  icon: string;
  left: string;
  top: string;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
  opacity: number;
}

export const FLOATING_ICONS_CONFIG: FloatingIconConfig[] = [
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

export const FloatingIcon: React.FC<FloatingIconConfig> = ({
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
