# Database Schema Documentation

## Models Overview

### User Model
Manages user accounts with authorization controls.
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `password`: String (Hashed password)
- `role`: String (user | admin)
- `points`: Integer (Tracks total points from approved submissions)
- `name`: String (Optional)
- Relationships:
  - Submissions
  - Achievements
  - Quests created (if admin)

### Quest Model
Missions that users complete for points.
- `id`: UUID (Primary Key)
- `title`: String
- `description`: String
- `reward`: Integer (Points awarded)
- `difficulty`: String (Easy | Medium | Hard)
- `category`: String
- `isActive`: Boolean
- Relationships:
  - Submissions

### Submission Model
User attempts at completing quests.
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key)
- `questId`: UUID (Foreign Key)
- `status`: String (pending | approved | rejected)
- `content`: String (Optional user notes)
- `fileUrl`: String (Optional Supabase bucket URL for proof validation)
- `fileName`: String (Optional original attached proof name)
- `feedback`: String (Admin feedback)

### Achievement Model
Trackers representing quests a user has completed.
- `id`: UUID (Primary Key)
- `userId`: UUID
- `questId`: UUID
- `earnedAt`: DateTime

### Reward Model
General model for all points awarded.
- `id`: UUID (Primary Key)
- `points`: Integer

*(For a fully comprehensive schema, refer to `backend/prisma/schema.prisma`)*
