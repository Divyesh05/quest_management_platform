# User Management Module Testing Guide

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
npm test -- src/modules/user/test/unit/user.service.test.ts
```

### API Tests
```bash
npm test -- src/modules/user/test/api/user.route.test.ts
```

### All User Tests
```bash
npm test -- src/modules/user/test/
```

### Test Coverage
```bash
npm test -- --coverage src/modules/user
```

## Manual Testing

Start the server:
```bash
npm run dev
```

### Test Endpoints:

1. **Get Profile** (requires authentication)
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

2. **Update Profile** (requires authentication)
```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "newemail@example.com"}'
```

3. **Get All Users** (admin only)
```bash
curl -X GET http://localhost:5000/api/users/all \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

4. **Add Points** (admin only)
```bash
curl -X POST http://localhost:5000/api/users/USER_ID/points/add \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"points": 50}'
```

5. **Deduct Points** (admin only)
```bash
curl -X POST http://localhost:5000/api/users/USER_ID/points/deduct \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"points": 25}'
```

6. **Get User by ID** (admin only)
```bash
curl -X GET http://localhost:5000/api/users/USER_ID \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

7. **Update User** (admin only)
```bash
curl -X PUT http://localhost:5000/api/users/USER_ID \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

8. **Delete User** (admin only)
```bash
curl -X DELETE http://localhost:5000/api/users/USER_ID \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Expected Test Results
- Unit tests: Should pass all service layer tests
- API tests: Should pass all endpoint tests including authorization
- Coverage: Should achieve >80% coverage
- Manual tests: All endpoints should work with proper authentication and authorization

## Features Tested
- User profile management
- Role-based access control
- Points system (add/deduct)
- Pagination for user listing
- Email uniqueness validation
- Authentication middleware
- Authorization middleware
