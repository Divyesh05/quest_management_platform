import { Socket, Server as SocketIOServer } from 'socket.io';
import { 
  SocketEvent, 
  QuestEventData, 
  SubmissionEventData, 
  AchievementEventData,
  RewardEventData,
  LeaderboardEventData,
  NotificationEventData,
  UserStatusEventData,
  TypingIndicatorEventData,
  PresenceEventData
} from './types';
import { 
  joinUserRoom, 
  joinRoleRoom, 
  joinRoom, 
  leaveRoom,
  sendToUser,
  broadcastToRole,
  broadcastToAll
} from './socket';
import { logger } from './utils';

export const registerEventHandlers = (socket: Socket, io: SocketIOServer): void => {
  // Join user and role rooms on connection
  joinUserRoom(socket);
  joinRoleRoom(socket);

  // Notify others that user is online
  socket.broadcast.emit(SocketEvent.USER_ONLINE, {
    user: socket.data.user,
    status: 'online'
  } as UserStatusEventData);

  // Quest Events
  socket.on(SocketEvent.QUEST_CREATED, (data: QuestEventData) => {
    logger.info(`Quest created: ${data.quest.id} by ${data.createdBy.email}`);
    
    // Broadcast to all users
    broadcastToAll(SocketEvent.QUEST_CREATED, data);
    
    // Send specific notification to admins
    broadcastToRole('admin', SocketEvent.ADMIN_QUEST_UPDATE, {
      type: 'created',
      quest: data.quest,
      createdBy: data.createdBy
    });
  });

  socket.on(SocketEvent.QUEST_UPDATED, (data: QuestEventData) => {
    logger.info(`Quest updated: ${data.quest.id} by ${data.createdBy.email}`);
    
    // Broadcast to all users
    broadcastToAll(SocketEvent.QUEST_UPDATED, data);
    
    // Send specific notification to admins
    broadcastToRole('admin', SocketEvent.ADMIN_QUEST_UPDATE, {
      type: 'updated',
      quest: data.quest,
      updatedBy: data.createdBy
    });
  });

  socket.on(SocketEvent.QUEST_DELETED, (data: { questId: string; deletedBy: any }) => {
    logger.info(`Quest deleted: ${data.questId} by ${data.deletedBy.email}`);
    
    // Broadcast to all users
    broadcastToAll(SocketEvent.QUEST_DELETED, data);
    
    // Send specific notification to admins
    broadcastToRole('admin', SocketEvent.ADMIN_QUEST_UPDATE, {
      type: 'deleted',
      questId: data.questId,
      deletedBy: data.deletedBy
    });
  });

  // Submission Events
  socket.on(SocketEvent.SUBMISSION_CREATED, (data: SubmissionEventData) => {
    logger.info(`Submission created: ${data.submission.id} by ${data.user.email}`);
    
    // Notify the user who submitted
    sendToUser(data.submission.userId, SocketEvent.SUBMISSION_CREATED, data);
    
    // Notify all admins about new submission
    broadcastToRole('admin', SocketEvent.ADMIN_SUBMISSION_REVIEW, {
      type: 'new_submission',
      submission: data.submission,
      user: data.user,
      quest: data.quest
    });
    
    // Update dashboard stats for admins
    broadcastToRole('admin', SocketEvent.DASHBOARD_STATS_UPDATED, {
      type: 'submission_created',
      timestamp: new Date().toISOString()
    });
  });

  socket.on(SocketEvent.SUBMISSION_UPDATED, (data: SubmissionEventData) => {
    logger.info(`Submission updated: ${data.submission.id} by ${data.user.email}`);
    
    // Notify the user who submitted
    sendToUser(data.submission.userId, SocketEvent.SUBMISSION_UPDATED, data);
    
    // Notify admins if status changed
    if (data.submission.status !== 'pending') {
      broadcastToRole('admin', SocketEvent.ADMIN_SUBMISSION_REVIEW, {
        type: 'status_changed',
        submission: data.submission,
        user: data.user,
        quest: data.quest
      });
    }
  });

  socket.on(SocketEvent.SUBMISSION_APPROVED, (data: SubmissionEventData) => {
    logger.info(`Submission approved: ${data.submission.id} for ${data.user.email}`);
    
    // Notify the user
    sendToUser(data.submission.userId, SocketEvent.SUBMISSION_APPROVED, data);
    
    // Send notification
    sendToUser(data.submission.userId, SocketEvent.NOTIFICATION, {
      id: `notif-${Date.now()}`,
      type: 'success',
      title: 'Submission Approved!',
      message: `Your submission for "${data.quest.title}" has been approved. You earned ${data.quest.reward} points!`,
      data: { submissionId: data.submission.id, questId: data.quest.id },
      timestamp: new Date().toISOString(),
      read: false
    } as NotificationEventData);
    
    // Notify admins
    broadcastToRole('admin', SocketEvent.ADMIN_SUBMISSION_REVIEW, {
      type: 'approved',
      submission: data.submission,
      user: data.user,
      quest: data.quest
    });
  });

  socket.on(SocketEvent.SUBMISSION_REJECTED, (data: SubmissionEventData) => {
    logger.info(`Submission rejected: ${data.submission.id} for ${data.user.email}`);
    
    // Notify the user
    sendToUser(data.submission.userId, SocketEvent.SUBMISSION_REJECTED, data);
    
    // Send notification
    sendToUser(data.submission.userId, SocketEvent.NOTIFICATION, {
      id: `notif-${Date.now()}`,
      type: 'warning',
      title: 'Submission Rejected',
      message: `Your submission for "${data.quest.title}" has been rejected. ${data.submission.feedback ? `Feedback: ${data.submission.feedback}` : ''}`,
      data: { submissionId: data.submission.id, questId: data.quest.id },
      timestamp: new Date().toISOString(),
      read: false
    } as NotificationEventData);
    
    // Notify admins
    broadcastToRole('admin', SocketEvent.ADMIN_SUBMISSION_REVIEW, {
      type: 'rejected',
      submission: data.submission,
      user: data.user,
      quest: data.quest
    });
  });

  // Achievement Events
  socket.on(SocketEvent.ACHIEVEMENT_EARNED, (data: AchievementEventData) => {
    logger.info(`Achievement earned: ${data.achievement.id} by ${data.user.email}`);
    
    // Notify the user
    sendToUser(data.achievement.userId, SocketEvent.ACHIEVEMENT_EARNED, data);
    
    // Send notification
    sendToUser(data.achievement.userId, SocketEvent.NOTIFICATION, {
      id: `notif-${Date.now()}`,
      type: 'success',
      title: 'Achievement Unlocked!',
      message: `You completed "${data.quest.title}" and earned ${data.quest.reward} points!`,
      data: { achievementId: data.achievement.id, questId: data.quest.id },
      timestamp: new Date().toISOString(),
      read: false
    } as NotificationEventData);
    
    // Update leaderboard for everyone
    broadcastToAll(SocketEvent.LEADERBOARD_UPDATED, {
      type: 'achievement_earned',
      user: data.user,
      quest: data.quest
    });
    
    // Update dashboard stats
    broadcastToRole('admin', SocketEvent.DASHBOARD_STATS_UPDATED, {
      type: 'achievement_earned',
      timestamp: new Date().toISOString()
    });
  });

  // Reward Events
  socket.on(SocketEvent.REWARD_GRANTED, (data: RewardEventData) => {
    logger.info(`Reward granted: ${data.reward.id} to ${data.user.email}`);
    
    // Notify the user
    sendToUser(data.reward.userId, SocketEvent.REWARD_GRANTED, data);
    
    // Send notification
    sendToUser(data.reward.userId, SocketEvent.NOTIFICATION, {
      id: `notif-${Date.now()}`,
      type: 'success',
      title: 'Reward Granted!',
      message: `You earned ${data.reward.points} points: ${data.reward.description}`,
      data: { rewardId: data.reward.id },
      timestamp: new Date().toISOString(),
      read: false
    } as NotificationEventData);
    
    // Update leaderboard
    broadcastToAll(SocketEvent.LEADERBOARD_UPDATED, {
      type: 'reward_granted',
      user: data.user,
      reward: data.reward
    });
    
    // Update points for the user
    sendToUser(data.reward.userId, SocketEvent.POINTS_UPDATED, {
      userId: data.reward.userId,
      newPoints: data.user.points,
      pointsChange: data.reward.points,
      reason: data.reward.description
    });
  });

  socket.on(SocketEvent.POINTS_UPDATED, (data: { userId: string; newPoints: number; pointsChange: number; reason: string }) => {
    logger.info(`Points updated for user ${data.userId}: ${data.pointsChange} (${data.reason})`);
    
    // Notify the user
    sendToUser(data.userId, SocketEvent.POINTS_UPDATED, data);
    
    // Update leaderboard
    broadcastToAll(SocketEvent.LEADERBOARD_UPDATED, {
      type: 'points_updated',
      userId: data.userId,
      newPoints: data.newPoints,
      pointsChange: data.pointsChange
    });
  });

  // Leaderboard Events
  socket.on(SocketEvent.LEADERBOARD_UPDATED, (data: LeaderboardEventData) => {
    logger.info('Leaderboard updated');
    
    // Broadcast to all users
    broadcastToAll(SocketEvent.LEADERBOARD_UPDATED, data);
  });

  socket.on(SocketEvent.RANK_CHANGED, (data: { userId: string; previousRank: number; newRank: number; rankChange: number; timeRange: string }) => {
    logger.info(`Rank changed for user ${data.userId}: ${data.previousRank} → ${data.newRank}`);
    
    // Notify the user
    sendToUser(data.userId, SocketEvent.RANK_CHANGED, data);
    
    // Send notification if rank improved
    if (data.rankChange > 0) {
      sendToUser(data.userId, SocketEvent.NOTIFICATION, {
        id: `notif-${Date.now()}`,
        type: 'success',
        title: 'Rank Improved!',
        message: `You moved up ${data.rankChange} position${data.rankChange > 1 ? 's' : ''} in the leaderboard!`,
        data: { newRank: data.newRank, rankChange: data.rankChange },
        timestamp: new Date().toISOString(),
        read: false
      } as NotificationEventData);
    }
  });

  // Notification Events
  socket.on(SocketEvent.NOTIFICATION, (data: NotificationEventData) => {
    logger.info(`Notification sent: ${data.title}`);
    
    if (data.userId) {
      sendToUser(data.userId, SocketEvent.NOTIFICATION, data);
    } else if (data.role) {
      broadcastToRole(data.role, SocketEvent.NOTIFICATION, data);
    } else {
      broadcastToAll(SocketEvent.NOTIFICATION, data);
    }
  });

  socket.on(SocketEvent.SYSTEM_NOTIFICATION, (data: NotificationEventData) => {
    logger.info(`System notification: ${data.title}`);
    
    // Broadcast to all users
    broadcastToAll(SocketEvent.SYSTEM_NOTIFICATION, data);
  });

  // User Events
  socket.on(SocketEvent.USER_UPDATED, (data: { user: any; updatedBy: any }) => {
    logger.info(`User updated: ${data.user.id} by ${data.updatedBy.email}`);
    
    // Notify the user
    sendToUser(data.user.id, SocketEvent.USER_UPDATED, data);
    
    // Notify admins
    broadcastToRole('admin', SocketEvent.ADMIN_USER_ACTION, {
      type: 'user_updated',
      user: data.user,
      updatedBy: data.updatedBy
    });
  });

  // Dashboard Events
  socket.on(SocketEvent.DASHBOARD_STATS_UPDATED, (data: any) => {
    logger.info('Dashboard stats updated');
    
    // Broadcast to admins
    broadcastToRole('admin', SocketEvent.DASHBOARD_STATS_UPDATED, data);
  });

  // Real-time collaboration events
  socket.on(SocketEvent.TYPING_INDICATOR, (data: TypingIndicatorEventData) => {
    // Broadcast to others in the same location (e.g., same quest page)
    if (data.location) {
      socket.to(`location:${data.location}`).emit(SocketEvent.TYPING_INDICATOR, data);
    } else {
      socket.broadcast.emit(SocketEvent.TYPING_INDICATOR, data);
    }
  });

  socket.on(SocketEvent.PRESENCE_UPDATED, (data: PresenceEventData) => {
    logger.info(`Presence updated for user ${data.user.id}: ${data.presence.status}`);
    
    // Broadcast to all users
    broadcastToAll(SocketEvent.PRESENCE_UPDATED, data);
  });

  // Room management events
  socket.on('join_room', (room: string) => {
    joinRoom(socket, room);
    socket.emit('room_joined', { room });
  });

  socket.on('leave_room', (room: string) => {
    leaveRoom(socket, room);
    socket.emit('room_left', { room });
  });

  // Custom events for specific features
  socket.on('join_quest_room', (questId: string) => {
    const room = `quest:${questId}`;
    joinRoom(socket, room);
    socket.emit('quest_room_joined', { questId, room });
  });

  socket.on('leave_quest_room', (questId: string) => {
    const room = `quest:${questId}`;
    leaveRoom(socket, room);
    socket.emit('quest_room_left', { questId, room });
  });

  socket.on('join_submission_room', (submissionId: string) => {
    const room = `submission:${submissionId}`;
    joinRoom(socket, room);
    socket.emit('submission_room_joined', { submissionId, room });
  });

  socket.on('leave_submission_room', (submissionId: string) => {
    const room = `submission:${submissionId}`;
    leaveRoom(socket, room);
    socket.emit('submission_room_left', { submissionId, room });
  });

  // Error handling
  socket.on('error', (error) => {
    logger.error(`Socket error for user ${socket.data.user.id}:`, error);
    
    socket.emit(SocketEvent.ERROR, {
      error: {
        code: 'SOCKET_ERROR',
        message: 'An error occurred',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  });
};
