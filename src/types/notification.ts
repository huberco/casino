export interface Notification {
  _id: string;
  id?: string; // Alias for _id for compatibility
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority: NotificationPriority;
  createdAt: string;
  expiresAt?: string;
  readAt?: string;
  status?: NotificationStatus;
}

export enum NotificationType {
  // Welcome & Account
  WELCOME = 'welcome',
  ACCOUNT_VERIFIED = 'account_verified',
  PASSWORD_UPDATED = 'password_updated',
  ACCOUNT_FROZEN = 'account_frozen',
  ACCOUNT_UNFROZEN = 'account_unfrozen',
  
  // Financial
  DEPOSIT_SUCCESS = 'deposit_success',
  DEPOSIT_FAILED = 'deposit_failed',
  WITHDRAWAL_SUCCESS = 'withdrawal_success',
  WITHDRAWAL_FAILED = 'withdrawal_failed',
  WITHDRAWAL_PENDING = 'withdrawal_pending',
  
  // Game & Achievement
  LEVEL_UP = 'level_up',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  BIG_WIN = 'big_win',
  JACKPOT_WIN = 'jackpot_win',
  
  // System
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SYSTEM_UPDATE = 'system_update',
  SECURITY_ALERT = 'security_alert',
  
  // Admin
  ADMIN_MESSAGE = 'admin_message',
  GAME_DISABLED = 'game_disabled',
  GAME_ENABLED = 'game_enabled',
  
  // Custom
  CUSTOM = 'custom'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NotificationResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: NotificationPagination;
  };
}

export interface NotificationStatsResponse {
  success: boolean;
  data: NotificationStats;
}
