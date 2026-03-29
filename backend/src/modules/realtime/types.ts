// Socket Event Types
export enum SocketEvent {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  
  // Authentication events
  AUTHENTICATED = 'authenticated',
  AUTHENTICATION_ERROR = 'authentication_error',
  
  // Quest events
  QUEST_CREATED = 'quest_created',
  QUEST_UPDATED = 'quest_updated',
  QUEST_DELETED = 'quest_deleted',
  QUEST_COMPLETED = 'quest_completed',
  
  // Submission events
  SUBMISSION_CREATED = 'submission_created',
  SUBMISSION_UPDATED = 'submission_updated',
  SUBMISSION_APPROVED = 'submission_approved',
  SUBMISSION_REJECTED = 'submission_rejected',
  
  // Achievement events
  ACHIEVEMENT_EARNED = 'achievement_earned',
  ACHIEVEMENT_UPDATED = 'achievement_updated',
  
  // Reward events
  REWARD_GRANTED = 'reward_granted',
  REWARD_UPDATED = 'reward_updated',
  POINTS_UPDATED = 'points_updated',
  
  // Leaderboard events
  LEADERBOARD_UPDATED = 'leaderboard_updated',
  RANK_CHANGED = 'rank_changed',
  
  // Notification events
  NOTIFICATION = 'notification',
  SYSTEM_NOTIFICATION = 'system_notification',
  
  // User events
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  USER_UPDATED = 'user_updated',
  
  // Dashboard events
  DASHBOARD_STATS_UPDATED = 'dashboard_stats_updated',
  
  // Real-time collaboration
  TYPING_INDICATOR = 'typing_indicator',
  PRESENCE_UPDATED = 'presence_updated',
  
  // Admin events
  ADMIN_QUEST_UPDATE = 'admin_quest_update',
  ADMIN_SUBMISSION_REVIEW = 'admin_submission_review',
  ADMIN_USER_ACTION = 'admin_user_action',
}

// Event Data Interfaces
export interface QuestEventData {
  quest: {
    id: string;
    title: string;
    description: string;
    reward: number;
    difficulty: string;
    category: string;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
  createdBy: {
    id: string;
    email: string;
    role: string;
  };
}

export interface SubmissionEventData {
  submission: {
    id: string;
    userId: string;
    questId: string;
    status: string;
    content?: string;
    submittedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    feedback?: string;
  };
  user: {
    id: string;
    email: string;
    role: string;
  };
  quest: {
    id: string;
    title: string;
    reward: number;
  };
}

export interface AchievementEventData {
  achievement: {
    id: string;
    userId: string;
    questId: string;
    earnedAt: string;
  };
  user: {
    id: string;
    email: string;
    role: string;
  };
  quest: {
    id: string;
    title: string;
    reward: number;
    category: string;
    difficulty: string;
  };
}

export interface RewardEventData {
  reward: {
    id: string;
    userId: string;
    questId?: string;
    type: string;
    points: number;
    description: string;
    metadata?: any;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    id: string;
    email: string;
    role: string;
    points: number;
  };
  quest?: {
    id: string;
    title: string;
    reward: number;
  };
}

export interface LeaderboardEventData {
  leaderboard: {
    rank: number;
    user: {
      id: string;
      email: string;
      points: number;
    };
    achievementCount: number;
    totalReward: number;
    averageReward: number;
    rankChange: number;
    badges: string[];
  }[];
  timeRange: string;
  category?: string;
  difficulty?: string;
}

export interface RankChangedEventData {
  user: {
    id: string;
    email: string;
    points: number;
  };
  previousRank: number;
  newRank: number;
  rankChange: number;
  timeRange: string;
}

export interface NotificationEventData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  read: boolean;
  userId?: string;
  role?: string;
}

export interface UserStatusEventData {
  user: {
    id: string;
    email: string;
    role: string;
    points: number;
  };
  status: 'online' | 'offline';
  lastSeen?: string;
}

export interface DashboardStatsEventData {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalQuests: number;
    activeQuests: number;
    totalSubmissions: number;
    pendingSubmissions: number;
    approvedSubmissions: number;
    rejectedSubmissions: number;
    totalAchievements: number;
    totalPointsAwarded: number;
    approvalRate: number;
  };
  timeRange: string;
}

export interface TypingIndicatorEventData {
  user: {
    id: string;
    email: string;
    role: string;
  };
  isTyping: boolean;
  location?: string; // Where the user is typing (e.g., quest ID, submission ID)
  timestamp: string;
}

export interface PresenceEventData {
  user: {
    id: string;
    email: string;
    role: string;
  };
  presence: {
    status: 'online' | 'away' | 'busy' | 'offline';
    lastSeen: string;
    currentLocation?: string;
  };
}

// Error Event Data
export interface ErrorEventData {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// Socket Data Interface
export interface SocketData {
  user: {
    id: string;
    email: string;
    role: 'user' | 'admin';
    points: number;
  };
  authenticated: boolean;
  connectedAt: string;
}

// Event Handler Interface
export interface EventHandler {
  (socket: any, io: any, data: any): Promise<void> | void;
}

// Event Registry Interface
export interface EventRegistry {
  [key: string]: EventHandler[];
}

// Room Types
export enum RoomType {
  USER = 'user',
  ROLE = 'role',
  QUEST = 'quest',
  SUBMISSION = 'submission',
  ADMIN = 'admin',
  GENERAL = 'general'
}

// Notification Types
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

// Presence Status
export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline'
}
