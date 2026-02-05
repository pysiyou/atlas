/**
 * VennBubbles - Modern Venn-diagram-style bubble visualization.
 * Shows overlapping circles with percentages. Supports intersection data.
 * Radius ∝ √(value) so area ∝ value.
 */

import React, { useMemo } from 'react';
import { Badge } from '@/shared/ui/display/Badge';

/** Data for a single segment in the Venn diagram */
export interface VennSegment {
  id: string;
  label: string;
  value: number;
  color: string;
  gradientEnd?: string;
}

/** Intersection between two or more segments */
export interface VennIntersection {
  segmentIds: string[];
  value: number;
}

export interface VennBubblesProps {
  /** Main segments (categories) */
  segments: VennSegment[];
  /** Intersections between segments */
  intersections?: VennIntersection[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Show legend below the chart */
  showLegend?: boolean;
  /** Ring color for separation (defaults to theme-aware surface color) */
  ringColor?: string;
  /** Ring stroke width */
  ringWidth?: number;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Accessible label for the chart */
  ariaLabel?: string;
  /** Additional class names */
  className?: string;
}

const VIEW_WIDTH = 240;
const VIEW_HEIGHT = 200;
const MAX_R = 75;
const MIN_R = 20;

const DEFAULT_POSITIONS = [
  { cx: 80, cy: 100 },
  { cx: 160, cy: 70 },
  { cx: 150, cy: 150 },
];

function radiusFromValue(value: number, maxValue: number): number {
  if (value <= 0) return 0;
  const normalized = Math.sqrt(value) / Math.sqrt(maxValue);
  return MIN_R + normalized * (MAX_R - MIN_R);
}

function fontSizeFromRadius(r: number): number {
  return Math.max(10, Math.min(26, r * 0.35));
}

function getIntersectionCenter(
  cx1: number,
  cy1: number,
  cx2: number,
  cy2: number,
  bias: number = 0.5
): { x: number; y: number } {
  return {
    x: cx1 + (cx2 - cx1) * bias,
    y: cy1 + (cy2 - cy1) * bias,
  };
}

export const VennBubbles: React.FC<VennBubblesProps> = ({
  segments,
  intersections = [],
  isLoading = false,
  showLegend = true,
  ringColor,
  ringWidth = 4,
  emptyMessage = 'No data',
  ariaLabel,
  className = '',
}) => {
  // Use canvas background for ring to create visual separation
  const adaptiveRingColor = ringColor ?? 'var(--canvas)';

  const sortedSegments = useMemo(
    () => [...segments].sort((a, b) => b.value - a.value),
    [segments]
  );

  const maxValue = useMemo(
    () => Math.max(...segments.map((s) => s.value), 1),
    [segments]
  );

  const isEmpty = segments.every((s) => s.value === 0);

  const segmentData = useMemo(() => {
    return sortedSegments.map((segment, index) => {
      const pos = DEFAULT_POSITIONS[index] || { cx: 120, cy: 100 };
      const radius = radiusFromValue(segment.value, maxValue);
      return { ...segment, ...pos, radius, fontSize: fontSizeFromRadius(radius) };
    });
  }, [sortedSegments, maxValue]);

  const segmentMap = useMemo(() => {
    const map = new Map<string, (typeof segmentData)[0]>();
    segmentData.forEach((s) => map.set(s.id, s));
    return map;
  }, [segmentData]);

  const intersectionLabels = useMemo(() => {
    return intersections
      .filter((int) => int.value > 0 && int.segmentIds.length === 2)
      .map((int) => {
        const seg1 = segmentMap.get(int.segmentIds[0]);
        const seg2 = segmentMap.get(int.segmentIds[1]);
        if (!seg1 || !seg2) return null;
        const pos = getIntersectionCenter(seg1.cx, seg1.cy, seg2.cx, seg2.cy);
        return { ...int, x: pos.x, y: pos.y, fontSize: 11 };
      })
      .filter(Boolean);
  }, [intersections, segmentMap]);

  const baseClass = 'h-full w-full min-h-0 min-w-0 flex flex-col bg-canvas rounded-lg overflow-hidden';

  if (isLoading) {
    return (
      <div className={`${baseClass} items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-12 h-12">
            <div 
              className="absolute inset-0 rounded-full border-4 border-transparent animate-spin" 
              style={{ 
                borderTopColor: 'var(--primary)',
                animationDuration: '1s' 
              }} 
            />
            <div 
              className="absolute inset-2 rounded-full border-4 border-transparent animate-spin" 
              style={{ 
                borderTopColor: 'var(--chart-accent)',
                animationDuration: '1.5s', 
                animationDirection: 'reverse' 
              }} 
            />
          </div>
          <span className="text-text-3 text-sm font-medium">Loading visualization…</span>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={`${baseClass} items-center justify-center ${className}`}>
        <div className="flex flex-col items-center gap-2 opacity-60">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-40">
            <circle cx="18" cy="24" r="12" stroke="currentColor" strokeWidth="2" className="text-text-muted" />
            <circle cx="30" cy="24" r="12" stroke="currentColor" strokeWidth="2" className="text-text-muted" />
          </svg>
          <span className="text-text-3 text-sm font-medium">{emptyMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClass} ${className}`}>
      <div className="flex-1 min-h-0 min-w-0 flex flex-col p-2">
        <div className="flex-1 min-h-0 min-w-0">
          <svg
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className="w-full h-full"
            style={{ display: 'block', filter: 'drop-shadow(0 4px 12px var(--shadow-md))' }}
            preserveAspectRatio="xMidYMid meet"
            aria-label={ariaLabel ?? segments.map((s) => `${s.label}: ${s.value}%`).join(', ')}
          >
          <defs>
            {segmentData.map((segment) => (
              <React.Fragment key={`defs-${segment.id}`}>
                <filter id={`shadow-${segment.id}`}>
                  <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                  <feOffset dx="0" dy="2" result="offsetblur" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </React.Fragment>
            ))}
          </defs>

          {segmentData.map((segment) => (
              <g key={segment.id}>
                {/* Main circle with shadow */}
                <circle
                  cx={segment.cx}
                  cy={segment.cy}
                  r={segment.radius}
                  fill={segment.color}
                  stroke={adaptiveRingColor}
                  strokeWidth={ringWidth}
                  filter={`url(#shadow-${segment.id})`}
                />
                {/* Percentage text */}
                <text
                  x={segment.cx}
                  y={segment.cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fill: '#ffffff',
                    fontSize: segment.fontSize,
                    fontWeight: 700,
                    fontFamily: 'Nunito, sans-serif',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {Math.round(segment.value)}%
                </text>
              </g>
            ))}

          {intersectionLabels.map(
            (int, idx) =>
              int && (
                <text
                  key={`intersection-${idx}`}
                  x={int.x}
                  y={int.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fill: '#ffffff',
                    fontSize: int.fontSize,
                    fontWeight: 700,
                    fontFamily: 'Nunito, sans-serif',
                    textShadow: '0 2px 6px rgba(0, 0, 0, 0.5)',
                    opacity: 0.9,
                  }}
                >
                  {Math.round(int.value)}%
                </text>
              )
          )}
          </svg>
        </div>

      {showLegend && (
        <div className="shrink-0">
          <div className="flex flex-wrap justify-center gap-2">
            {segments.map((segment) => (
                <div key={segment.id}>
                  <Badge
                    variant="neutral"
                    size="sm"
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1.5"
                      style={{
                        backgroundColor: segment.color,
                      }}
                    />
                    <span>
                      {segment.label}
                    </span>
                  </Badge>
                </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
