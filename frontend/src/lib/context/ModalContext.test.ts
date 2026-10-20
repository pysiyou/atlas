import { describe, expect, it } from 'vitest';
import { ModalType } from './modalTypes';
import { modalFrameKey, planModalOpen, popModalStack, replaceModalStack } from './modalTypes';

const sample = { type: ModalType.SAMPLE_DETAIL, sampleId: '12' } as const;
const testView = {
  type: ModalType.TEST_DETAIL,
  orderTestId: 4,
  interaction: 'view' as const,
};
const testValidate = {
  type: ModalType.TEST_DETAIL,
  orderTestId: 4,
  interaction: 'validate' as const,
};
const nestedSample = { type: ModalType.SAMPLE_DETAIL, sampleId: '99', readOnly: true } as const;
const extra = {
  type: ModalType.RESULT_DETAIL,
  orderTestId: 8,
} as const;

describe('modal stack helpers', () => {
  it('replaceModalStack starts a new root frame', () => {
    expect(replaceModalStack(sample)).toEqual([sample]);
  });

  it('planModalOpen opens immediately when the stack is empty', () => {
    expect(planModalOpen([], sample)).toEqual({
      kind: 'immediate',
      stack: [sample],
    });
  });

  it('planModalOpen closes the current modal before opening another', () => {
    expect(planModalOpen([testView], nestedSample)).toEqual({
      kind: 'close_then_open',
      stack: [],
      frame: nestedSample,
    });
  });

  it('popModalStack clears the only frame', () => {
    expect(popModalStack([testView])).toEqual([]);
    expect(popModalStack([])).toEqual([]);
  });

  it('modalFrameKey distinguishes view vs validate for the same test', () => {
    expect(modalFrameKey(testView)).not.toBe(modalFrameKey(testValidate));
  });

  it('planModalOpen replaces the pending frame when switching targets', () => {
    const second = planModalOpen([testView], extra);
    expect(second).toEqual({
      kind: 'close_then_open',
      stack: [],
      frame: extra,
    });
  });
});
