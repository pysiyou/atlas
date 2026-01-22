import type { TableCardViewProps } from './types';
import { useCardViewColumns } from './hooks/useColumnVisibility';
import { formatPhoneNumber, calculateAge } from '@/utils';
import { Avatar } from '@/shared/ui';

/**
 * Table Card View Component
 * Mobile-friendly card layout for table data
 */
export function TableCardView<T>({
  data,
  columns,
  priorityFields,
  onRowClick,
  getRowKey,
}: TableCardViewProps<T>) {
  const cardColumns = useCardViewColumns(columns, priorityFields);
  const primaryColumn = cardColumns[0];
  const secondaryColumns = cardColumns.slice(1);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      {data.map((item, index) => {
        const rowKey = getRowKey ? getRowKey(item, index) : index;
        const isClickable = !!onRowClick;

        return (
          <div
            key={rowKey}
            className={`
              bg-white border border-gray-200 rounded-lg p-4 
              transition-shadow
              ${isClickable ? 'cursor-pointer hover:shadow-md' : ''}
            `.trim()}
            onClick={() => onRowClick?.(item, index)}
          >
            {/* Primary field as title */}
            {primaryColumn && (
              <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                <div className="flex-1 min-w-0">
                  {primaryColumn.render ? (
                    primaryColumn.render(item, index)
                  ) : (
                    <div className="font-semibold text-gray-900 truncate">
                      {String((item as Record<string, unknown>)[primaryColumn.key] ?? '')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Secondary fields - values only */}
            <div className="space-y-2">
              {/* Avatar with name and age - for patient data */}
              {(() => {
                const itemRecord = item as Record<string, unknown>;
                const fullName = itemRecord.fullName;
                const dateOfBirth = itemRecord.dateOfBirth;
                
                if (fullName && dateOfBirth) {
                  const age = calculateAge(String(dateOfBirth));
                  // Filter out fullName and dateOfBirth columns since we're showing them with Avatar
                  const filteredColumns = secondaryColumns.filter(
                    col => col.key !== 'fullName' && col.key !== 'dateOfBirth'
                  );
                  
                  return (
                    <>
                      <Avatar
                        primaryText={String(fullName)}
                        secondaryText={`${age} years old`}
                        size="sm"
                      />
                      {filteredColumns.map((column) => (
                        <div key={column.key} className="text-sm text-gray-900 truncate">
                          {column.render
                            ? column.render(item, index)
                            : String((item as Record<string, unknown>)[column.key] ?? '')}
                        </div>
                      ))}
                    </>
                  );
                }
                
                // For non-patient data, render all secondary columns normally
                return (
                  <>
                    {secondaryColumns.map((column) => (
                      <div key={column.key} className="text-sm text-gray-900">
                        {column.render
                          ? column.render(item, index)
                          : String((item as Record<string, unknown>)[column.key] ?? '')}
                      </div>
                    ))}
                  </>
                );
              })()}
              
              {/* Phone and Email - if available in data */}
              {(() => {
                const itemRecord = item as Record<string, unknown>;
                const phone = itemRecord.phone;
                const email = itemRecord.email;
                const hasContactInfo = phone || email;
                
                if (!hasContactInfo) return null;
                
                return (
                  <>
                    {phone && (
                      <div className="text-sm text-gray-900 truncate">
                        {formatPhoneNumber(String(phone))}
                      </div>
                    )}
                    {email && (
                      <div className="text-sm text-gray-900 truncate">
                        {String(email)}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
