import React from 'react';
import { SectionContainer, SearchBar, Badge } from '@/shared/ui';
import { ShoppingCart, X, Clock, Droplet, AlertCircle, Beaker } from 'lucide-react';
import { formatCurrency } from '@/utils';
import type { Test } from '@/types';

interface TestSelectorProps {
  selectedTests: string[];
  testSearch: string;
  onTestSearchChange: (value: string) => void;
  filteredTests: Test[];
  onToggleTest: (testCode: string) => void;
  totalPrice: number;
  error?: string;
}

export const TestSelect: React.FC<TestSelectorProps> = ({
  selectedTests,
  testSearch,
  onTestSearchChange,
  filteredTests,
  onToggleTest,
  totalPrice,
  error,
}) => {
  const headerContent = (
    <div className="text-sm font-medium text-sky-600">
      Total: {formatCurrency(totalPrice)}
    </div>
  );

  return (
    <SectionContainer 
      title={`Test Selection (${selectedTests.length} selected)`}
      headerRight={headerContent}
    >
      <div className="space-y-4">
        <SearchBar
          placeholder="Search tests by name, code, or category..."
          value={testSearch}
          onChange={(e) => onTestSearchChange(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        {selectedTests.length > 0 && (
          <div className="border border-green-200 bg-green-50 rounded p-4">
            <div className="font-medium text-green-900 mb-2 flex items-center gap-2">
              <ShoppingCart size={16} />
              Selected Tests
            </div>
            <div className="space-y-2">
              {selectedTests.map((testCode) => {
                const test = filteredTests.find((t) => t.code === testCode);
                if (!test) return null;
                return (
                  <div
                    key={testCode}
                    className="flex items-center justify-between bg-white p-2 rounded"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{test.name}</div>
                      <div className="text-xs text-gray-600">
                        {test.code} • {test.sampleType} • {formatCurrency(test.price)}
                      </div>
                      {test.synonyms && test.synonyms.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Also known as: {test.synonyms.slice(0, 2).join(', ')}
                          {test.synonyms.length > 2 && ` +${test.synonyms.length - 2} more`}
                        </div>
                      )}
                      {test.fastingRequired && (
                        <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          Fasting required
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleTest(testCode)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="border border-gray-200 rounded divide-y max-h-96 overflow-y-auto">
          {filteredTests.map((test) => {
            const isSelected = selectedTests.includes(test.code);
            return (
              <button
                key={test.code}
                type="button"
                onClick={() => onToggleTest(test.code)}
                className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-sky-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{test.name}</div>
                        <div className="text-sm text-gray-600">
                          {test.code} • {test.category}
                        </div>
                        {test.synonyms && test.synonyms.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Also: {test.synonyms.slice(0, 2).join(', ')}
                            {test.synonyms.length > 2 && ` +${test.synonyms.length - 2}`}
                          </div>
                        )}
                        {test.panels && test.panels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {test.panels.map(panel => (
                              <Badge key={panel} variant="default" size="sm" className="border-none font-medium">
                                {panel}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Droplet size={12} />
                        <span>{test.sampleType}</span>
                        {test.minimumVolume && (
                          <span className="text-gray-400">({test.minimumVolume}mL min)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{test.turnaroundTime}h</span>
                      </div>
                      {test.containerDescription && (
                        <div className="flex items-center gap-1">
                          <Beaker size={12} />
                          <span className="text-gray-400">{test.containerDescription}</span>
                        </div>
                      )}
                    </div>
                    
                    {test.fastingRequired && (
                      <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        Fasting required
                      </div>
                    )}
                    
                    {test.collectionNotes && (
                      <div className="text-xs text-blue-600 mt-1">
                        📝 {test.collectionNotes}
                      </div>
                    )}
                    
                    {test.specialRequirements && !test.fastingRequired && (
                      <div className="text-xs text-orange-600 mt-1">
                        ⚠️ {test.specialRequirements}
                      </div>
                    )}
                    
                    {test.loincCodes && test.loincCodes.length > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        LOINC: {test.loincCodes.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <div className="font-medium text-sky-600">{formatCurrency(test.price)}</div>
                    {isSelected && (
                      <Badge variant="success" size="sm" className="border-none font-medium mt-1">
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </SectionContainer>
  );
};
