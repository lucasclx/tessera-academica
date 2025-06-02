// Crie este arquivo se ainda não existir: src/store/notificationStore.ts
// Exemplo de como poderia ser:

import { create } from 'zustand';

interface NotificationSummaryData {
  unreadCount: number;
  totalCount: number;
  hasUrgent: boolean;
  documentsCount: number;
  commentsCount: number;
  approvalsCount: number;
}

interface NotificationSummaryStore {
  summary: NotificationSummaryData | null;
  setSummary: (summary: NotificationSummaryData) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: (count?: number) => void;
  clearUnreadCount: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useNotificationSummaryStore = create<NotificationSummaryStore>((set) => ({
  summary: { // Valores iniciais
    unreadCount: 0,
    totalCount: 0,
    hasUrgent: false,
    documentsCount: 0,
    commentsCount: 0,
    approvalsCount: 0,
  },
  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),
  setSummary: (summary) => set({ summary, isLoading: false }),
  incrementUnreadCount: () => set((state) => ({
    summary: state.summary ? { ...state.summary, unreadCount: state.summary.unreadCount + 1 } : { unreadCount: 1, totalCount: 1, hasUrgent: false, documentsCount: 0, commentsCount: 0, approvalsCount: 0 }
  })),
  decrementUnreadCount: (count = 1) => set((state) => ({
    summary: state.summary ? { ...state.summary, unreadCount: Math.max(0, state.summary.unreadCount - count) } : null
  })),
  clearUnreadCount: () => set((state) => ({
    summary: state.summary ? { ...state.summary, unreadCount: 0 } : null
  })),
}));
