import { useCallback } from 'react';

interface UseConfirmDialogResult {
  confirm: (message: string, title?: string) => Promise<boolean>;
  confirmDeletion: (itemName?: string) => Promise<boolean>;
}

export function useConfirmDialog(): UseConfirmDialogResult {
  const confirm = useCallback(async (message: string, title?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const result = window.confirm(title ? `${title}\n\n${message}` : message);
      resolve(result);
    });
  }, []);

  const confirmDeletion = useCallback(async (itemName?: string): Promise<boolean> => {
    const message = itemName 
      ? `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`
      : 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.';
    
    return confirm(message, 'Confirmar Exclusão');
  }, [confirm]);

  return {
    confirm,
    confirmDeletion,
  };
}