// src/utils/documentUtils.ts - CORRIGIDO
export const getPriorityLevel = (document: any): 'high' | 'medium' | 'low' => {
  if (document.status === 'SUBMITTED') {
    const daysSinceSubmission = Math.floor(
      (Date.now() - new Date(document.submittedAt || document.updatedAt).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    if (daysSinceSubmission > 7) return 'high';
    if (daysSinceSubmission > 3) return 'medium';
  }
  return 'low';
};

export const getPriorityColors = (priority: 'high' | 'medium' | 'low'): string => {
  const colors = {
    high: 'border-l-red-500 bg-red-50',
    medium: 'border-l-yellow-500 bg-yellow-50',
    low: 'border-l-blue-500 bg-blue-50',
  };
  return colors[priority];
};

export const canEditDocument = (document: any, isStudent: boolean): boolean => {
  return isStudent && (document.status === 'DRAFT' || document.status === 'REVISION');
};

export const canSubmitDocument = (document: any, isStudent: boolean): boolean => {
  return isStudent && (document.status === 'DRAFT' || document.status === 'REVISION');
};

export const canPerformAdvisorActions = (document: any, isAdvisor: boolean): boolean => {
  return isAdvisor && document.status === 'SUBMITTED';
};