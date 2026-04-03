# Architecture Documentation

## Overview
The Quest Management System is a full-stack platform built with a modern technology stack, enabling administrators to create and manage quests, while allowing users to browse, complete, and track their progress through these quests.

## Technology Stack
- **Frontend:** React, Vite, TailwindCSS, Socket.io-client
- **Backend:** Node.js, Express, Socket.io, Prisma ORM
- **Database:** Supabase Postgres
- **Storage:** Supabase Storage (for file uploads)

## Core Components
### 1. RESTful API
The backend exposes RESTful API endpoints for authentication, user management, quests, submissions, leaderboards, and achievements.
- Swagger documentation is available at `/api/docs`.

### 2. Real-time Notifications (Socket.io)
When a user completes an achievement or their submission is validated, relevant real-time notifications are pushed via WebSockets connecting the server and the React frontend.

### 3. File Upload handling
Submissions can optionally contain proofs (attachments). Uploads are temporarily stored in memory via multer and dispatched to Supabase storage. A public URL is then saved via Prisma ORM for seamless delivery.

### 4. Database Modeling 
Prisma handles database ORM and migrations, streamlining queries across the Supabase instance securely using environment variables.
