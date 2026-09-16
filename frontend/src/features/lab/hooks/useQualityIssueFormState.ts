import { useState } from 'react';
import type { RemedyType } from '@/types/lab-operations';

export function useQualityIssueFormState() {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredRemedy, setPreferredRemedy] = useState<RemedyType | ''>('');

  const reset = () => {
    setReason('');
    setNotes('');
    setPreferredRemedy('');
  };

  return { reason, notes, setReason, setNotes, preferredRemedy, setPreferredRemedy, reset };
}
