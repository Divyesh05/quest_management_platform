import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { SocketData } from './types';
import { logger } from './utils';

const prisma = new PrismaClient();

export const authenticateSocket = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    // Get token from handshake auth or query parameter
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as any;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        points: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user data to socket
    socket.data = {
      user,
      authenticated: true,
      connectedAt: new Date().toISOString()
    } as SocketData;

    logger.info(`Socket authenticated: ${user.email} (${socket.id})`);
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Invalid token'));
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Token expired'));
    }
    
    next(new Error('Authentication failed'));
  }
};

export const requireRole = (role: string) => {
  return (socket: Socket, next: (err?: Error) => void) => {
    if (!socket.data.authenticated) {
      return next(new Error('Authentication required'));
    }

    if (socket.data.user.role !== role) {
      return next(new Error(`Access denied. Required role: ${role}`));
    }

    next();
  };
};

export const requireAnyRole = (roles: string[]) => {
  return (socket: Socket, next: (err?: Error) => void) => {
    if (!socket.data.authenticated) {
      return next(new Error('Authentication required'));
    }

    if (!roles.includes(socket.data.user.role)) {
      return next(new Error(`Access denied. Required one of roles: ${roles.join(', ')}`));
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');

export const optionalAuth = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      // Allow connection without authentication but mark as unauthenticated
      socket.data = {
        user: null,
        authenticated: false,
        connectedAt: new Date().toISOString()
      } as SocketData;
      return next();
    }

    // Try to authenticate if token provided
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        points: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (user) {
      socket.data = {
        user,
        authenticated: true,
        connectedAt: new Date().toISOString()
      } as SocketData;
    } else {
      socket.data = {
        user: null,
        authenticated: false,
        connectedAt: new Date().toISOString()
      } as SocketData;
    }

    next();
  } catch (error) {
    // Allow connection without authentication on error
    socket.data = {
      user: null,
      authenticated: false,
      connectedAt: new Date().toISOString()
    } as SocketData;
    next();
  }
};

// Rate limiting middleware
export const rateLimit = (maxConnections: number = 10, windowMs: number = 60000) => {
  const connections = new Map<string, { count: number; resetTime: number }>();

  return (socket: Socket, next: (err?: Error) => void) => {
    if (!socket.data.authenticated) {
      return next(new Error('Authentication required for rate-limited connections'));
    }

    const userId = socket.data.user.id;
    const now = Date.now();
    const userConnections = connections.get(userId);

    if (!userConnections || now > userConnections.resetTime) {
      // Reset or initialize counter
      connections.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    if (userConnections.count >= maxConnections) {
      return next(new Error('Too many connections. Please try again later.'));
    }

    // Increment counter
    userConnections.count++;
    next();
  };
};

// Room access control middleware
export const canAccessRoom = (room: string) => {
  return (socket: Socket, next: (err?: Error) => void) => {
    if (!socket.data.authenticated) {
      return next(new Error('Authentication required'));
    }

    const user = socket.data.user;
    const roomParts = room.split(':');

    // Check room access based on room type
    switch (roomParts[0]) {
      case 'user':
        if (roomParts[1] !== user.id && user.role !== 'admin') {
          return next(new Error('Access denied to user room'));
        }
        break;
      
      case 'role':
        if (roomParts[1] !== user.role) {
          return next(new Error('Access denied to role room'));
        }
        break;
      
      case 'admin':
        if (user.role !== 'admin') {
          return next(new Error('Access denied to admin room'));
        }
        break;
      
      case 'quest':
      case 'submission':
        // These rooms are generally accessible to authenticated users
        // Additional logic can be added here if needed
        break;
      
      default:
        return next(new Error('Invalid room type'));
    }

    next();
  };
};

// Connection validation middleware
export const validateConnection = (socket: Socket, next: (err?: Error) => void) => {
  // Check if user is already connected (optional)
  const userId = socket.data.user?.id;
  
  if (userId && socket.data.authenticated) {
    // You can implement logic to handle multiple connections from same user
    // For now, we'll allow it
    logger.info(`User ${userId} connecting (additional connection)`);
  }

  // Validate socket version or other requirements
  const clientVersion = socket.handshake.query.version;
  const serverVersion = '1.0.0'; // This could come from environment or config

  if (clientVersion && clientVersion !== serverVersion) {
    logger.warn(`Version mismatch: client ${clientVersion}, server ${serverVersion}`);
    // You could implement version compatibility logic here
  }

  next();
};
