import { Controller, type Control } from 'react-hook-form';
import type { Workup } from '@/features/catalog';
import type { OrderableTestSummary } from '@/types';
import { OrderTestPicker } from './OrderTestPicker';
import type { OrderFormInput } from '../schemas/order.schema';

export function OrderUpsertTestCodesField({
  control,
  testSearch,
  setTestSearch,
  filteredTests,
  tests,
  workups,
}: {
  control: Control<OrderFormInput>;
  testSearch: string;
  setTestSearch: (value: string) => void;
  filteredTests: OrderableTestSummary[];
  tests: OrderableTestSummary[];
  workups: Workup[];
}) {
  return (
    <Controller
      name="testCodes"
      control={control}
      rules={{ required: 'At least one test is required' }}
      render={({ field, fieldState }) => (
        <OrderTestPicker
          selectedTests={field.value || []}
          testSearch={testSearch}
          onTestSearchChange={setTestSearch}
          filteredTests={filteredTests}
          onToggleTest={(code: string) => {
            const current = field.value || [];
            const isAdding = !current.includes(code);
            const newValue = isAdding ? [...current, code] : current.filter(c => c !== code);
            field.onChange(newValue);
          }}
          error={fieldState.error?.message}
          tests={tests}
          workups={workups}
          onAddWorkup={memberCodes => {
            const current = field.value || [];
            const merged = [...current];
            for (const code of memberCodes) {
              if (!merged.includes(code)) merged.push(code);
            }
            field.onChange(merged);
          }}
        />
      )}
    />
  );
}