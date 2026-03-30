import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiResponse } from '../types';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';
  let details: any = undefined;

  // Handle specific error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APP_ERROR';
  }
  // Zod validation errors
  else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
  }
  // Prisma errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Resource already exists';
        code = 'DUPLICATE_RESOURCE';
        details = {
          field: error.meta?.target,
        };
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Resource not found';
        code = 'RESOURCE_NOT_FOUND';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint violation';
        code = 'FOREIGN_KEY_VIOLATION';
        break;
      default:
        statusCode = 500;
        message = 'Database error';
        code = 'DATABASE_ERROR';
    }
  }
  // JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }
  // Syntax errors (usually JSON parsing)
  else if (error instanceof SyntaxError) {
    statusCode = 400;
    message = 'Invalid request format';
    code = 'INVALID_FORMAT';
  }

  // Log error details
  console.error('Error Details:', {
    message: error.message,
    stack: error.stack,
    statusCode,
    code,
    details,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Send error response
  const response: ApiResponse = {
    success: false,
    message,
    error: code,
  };

  if (details && process.env.NODE_ENV !== 'production') {
    (response as any).details = details;
  }

  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    (response as any).stack = error.stack;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'ROUTE_NOT_FOUND',
  });
};

export const validateRequest = (schema: any, target: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const validatedData = schema.parse(data);
      
      // Replace the request data with validated data
      req[target] = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};
