# Realtime Module Testing Guide

## Overview

The Realtime module provides WebSocket-based real-time communication for the Quest Management System using Socket.IO. It enables live updates for quests, submissions, achievements, rewards, leaderboards, and notifications.

## Features

### 🔄 Real-time Communication
- WebSocket connections with Socket.IO
- Authentication and authorization
- Room-based communication
- Event broadcasting and targeting

### 📡 Event Types
- Quest events (create, update, delete, complete)
- Submission events (create, update, approve, reject)
- Achievement events (earned, updated)
- Reward events (granted, updated, points updated)
- Leaderboard events (updated, rank changed)
- Notification events (system, user, role-specific)
- User events (online/offline, updated)
- Dashboard events (stats updated)

### 🏠 Room Management
- User-specific rooms
- Role-based rooms
- Quest rooms
- Submission rooms
- Admin rooms
- Custom dynamic rooms

### 🔐 Security Features
- JWT authentication
- Role-based access control
- Rate limiting
- Input validation
- Error handling

## Prerequisites

1. Install dependencies:
```bash
cd backend
npm install socket.io @types/socket.io jsonwebtoken @types/jsonwebtoken winston
```

2. Set up environment variables:
```bash
# Add to .env file
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
SOCKET_CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

## Running Tests

### Unit Tests
```bash
npm test -- src/modules/realtime/test/unit/socket.test.ts
```

### Integration Tests
```bash
npm test -- src/modules/realtime/test/integration/realtime.test.ts
```

### All Realtime Tests
```bash
npm test -- src/modules/realtime/test/
```

### Test Coverage
```bash
npm test -- --coverage src/modules/realtime
```

## Manual Testing

### Backend Setup
```typescript
// In your main server file (server.ts or index.ts)
import { createServer } from 'http';
import { initializeSocket } from './src/modules/realtime/socket';

const server = createServer();
const io = initializeSocket(server);

server.listen(5000, () => {
  console.log('Server running on port 5000');
  console.log('Socket.IO server initialized');
});
```

### Frontend Integration
```typescript
// Install Socket.IO client
npm install socket.io-client

// In your React app
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token')
  }
});

// Listen to events
socket.on('notification', (data) => {
  console.log('Received notification:', data);
});

// Emit events
socket.emit('join_room', 'quest-room');
```

## Event Examples

### Quest Events
```typescript
// Listen for quest creation
socket.on('quest_created', (data) => {
  console.log('New quest:', data.quest);
  console.log('Created by:', data.createdBy);
});

// Listen for quest completion
socket.on('quest_completed', (data) => {
  console.log('Quest completed:', data.quest);
  console.log('Completed by:', data.user);
});
```

### Submission Events
```typescript
// Listen for new submissions
socket.on('submission_created', (data) => {
  console.log('New submission:', data.submission);
  console.log('Submitted by:', data.user);
});

// Listen for approval
socket.on('submission_approved', (data) => {
  console.log('Submission approved:', data.submission);
  // Show success notification
});
```

### Achievement Events
```typescript
// Listen for achievements
socket.on('achievement_earned', (data) => {
  console.log('Achievement earned:', data.achievement);
  console.log('User:', data.user);
  // Update UI with new achievement
});
```

### Leaderboard Events
```typescript
// Listen for leaderboard updates
socket.on('leaderboard_updated', (data) => {
  console.log('Leaderboard updated:', data.leaderboard);
  // Update leaderboard UI
});

// Listen for rank changes
socket.on('rank_changed', (data) => {
  console.log('Rank changed:', data.previousRank, '→', data.newRank);
  // Show rank improvement notification
});
```

### Notification Events
```typescript
// Listen for notifications
socket.on('notification', (data) => {
  console.log('Notification:', data);
  // Show toast notification
  // Update notification badge
});

// Send notifications
socket.emit('notification', {
  type: 'success',
  title: 'Success!',
  message: 'Operation completed successfully',
  userId: 'user-123' // Send to specific user
});
```

## Room Management Examples

### Joining Rooms
```typescript
// Join user room
socket.emit('join_room', 'user:user-123');

// Join role room
socket.emit('join_room', 'role:admin');

// Join quest room
socket.emit('join_room', 'quest:quest-123');

// Join submission room
socket.emit('join_room', 'submission:sub-123');
```

### Room-Specific Events
```typescript
// Send message to quest room
socket.emit('room_message', {
  room: 'quest:quest-123',
  data: {
    type: 'info',
    message: 'Quest update available'
  }
});

