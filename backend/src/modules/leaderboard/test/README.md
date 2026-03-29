# Leaderboard Module Testing Guide

## Prerequisites
1. Install dependencies:
```bash
cd backend
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Fill in your DATABASE_URL and JWT_SECRET
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

## Running Tests

### Unit Tests
```bash
npm test -- src/modules/leaderboard/test/unit/leaderboard.service.test.ts
```

### API Tests
```bash
npm test -- src/modules/leaderboard/test/api/leaderboard.route.test.ts
```

### All Leaderboard Tests
```bash
npm test -- src/modules/leaderboard/test/
```

### Test Coverage
```bash
npm test -- --coverage src/modules/leaderboard
```

## Manual Testing

Start the server:
```bash
npm run dev
```

### Test Endpoints:

1. **Get Global Leaderboard** (public)
```bash
curl -X GET "http://localhost:5000/api/leaderboard/global?page=1&limit=50&timeRange=week&category=education&difficulty=medium"
```

2. **Get User Leaderboard** (authenticated users)
```bash
curl -X GET "http://localhost:5000/api/leaderboard/user?limit=10&timeRange=month" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

3. **Get Quest Leaderboard** (public)
```bash
curl -X GET "http://localhost:5000/api/leaderboard/quest/QUEST_ID?page=1&limit=20"
```

4. **Get Category Leaderboards** (public)
```bash
curl -X GET "http://localhost:5000/api/leaderboard/categories?timeRange=year"
```

5. **Get Leaderboard Statistics** (public)
```bash
curl -X GET "http://localhost:5000/api/leaderboard/stats?timeRange=week"
```

6. **Get User Ranking** (authenticated users)
```bash
curl -X GET "http://localhost:5000/api/leaderboard/user/ranking?timeRange=month" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Expected Test Results
- Unit tests: Should pass all service layer tests
- API tests: Should pass all endpoint tests including validation
- Coverage: Should achieve >80% coverage
- Manual tests: All endpoints should work with proper filtering and pagination

## Features Tested
- Global leaderboard with pagination and filtering
- User-specific leaderboard with nearby users
- Quest-specific leaderboards
- Category-based leaderboards
- Comprehensive statistics and analytics
- User ranking and badge system
- Time-based filtering (week, month, year, all time)
- Performance optimization for large datasets

## Leaderboard Features

### Global Leaderboard
- **Ranking System**: Users ranked by total reward points
- **Pagination**: Efficient handling of large user bases
- **Filters**: Time range, category, difficulty filtering
- **Rank Changes**: Track user movement over time
- **Badges**: Achievement-based badges displayed

### User Leaderboard
- **Personal Ranking**: User's position in global leaderboard
- **Nearby Users**: Show competitors around user's rank
- **Context**: 5 users above and below for context
- **Personal Stats**: Individual achievement and reward summary

### Quest Leaderboard
- **Competition**: First-completion leaderboard per quest
- **Performance Metrics**: Time to complete, success rates
- **Submission Details**: Status and feedback information
- **Quest Statistics**: Overall quest performance data

### Category Leaderboards
- **Specialization**: Rankings by quest categories
- **Multiple Categories**: Education, General, Technical, Creative
- **Per-Category Stats**: Separate leaderboards for each category
- **Cross-Comparison**: Compare performance across categories

## Time Range Filters

### Available Filters
- `all`: All time data
- `week`: Last 7 days
- `month`: Current month
- `year`: Current year

### Filter Usage
```bash
# All time (default)
curl -X GET "http://localhost:5000/api/leaderboard/global"

# Last 7 days
curl -X GET "http://localhost:5000/api/leaderboard/global?timeRange=week"

# Current month
curl -X GET "http://localhost:5000/api/leaderboard/global?timeRange=month"

