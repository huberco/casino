import { useState, useEffect, useCallback } from 'react';
import { gameApi } from '@/lib/api';
import { DailyStatsResponse } from '@/types/dailyStats';

export const useDailyStats = (days: number = 30) => {
  const [data, setData] = useState<DailyStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 Fetching daily stats for ${days} days...`);
      const response = await gameApi.history.getDailyStats(days);
      
      if (response.success && response.data) {
        console.log('🔍 Daily stats fetched:', response.data);
        setData(response.data.data);
      } else {
        setError(response.error || 'Failed to fetch daily statistics');
      }
    } catch (err) {
      setError('Failed to fetch daily statistics');
      console.error('Error fetching daily stats:', err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchDailyStats();
  }, [fetchDailyStats]);

  return {
    data,
    loading,
    error,
    refetch: fetchDailyStats
  };
};
