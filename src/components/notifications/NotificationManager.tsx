'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification } from '@/types/notification';
import NotificationToast from './NotificationToast';

interface NotificationManagerProps {
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const NotificationManager: React.FC<NotificationManagerProps> = ({
  maxToasts = 3,
  position = 'top-right'
}) => {
  const { notifications } = useNotifications();
  const [activeToasts, setActiveToasts] = useState<Notification[]>([]);
  const [shownNotificationIds, setShownNotificationIds] = useState<Set<string>>(new Set());

  // Filter for new notifications that should show as toasts
  useEffect(() => {
    const newNotifications = notifications.filter(notification => {
      // Only show high priority notifications as toasts
      const shouldShow = ['high', 'urgent'].includes(notification.priority) ||
                        ['jackpot_win', 'big_win', 'security_alert', 'admin_message'].includes(notification.type);
      
      // Don't show if already shown (even if closed)
      const notAlreadyShown = !shownNotificationIds.has(notification._id);
      
      return shouldShow && notAlreadyShown;
    });

    // Add new notifications to active toasts and track them as shown
    if (newNotifications.length > 0) {
      setActiveToasts(prev => {
        const combined = [...prev, ...newNotifications];
        // Keep only the most recent ones
        return combined.slice(-maxToasts);
      });

      // Mark these notifications as shown
      setShownNotificationIds(prev => {
        const newSet = new Set(prev);
        newNotifications.forEach(notif => newSet.add(notif._id));
        return newSet;
      });
    }
  }, [notifications, maxToasts]); // Removed activeToasts from dependencies to prevent infinite loop

  const removeToast = (notificationId: string) => {
    setActiveToasts(prev => prev.filter(toast => toast._id !== notificationId));
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2 pointer-events-none`}>
      {activeToasts.map((notification, index) => (
        <div key={notification._id} className="pointer-events-auto">
          <NotificationToast
            notification={notification}
            onClose={() => removeToast(notification._id)}
            autoClose={true}
            duration={notification.priority === 'urgent' ? 10000 : 5000}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationManager;
