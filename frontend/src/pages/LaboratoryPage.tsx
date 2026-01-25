/**
 * Laboratory Page
 * Lab operations - sample collection, result entry, validation
 */

import React, { useState } from 'react';
import { CollectionView } from '@/features/lab/collection/CollectionView';
import { EntryView } from '@/features/lab/entry/EntryView';
import { ValidationView } from '@/features/lab/validation/ValidationView';
import { Icon } from '@/shared/ui/Icon';
import { ICONS } from '@/utils/icon-mappings';
import { semanticColors, neutralColors, brandColors } from '@/shared/design-system/tokens/colors';

export const Laboratory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'collection' | 'entry' | 'validation'>('collection');

  const tabs = [
    {
      id: 'collection' as const,
      label: 'Sample Collection',
      icon: <Icon name={ICONS.dataFields.flask} className="w-4 h-4" />,
    },
    {
      id: 'entry' as const,
      label: 'Result Entry',
      icon: <Icon name={ICONS.dataFields.notebook} className="w-4 h-4" />,
    },
    {
      id: 'validation' as const,
      label: 'Result Validation',
      icon: <Icon name={ICONS.ui.shieldCheck} className="w-4 h-4" />,
    },
  ];

  const activeTabConfig = tabs.find(t => t.id === activeTab);
  const pageTitle = activeTabConfig?.label ?? 'Laboratory';

  return (
    <div className="h-full flex flex-col p-4 space-y-6">
      {/* Page Header: title with tabs on the right */}
      <div className="shrink-0 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        <div className="bg-gray-200/60 p-1 rounded flex items-center gap-1">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 cursor-pointer
                  ${
                    isActive
                      ? `bg-white ${brandColors.primary.textLightMedium} shadow-sm shadow-gray-200 ring-1 ring-black/5`
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                  }
                `}
              >
                <div
                  className={`${isActive ? semanticColors.info.icon : neutralColors.text.disabled} flex items-center`}
                >
                  {tab.icon}
                </div>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="flex-1 flex flex-col bg-white rounded border border-gray-200 shadow-sm overflow-hidden min-h-0">
        {/* Content Area: flex column, no scroll – filter + grid handle layout like ListView */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gray-50">
          {activeTab === 'collection' && <CollectionView />}
          {activeTab === 'entry' && <EntryView />}
          {activeTab === 'validation' && <ValidationView />}
        </div>
      </div>
    </div>
  );
};
