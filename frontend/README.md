# Quest Management System - Frontend

## Overview

This is the frontend application for the Quest Management System, built with React, TypeScript, and Tailwind CSS. It provides a modern, responsive interface for users to manage quests, track submissions, earn rewards, and compete on leaderboards.

## Features

### 🔐 Authentication
- User registration and login
- Role-based access control (User/Admin)
- JWT token management
- Protected routes

### 📊 Dashboard
- Personal statistics overview
- Recent activity feed
- Progress tracking by category and difficulty
- Monthly progress charts

### 📚 Quest Management
- Browse available quests
- Filter by category, difficulty, and status
- Quest details and submission interface
- Admin quest management

### 📝 Submissions
- Submit quest completions
- Track submission status
- Admin review and approval system
- Feedback and scoring

### 🏆 Rewards System
- View earned rewards
- Point balance tracking
- Reward history
- Admin reward management

### 📈 Leaderboard
- Global rankings
- Category-specific leaderboards
- User ranking with badges
- Time-based filtering

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router** - Navigation
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Lucide React** - Icons
- **Recharts** - Data visualization

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend API running on port 5000

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd quest-management-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=QuestHub
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard components
│   ├── quests/         # Quest components
│   ├── submissions/    # Submission components
│   ├── rewards/        # Reward components
│   └── leaderboard/    # Leaderboard components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── styles/             # Global styles
```

## Key Components

### Authentication
- `AuthProvider` - Authentication context
- `useAuth` - Authentication hook
- `LoginPage` - Login interface
- `RegisterPage` - Registration interface

### Layout
- `Layout` - Main application layout
- `Sidebar` - Navigation sidebar
- `Header` - Top navigation bar

### Data Management
- `api.ts` - Axios configuration
- `auth.ts` - Authentication service
- `quest.ts` - Quest service
- Form validation with Zod

### UI Components
- Reusable components with Tailwind CSS
- Consistent design system
- Responsive design
- Accessibility features

## State Management

- **React Query** for server state
- **React Context** for authentication
- **Local State** for component state
- **Form State** with React Hook Form

## Styling

- **Tailwind CSS** for utility-first styling
- **Custom components** with consistent design
- **Responsive design** for all screen sizes
- **Dark mode support** (planned)
- **Accessibility** features

## Routing

- **React Router v6** for navigation
- **Protected routes** for authenticated users
- **Admin routes** for admin users
- **404 handling**

## Forms

- **React Hook Form** for form management
- **Zod** for schema validation
- **Error handling** and validation messages
- **Accessible form inputs**

## API Integration

- **Axios** for HTTP requests
- **Request/Response interceptors**
- **Error handling** and user feedback
- **Token management** for authentication

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## Build and Deployment

```bash
# Build for production
npm run build

# Preview build locally
npm run build && npm run start

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## Demo Accounts

### Admin Account
- Email: `admin@example.com`
- Password: `admin123`
- Role: Admin

### User Account
- Email: `user@example.com`
- Password: `user123`
- Role: User

## Features by Role

### User Features
- View dashboard and personal statistics
- Browse and submit quests
- Track submissions and rewards
- View leaderboards
- Manage profile

### Admin Features
- All user features
- Create and manage quests
- Review and approve submissions
- Manage rewards
- View comprehensive analytics
- User management

## Responsive Design

- **Mobile-first** approach
- **Tablet** and **desktop** layouts
- **Touch-friendly** interactions
- **Accessible** navigation

## Performance

- **Code splitting** for better loading
- **Image optimization**
- **Caching strategies**
- **Bundle optimization**

## Accessibility

- **Semantic HTML**
- **ARIA labels**
- **Keyboard navigation**
- **Screen reader support**
- **Focus management**

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Use semantic commit messages
5. Ensure accessibility compliance

## Troubleshooting

### Common Issues

**API Connection Issues**
- Ensure backend is running on port 5000
- Check environment variables
- Verify CORS configuration

**Build Errors**
- Clear node_modules and reinstall
- Check for dependency conflicts
- Verify TypeScript configuration

**Styling Issues**
- Ensure Tailwind CSS is properly configured
- Check for CSS conflicts
- Verify responsive breakpoints

## Future Enhancements

- [ ] Dark mode support
- [ ] Real-time notifications
- [ ] Offline support
- [ ] PWA capabilities
- [ ] Advanced analytics
- [ ] Social features
- [ ] Gamification elements
- [ ] Mobile app

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the demo accounts
- Contact the development team
