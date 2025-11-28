import { useEffect } from 'react';
import { useWebSocket } from '@/contexts/socketContext';

interface UseGamePageTrackingProps {
  gameType: string;
  isActive?: boolean;
}

export const useGamePageTracking = ({ gameType, isActive = true }: UseGamePageTrackingProps) => {
  const { isConnected, emit } = useWebSocket();

  useEffect(() => {
    if (!isActive || !isConnected || !gameType) return;

    console.log(`🎮 Tracking game page visit: ${gameType}`);
    
    // Emit join game event when component mounts
    emit('joined_game', { gameType });

    // Emit leave game event when component unmounts
    return () => {
      console.log(`🎮 Tracking game page leave: ${gameType}`);
      emit('left_game', { gameType });
    };
  }, [gameType, isActive, isConnected, emit]);

  // Handle page visibility changes (when user switches tabs)
  useEffect(() => {
    if (!isActive || !isConnected || !gameType) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log(`🎮 Page hidden, leaving game: ${gameType}`);
        emit('left_game', { gameType });
      } else {
        console.log(`🎮 Page visible, joining game: ${gameType}`);
        emit('joined_game', { gameType });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gameType, isActive, isConnected, emit]);
};
