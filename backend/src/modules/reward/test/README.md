# Reward System Module Testing Guide

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
npm test -- src/modules/reward/test/unit/reward.service.test.ts
```

### API Tests
```bash
npm test -- src/modules/reward/test/api/reward.route.test.ts
```

### All Reward Tests
```bash
npm test -- src/modules/reward/test/
```

### Test Coverage
```bash
npm test -- --coverage src/modules/reward
```

## Manual Testing

Start the server:
```bash
npm run dev
```

### Test Endpoints:

1. **Create Reward** (admin only)
```bash
curl -X POST http://localhost:5000/api/rewards \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "questId": "QUEST_ID",
    "type": "bonus",
    "points": 50,
    "description": "Great work this week!"
  }'
```

2. **Get My Rewards** (authenticated users)
```bash
curl -X GET "http://localhost:5000/api/rewards/my?page=1&limit=10&type=bonus" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

3. **Get Reward by ID** (owner or admin)
```bash
curl -X GET http://localhost:5000/api/rewards/REWARD_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

4. **Update Reward** (admin only)
```bash
curl -X PUT http://localhost:5000/api/rewards/REWARD_ID \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "points": 75,
    "description": "Updated reward description"
  }'
```

5. **Delete Reward** (admin only)
```bash
curl -X DELETE http://localhost:5000/api/rewards/REWARD_ID \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

6. **Get All Rewards** (admin only)
```bash
curl -X GET "http://localhost:5000/api/rewards/admin/all?page=1&limit=10&userId=USER_ID&type=bonus" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

7. **Get Reward Statistics** (admin only)
```bash
curl -X GET "http://localhost:5000/api/rewards/admin/stats?timeRange=week" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

8. **Award Quest Reward** (admin only)
```bash
curl -X POST http://localhost:5000/api/rewards/award/quest/USER_ID/QUEST_ID \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bonusPoints": 25
  }'
```

9. **Award Bonus Reward** (admin only)
```bash
curl -X POST http://localhost:5000/api/rewards/award/bonus/USER_ID \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "points": 50,
    "description": "Outstanding performance this month!"
  }'
```

10. **Award Streak Reward** (admin only)
```bash
curl -X POST http://localhost:5000/api/rewards/award/streak/USER_ID \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "streakCount": 7,
    "points": 25
  }'
```

## Expected Test Results
- Unit tests: Should pass all service layer tests
- API tests: Should pass all endpoint tests including authorization
- Coverage: Should achieve >80% coverage
- Manual tests: All endpoints should work with proper authentication and authorization

## Features Tested
- Reward CRUD operations
- Quest completion rewards
- Bonus rewards
- Streak rewards
- Point management and user balance updates
- Reward statistics and analytics
- Role-based access control
- Pagination and filtering

## Reward Types

### Quest Completion Rewards
- Automatically awarded when users complete quests
- Base points from quest + optional bonus
- Prevents duplicate rewards for same quest

### Bonus Rewards
- Manually awarded by admins
- For exceptional performance or special occasions
- Flexible point amounts and descriptions

### Streak Rewards
- Awarded for consistent activity
- Different tiers based on streak length
- Encourages user engagement

### Achievement Rewards
- Linked to specific achievements
- Recognition for milestones
- Can include metadata about achievement

### Referral Rewards
- For bringing new users to platform
- Incentivizes user growth
- Tracks referral relationships

## Test Data Examples

### Reward Creation
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "questId": "550e8400-e29b-41d4-a716-446655440001",
  "type": "quest_completion",
  "points": 75,
  "description": "Completed quest: Learn TypeScript (with 25 bonus points)",
  "metadata": {
    "questTitle": "Learn TypeScript",
    "questDifficulty": "medium",
    "questCategory": "education",
    "baseReward": 50,
    "bonusPoints": 25
  }
}
```

### Reward Response Structure
```json
{
  "id": "reward-id",
  "userId": "user-id",
  "questId": "quest-id",
  "type": "bonus",
  "points": 50,
  "description": "Great work this week!",
  "metadata": null,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "user",
    "points": 250
  },
  "quest": {
    "id": "quest-id",
    "title": "Learn TypeScript",
    "description": "Complete TypeScript basics",
    "reward": 50,
    "difficulty": "medium",
    "category": "education"
  }
}
```

## Business Logic Tested

### Point Management
- Points are added to user balance when rewards are created
- Points are deducted when rewards are deleted
- Points are adjusted when reward amounts are updated
- Prevents negative point balances

### Reward Validation
- User must exist to receive rewards
- Quest must exist for quest completion rewards
- Users cannot receive duplicate quest completion rewards
- Point limits enforced by reward type

### Statistics Calculation
- Total rewards and points awarded
- Breakdown by reward type
- Top users by rewards earned
- Quest performance analytics
- Time-based filtering

## Error Scenarios to Test
- Creating rewards for non-existent users
- Awarding duplicate quest completion rewards
- Invalid reward types or point amounts
- Unauthorized access attempts
- Deleting rewards that don't exist
- Insufficient permissions for admin operations

## Performance Considerations
- Efficient point balance updates
- Optimized statistics queries
- Proper indexing on reward relationships
- Batch operations for bulk reward creation

## Integration Testing

### Cross-Module Dependencies
- Verify rewards integrate with quest system
- Test point balance synchronization
- Validate user permissions across modules
- Test achievement-reward relationships

### Data Consistency
- Ensure user points are always accurate
- Test concurrent reward operations
- Validate reward uniqueness constraints
- Check audit trail integrity

## Workflow Testing
1. Create user and quest
2. Complete quest submission
3. Approve submission
4. Award quest completion reward
5. Verify user points updated
6. Award additional bonus reward
7. Check reward statistics
8. Test reward deletion and point deduction

## Security Testing
- Test admin-only endpoints
- Verify user can only access own rewards
- Validate input sanitization
- Test SQL injection prevention
- Check rate limiting on reward creation
