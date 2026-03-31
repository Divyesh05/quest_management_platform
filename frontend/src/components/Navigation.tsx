import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth';

interface NavigationProps {
  user?: any;
}

export const Navigation: React.FC<NavigationProps> = ({ user }) => {
  const location = useLocation();

  const handleLogout = () => {
    authService.logout();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-primary text-primary-foreground p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="text-2xl font-bold m-0 text-primary-foreground hover:text-primary-foreground/80">
          🏆 QuestHub
        </Link>
        
        {user ? (
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className={`text-primary-foreground hover:text-primary-foreground/80 p-2 rounded ${
                isActive('/dashboard') ? 'bg-primary-foreground/20' : ''
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/quests"
              className={`text-primary-foreground hover:text-primary-foreground/80 p-2 rounded ${
                isActive('/quests') ? 'bg-primary-foreground/20' : ''
              }`}
            >
              Quests
            </Link>
            <Link
              to="/submissions"
              className={`text-primary-foreground hover:text-primary-foreground/80 p-2 rounded ${
                isActive('/submissions') ? 'bg-primary-foreground/20' : ''
              }`}
            >
              Submissions
            </Link>
            <Link
              to="/leaderboard"
              className={`text-primary-foreground hover:text-primary-foreground/80 p-2 rounded ${
                isActive('/leaderboard') ? 'bg-primary-foreground/20' : ''
              }`}
            >
              Leaderboard
            </Link>
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className={`text-primary-foreground hover:text-primary-foreground/80 p-2 rounded ${
                  isActive('/admin') ? 'bg-primary-foreground/20' : ''
                }`}
              >
                Admin
              </Link>
            )}
            <Link
              to="/profile"
              className={`text-primary-foreground hover:text-primary-foreground/80 p-2 rounded ${
                isActive('/profile') ? 'bg-primary-foreground/20' : ''
              }`}
            >
              Profile
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Link
              to="/login"
              className="text-primary-foreground hover:text-primary-foreground/80 p-2 rounded"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-primary-foreground hover:text-primary-foreground/80 p-2 rounded"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