# Current year
curl -X GET "http://localhost:5000/api/leaderboard/global?timeRange=year"
```

## Badge System

### Achievement-Based Badges
- **Century Club**: 100+ achievements
- **High Achiever**: 50+ achievements
- **Rising Star**: 25+ achievements
- **Dedicated**: 10+ achievements
- **Getting Started**: 5+ achievements

### Point-Based Badges
- **Elite**: 5000+ points
- **Master**: 2500+ points
- **Expert**: 1000+ points
- **Skilled**: 500+ points
- **Novice**: 100+ points

### Streak Badges
- **On Fire**: 30+ day streak
- **Consistent**: 14+ day streak
- **Week Warrior**: 7+ day streak

## Test Data Examples

### Global Leaderboard Response
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user": {
          "id": "user-1",
          "email": "top@example.com",
          "points": 2500,
          "createdAt": "2024-01-01T00:00:00Z"
        },
        "achievementCount": 25,
        "totalReward": 2500,
        "averageReward": 100,
        "rankChange": 2,
        "badges": ["High Achiever", "Master"]
      }
    ],
    "total": 100,
    "page": 1,
    "totalPages": 2
  }
}
```

### User Ranking Response
```json
{
  "success": true,
  "data": {
    "globalRank": 15,
    "categoryRanks": {
      "education": 8,
      "technical": 25
    },
    "difficultyRanks": {
      "medium": 12,
      "hard": 20
    },
    "totalParticipants": 500,
    "badges": ["Dedicated", "Skilled"]
  }
}
```

## Performance Considerations

### Query Optimization
- Efficient aggregation queries using Prisma groupBy
- Proper indexing on achievement and user tables
- Pagination to prevent large result sets
- Caching strategies for frequently accessed data

### Database Load
- Monitor query performance with large user bases
- Consider materialized views for complex aggregations
- Implement database connection pooling
- Optimize rank calculation algorithms

### Scalability
- Horizontal scaling for leaderboard calculations
- Background job processing for rank updates
- Redis caching for real-time leaderboard data
- CDN for static leaderboard snapshots

## Business Logic Tested

### Ranking Algorithm
- Users ranked by total reward points from achievements
- Tie-breaking by achievement count, then user creation date
- Real-time rank updates based on new achievements
- Historical rank tracking for trend analysis

### Badge System
- Automatic badge awarding based on achievements
- Point threshold calculations for skill badges
- Streak tracking and badge awarding
- Badge display and categorization

### Statistics Calculation
- Real-time aggregation of user performance
- Category and difficulty breakdown analysis
- Time-based trend calculations
- Activity and engagement metrics

## Error Scenarios to Test
- Invalid pagination parameters
- Non-existent quest leaderboards
- Users not found in leaderboard
- Invalid time range or category filters
- Database connection failures
- Large dataset performance issues

## Integration Testing

### Cross-Module Dependencies
- Verify leaderboard uses achievement data correctly
- Test integration with quest system
- Validate user data synchronization
- Check reward system integration

### Data Consistency
- Ensure leaderboard reflects latest achievements
- Test concurrent achievement submissions
- Validate rank calculation accuracy
- Check badge system consistency

## Workflow Testing
1. Create multiple users with different achievement levels
2. Complete quests and earn achievements
3. Verify global leaderboard rankings
4. Test user-specific leaderboard views
5. Check category and difficulty filtering
6. Validate time-based filtering
7. Test badge awarding system
8. Verify performance with large datasets

## Monitoring and Analytics

### Performance Metrics
- Leaderboard calculation response times
- Database query performance
- Cache hit rates
- User engagement with leaderboards

### Business Intelligence
- User retention correlated with leaderboard position
- Achievement completion patterns
- Category popularity analysis
- Time-based engagement trends

## Security Considerations

### Data Privacy
- Public vs. private leaderboard data
- User email visibility settings
- Sensitive information protection
- GDPR compliance considerations

### Rate Limiting
- Prevent leaderboard abuse
- Protect against scraping
- Implement fair usage policies
- Monitor API usage patterns
