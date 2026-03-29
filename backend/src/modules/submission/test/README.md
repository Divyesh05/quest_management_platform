# Submission Management Module Testing Guide

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
npm test -- src/modules/submission/test/unit/submission.service.test.ts
```

### API Tests
```bash
npm test -- src/modules/submission/test/api/submission.route.test.ts
```

### All Submission Tests
```bash
npm test -- src/modules/submission/test/
```

### Test Coverage
```bash
npm test -- --coverage src/modules/submission
```

## Manual Testing

Start the server:
```bash
npm run dev
```

### Test Endpoints:

1. **Create Submission** (authenticated users)
```bash
curl -X POST http://localhost:5000/api/submissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questId": "QUEST_ID",
    "content": "I completed this quest by learning TypeScript and building a project. Here are the details..."
  }'
```

2. **Get My Submissions** (authenticated users)
```bash
curl -X GET "http://localhost:5000/api/submissions/my?page=1&limit=10&status=pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

3. **Get Submission by ID** (owner or admin)
```bash
curl -X GET http://localhost:5000/api/submissions/SUBMISSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

4. **Update Submission** (owner, pending only)
```bash
curl -X PUT http://localhost:5000/api/submissions/SUBMISSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated submission content with more details..."
  }'
```

5. **Delete Submission** (owner, pending only)
```bash
curl -X DELETE http://localhost:5000/api/submissions/SUBMISSION_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

6. **Get All Submissions** (admin only)
```bash
curl -X GET "http://localhost:5000/api/submissions/admin/all?page=1&limit=10&status=pending&questId=QUEST_ID" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

7. **Approve Submission** (admin only)
```bash
curl -X PATCH http://localhost:5000/api/submissions/SUBMISSION_ID/approve \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "feedback": "Great work! The quest was completed successfully."
  }'
```

8. **Reject Submission** (admin only)
```bash
curl -X PATCH http://localhost:5000/api/submissions/SUBMISSION_ID/reject \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "feedback": "Please provide more details about your implementation."
  }'
```

9. **Get Submission Statistics** (admin only)
```bash
curl -X GET http://localhost:5000/api/submissions/admin/stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Expected Test Results
- Unit tests: Should pass all service layer tests
- API tests: Should pass all endpoint tests including authorization
- Coverage: Should achieve >80% coverage
- Manual tests: All endpoints should work with proper authentication and authorization

## Features Tested
- Submission CRUD operations
- Quest validation (active, exists)
- Duplicate submission prevention
- Achievement creation and points awarding
- Role-based access control
- Submission workflow (pending → approved/rejected)
- Statistics and analytics
- Pagination and filtering

## Business Logic Tested

### Submission Creation
- Quest must exist and be active
- User cannot submit same quest twice
- User cannot submit if already achieved
- Content validation

### Submission Review
- Only pending submissions can be updated/reviewed
- Approved submissions create achievements
- Approved submissions award points
- Feedback can be provided

### Access Control
- Users can only access their own submissions
- Admins can access all submissions
- Users can only delete their pending submissions
- Admins can delete any pending submission

## Test Data Examples

### Valid Submission Creation
```json
{
  "questId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "I completed the TypeScript learning quest by following the official documentation and building a small todo application. I learned about interfaces, generics, and type safety."
}
```

### Review Actions
```json
{
  "feedback": "Excellent work! Your implementation shows good understanding of TypeScript concepts."
}
```

### Error Scenarios to Test
- Submitting to inactive quest
- Submitting to non-existent quest
- Duplicate submission attempts
- Updating reviewed submissions
- Deleting reviewed submissions
- Unauthorized access attempts

## Workflow Testing
1. Create quest (admin)
2. Submit quest (user)
3. Review submission (admin)
4. Check points awarded (user)
5. Verify achievement created (user)
6. Try duplicate submission (should fail)
