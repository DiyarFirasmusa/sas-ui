import { describe, expect, it } from 'vitest';
import {
  currentStageIndex,
  decisionOf,
  formatDateTime,
  overallOutcome,
  sampleApprovalRequest,
  type ApprovalStage,
} from '@/components/blocks/approval-01-data';

function stages(...decisions: ApprovalStage['decision'][]): ApprovalStage[] {
  const template = sampleApprovalRequest.stages[0];
  if (!template) {
    throw new Error('sample has no stages');
  }
  return decisions.map((decision, index) => ({ ...template, id: `s${index}`, decision }));
}

describe('overallOutcome', () => {
  it('is pending while any stage still waits', () => {
    expect(overallOutcome(sampleApprovalRequest.stages)).toBe('pending');
  });

  it('is approved only when every stage is', () => {
    expect(overallOutcome(stages('approved', 'approved'))).toBe('approved');
    expect(overallOutcome([])).toBe('pending');
  });

  it('lets a rejection beat a return, and a return beat pending', () => {
    expect(overallOutcome(stages('approved', 'returned', 'pending'))).toBe('returned');
    expect(overallOutcome(stages('returned', 'rejected'))).toBe('rejected');
  });
});

describe('currentStageIndex', () => {
  it('points at the first pending stage of an open request', () => {
    expect(currentStageIndex(sampleApprovalRequest.stages)).toBe(2);
  });

  it('is -1 when nobody is waiting', () => {
    expect(currentStageIndex(stages('approved', 'approved'))).toBe(-1);
    expect(currentStageIndex(stages('approved', 'rejected', 'pending'))).toBe(-1);
    expect(currentStageIndex([])).toBe(-1);
  });
});

describe('decisionOf', () => {
  it('maps each action to the decision it records', () => {
    expect(decisionOf('approve')).toBe('approved');
    expect(decisionOf('reject')).toBe('rejected');
    expect(decisionOf('return')).toBe('returned');
  });
});

describe('formatDateTime', () => {
  it('uses Latin digits in Arabic too', () => {
    const text = formatDateTime('2026-11-05T14:45:00Z', 'ar');
    expect(text).toMatch(/2026/);
    expect(text).not.toMatch(/[٠-٩]/);
  });

  it('returns unparseable input unchanged', () => {
    expect(formatDateTime('yesterday', 'en')).toBe('yesterday');
  });
});
