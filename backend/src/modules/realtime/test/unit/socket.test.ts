import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { initializeSocket, getSocketIO, broadcastToAll, sendToUser } from '../../socket';
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

describe('Realtime Socket Module', () => {
  let server: any;
  let io: SocketIOServer;
  let clientSocket: ClientSocket;
  let serverSocket: any;

  beforeAll((done) => {
    server = createServer();
    io = initializeSocket(server);
    
    server.listen(() => {
      const port = (server.address() as any).port;
      clientSocket = ClientIO(`http://localhost:${port}`, {
        auth: {
          token: 'mock-token'
        }
      });
      
      io.on('connection', (socket) => {
        serverSocket = socket;
        // Mock authenticated user
        socket.data = {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            role: 'user',
            points: 100
          },
          authenticated: true,
          connectedAt: new Date().toISOString()
        };
      });

      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    server.close();
  });

  beforeEach(() => {
    // Reset any test state
  });

  describe('Socket Initialization', () => {
    it('should initialize Socket.IO server', () => {
      expect(io).toBeDefined();
      expect(getSocketIO()).toBe(io);
    });

    it('should throw error when getting Socket.IO before initialization', () => {
      // Reset the module to test uninitialized state
      jest.resetModules();
      expect(() => getSocketIO()).toThrow('Socket.IO not initialized');
    });
  });

  describe('Connection Handling', () => {
    it('should handle client connection', (done) => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    it('should handle client disconnection', (done) => {
      const testSocket = ClientIO(`http://localhost:${(server.address() as any).port}`, {
        auth: { token: 'mock-token' }
      });

      testSocket.on('connect', () => {
        testSocket.disconnect();
      });

      testSocket.on('disconnect', (reason) => {
        expect(reason).toBeDefined();
        testSocket.close();
        done();
      });
    });
  });

  describe('Broadcasting Functions', () => {
    it('should broadcast to all clients', (done) => {
      const testData = { message: 'Hello everyone!' };
      
      clientSocket.on(SocketEvent.NOTIFICATION, (data) => {
        expect(data).toEqual(testData);
        done();
      });

      broadcastToAll(SocketEvent.NOTIFICATION, testData);
    });

    it('should send to specific user', (done) => {
      const testData = { message: 'Private message' };
      const userId = 'user-123';
      
      // Mock the user room
      if (serverSocket) {
        serverSocket.join(`user:${userId}`);
      }

      clientSocket.on(SocketEvent.NOTIFICATION, (data) => {
        expect(data).toEqual(testData);
        done();
      });

      sendToUser(userId, SocketEvent.NOTIFICATION, testData);
    });

    it('should handle broadcasting when no clients connected', () => {
      expect(() => {
        broadcastToAll(SocketEvent.NOTIFICATION, { test: true });
      }).not.toThrow();
    });
  });

  describe('Room Management', () => {
    it('should join user room on connection', () => {
      if (serverSocket) {
        expect(serverSocket.rooms.has('user:user-123')).toBe(true);
      }
    });

    it('should join role room on connection', () => {
      if (serverSocket) {
        expect(serverSocket.rooms.has('role:user')).toBe(true);
      }
    });

    it('should handle custom room joining', (done) => {
      const testRoom = 'test-room';
      
      clientSocket.emit('join_room', testRoom);
      
      clientSocket.on('room_joined', (data) => {
        expect(data.room).toBe(testRoom);
        done();
      });
    });

    it('should handle custom room leaving', (done) => {
      const testRoom = 'test-room';
      
      clientSocket.emit('leave_room', testRoom);
      
      clientSocket.on('room_left', (data) => {
        expect(data.room).toBe(testRoom);
        done();
      });
    });
  });

  describe('Event Handling', () => {
    it('should handle notification events', (done) => {
      const notificationData = {
        id: 'notif-123',
        type: 'success',
        title: 'Test Notification',
        message: 'This is a test',
        timestamp: new Date().toISOString(),
        read: false
      };

      clientSocket.on(SocketEvent.NOTIFICATION, (data) => {
        expect(data).toEqual(notificationData);
        done();
      });

      clientSocket.emit(SocketEvent.NOTIFICATION, notificationData);
    });

    it('should handle typing indicator events', (done) => {
      const typingData = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'user'
        },
        isTyping: true,
        location: 'quest-123',
        timestamp: new Date().toISOString()
      };

      clientSocket.on(SocketEvent.TYPING_INDICATOR, (data) => {
        expect(data).toEqual(typingData);
        done();
      });

      clientSocket.emit(SocketEvent.TYPING_INDICATOR, typingData);
    });

    it('should handle presence updates', (done) => {
      const presenceData = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'user'
        },
        presence: {
          status: 'online',
          lastSeen: new Date().toISOString()
        }
      };

      clientSocket.on(SocketEvent.PRESENCE_UPDATED, (data) => {
        expect(data).toEqual(presenceData);
        done();
      });

      clientSocket.emit(SocketEvent.PRESENCE_UPDATED, presenceData);
    });
  });

  describe('Error Handling', () => {
    it('should handle socket errors gracefully', (done) => {
      const errorData = {
        error: {
          code: 'TEST_ERROR',
          message: 'Test error message',
          details: null
        },
        timestamp: new Date().toISOString()
      };

      clientSocket.on(SocketEvent.ERROR, (data) => {
        expect(data.error.message).toBe('Test error message');
        done();
      });

      clientSocket.emit('error', new Error('Test error message'));
    });

    it('should handle invalid event data', () => {
      expect(() => {
        clientSocket.emit(SocketEvent.NOTIFICATION, null);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid events', (done) => {
      let eventCount = 0;
      const totalEvents = 100;

      clientSocket.on(SocketEvent.NOTIFICATION, () => {
        eventCount++;
        if (eventCount === totalEvents) {
          expect(eventCount).toBe(totalEvents);
          done();
        }
      });

      // Send multiple events rapidly
      for (let i = 0; i < totalEvents; i++) {
        clientSocket.emit(SocketEvent.NOTIFICATION, {
          id: `notif-${i}`,
          type: 'info',
          title: `Notification ${i}`,
          message: `Test message ${i}`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    });

    it('should handle large payloads', (done) => {
      const largePayload = {
        data: new Array(1000).fill(0).map((_, i) => ({
          id: i,
          title: `Item ${i}`,
          description: `Description for item ${i}`,
          metadata: { nested: { value: i } }
        }))
      };

      clientSocket.on(SocketEvent.NOTIFICATION, (data) => {
        expect(data.data).toHaveLength(1000);
        done();
      });

      clientSocket.emit(SocketEvent.NOTIFICATION, largePayload);
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory on repeated connections', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create and close multiple connections
      const connections = [];
      for (let i = 0; i < 10; i++) {
        const socket = ClientIO(`http://localhost:${(server.address() as any).port}`, {
          auth: { token: 'mock-token' }
        });
        connections.push(socket);
      }

      // Wait for connections to establish
      await new Promise(resolve => setTimeout(resolve, 100));

      // Close all connections
      connections.forEach(socket => socket.close());

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Security', () => {
    it('should reject connections without authentication', (done) => {
      const unauthSocket = ClientIO(`http://localhost:${(server.address() as any).port}`);

      unauthSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication');
        unauthSocket.close();
        done();
      });
    });

    it('should reject connections with invalid tokens', (done) => {
      const invalidSocket = ClientIO(`http://localhost:${(server.address() as any).port}`, {
        auth: { token: 'invalid-token' }
      });

      invalidSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Invalid token');
        invalidSocket.close();
        done();
      });
    });
  });
});
