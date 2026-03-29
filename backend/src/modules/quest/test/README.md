# Quest Management Module Testing Guide

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
npm test -- src/modules/quest/test/unit/quest.service.test.ts
```

### API Tests
```bash
npm test -- src/modules/quest/test/api/quest.route.test.ts
```

### All Quest Tests
```bash
npm test -- src/modules/quest/test/
```

### Test Coverage
```bash
npm test -- --coverage src/modules/quest
```

## Manual Testing

Start the server:
```bash
npm run dev
```

### Test Endpoints:

1. **Get All Quests** (public)
```bash
curl -X GET "http://localhost:5000/api/quests?page=1&limit=10&difficulty=easy&category=general"
```

2. **Get Active Quests** (public)
```bash
curl -X GET "http://localhost:5000/api/quests/active?page=1&limit=10"
```

3. **Get Quests by Category** (public)
```bash
curl -X GET "http://localhost:5000/api/quests/category/general?page=1&limit=10"
```

4. **Get Quests by Difficulty** (public)
```bash
curl -X GET "http://localhost:5000/api/quests/difficulty/easy?page=1&limit=10"
```

5. **Get Quest by ID** (public)
```bash
curl -X GET "http://localhost:5000/api/quests/QUEST_ID"
```

6. **Create Quest** (admin only)
```bash
curl -X POST http://localhost:5000/api/quests \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete Daily Challenge",
    "description": "Complete any daily challenge quest",
    "reward": 100,
    "difficulty": "medium",
    "category": "daily",
    "isActive": true
  }'
```

7. **Update Quest** (admin only)
```bash
curl -X PUT http://localhost:5000/api/quests/QUEST_ID \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Quest Title",
    "reward": 150,
    "difficulty": "hard"
  }'
```

8. **Toggle Quest Status** (admin only)
```bash
curl -X PATCH http://localhost:5000/api/quests/QUEST_ID/toggle \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

9. **Delete Quest** (admin only)
```bash
curl -X DELETE http://localhost:5000/api/quests/QUEST_ID \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

10. **Get Quest Statistics** (admin only)
```bash
curl -X GET http://localhost:5000/api/quests/admin/stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Expected Test Results
- Unit tests: Should pass all service layer tests
- API tests: Should pass all endpoint tests including authorization
- Coverage: Should achieve >80% coverage
- Manual tests: All endpoints should work with proper authentication and authorization

## Features Tested
- Quest CRUD operations
- Quest filtering and pagination
- Quest categorization and difficulty levels
- Quest status management (active/inactive)
- Role-based access control
- Quest statistics and analytics
- Search functionality
- Submission validation (prevent deletion with submissions)

## Test Data Examples

### Valid Quest Creation
```json
{
  "title": "Learn TypeScript Basics",
  "description": "Complete an introductory TypeScript course",
  "reward": 75,
  "difficulty": "easy",
  "category": "education"
}
```

### Quest Filters
- `difficulty`: easy, medium, hard
- `category`: general, daily, weekly, special, education
- `isActive`: true, false
- `search`: text search in title and description

### Error Scenarios to Test
- Invalid quest data (empty title, negative reward)
- Non-existent quest ID
- Unauthorized access (non-admin users)
- Deleting quest with existing submissions
- Invalid pagination parameters
