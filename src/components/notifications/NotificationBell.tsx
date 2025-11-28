'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationType, NotificationPriority } from '@/types/notification';
import { Badge, Button } from '@heroui/react';
import { FaBell, FaX } from 'react-icons/fa6';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.WELCOME:
        return '👋';
      case NotificationType.ACCOUNT_VERIFIED:
        return '✅';
      case NotificationType.PASSWORD_UPDATED:
        return '🔒';
      case NotificationType.ACCOUNT_FROZEN:
        return '❄️';
      case NotificationType.DEPOSIT_SUCCESS:
        return '💰';
      case NotificationType.DEPOSIT_FAILED:
        return '❌';
      case NotificationType.WITHDRAWAL_SUCCESS:
        return '💸';
      case NotificationType.WITHDRAWAL_FAILED:
        return '❌';
      case NotificationType.LEVEL_UP:
        return '⬆️';
      case NotificationType.ACHIEVEMENT_UNLOCKED:
        return '🏆';
      case NotificationType.BIG_WIN:
        return '🎉';
      case NotificationType.JACKPOT_WIN:
        return '🎰';
      case NotificationType.SYSTEM_MAINTENANCE:
        return '🔧';
      case NotificationType.SECURITY_ALERT:
        return '🚨';
      case NotificationType.ADMIN_MESSAGE:
        return '📢';
      default:
        return '📨';
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return 'text-red-500';
      case NotificationPriority.HIGH:
        return 'text-orange-500';
      case NotificationPriority.NORMAL:
        return 'text-blue-500';
      case NotificationPriority.LOW:
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors duration-200"
      >
        
        {unreadCount > 0 && (
          <Badge
            content={unreadCount > 99 ? '99+' : unreadCount}
            color="danger"
            size="sm"
            className="absolute  min-w-[20px] h-5 text-xs"
          >
            <FaBell className="w-6 h-6" />
          </Badge>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-background-alt border border-gray-700 rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="light"
                  color="primary"
                  isLoading={isMarkingAll}
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No notifications yet
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                    !notification.readAt ? 'bg-blue-900/20' : ''
                  }`}
                  onClick={() => {
                    if (!notification.readAt && notification._id) {
                      markAsRead(notification._id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium text-sm truncate">
                          {notification.title}
                        </h4>
                        <span className={`text-xs ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {formatTime(notification.createdAt)}
                        </span>
                        {!notification.readAt && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 5 && (
            <div className="p-3 border-t border-gray-700">
              <button className="w-full text-center text-blue-400 hover:text-blue-300 text-sm transition-colors">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
