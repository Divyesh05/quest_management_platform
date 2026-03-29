import winston from 'winston';

// Create logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'realtime' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production, log to the console with a simple format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        let log = `${timestamp} [${service}] ${level}: ${message}`;
        
        // Add socket ID if available
        if (meta.socketId) {
          log += ` (socket: ${meta.socketId})`;
        }
        
        // Add user ID if available
        if (meta.userId) {
          log += ` (user: ${meta.userId})`;
        }
        
        // Add extra metadata
        if (Object.keys(meta).length > 0) {
          log += ` ${JSON.stringify(meta)}`;
        }
        
        return log;
      })
    )
  }));
}

export { logger };

// Utility functions for common operations
export const formatTimestamp = (date: Date = new Date()): string => {
  return date.toISOString();
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const sanitizeData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data };
  
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.secret;
  
  // Sanitize nested objects
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });
  
  return sanitized;
};

export const validateSocketData = (socket: any): boolean => {
  return socket && 
         socket.data && 
         socket.data.user && 
         socket.data.authenticated &&
         socket.data.user.id &&
         socket.data.user.email;
};

export const getUserSocketInfo = (socket: any): any => {
  if (!validateSocketData(socket)) {
    return null;
  }

  return {
    id: socket.id,
    userId: socket.data.user.id,
    email: socket.data.user.email,
    role: socket.data.user.role,
    connectedAt: socket.data.connectedAt,
    rooms: Array.from(socket.rooms)
  };
};

export const createEventPayload = (type: string, data: any, userId?: string): any => {
  return {
    id: generateId(),
    type,
    data: sanitizeData(data),
    timestamp: formatTimestamp(),
    userId,
    metadata: {
      source: 'socket.io',
      version: '1.0.0'
    }
  };
};

export const calculateRateLimit = (connections: number, maxConnections: number): boolean => {
  return connections < maxConnections;
};

export const getCircuitBreakerState = (failureCount: number, threshold: number = 5): 'closed' | 'open' | 'half-open' => {
  if (failureCount >= threshold) {
    return 'open';
  }
  return 'closed';
};

export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean;
  return function executedFunction(...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const retry = async (fn: Function, retries: number = 3, delay: number = 1000): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    logger.warn(`Retrying operation, ${retries} retries left`, { error: error.message });
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUserId = (userId: string): boolean => {
  const userIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return userIdRegex.test(userId);
};

export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const getMemoryUsage = (): any => {
  const usage = process.memoryUsage();
  return {
    rss: formatBytes(usage.rss),
    heapTotal: formatBytes(usage.heapTotal),
    heapUsed: formatBytes(usage.heapUsed),
    external: formatBytes(usage.external),
    arrayBuffers: formatBytes(usage.arrayBuffers)
  };
};

export const healthCheck = (): any => {
  return {
    status: 'healthy',
    timestamp: formatTimestamp(),
    uptime: process.uptime(),
    memory: getMemoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };
};

// Error handling utilities
export class SocketError extends Error {
  public code: string;
  public statusCode: number;
  public timestamp: string;

  constructor(message: string, code: string = 'SOCKET_ERROR', statusCode: number = 500) {
    super(message);
    this.name = 'SocketError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = formatTimestamp();
  }
}

export const createErrorPayload = (error: Error, socketId?: string): any => {
  return {
    error: {
      name: error.name,
      message: error.message,
      code: (error as any).code || 'UNKNOWN_ERROR',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    socketId,
    timestamp: formatTimestamp()
  };
};

// Performance monitoring
export const measureExecutionTime = async (fn: Function, label: string): Promise<any> => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.info(`${label} completed`, { duration, label });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${label} failed`, { duration, label, error: error.message });
    throw error;
  }
};

// Data transformation utilities
export const transformUserForSocket = (user: any): any => {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    points: user.points,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

export const transformQuestForSocket = (quest: any): any => {
  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    reward: quest.reward,
    difficulty: quest.difficulty,
    category: quest.category,
    isActive: quest.isActive,
    createdBy: quest.createdBy,
    createdAt: quest.createdAt,
    updatedAt: quest.updatedAt
  };
};

export const transformSubmissionForSocket = (submission: any): any => {
  return {
    id: submission.id,
    userId: submission.userId,
    questId: submission.questId,
    status: submission.status,
    content: submission.content,
    submittedAt: submission.submittedAt,
    reviewedAt: submission.reviewedAt,
    reviewedBy: submission.reviewedBy,
    feedback: submission.feedback
  };
};
