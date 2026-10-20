import { describe, expect, it } from 'vitest';
import { ModalType } from './modalTypes';
import {
  MAX_MODAL_STACK_DEPTH,
  modalFrameKey,
  popModalStack,
  pushModalFrame,
  replaceModalStack,
} from './modalTypes';

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

  it('pushModalFrame appends a nested frame', () => {
    const stack = pushModalFrame([testView], nestedSample);
    expect(stack).toEqual([testView, nestedSample]);
  });

  it('pushModalFrame on an empty stack opens a root frame', () => {
    expect(pushModalFrame([], sample)).toEqual([sample]);
  });

  it('pushModalFrame replaces the top when at the depth cap', () => {
    const full = [sample, testView, nestedSample];
    expect(full).toHaveLength(MAX_MODAL_STACK_DEPTH);
    const next = pushModalFrame(full, extra);
    expect(next).toHaveLength(MAX_MODAL_STACK_DEPTH);
    expect(next[2]).toEqual(extra);
    expect(next[0]).toEqual(sample);
    expect(next[1]).toEqual(testView);
  });

  it('popModalStack restores the parent frame', () => {
    const stack = [testView, nestedSample];
    expect(popModalStack(stack)).toEqual([testView]);
    expect(popModalStack([testView])).toEqual([]);
    expect(popModalStack([])).toEqual([]);
  });

  it('modalFrameKey distinguishes view vs validate for the same test', () => {
    expect(modalFrameKey(testView)).not.toBe(modalFrameKey(testValidate));
  });
});
