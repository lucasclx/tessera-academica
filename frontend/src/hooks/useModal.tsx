import { useState, useCallback } from 'react';

interface UseModalResult<T = any> {
  isOpen: boolean;
  selectedItem: T | null;
  openModal: (item?: T) => void;
  closeModal: () => void;
  setSelectedItem: (item: T | null) => void;
}

export function useModal<T = any>(): UseModalResult<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const openModal = useCallback((item?: T) => {
    if (item !== undefined) {
      setSelectedItem(item);
    }
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // setSelectedItem(null); // opcional
  }, []);

  return {
    isOpen,
    selectedItem,
    openModal,
    closeModal,
    setSelectedItem,
  };
}