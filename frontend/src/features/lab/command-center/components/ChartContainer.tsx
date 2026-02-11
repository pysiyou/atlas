/**
 * ChartContainer - Renders children only after the container has measurable dimensions.
 * Uses ResizeObserver to avoid Recharts width/height -1 when layout isn't ready.
 */

import React, { useEffect, useRef, useState } from 'react';

export interface ChartContainerSize {
  width: number;
  height: number;
}

interface ChartContainerProps {
  className?: string;
  style?: React.CSSProperties;
  children: (size: ChartContainerSize) => React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  className = '',
  style,
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ChartContainerSize>({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ready = size.width > 0 && size.height > 0;

  return (
    <div ref={ref} className={className} style={style}>
      {ready ? children(size) : null}
    </div>
  );
};
