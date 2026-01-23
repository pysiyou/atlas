import React, { useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  content: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  className?: string;
  variant?: 'underline' | 'pills';
}

// Export hooks for custom tab implementations
// eslint-disable-next-line react-refresh/only-export-components
export const useTabs = (tabs: TabItem[], defaultTabId?: string) => {
  const [activeTabId, setActiveTabId] = useState(defaultTabId || tabs[0]?.id);
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  return {
    activeTabId,
    setActiveTabId,
    activeTab,
  };
};

export interface TabsListProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
  /** Optional ref to the header container for indicator positioning */
  headerRef?: React.RefObject<HTMLDivElement | null>;
  /** Callback to receive indicator state (for external rendering) */
  onIndicatorChange?: (indicator: { left: number; width: number }) => void;
}

export const TabsList: React.FC<TabsListProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  variant = 'underline',
  className = '',
  headerRef,
  onIndicatorChange,
}) => {
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  /**
   * Update indicator position based on active tab button
   * Similar to cargoplan: positions indicator relative to header container
   */
  const updateIndicator = useCallback(() => {
    const activeButton = tabsRef.current[activeTabId];
    // Use headerRef if provided (for TabbedSectionContainer), otherwise use containerRef
    const headerEl = headerRef?.current || containerRef.current;

    if (!activeButton || !headerEl) {
      return;
    }

    // Get button and header positions (matching cargoplan pattern)
    const buttonRect = activeButton.getBoundingClientRect();
    const headerRect = headerEl.getBoundingClientRect();

    // Calculate position relative to header (where indicator is positioned)
    // Button's viewport position - header's viewport position = position relative to header
    const newLeft = buttonRect.left - headerRect.left;
    const newWidth = buttonRect.width;

    // Only update if values changed significantly to prevent jitter
    setIndicator(prev => {
      const leftDiff = Math.abs(prev.left - newLeft);
      const widthDiff = Math.abs(prev.width - newWidth);

      // Only update if change is significant (prevents micro-updates during animation)
      if (leftDiff < 1 && widthDiff < 1) {
        return prev;
      }

      return { left: newLeft, width: newWidth };
    });
  }, [activeTabId, headerRef]);

  // Update indicator on mount and when active tab changes
  useLayoutEffect(() => {
    // Use double RAF to ensure layout is complete before measuring
    let raf2: number;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        updateIndicator();
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [updateIndicator, activeTabId, tabs.length]);

  // Handle resize and scroll events
  useEffect(() => {
    const handleResize = () => {
      updateIndicator();
    };

    window.addEventListener('resize', handleResize);

    // Set up ResizeObserver for header/container and tab buttons
    const ro = new ResizeObserver(() => {
      updateIndicator();
    });

    const headerEl = headerRef?.current || containerRef.current;
    if (headerEl) {
      ro.observe(headerEl);
    }

    Object.values(tabsRef.current).forEach(el => {
      if (el) ro.observe(el);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
    };
  }, [updateIndicator, tabs.length, headerRef]);

  // Handle scroll on container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateIndicator();
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [updateIndicator]);

  // Sync indicator state to parent component (for TabbedSectionContainer)
  // This must be in a useEffect to avoid updating parent state during render
  useEffect(() => {
    if (onIndicatorChange) {
      onIndicatorChange(indicator);
    }
  }, [indicator, onIndicatorChange]);

  return (
    <div
      ref={containerRef}
      className={`
        relative flex items-center overflow-x-auto no-scrollbar
        ${variant === 'underline' ? 'h-full min-h-full' : 'gap-2'}
        ${className}
      `}
    >
      {tabs.map(tab => {
        const isActive = activeTabId === tab.id;

        let buttonClass =
          'whitespace-nowrap flex items-center justify-center transition-all duration-200 font-medium text-xs cursor-pointer ';

        if (variant === 'underline') {
          // Remove border-b-2 from buttons since we use sliding indicator
          buttonClass += `px-4 py-2 ${
            isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`;
        } else {
          // Pills variant
          buttonClass += `px-3 py-1.5 rounded-md ${
            isActive
              ? 'bg-blue-100 text-blue-700'
              : 'bg-transparent text-gray-600 hover:bg-gray-100'
          }`;
        }

        return (
          <button
            key={tab.id}
            ref={el => {
              tabsRef.current[tab.id] = el;
            }}
            onClick={() => onTabChange(tab.id)}
            className={buttonClass}
            type="button"
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-2 text-xs py-0.5 px-1.5 rounded-full ${
                  isActive
                    ? variant === 'underline'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-blue-200 text-blue-800'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}

      {/* Sliding tab indicator - only for underline variant */}
      {/* Positioned at the absolute bottom to align with header border */}
      {/* If headerRef is provided, indicator is rendered in TabbedSectionContainer wrapper */}
      {variant === 'underline' && !headerRef && (
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-blue-600 rounded-full pointer-events-none z-10"
          style={{
            left: `${indicator.left}px`,
            width: `${indicator.width}px`,
            transition:
              indicator.left > 0 || indicator.width > 0
                ? 'left 280ms cubic-bezier(0.4, 0, 0.2, 1), width 280ms cubic-bezier(0.4, 0, 0.2, 1)'
                : 'none',
            transform: 'translateZ(0)',
            willChange: 'left, width',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTabId,
  className = '',
  variant = 'underline',
}) => {
  const { activeTabId, setActiveTabId, activeTab } = useTabs(tabs, defaultTabId);

  if (!tabs.length) return null;

  return (
    <div className={`w-full ${className}`}>
      <TabsList
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
        variant={variant}
      />

      {/* Tab Content */}
      <div className="mt-4 animate-in fade-in duration-200">{activeTab.content}</div>
    </div>
  );
};
