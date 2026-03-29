import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { authenticateSocket } from './middleware';
import { registerEventHandlers } from './handlers';
import { SocketEvent } from './types';
import { logger } from './utils';

let io: SocketIOServer;

export const initializeSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(authenticateSocket);

  // Handle connections
  io.on('connection', (socket: Socket) => {
    logger.info(`User connected: ${socket.data.user.id} (${socket.id})`);

    // Register all event handlers
    registerEventHandlers(socket, io);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${socket.data.user.id} (${socket.id}) - ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.data.user.id}:`, error);
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
};

export const getSocketIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

// Helper functions for broadcasting
export const broadcastToAll = (event: SocketEvent, data: any): void => {
  if (io) {
    io.emit(event, data);
    logger.info(`Broadcasted event ${event} to all clients`);
  }
};

export const broadcastToRole = (role: string, event: SocketEvent, data: any): void => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
    logger.info(`Broadcasted event ${event} to role: ${role}`);
  }
};

export const sendToUser = (userId: string, event: SocketEvent, data: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
    logger.info(`Sent event ${event} to user: ${userId}`);
  }
};

export const broadcastToRoom = (room: string, event: SocketEvent, data: any): void => {
  if (io) {
    io.to(room).emit(event, data);
    logger.info(`Broadcasted event ${event} to room: ${room}`);
  }
};

// Room management
export const joinRoom = (socket: Socket, room: string): void => {
  socket.join(room);
  logger.info(`User ${socket.data.user.id} joined room: ${room}`);
};

export const leaveRoom = (socket: Socket, room: string): void => {
  socket.leave(room);
  logger.info(`User ${socket.data.user.id} left room: ${room}`);
};

export const joinUserRoom = (socket: Socket): void => {
  const userRoom = `user:${socket.data.user.id}`;
  joinRoom(socket, userRoom);
};

export const joinRoleRoom = (socket: Socket): void => {
  const roleRoom = `role:${socket.data.user.role}`;
  joinRoom(socket, roleRoom);
};

export const getConnectedUsers = (): string[] => {
  if (!io) return [];
  
  const connectedUsers: string[] = [];
  io.sockets.sockets.forEach((socket) => {
    if (socket.data.user) {
      connectedUsers.push(socket.data.user.id);
    }
  });
  
  return connectedUsers;
};

export const isUserConnected = (userId: string): boolean => {
  if (!io) return false;
  
  return io.sockets.sockets.has(userId);
};

export const getSocketByUserId = (userId: string): Socket | null => {
  if (!io) return null;
  
  for (const [socketId, socket] of io.sockets.sockets) {
    if (socket.data.user && socket.data.user.id === userId) {
      return socket;
    }
  }
  
  return null;
};
