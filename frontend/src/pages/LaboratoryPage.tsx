/**
 * Laboratory Page
 * Lab operations - sample collection, result entry, validation
 */

import React, { useState } from 'react';
import { CollectionView } from '@/features/lab/collection/CollectionView';
import { EntryView } from '@/features/lab/entry/EntryView';
import { ValidationView } from '@/features/lab/validation/ValidationView';
import { Icon } from '@/shared/ui/Icon';

export const Laboratory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'collection' | 'entry' | 'validation'>('collection');

  const tabs = [
    {
      id: 'collection' as const,
      label: 'Sample Collection',
      icon: <Icon name="flask" className="w-4 h-4" />,
    },
    {
      id: 'entry' as const,
      label: 'Result Entry',
      icon: <Icon name="notebook" className="w-4 h-4" />,
    },
    {
      id: 'validation' as const,
      label: 'Validation',
      icon: <Icon name="shield-check" className="w-4 h-4" />,
    },
  ];

  return (
    <div className="h-full flex flex-col p-4 space-y-6">
      {/* Page Header */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Laboratory Operations</h1>
      </div>

      {/* Main Content Card */}
      <div className="flex-1 flex flex-col bg-white rounded border border-gray-200 shadow-sm overflow-hidden min-h-0">
        {/* Tabs / Toolbar */}
        <div className="p-3 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="bg-gray-200/60 p-1 rounded flex items-center gap-1 self-start md:self-auto">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200
                    ${
                      isActive
                        ? 'bg-white text-sky-700 shadow-sm shadow-gray-200 ring-1 ring-black/5'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                    }
                  `}
                >
                  <div
                    className={`${isActive ? 'text-sky-600' : 'text-gray-400'} flex items-center`}
                  >
                    {tab.icon}
                  </div>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50 p-6">
          {activeTab === 'collection' && <CollectionView />}
          {activeTab === 'entry' && <EntryView />}
          {activeTab === 'validation' && <ValidationView />}
        </div>
      </div>
    </div>
  );
};