// Listen for room messages
socket.on('room_message', (data) => {
  console.log('Room message:', data);
});
```

## Testing Scenarios

### Basic Connection Tests
1. **Authentication Flow**
   - Connect with valid token
   - Connect with invalid token
   - Connect without token
   - Test token expiration

2. **Room Management**
   - Join multiple rooms
   - Leave rooms
   - Send room-specific messages
   - Test room access control

3. **Event Broadcasting**
   - Broadcast to all users
   - Send to specific users
   - Send to specific roles
   - Test event delivery

### Advanced Scenarios
1. **High-Frequency Events**
   - Send 1000+ events rapidly
   - Test performance under load
   - Verify message ordering

2. **Large Payloads**
   - Send large data objects
   - Test memory usage
   - Verify data integrity

3. **Error Handling**
   - Malformed event data
   - Network interruptions
   - Server disconnections
   - Client crashes

4. **Concurrent Users**
   - Multiple simultaneous connections
   - Cross-user communication
   - Race conditions
   - Resource cleanup

## Performance Considerations

### Server-Side
- **Connection Pooling**: Efficient connection management
- **Event Queuing**: Handle high-frequency events
- **Memory Management**: Clean up disconnected sockets
- **Rate Limiting**: Prevent abuse and spam
- **Load Balancing**: Scale across multiple instances

### Client-Side
- **Reconnection Logic**: Handle disconnections gracefully
- **Event Buffering**: Store events during disconnection
- **Batch Processing**: Group related events
- **Memory Management**: Clean up event listeners
- **Debouncing**: Prevent excessive event handling

## Monitoring and Debugging

### Logging
```typescript
// Enable debug logging
import { logger } from './src/modules/realtime/utils';

logger.info('Socket connection established');
logger.warn('Rate limit approaching');
logger.error('Socket error occurred', { error: err, socketId: socket.id });
```

### Metrics to Track
- Active connections count
- Events per second
- Message latency
- Memory usage
- Error rates
- Room populations

## Security Considerations

### Authentication
- JWT token validation
- Token expiration handling
- User verification against database
- Secure token transmission

### Authorization
- Role-based access control
- Room access validation
- Event-level permissions
- Admin-only features

### Data Validation
- Input sanitization
- Payload size limits
- Event type validation
- SQL injection prevention

## Frontend Integration Guide

### React Hook Example
```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      setConnected(true);
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      setSocket(null);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, connected };
};
```

### Context Provider
```typescript
import React, { createContext, useContext } from 'react';
import { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  emit: (event: string, data: any) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  // Socket initialization logic here...

  const emit = (event: string, data: any) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, emit }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
```

## Troubleshooting

### Common Issues

**Connection Failures**
- Check CORS configuration
- Verify JWT_SECRET matches
- Ensure frontend URL is correct
- Check firewall settings

**Authentication Issues**
- Verify token format
- Check token expiration
- Ensure user exists in database
- Validate JWT secret

**Event Not Received**
- Check event name spelling
- Verify listener registration
- Check room membership
- Ensure proper data format

**Performance Issues**
- Monitor memory usage
- Check for memory leaks
- Optimize event handlers
- Implement rate limiting

### Debug Commands
```bash
# Check active connections
curl http://localhost:5000/socket.io/

# Monitor logs
tail -f logs/combined.log

# Check memory usage
ps aux | grep node
```

## Best Practices

### Code Organization
- Separate event handlers
- Use TypeScript interfaces
- Implement proper error handling
- Keep event names in constants

### Performance
- Use event debouncing
- Implement proper cleanup
- Monitor memory usage
- Optimize large payloads

### Security
- Always validate inputs
- Use HTTPS in production
- Implement rate limiting
- Log security events

### Testing
- Test connection scenarios
- Verify error handling
- Test with multiple clients
- Monitor performance metrics

## Expected Test Results

### Unit Tests
- ✅ Socket initialization
- ✅ Authentication middleware
- ✅ Event handlers registration
- ✅ Room management
- ✅ Broadcasting functions
- ✅ Error handling

### Integration Tests
- ✅ Multi-client scenarios
- ✅ Real-time event propagation
- ✅ Room-based communication
- ✅ Performance under load
- ✅ Error recovery

### Coverage Metrics
- **Target**: >90% coverage
- **Functions**: All public methods
- **Event Handlers**: All event types
- **Middleware**: Authentication and authorization
- **Error Scenarios**: Connection and data errors

## Deployment Considerations

### Production Setup
- Use Redis adapter for scaling
- Enable compression
- Configure proper CORS
- Set up monitoring
- Implement health checks

### Scaling
- Horizontal scaling support
- Load balancing configuration
- Database connection pooling
- Caching strategies
- Performance monitoring

This realtime module provides a robust foundation for real-time features in the Quest Management System, ensuring reliable, secure, and performant WebSocket communication.
