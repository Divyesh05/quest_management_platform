# Authentication Module Testing Guide

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
npm test -- src/modules/auth/test/unit/auth.service.test.ts
```

### API Tests
```bash
npm test -- src/modules/auth/test/api/auth.route.test.ts
```

### All Auth Tests
```bash
npm test -- src/modules/auth/test/
```

### Test Coverage
```bash
npm test -- --coverage src/modules/auth
```

## Manual Testing

Start the server:
```bash
npm run dev
```

### Test Endpoints:

1. **Register User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

2. **Login User**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

3. **Get Profile** (requires token)
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Expected Test Results
- Unit tests: Should pass all service layer tests
- API tests: Should pass all endpoint tests
- Coverage: Should achieve >80% coverage
- Manual tests: All endpoints should work as expected
