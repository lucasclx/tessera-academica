import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationSummaryStore } from '../notificationStore';

describe('useNotificationSummaryStore', () => {
  beforeEach(() => {
    useNotificationSummaryStore.setState({
      summary: {
        unreadCount: 0,
        totalCount: 0,
        hasUrgent: false,
        documentsCount: 0,
        commentsCount: 0,
        approvalsCount: 0,
      },
      isLoading: true,
    });
  });

  it('incrementUnreadCount increases unread count by 1', () => {
    const { result } = renderHook(() => useNotificationSummaryStore());
    act(() => {
      result.current.incrementUnreadCount();
    });
    expect(result.current.summary?.unreadCount).toBe(1);
  });

  it('clearUnreadCount resets unread count', () => {
    const { result } = renderHook(() => useNotificationSummaryStore());
    act(() => {
      result.current.incrementUnreadCount();
    });
    expect(result.current.summary?.unreadCount).toBe(1);
    act(() => {
      result.current.clearUnreadCount();
    });
    expect(result.current.summary?.unreadCount).toBe(0);
  });
});
