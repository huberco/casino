'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification, NotificationType, NotificationPriority } from '@/types/notification';
import {
  FaBell,
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTrash,
  FaCheckDouble,
  FaTrophy,
  FaCoins,
  FaShieldAlt,
  FaGift,
  FaCog,
  FaEnvelope
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { Button, Select, SelectItem } from '@heroui/react';

const NotificationsPage: React.FC = () => {
  const {
    notifications,
    stats,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshStats
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchNotifications(1, 100, filter === 'unread');
  }, [filter]);

  const getNotificationIcon = (type: NotificationType) => {
    const iconClass = "text-xl";

    switch (type) {
      case NotificationType.JACKPOT_WIN:
      case NotificationType.BIG_WIN:
        return <FaTrophy className={`${iconClass} text-yellow-400`} />;
      case NotificationType.DEPOSIT_SUCCESS:
      case NotificationType.WITHDRAWAL_SUCCESS:
        return <FaCoins className={`${iconClass} text-green-400`} />;
      case NotificationType.DEPOSIT_FAILED:
      case NotificationType.WITHDRAWAL_FAILED:
        return <FaExclamationCircle className={`${iconClass} text-red-400`} />;
      case NotificationType.SECURITY_ALERT:
      case NotificationType.ACCOUNT_FROZEN:
        return <FaShieldAlt className={`${iconClass} text-red-400`} />;
      case NotificationType.LEVEL_UP:
      case NotificationType.ACHIEVEMENT_UNLOCKED:
        return <FaGift className={`${iconClass} text-purple-400`} />;
      case NotificationType.SYSTEM_MAINTENANCE:
      case NotificationType.SYSTEM_UPDATE:
        return <FaCog className={`${iconClass} text-blue-400`} />;
      case NotificationType.ADMIN_MESSAGE:
        return <FaEnvelope className={`${iconClass} text-orange-400`} />;
      case NotificationType.WELCOME:
      case NotificationType.ACCOUNT_VERIFIED:
        return <FaCheckCircle className={`${iconClass} text-green-400`} />;
      default:
        return <FaBell className={`${iconClass} text-gray-400`} />;
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    const baseClass = "px-2 py-0.5 text-xs font-semibold rounded-full";

    switch (priority) {
      case NotificationPriority.URGENT:
        return <span className={`${baseClass} bg-red-500/20 text-red-400 border border-red-500/30`}>Urgent</span>;
      case NotificationPriority.HIGH:
        return <span className={`${baseClass} bg-orange-500/20 text-orange-400 border border-orange-500/30`}>High</span>;
      case NotificationPriority.NORMAL:
        return <span className={`${baseClass} bg-blue-500/20 text-blue-400 border border-blue-500/30`}>Normal</span>;
      case NotificationPriority.LOW:
        return <span className={`${baseClass} bg-gray-500/20 text-gray-400 border border-gray-500/30`}>Low</span>;
      default:
        return null;
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!notificationId) return;

    setDeletingIds(prev => new Set(prev).add(notificationId));

    try {
      const success = await deleteNotification(notificationId);
      if (!success) {
        console.error('Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!notificationId) return;
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const filteredNotifications = notifications.filter(notif => {
    if (selectedType !== 'all' && notif.type !== selectedType) {
      return false;
    }
    return true;
  });

  const uniqueTypes = Array.from(new Set(notifications.map(n => n.type)));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
        <p className="text-gray-400">Manage your personal notifications and alerts</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-background-alt rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Notifications</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <FaBell className="text-3xl text-blue-400" />
            </div>
          </div>

          <div className="bg-background-alt rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Unread</p>
                <p className="text-2xl font-bold text-orange-400">{stats.unread}</p>
              </div>
              <FaExclamationCircle className="text-3xl text-orange-400" />
            </div>
          </div>

          <div className="bg-background-alt rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Read</p>
                <p className="text-2xl font-bold text-green-400">{stats.total - stats.unread}</p>
              </div>
              <FaCheckCircle className="text-3xl text-green-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-background-alt rounded-lg p-4 mb-6 border border-gray-800">
        <div className="flex flex-col sm:flex-row gap-4 items-start md:items-center justify-between">
          {/* Filter Tabs */}
          <div className="flex gap-2">
            <Button
              onPress={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                ? 'bg-primary text-background'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
            >
              All ({stats?.total || 0})
            </Button>
            <Button
              onPress={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'unread'
                ? 'bg-primary text-background'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
            >
              Unread ({stats?.unread || 0})
            </Button>
          </div>

          {/* Type Filter */}
          <div className="flex gap-2 items-center flex-wrap">
            <Select
              label="Filter by Type"
              placeholder="Select notification type"
              labelPlacement='outside'
              selectedKeys={[selectedType]}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string
                setSelectedType(selectedKey || 'all')
              }}
              className='w-full sm:w-auto'
              classNames={{
                trigger: "bg-background border-gray-700 min-w-[200px]",
                value: "text-white",
                label: "hidden",
                base:"mt-0!"
              }}
            >
              {[
                <SelectItem key="all">All Types</SelectItem>,
                ...uniqueTypes.map(type => (
                  <SelectItem key={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))
              ]}
            </Select>

            {/* Mark All as Read */}
              {stats && stats.unread > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg border border-green-500/30 transition-colors"
                >
                  <FaCheckDouble />
                  Mark All Read
                </button>
              )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-background-alt rounded-lg p-12 border border-gray-800 text-center">
          <FaBell className="text-6xl text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No notifications</h3>
          <p className="text-gray-500">
            {filter === 'unread'
              ? "You don't have any unread notifications"
              : "You don't have any notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const notifId = (notification as any)._id || (notification as any).id;
            const isRead = notification.readAt || notification.status === 'read';
            const isDeleting = deletingIds.has(notifId);

            return (
              <div
                key={notifId}
                className={`bg-background-alt rounded-lg p-4 border transition-all ${isRead
                  ? 'border-gray-800 opacity-75'
                  : 'border-blue-500/30 shadow-lg shadow-blue-500/10'
                  } ${isDeleting ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${isRead ? 'bg-gray-800' : 'bg-blue-500/10'
                    }`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-semibold">{notification.title}</h3>
                          {!isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                          {getPriorityBadge(notification.priority)}
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{notification.message}</p>

                        {/* Additional Data */}
                        {notification.data && Object.keys(notification.data).length > 0 && (
                          <div className="bg-gray-800/50 rounded p-2 mb-2 hidden sm:block">
                            <p className="text-xs text-gray-500 mb-1">Additional Information:</p>
                            <pre className="text-xs text-gray-400 overflow-x-auto">
                              {JSON.stringify(notification.data, null, 2)}
                            </pre>
                          </div>
                        )}

                        <div className="flex items-center gap-1 sm:gap-4 text-xs text-gray-500 flex-col sm:flex-row">
                          <span>
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                          <span className="text-gray-600 sm:block hidden">•</span>
                          <span className="capitalize">
                            {notification.type.replace(/_/g, ' ')}
                          </span>
                          {notification.expiresAt && (
                            <>
                              <span className="text-gray-600 sm:block hidden">•</span>
                              <span className="text-orange-400">
                                Expires {formatDistanceToNow(new Date(notification.expiresAt), { addSuffix: true })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notifId)}
                            className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
                            title="Mark as read"
                          >
                            <FaCheckCircle />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notifId)}
                          disabled={isDeleting}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                          title="Delete notification"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
