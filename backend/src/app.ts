import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { connectDatabase } from './modules/database/service';

// Load environment variables
dotenv.config();

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Apply rate limiting
app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    success: true,
    message: 'Service is healthy',
    data: {
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    }
  });
});

// Basic API route for testing
app.get('/api/test', (_req, res) => {
  res.json({
    success: true,
    message: 'Backend is working!',
    data: { timestamp: new Date().toISOString() }
  });
});

// API routes
try {
  console.log('🔄 Loading routes...');
  
  // Enable routes one by one to find the issue
  // Authentication routes
  const authRoutes = require('./modules/auth/routes').default;
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');

  // User routes
  const userRoutes = require('./modules/user/routes').default;
  app.use('/api/users', userRoutes);
  console.log('✅ User routes loaded');

  // Quest routes
  const questRoutes = require('./modules/quests/routes').default;
  app.use('/api/quests', questRoutes);
  console.log('✅ Quest routes loaded');

  // Submission routes
  const submissionRoutes = require('./modules/submissions/routes').default;
  app.use('/api/submissions', submissionRoutes);
  console.log('✅ Submission routes loaded');

  // Leaderboard routes
  const leaderboardRoutes = require('./modules/leaderboard/routes').default;
  app.use('/api/leaderboard', leaderboardRoutes);
  console.log('✅ Leaderboard routes loaded');

  // Achievement routes
  const achievementRoutes = require('./modules/achievement/routes').default;
  app.use('/api/achievements', achievementRoutes);
  console.log('✅ Achievement routes loaded');

} catch (error: any) {
  console.error('❌ Error loading routes:', error.message);
  console.error('📍 Stack trace:', error.stack);
  process.exit(1);
}

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    console.log('🗄️ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('⚠️ Starting server without database connection');
  }

  const server = app.listen(PORT, '127.0.0.1', {
    // Socket options to prevent address in use errors
    exclusive: true,
  }, () => {
    console.log(`\n🚀 Quest Management Server started successfully!`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`🧪 Test Endpoint: http://localhost:${PORT}/api/test`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
    console.log(`\n🔐 Available Endpoints:`);
    console.log(`   POST /api/auth/register    - Register new user`);
    console.log(`   POST /api/auth/login       - User login`);
    console.log(`   GET  /api/auth/profile     - Get user profile`);
    console.log(`   GET  /api/users            - Get all users (admin)`);
    console.log(`   GET  /api/users/:id        - Get user by ID (admin)`);
    console.log(`   PUT  /api/users/:id        - Update user (admin)`);
    console.log(`   DELETE /api/users/:id     - Delete user (admin)`);
    console.log(`   PUT  /api/users/:id/points - Add points to user (admin)`);
    console.log(`   GET  /api/quests           - Get all quests`);
    console.log(`   POST /api/quests           - Create quest (admin)`);
    console.log(`   GET  /api/submissions      - Get submissions (admin)`);
    console.log(`   POST /api/submissions      - Create submission`);
    console.log(`   GET  /api/leaderboard      - Get leaderboard`);
    console.log(`   GET  /api/leaderboard/top/:limit - Get top users`);
    console.log(`\n📝 Note: Use Authorization: Bearer <token> for protected routes`);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal: string) => {
    console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });

    // Force close after 5 seconds (reduced from 10)
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });
};

startServer();

export default app;
