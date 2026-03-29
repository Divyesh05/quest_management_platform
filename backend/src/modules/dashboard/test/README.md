# Dashboard Analytics Module Testing Guide

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
npm test -- src/modules/dashboard/test/unit/dashboard.service.test.ts
```

### API Tests
```bash
npm test -- src/modules/dashboard/test/api/dashboard.route.test.ts
```

### All Dashboard Tests
```bash
npm test -- src/modules/dashboard/test/
```

### Test Coverage
```bash
npm test -- --coverage src/modules/dashboard
```

## Manual Testing

Start the server:
```bash
npm run dev
```

### Test Endpoints:

1. **Get Admin Dashboard Statistics** (admin only)
```bash
curl -X GET "http://localhost:5000/api/dashboard/admin/stats?timeRange=week" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

2. **Get User Dashboard Statistics** (authenticated users)
```bash
curl -X GET "http://localhost:5000/api/dashboard/user/stats?timeRange=month" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

3. **Get Quest Analytics** (admin only)
```bash
curl -X GET "http://localhost:5000/api/dashboard/admin/quest/QUEST_ID?timeRange=year" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Expected Test Results
- Unit tests: Should pass all service layer tests
- API tests: Should pass all endpoint tests including authorization
- Coverage: Should achieve >80% coverage
- Manual tests: All endpoints should work with proper authentication and authorization

## Features Tested
- Comprehensive dashboard statistics
- User-specific analytics
- Quest performance analytics
- Time-based filtering (week, month, year, all time)
- Trend analysis and visualization data
- Top performer rankings
- Progress tracking by category and difficulty
- Recent activity feeds
- Performance metrics and KPIs

## Dashboard Features

### Admin Dashboard
- **Overview Statistics**: Total users, quests, submissions, achievements
- **Engagement Metrics**: Active users, approval rates, completion rates
- **Top Performers**: User rankings by achievements and points
- **Quest Performance**: Best and worst performing quests
- **Recent Activity**: Latest submissions and achievements
- **Trends Analysis**: Submission and achievement trends over time

### User Dashboard
- **Personal Overview**: Submission stats, achievements, points
- **Progress Tracking**: By category and difficulty
- **Monthly Progress**: Achievement and point trends
- **Recent Activity**: Personal activity timeline

### Quest Analytics
- **Quest Statistics**: Submission counts, approval rates
- **Performance Metrics**: Completion rates, average time
- **Trend Analysis**: Submission patterns over time
- **Top Performers**: Users who completed the quest

## Time Range Filters

### Available Filters
- `all`: All time data
- `week`: Last 7 days
- `month`: Current month
- `year`: Current year

### Filter Usage
```bash
# All time (default)
curl -X GET "http://localhost:5000/api/dashboard/admin/stats"

# Last 7 days
curl -X GET "http://localhost:5000/api/dashboard/admin/stats?timeRange=week"

# Current month
curl -X GET "http://localhost:5000/api/dashboard/admin/stats?timeRange=month"

# Current year
curl -X GET "http://localhost:5000/api/dashboard/admin/stats?timeRange=year"
```

## Test Data Examples

### Admin Dashboard Response Structure
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 100,
      "activeUsers": 50,
      "totalQuests": 20,
      "activeQuests": 15,
      "totalSubmissions": 200,
      "pendingSubmissions": 30,
      "approvedSubmissions": 150,
      "rejectedSubmissions": 20,
      "totalAchievements": 180,
      "totalPointsAwarded": 9000,
      "approvalRate": 75
    },
    "topUsers": [...],
    "questStats": [...],
    "recentActivity": [...],
    "trends": {
      "submissions": [...],
      "achievements": [...]
    },
    "timeRange": "week"
  }
}
```

### User Dashboard Response Structure
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalSubmissions": 5,
      "approvedSubmissions": 3,
      "rejectedSubmissions": 1,
      "pendingSubmissions": 1,
      "totalAchievements": 3,
      "totalPoints": 150,
      "approvalRate": 60
    },
    "recentActivity": [...],
    "progressByCategory": {
      "education": { "completed": 2, "total": 3, "percentage": 66.67 }
    },
    "progressByDifficulty": {
      "easy": { "completed": 2, "total": 2, "percentage": 100 },
      "medium": { "completed": 1, "total": 2, "percentage": 50 }
    },
    "monthlyProgress": [...]
  }
}
```

## Performance Considerations

### Query Optimization
- Parallel execution of multiple database queries
- Efficient aggregation using Prisma groupBy
- Proper indexing on timestamp fields
- Pagination for large datasets

### Caching Strategy
- Dashboard data can be cached for short periods
- Time-based cache invalidation
- User-specific cache keys

### Database Load
- Monitor query performance with large datasets
- Consider materialized views for complex aggregations
- Implement database connection pooling

## Business Logic Tested

### Statistics Calculation
- Real-time aggregation of user, quest, and activity data
- Percentage calculations for rates and progress
- Time-based filtering and trend analysis

### Performance Metrics
- Approval rates calculation
- Completion rates by quest
- Average completion time estimation
- User engagement tracking

### Progress Tracking
- Category-wise progress calculation
- Difficulty-wise progress analysis
- Monthly trend analysis
- Personal achievement tracking

## Error Scenarios to Test
- Invalid time range parameters
- Non-existent quest analytics
- Unauthorized access attempts
- Database connection failures
- Large dataset performance

## Integration Testing

### Cross-Module Dependencies
- Verify dashboard uses data from all modules
- Test real-time data consistency
- Validate user permissions across modules

### Data Consistency
- Ensure dashboard reflects latest changes
- Test concurrent data modifications
- Validate aggregate data accuracy

## Monitoring and Analytics

### Performance Metrics
- Response time monitoring
- Database query performance
- Memory usage tracking

### Business Intelligence
- User engagement patterns
- Quest popularity analysis
- Submission approval trends
- Peak activity periods

## Workflow Testing
1. Create test users and quests
2. Generate submissions and achievements
3. Test dashboard statistics accuracy
4. Verify time-based filtering
5. Validate trend calculations
6. Test performance with large datasets
