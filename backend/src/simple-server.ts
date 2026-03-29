import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic API routes for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication for testing
  if (email === 'admin@example.com' && password === 'admin123') {
    res.json({
      success: true,
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        name: 'Admin User'
      },
      token: 'mock-jwt-token-for-testing'
    });
  } else if (email === 'user@example.com' && password === 'user123') {
    res.json({
      success: true,
      user: {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
        name: 'Test User'
      },
      token: 'mock-jwt-token-for-testing'
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

// Mock quest data
app.get('/api/quests', (req, res) => {
  const quests = [
    {
      id: 'quest-1',
      title: 'Complete React Tutorial',
      description: 'Learn the basics of React and complete a simple tutorial',
      difficulty: 'easy',
      category: 'education',
      reward: 100,
      isActive: true,
      createdBy: 'admin@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'quest-2',
      title: 'Build a REST API',
      description: 'Create a complete REST API with Node.js and Express',
      difficulty: 'medium',
      category: 'development',
      reward: 200,
      isActive: true,
      createdBy: 'admin@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'quest-3',
      title: 'Implement Authentication System',
      description: 'Add JWT-based authentication to your application',
      difficulty: 'hard',
      category: 'security',
      reward: 300,
      isActive: true,
      createdBy: 'admin@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  res.json(quests);
});

// Mock submission data
app.get('/api/submissions', (req, res) => {
  const submissions = [
    {
      id: 'sub-1',
      questId: 'quest-1',
      userId: 'user-123',
      content: 'I completed the React tutorial and learned about components, props, and state management.',
      status: 'approved',
      submittedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      feedback: 'Great work! You demonstrated good understanding of React concepts.',
      score: 95
    },
    {
      id: 'sub-2',
      questId: 'quest-2',
      userId: 'user-123',
      content: 'Built a complete REST API with user authentication, CRUD operations, and proper error handling.',
      status: 'pending',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      feedback: null,
      score: null
    }
  ];
  
  res.json(submissions);
});

// Mock leaderboard data
app.get('/api/leaderboard', (req, res) => {
  const leaderboard = [
    {
      rank: 1,
      user: {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User'
      },
      points: 500,
      achievementCount: 3,
      totalReward: 600,
      averageReward: 200,
      rankChange: 2,
      badges: ['High Achiever', 'Quest Master', 'Early Bird']
    },
    {
      rank: 2,
      user: {
        id: 'user-456',
        email: 'another@example.com',
        name: 'Another User'
      },
      points: 350,
      achievementCount: 2,
      totalReward: 400,
      averageReward: 200,
      rankChange: -1,
      badges: ['Quest Hunter']
    }
  ];
  
  res.json(leaderboard);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Quest Management Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: http://localhost:3000`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 Test endpoints available:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET  http://localhost:${PORT}/api/quests`);
  console.log(`   GET  http://localhost:${PORT}/api/submissions`);
  console.log(`   GET  http://localhost:${PORT}/api/leaderboard`);
});

export default app;
