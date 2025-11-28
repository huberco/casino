import { useState, useEffect, useCallback } from 'react';
import { gameApi } from '@/lib/api';
import { GameStatusResponse, SingleGameStatus } from '@/types/gameStatus';
import { useWebSocket } from '@/contexts/socketContext';

export const useGameStatus = () => {
  const [gameStatuses, setGameStatuses] = useState<GameStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, emit, on, off } = useWebSocket();

  const fetchGameStatuses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching game statuses...');
      const response = await gameApi.gameStatus.getActivePlayerCounts();
      
      if (response.success && response.data) {
        console.log('🔍 Setting game statuses:', response.data);
        setGameStatuses(response.data.data);
      } else {
        console.error('🔍 Game status fetch failed:', response.error);
        setError(response.error || 'Failed to fetch game statuses');
      }
    } catch (err) {
      console.error('🔍 Game status fetch error:', err);
      setError('Failed to fetch game statuses');
    } finally {
      setLoading(false);
    }
  }, []);

  const getGamePlayerCount = useCallback(async (gameType: string): Promise<number> => {
    try {
      const response = await gameApi.gameStatus.getGamePlayerCount(gameType);
      
      if (response.success && response.data) {
        return response.data.activePlayers;
      }
      return 0;
    } catch (err) {
      console.error(`Error fetching ${gameType} player count:`, err);
      return 0;
    }
  }, []);

  // Handle real-time player count updates from WebSocket
  const handlePlayerCountsUpdate = useCallback((data: GameStatusResponse) => {
    console.log('🔍 Received real-time player counts update:', data);
    setGameStatuses(data);
    setLoading(false);
    setError(null);
  }, []);

  // Remove initial fetch - WebSocket will provide the data
  // useEffect(() => {
  //   // Initial fetch
  //   fetchGameStatuses();
  // }, []); // Only run once on mount

  useEffect(() => {
    // Set up WebSocket listeners for real-time updates
    if (isConnected) {
      on('player_counts_update', handlePlayerCountsUpdate);
      
      // Request current player counts
      emit('get_player_counts', {});
    }
    
    return () => {
      off('player_counts_update', handlePlayerCountsUpdate);
    };
  }, [isConnected, on, off, emit, handlePlayerCountsUpdate]);

  // Remove fallback interval - WebSocket provides real-time updates
  // useEffect(() => {
  //   // Fallback: Refresh every 30 seconds if WebSocket is not available
  //   const interval = setInterval(() => {
  //     if (!isConnected) {
  //       fetchGameStatuses();
  //     }
  //   }, 30000);
  //   
  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, [isConnected, fetchGameStatuses]);

  // Emit join game event
  const joinGame = useCallback((gameType: string) => {
    if (isConnected) {
      console.log(`🎮 Joining game: ${gameType}`);
      emit('joined_game', { gameType });
    }
  }, [isConnected, emit]);

  // Emit leave game event
  const leaveGame = useCallback((gameType: string) => {
    if (isConnected) {
      console.log(`🎮 Leaving game: ${gameType}`);
      emit('left_game', { gameType });
    }
  }, [isConnected, emit]);

  return {
    gameStatuses,
    loading,
    error,
    refetch: fetchGameStatuses,
    getGamePlayerCount,
    joinGame,
    leaveGame
  };
};
