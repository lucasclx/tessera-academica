import { describe, it, expect } from 'vitest';
import { getPriorityLevel, getPriorityColors, canEditDocument, canSubmitDocument, canPerformAdvisorActions } from '../documentUtils';

describe('documentUtils', () => {
  describe('getPriorityLevel', () => {
    it('returns high for submitted documents older than seven days', () => {
      const doc = { status: 'SUBMITTED', submittedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() };
      expect(getPriorityLevel(doc)).toBe('high');
    });

    it('returns medium for submitted documents older than three days', () => {
      const doc = { status: 'SUBMITTED', submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() };
      expect(getPriorityLevel(doc)).toBe('medium');
    });

    it('returns low otherwise', () => {
      const recent = { status: 'SUBMITTED', submittedAt: new Date().toISOString() };
      const draft = { status: 'DRAFT', submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() };
      expect(getPriorityLevel(recent)).toBe('low');
      expect(getPriorityLevel(draft)).toBe('low');
    });
  });

  it('getPriorityColors returns expected classes', () => {
    expect(getPriorityColors('high')).toBe('border-l-red-500 bg-red-50');
    expect(getPriorityColors('medium')).toBe('border-l-yellow-500 bg-yellow-50');
    expect(getPriorityColors('low')).toBe('border-l-blue-500 bg-blue-50');
  });

  describe('permission helpers', () => {
    const draft = { status: 'DRAFT' };
    const revision = { status: 'REVISION' };
    const submitted = { status: 'SUBMITTED' };

    it('canEditDocument only allows students for draft or revision', () => {
      expect(canEditDocument(draft, true)).toBe(true);
      expect(canEditDocument(revision, true)).toBe(true);
      expect(canEditDocument(submitted, true)).toBe(false);
      expect(canEditDocument(draft, false)).toBe(false);
    });

    it('canSubmitDocument mirrors edit permissions', () => {
      expect(canSubmitDocument(draft, true)).toBe(true);
      expect(canSubmitDocument(revision, true)).toBe(true);
      expect(canSubmitDocument(submitted, true)).toBe(false);
      expect(canSubmitDocument(draft, false)).toBe(false);
    });

    it('canPerformAdvisorActions only for advisors on submitted docs', () => {
      expect(canPerformAdvisorActions(submitted, true)).toBe(true);
      expect(canPerformAdvisorActions(draft, true)).toBe(false);
      expect(canPerformAdvisorActions(submitted, false)).toBe(false);
    });
  });
});
