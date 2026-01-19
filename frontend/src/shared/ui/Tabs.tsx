import React, { useState } from 'react';


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
    activeTab
  };
};

export interface TabsListProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export const TabsList: React.FC<TabsListProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  variant = 'underline',
  className = ''
}) => {
  return (
    <div className={`
      flex items-center overflow-x-auto no-scrollbar
      ${variant === 'underline' ? 'border-b border-gray-200' : 'gap-2'}
      ${className}
    `}>
      {tabs.map(tab => {
        const isActive = activeTabId === tab.id;
        
        let buttonClass = 'whitespace-nowrap flex items-center justify-center transition-all duration-200 font-medium text-xs ';
        
        if (variant === 'underline') {
          buttonClass += `px-4 py-2 border-b-2 -mb-px ${
            isActive 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
            onClick={() => onTabChange(tab.id)}
            className={buttonClass}
            type="button"
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-2 text-xs py-0.5 px-1.5 rounded-full ${
                isActive 
                  ? (variant === 'underline' ? 'bg-blue-100 text-blue-600' : 'bg-blue-200 text-blue-800')
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export const Tabs: React.FC<TabsProps> = ({ 
  tabs, 
  defaultTabId, 
  className = '',
  variant = 'underline'
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
      <div className="mt-4 animate-in fade-in duration-200">
        {activeTab.content}
      </div>
    </div>
  );
};
