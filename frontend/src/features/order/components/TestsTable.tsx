/**
 * TestsTable Component
 * Displays a table of order tests
 */

import React from 'react';
import { Badge, EmptyState } from '@/shared/ui';
import { formatCurrency } from '@/utils';
import { getTestName, getTestSampleType, getTestCategory } from '@/utils/typeHelpers';
import type { OrderTest, Test } from '@/types';

export interface TestsTableProps {
  tests: OrderTest[];
  testCatalog: Test[];
  supersededCount?: number;
  variant?: 'simple' | 'detailed';
}

export const TestsTable: React.FC<TestsTableProps> = ({
  tests,
  testCatalog,
  variant = 'simple',
}) => {
  if (tests.length === 0) {
    return (
      <EmptyState
        icon="health"
        title="No Tests"
        description="This order has no tests."
      />
    );
  }

  if (variant === 'simple') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <tbody className="divide-y divide-gray-100">
            {tests.map((test: OrderTest, index: number) => {
              const testName = getTestName(test.testCode, testCatalog);
              const isSuperseded = test.status === 'superseded';
              const isRetest = test.isRetest || false;
              const retestNumber = test.retestNumber || 0;

              return (
                <tr
                  key={test.id || index}
                  className={`transition-colors ${
                    isSuperseded
                      ? 'bg-gray-50/50 opacity-60'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <span className={`font-mono ${
                        isSuperseded ? 'text-gray-400 line-through' : 'text-sky-600'
                      }`}>
                        {test.testCode}
                      </span>
                      {isRetest && retestNumber > 0 && (
                        <Badge variant="default" size="xs" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                          #{retestNumber}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`${isSuperseded ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {testName}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={test.status} size="sm" strikethrough={isSuperseded} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Detailed variant for large screens
  return (
    <table className="w-full text-left text-xs table-fixed">
      <colgroup>
        <col style={{ width: '12%' }} />
        <col style={{ width: '30%' }} />
        <col style={{ width: '20%' }} />
        <col style={{ width: '15%' }} />
        <col style={{ width: '15%' }} />
        <col style={{ width: '8%' }} />
      </colgroup>
      <thead className="bg-gray-50 text-gray-500 uppercase sticky top-0 z-10 [&_th]:font-normal">
        <tr>
          <th className="px-4 py-2">Code</th>
          <th className="px-4 py-2">Name</th>
          <th className="px-4 py-2">Category</th>
          <th className="px-4 py-2">Sample</th>
          <th className="px-4 py-2">Status</th>
          <th className="px-4 py-2 text-right">Price</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {tests.map((test: OrderTest, index: number) => {
          const testName = getTestName(test.testCode, testCatalog);
          const sampleType = getTestSampleType(test.testCode, testCatalog);
          const category = getTestCategory(test.testCode, testCatalog);
          const isSuperseded = test.status === 'superseded';
          const isRetest = test.isRetest || false;
          const retestNumber = test.retestNumber || 0;

          return (
            <tr
              key={test.id || index}
              className={`transition-colors ${
                isSuperseded
                  ? 'bg-gray-50/50 opacity-60'
                  : 'hover:bg-gray-50'
              }`}
            >
              <td className={`px-4 py-3 font-mono truncate whitespace-nowrap ${
                isSuperseded ? 'text-gray-400 line-through' : 'text-sky-600'
              }`}>
                {test.testCode}
              </td>

              <td className={`px-4 py-3 whitespace-normal wrap-break-word ${
                isSuperseded ? 'line-through' : ''
              }`}>
                <div className="flex items-center gap-1">
                  <span className={`font-medium ${
                    isSuperseded ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {testName}
                  </span>
                  {isRetest && retestNumber > 0 && (
                    <Badge variant="default" size="xs" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                      #{retestNumber}
                    </Badge>
                  )}
                </div>
              </td>

              <td className="px-4 py-3 whitespace-nowrap">
                <Badge variant={category as 'default'} size="sm" strikethrough={isSuperseded} />
              </td>

              <td className="px-4 py-3 whitespace-nowrap">
                <Badge variant={sampleType as 'default'} size="sm" strikethrough={isSuperseded} />
              </td>

              <td className="px-4 py-3 whitespace-nowrap">
                <Badge variant={test.status} size="sm" strikethrough={isSuperseded} />
              </td>

              <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                isSuperseded ? 'text-gray-400 line-through' : 'text-sky-600'
              }`}>
                {formatCurrency(test.priceAtOrder)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
