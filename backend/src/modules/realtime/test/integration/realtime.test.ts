import { Server as HTTPServer } from 'http';
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client';
import { Server as SocketIOServer } from 'socket.io';
import { initializeSocket, getSocketIO } from '../../socket';
import { SocketEvent } from '../../types';
import { logger } from '../../utils';

// Mock Jest types for testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeDefined(): R;
      toBe(expected: any): R;
      toHaveLength(length: number): R;
      toBeLessThan(n: number): R;
      toBeGreaterThan(n: number): R;
    }
  }
}

describe('Realtime Integration Tests', () => {
  let server: HTTPServer;
  let io: any;
  let clientSocket: ClientSocket;
  let adminSocket: ClientSocket;
  let userSocket1: ClientSocket;
  let userSocket2: ClientSocket;

  beforeAll(async () => {
    server = new HTTPServer();
    io = initializeSocket(server);
    
    await new Promise<void>((resolve) => {
      server.listen(() => resolve());
    });
  });

  afterAll(async () => {
    if (clientSocket) clientSocket.close();
    if (adminSocket) adminSocket.close();
    if (userSocket1) userSocket1.close();
    if (userSocket2) userSocket2.close();
    
    io.close();
    server.close();
  });

  beforeEach(async () => {
    // Create fresh sockets for each test
    clientSocket = ClientIO(`http://localhost:${(server.address() as any).port}`, {
      auth: { token: 'mock-user-token' }
    });

    adminSocket = ClientIO(`http://localhost:${(server.address() as any).port}`, {
      auth: { token: 'mock-admin-token' }
    });

    userSocket1 = ClientIO(`http://localhost:${(server.address() as any).port}`, {
      auth: { token: 'mock-user-1-token' }
    });

    userSocket2 = ClientIO(`http://localhost:${(server.address() as any).port}`, {
      auth: { token: 'mock-user-2-token' }
    });

    // Wait for connections
    await new Promise<void>((resolve) => {
      let connectedCount = 0;
      const checkConnections = () => {
        connectedCount++;
        if (connectedCount === 4) resolve();
      };
      
      clientSocket.on('connect', checkConnections);
      adminSocket.on('connect', checkConnections);
      userSocket1.on('connect', checkConnections);
      userSocket2.on('connect', checkConnections);
    });
  });

  afterEach(async () => {
    // Clean up sockets
    if (clientSocket) clientSocket.close();
    if (adminSocket) adminSocket.close();
    if (userSocket1) userSocket1.close();
    if (userSocket2) userSocket2.close();
  });

  describe('Connection Management', () => {
    it('should handle multiple concurrent connections', async () => {
      const additionalSockets = [];
      
      for (let i = 0; i < 5; i++) {
        const socket = ClientIO(`http://localhost:${(server.address() as any).port}`, {
          auth: { token: `mock-token-${i}` }
        });
        additionalSockets.push(socket);
      }

      await new Promise<void>((resolve) => {
        let connectedCount = 0;
        additionalSockets.forEach(socket => {
          socket.on('connect', () => {
            connectedCount++;
            if (connectedCount === 5) resolve();
          });
        });
      });

      // Verify all sockets are connected
      additionalSockets.forEach(socket => {
        expect(socket.connected).toBe(true);
      });

      // Clean up
      additionalSockets.forEach(socket => socket.close());
    });

    it('should handle disconnection gracefully', async () => {
      const disconnectPromise = new Promise<void>((resolve) => {
        clientSocket.on('disconnect', resolve);
      });

      clientSocket.disconnect();
      await disconnectPromise;

      expect(clientSocket.connected).toBe(false);
    });

    it('should handle connection errors', async () => {
      const errorSocket = ClientIO(`http://localhost:${(server.address() as any).port}`, {
        auth: { token: 'invalid-token' }
      });

      const errorPromise = new Promise<void>((resolve) => {
        errorSocket.on('connect_error', resolve);
      });

      await errorPromise;
      expect(errorSocket.connected).toBe(false);
    });
  });

  describe('Event Broadcasting', () => {
    it('should broadcast notifications to all users', async () => {
      const notificationData = {
        id: 'test-notif',
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification',
        timestamp: new Date().toISOString(),
        read: false
      };

      const receivedNotifications = [];
      
      const setupListener = (socket: ClientSocket, name: string) => {
        return new Promise<void>((resolve) => {
          socket.on(SocketEvent.NOTIFICATION, (data) => {
            receivedNotifications.push({ name, data });
            if (receivedNotifications.length === 4) resolve();
          });
        });
      };

      await Promise.all([
        setupListener(clientSocket, 'client'),
        setupListener(adminSocket, 'admin'),
        setupListener(userSocket1, 'user1'),
        setupListener(userSocket2, 'user2')
      ]);

      // Broadcast from client socket
      clientSocket.emit(SocketEvent.NOTIFICATION, notificationData);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedNotifications).toHaveLength(4);
      receivedNotifications.forEach(({ name, data }) => {
        expect(data.id).toBe(notificationData.id);
        expect(data.title).toBe(notificationData.title);
        expect(data.message).toBe(notificationData.message);
      });
    });

    it('should send messages to specific users', async () => {
      const messageData = {
        id: 'direct-message',
        type: 'success',
        title: 'Direct Message',
        message: 'This is a direct message',
        timestamp: new Date().toISOString(),
        read: false
      };

      const receivedMessages = [];
      
      userSocket1.on(SocketEvent.NOTIFICATION, (data) => {
        receivedMessages.push({ socket: 'user1', data });
      });

      userSocket2.on(SocketEvent.NOTIFICATION, (data) => {
        receivedMessages.push({ socket: 'user2', data });
      });

      // Send message only to user1
      clientSocket.emit('send_to_user', {
        userId: 'user-1',
        event: SocketEvent.NOTIFICATION,
        data: messageData
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0].socket).toBe('user1');
      expect(receivedMessages[0].data.title).toBe(messageData.title);
    });

    it('should broadcast to specific roles', async () => {
      const adminMessage = {
        id: 'admin-message',
        type: 'warning',
        title: 'Admin Alert',
        message: 'This is an admin-only message',
        timestamp: new Date().toISOString(),
        read: false
      };

      const receivedMessages = [];
      
      adminSocket.on(SocketEvent.NOTIFICATION, (data) => {
        receivedMessages.push({ socket: 'admin', data });
      });

      userSocket1.on(SocketEvent.NOTIFICATION, (data) => {
        receivedMessages.push({ socket: 'user1', data });
      });

      // Broadcast to admin role only
      clientSocket.emit('broadcast_to_role', {
        role: 'admin',
        event: SocketEvent.NOTIFICATION,
        data: adminMessage
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0].socket).toBe('admin');
      expect(receivedMessages[0].data.title).toBe(adminMessage.title);
    });
  });

  describe('Room Management', () => {
    it('should join and leave rooms dynamically', async () => {
      const roomName = 'test-room';
      const joinPromises = [];
      const leavePromises = [];

      [clientSocket, userSocket1, userSocket2].forEach((socket, index) => {
        const joinPromise = new Promise<void>((resolve) => {
          socket.on('room_joined', (data) => {
            expect(data.room).toBe(roomName);
            resolve();
          });
        });
        joinPromises.push(joinPromise);

        const leavePromise = new Promise<void>((resolve) => {
          socket.on('room_left', (data) => {
            expect(data.room).toBe(roomName);
            resolve();
          });
        });
        leavePromises.push(leavePromise);

        socket.emit('join_room', roomName);
      });

      await Promise.all(joinPromises);

      // Verify all sockets joined the room
      [clientSocket, userSocket1, userSocket2].forEach(socket => {
        socket.emit('leave_room', roomName);
      });

      await Promise.all(leavePromises);
    });

    it('should handle room-specific events', async () => {
      const roomName = 'quest-room';
      const roomMessage = {
        type: 'info',
        message: 'Room-specific message'
      };

      const receivedMessages = [];
      
      userSocket1.on('room_message', (data) => {
        receivedMessages.push({ socket: 'user1', data });
      });

      userSocket2.on('room_message', (data) => {
        receivedMessages.push({ socket: 'user2', data });
      });

      // Join room and send message
      userSocket1.emit('join_room', roomName);
      userSocket2.emit('join_room', roomName);

      await new Promise(resolve => setTimeout(resolve, 50));

      clientSocket.emit('room_message', {
        room: roomName,
        data: roomMessage
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Only users in room should receive the message
      expect(receivedMessages).toHaveLength(2);
      receivedMessages.forEach(({ data }) => {
        expect(data.type).toBe(roomMessage.type);
        expect(data.message).toBe(roomMessage.message);
      });
    });
  });

  describe('Real-time Quest Updates', () => {
    it('should broadcast quest creation events', async () => {
      const questData = {
        quest: {
          id: 'quest-123',
          title: 'Test Quest',
          description: 'Test Description',
          reward: 100,
          difficulty: 'medium',
          category: 'education',
          isActive: true,
          createdBy: 'admin@example.com',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        createdBy: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'admin'
        }
      };

      const receivedEvents = [];
      
      [clientSocket, userSocket1, userSocket2].forEach((socket, index) => {
        socket.on(SocketEvent.QUEST_CREATED, (data) => {
          receivedEvents.push({ socket: index, data });
        });
      });

      adminSocket.emit(SocketEvent.QUEST_CREATED, questData);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedEvents).toHaveLength(3);
      receivedEvents.forEach(({ data }) => {
        expect(data.quest.id).toBe(questData.quest.id);
        expect(data.quest.title).toBe(questData.quest.title);
      });
    });

    it('should handle quest completion events', async () => {
      const achievementData = {
        achievement: {
          id: 'ach-123',
          userId: 'user-1',
          questId: 'quest-123',
          earnedAt: new Date().toISOString()
        },
        user: {
          id: 'user-1',
          email: 'user1@example.com',
          role: 'user',
          points: 150
        },
        quest: {
          id: 'quest-123',
          title: 'Test Quest',
          reward: 100,
          category: 'education',
          difficulty: 'medium'
        }
      };

      const receivedEvents = [];
      
      [clientSocket, userSocket1, userSocket2].forEach((socket, index) => {
        socket.on(SocketEvent.ACHIEVEMENT_EARNED, (data) => {
          receivedEvents.push({ socket: index, data });
        });
      });

      userSocket1.emit(SocketEvent.ACHIEVEMENT_EARNED, achievementData);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedEvents).toHaveLength(3);
      receivedEvents.forEach(({ data }) => {
        expect(data.achievement.id).toBe(achievementData.achievement.id);
        expect(data.quest.title).toBe(achievementData.quest.title);
      });
    });
  });

  describe('Leaderboard Updates', () => {
    it('should update leaderboard in real-time', async () => {
      const leaderboardData = {
        leaderboard: [
          {
            rank: 1,
            user: {
              id: 'user-1',
              email: 'user1@example.com',
              points: 500
            },
            achievementCount: 10,
            totalReward: 500,
            averageReward: 50,
            rankChange: 2,
            badges: ['High Achiever']
          }
        ],
        timeRange: 'all'
      };

      const receivedUpdates = [];
      
      [clientSocket, userSocket1, userSocket2].forEach((socket, index) => {
        socket.on(SocketEvent.LEADERBOARD_UPDATED, (data) => {
          receivedUpdates.push({ socket: index, data });
        });
      });

      adminSocket.emit(SocketEvent.LEADERBOARD_UPDATED, leaderboardData);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedUpdates).toHaveLength(3);
      receivedUpdates.forEach(({ data }) => {
        expect(data.leaderboard).toHaveLength(1);
        expect(data.leaderboard[0].rank).toBe(1);
        expect(data.leaderboard[0].user.points).toBe(500);
      });
    });

    it('should handle rank change notifications', async () => {
      const rankChangeData = {
        user: {
          id: 'user-1',
          email: 'user1@example.com',
          points: 600
        },
        previousRank: 5,
        newRank: 2,
        rankChange: 3,
        timeRange: 'week'
      };

      const receivedNotifications = [];
      
      userSocket1.on(SocketEvent.RANK_CHANGED, (data) => {
        receivedNotifications.push(data);
      });

      userSocket1.on(SocketEvent.NOTIFICATION, (data) => {
        if (data.title === 'Rank Improved!') {
          receivedNotifications.push(data);
        }
      });

      // Simulate rank improvement
      clientSocket.emit(SocketEvent.RANK_CHANGED, rankChangeData);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedNotifications).toHaveLength(2);
      expect(receivedNotifications[0].newRank).toBe(2);
      expect(receivedNotifications[0].rankChange).toBe(3);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-frequency events', async () => {
      const eventCount = 1000;
      const receivedCount = { client: 0, user1: 0, user2: 0 };
      
      [clientSocket, userSocket1, userSocket2].forEach((socket, index) => {
        const socketName = ['client', 'user1', 'user2'][index];
        socket.on(SocketEvent.NOTIFICATION, () => {
          receivedCount[socketName]++;
        });
      });

      const startTime = Date.now();

      // Send high-frequency events
      for (let i = 0; i < eventCount; i++) {
        clientSocket.emit(SocketEvent.NOTIFICATION, {
          id: `notif-${i}`,
          type: 'info',
          title: `Notification ${i}`,
          message: `Message ${i}`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should handle events efficiently
      expect(processingTime).toBeLessThan(2000); // Should complete within 2 seconds
      
      // Should receive most events (allowing for some network loss)
      const totalReceived = receivedCount.client + receivedCount.user1 + receivedCount.user2;
      expect(totalReceived).toBeGreaterThan(eventCount * 0.8); // At least 80% delivery rate
    });

    it('should handle large payloads efficiently', async () => {
      const largePayload = {
        id: 'large-payload',
        type: 'info',
        title: 'Large Payload Test',
        data: new Array(1000).fill(0).map((_, i) => ({
          id: i,
          title: `Item ${i}`,
          description: `Description for item ${i}`,
          metadata: {
            nested: {
              value: i,
              array: new Array(100).fill(i)
            }
          }
        }))
      };

      const receivedPayloads = [];
      
      [clientSocket, userSocket1].forEach((socket, index) => {
        socket.on(SocketEvent.NOTIFICATION, (data) => {
          receivedPayloads.push({ socket: index, size: JSON.stringify(data).length });
        });
      });

      const startTime = Date.now();
      clientSocket.emit(SocketEvent.NOTIFICATION, largePayload);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(1000); // Should process within 1 second
      expect(receivedPayloads).toHaveLength(2);
      receivedPayloads.forEach(({ size }) => {
        expect(size).toBeGreaterThan(100000); // Verify large payload was received
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle socket disconnection during event processing', async () => {
      let processingError = false;
      
      userSocket1.on(SocketEvent.NOTIFICATION, () => {
        // Simulate processing error
        if (!processingError) {
          processingError = true;
          userSocket1.disconnect();
        }
      });

      userSocket1.on('disconnect', () => {
        logger.info('Socket disconnected during processing');
      });

      clientSocket.emit(SocketEvent.NOTIFICATION, {
        id: 'test-disconnect',
        type: 'info',
        title: 'Test',
        message: 'Test message'
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      expect(processingError).toBe(true);
    });

    it('should handle malformed event data gracefully', async () => {
      const malformedEvents = [
        null,
        undefined,
        'invalid-string',
        { invalid: 'structure' },
        [],
        123
      ];

      const receivedEvents = [];
      let errorCount = 0;

      userSocket1.on(SocketEvent.NOTIFICATION, (data) => {
        receivedEvents.push(data);
      });

      userSocket1.on(SocketEvent.ERROR, () => {
        errorCount++;
      });

      // Send malformed events
      malformedEvents.forEach((event, index) => {
        setTimeout(() => {
          clientSocket.emit(SocketEvent.NOTIFICATION, event);
        }, index * 10);
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Should handle malformed data without crashing
      expect(receivedEvents.length + errorCount).toBe(malformedEvents.length);
    });
  });
});
