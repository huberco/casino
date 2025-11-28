'use client';

import React, { useState, useEffect } from 'react';
import { Notification, NotificationType, NotificationPriority } from '@/types/notification';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle } from 'react-icons/fa';
import { FaCircle, FaInfo, FaX } from 'react-icons/fa6';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getIcon = () => {
    switch (notification.priority) {
      case NotificationPriority.URGENT:
        return <FaExclamationTriangle className="w-5 h-5 text-red-500" />;
      case NotificationPriority.HIGH:
        return <FaExclamationTriangle className="w-5 h-5 text-orange-500" />;
      case NotificationPriority.NORMAL:
        return <FaInfo className="w-5 h-5 text-blue-500" />;
      case NotificationPriority.LOW:
        return <FaCircle className="w-5 h-5 text-green-500" />;
      default:
        return <FaInfo className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.priority) {
      case NotificationPriority.URGENT:
        return 'bg-red-900/20 border-red-500/30';
      case NotificationPriority.HIGH:
        return 'bg-orange-900/20 border-orange-500/30';
      case NotificationPriority.NORMAL:
        return 'bg-blue-900/20 border-blue-500/30';
      case NotificationPriority.LOW:
        return 'bg-green-900/20 border-green-500/30';
      default:
        return 'bg-gray-900/20 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: NotificationType) => {
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`relative max-w-sm w-full ${getBackgroundColor()} border rounded-lg p-4 shadow-lg backdrop-blur-sm`}
        >
          {/* Close Button */}
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300); // Wait for animation to complete
            }}
            className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
          >
            <FaX className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="flex items-start gap-3 pr-6">
            {/* Type Icon */}
            <div className="text-2xl flex-shrink-0">
              {getTypeIcon(notification.type)}
            </div>

            {/* Priority Icon */}
            <div className="flex-shrink-0 mt-1">
              {getIcon()}
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold text-sm mb-1">
                {notification.title}
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                {notification.message}
              </p>
              
              {/* Additional Data */}
              {notification.data && (
                <div className="mt-2 text-xs text-gray-400">
                  {notification.data.amount && (
                    <span>Amount: {notification.data.amount} {notification.data.currency || 'USD'}</span>
                  )}
                  {notification.data.gameType && (
                    <span>Game: {notification.data.gameType}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar for Auto-Close */}
          {autoClose && (
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-1 bg-white/20 rounded-b-lg"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationToast;
