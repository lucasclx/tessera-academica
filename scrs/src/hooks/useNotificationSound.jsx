import { useCallback, useRef } from 'react';

export const useNotificationSound = () => {
  const audioRef = useRef(null);

  const initializeAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/notification-sound.mp3'); // Adicionar arquivo de som
      audioRef.current.volume = 0.5;
    }
  }, []);

  const playNotificationSound = useCallback((priority = 'NORMAL') => {
    initializeAudio();
    
    // Diferentes sons ou volumes baseados na prioridade
    if (audioRef.current) {
      switch (priority) {
        case 'URGENT':
          audioRef.current.volume = 0.8;
          break;
        case 'HIGH':
          audioRef.current.volume = 0.6;
          break;
        case 'NORMAL':
          audioRef.current.volume = 0.4;
          break;
        case 'LOW':
          audioRef.current.volume = 0.2;
          break;
        default:
          audioRef.current.volume = 0.4;
      }
      
      audioRef.current.play().catch(error => {
        console.log('Não foi possível reproduzir som de notificação:', error);
      });
    }
  }, [initializeAudio]);

  return { playNotificationSound };
};