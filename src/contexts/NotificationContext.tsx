'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useWebSocket } from './socketContext';
import { useAuth } from './AuthContext';
import { apiClient } from '@/lib/api';
import { 
  Notification, 
  NotificationType, 
  NotificationPriority, 
  NotificationStats,
  NotificationResponse,
  NotificationStatsResponse
} from '@/types/notification';

interface NotificationContextType {
  notifications: Notification[];
  stats: NotificationStats | null;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (page?: number, limit?: number, unreadOnly?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<number>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  refreshStats: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  removeNotification: (notificationId: string) => void;
  clearError: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, on, off } = useWebSocket();
  const { user } = useAuth();

  const unreadCount = stats?.unread || 0;

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async (
    page: number = 1, 
    limit: number = 20, 
    unreadOnly: boolean = false
  ) => {
    if (!user?.isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        unreadOnly: unreadOnly.toString()
      });

      const response = await apiClient.get(`/notifications/user/notifications?${params}`);
      const data: NotificationResponse = response.data;
      
      if (data.success) {
        setNotifications(data.data.notifications);
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user?.isAuthenticated]);

  /**
   * Fetch notification statistics
   */
  const refreshStats = useCallback(async () => {
    if (!user?.isAuthenticated) return;

    try {
      const response = await apiClient.get('/notifications/user/stats');
      const data: NotificationStatsResponse = response.data;
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  }, [user?.isAuthenticated]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!user?.isAuthenticated) return false;

    try {
      await apiClient.put(`/notifications/user/notifications/${notificationId}/read`);

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, readAt: new Date().toISOString(), status: 'read' as any }
            : notif
        )
      );

      // Refresh stats to update unread count
      await refreshStats();

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, [user?.isAuthenticated, refreshStats]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async (): Promise<number> => {
    if (!user?.isAuthenticated) return 0;

    try {
      const response = await apiClient.put('/notifications/user/notifications/read-all');
      const data = response.data;
      
      if (data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => ({
            ...notif,
            readAt: new Date().toISOString(),
            status: 'read' as any
          }))
        );

        // Refresh stats
        await refreshStats();

        return data.message.match(/\d+/)?.[0] ? parseInt(data.message.match(/\d+/)[0]) : 0;
      }

      return 0;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }, [user?.isAuthenticated, refreshStats]);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!user?.isAuthenticated) return false;

    try {
      await apiClient.delete(`/notifications/user/notifications/${notificationId}`);

      // Remove from local state
      removeNotification(notificationId);

      // Refresh stats to update counts
      await refreshStats();

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }, [user?.isAuthenticated, refreshStats]);

  /**
   * Add notification to local state (for real-time updates)
   */
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => {
      // Check if notification already exists (support both _id and id for compatibility)
      const notifId = (notification as any)._id || (notification as any).id;
      const exists = prev.some(notif => {
        const existingId = (notif as any)._id || (notif as any).id;
        return existingId === notifId;
      });
      if (exists) return prev;

      // Add to beginning of array
      return [notification, ...prev];
    });

    // Update stats
    setStats(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        total: prev.total + 1,
        unread: prev.unread + 1,
        byType: {
          ...prev.byType,
          [notification.type]: (prev.byType[notification.type] || 0) + 1
        },
        byPriority: {
          ...prev.byPriority,
          [notification.priority]: (prev.byPriority[notification.priority] || 0) + 1
        }
      };
    });
  }, []);

  /**
   * Remove notification from local state
   */
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(notif => {
      const existingId = (notif as any)._id || (notif as any).id;
      return existingId !== notificationId;
    }));
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handle incoming notifications via WebSocket
   */
  const handleNotification = useCallback((notification: Notification) => {
    console.log('📨 New notification received:', notification);
    addNotification(notification);
  }, [addNotification]);

  /**
   * Setup WebSocket listeners
   */
  useEffect(() => {
    if (!isConnected || !user?.isAuthenticated) return;

    on('notification', handleNotification);

    return () => {
      off('notification', handleNotification);
    };
  }, [isConnected, user?.isAuthenticated, on, off, handleNotification]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    if (user?.isAuthenticated && isConnected) {
      fetchNotifications();
      refreshStats();
    }
  }, [user?.isAuthenticated, isConnected, fetchNotifications, refreshStats]);

  /**
   * Cleanup expired notifications periodically
   */
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date();
      setNotifications(prev => 
        prev.filter(notif => {
          if (!notif.expiresAt) return true;
          return new Date(notif.expiresAt) > now;
        })
      );
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  const contextValue: NotificationContextType = {
    notifications,
    stats,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshStats,
    addNotification,
    removeNotification,
    clearError
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
