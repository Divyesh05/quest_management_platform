import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

// API Service
import { apiPost, apiGet } from "./services/api";
import { authService } from './services/auth';

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Page Components
import { QuestsPage } from './pages/QuestsPage';
import { QuestDetailPage } from './pages/QuestDetailPage';
import { SubmissionsPage } from './pages/SubmissionsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { QuestCreatePage } from './pages/QuestCreatePage';
import { AdminUsersPage } from './pages/AdminUsersPage';

// Layout Components
import { Navigation } from './components/Navigation';
import { ProtectedRoute } from './components/ProtectedRoute';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  reward: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Submission {
  id: string;
  questId: string;
  userId: string;
  content: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  feedback: string | null;
  score: number | null;
}

interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    email: string;
    name: string;
  };
  points: number;
  achievementCount: number;
  totalReward: number;
  averageReward: number;
  rankChange: number;
  badges: string[];
}

// Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <main className="p-4">
        {children}
      </main>
    </div>
  );
};

// Simple Login Page
const LoginPage: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await apiPost("/auth/login", { email, password }) as {
        success: boolean;
        data: { token: string; user: User };
      };

      if (data.success) {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        navigate("/dashboard");
      } else {
        alert("Invalid credentials");
      }
    } catch {
      alert("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground">
            Sign in to your account
          </h2>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                required
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t">
            <h3 className="text-sm font-medium text-foreground mb-4">
              Demo Accounts
            </h3>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEmail("admin@example.com");
                  setPassword("admin123");
                }}
                className="w-full text-left"
              >
                <div className="font-medium">Admin Account</div>
                <div className="text-sm text-muted-foreground">
                  admin@example.com / admin123
                </div>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEmail("user@example.com");
                  setPassword("user123");
                }}
                className="w-full text-left"
              >
                <div className="font-medium">User Account</div>
                <div className="text-sm text-muted-foreground">
                  user@example.com / user123
                </div>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Simple Dashboard Page
const DashboardPage: React.FC = () => {
  const [quests, setQuests] = React.useState<Quest[]>([]);
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardEntry[]>([]);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsedUser: User = JSON.parse(userData) as User;
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user data:", error);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch quests
        let questsData: Quest[] = [];
        try {
          const questsRes = await apiGet("/quests") as any;
          questsData = questsRes.data || questsRes || [];
        } catch (err) {
          console.warn("Failed to fetch quests:", err);
          questsData = [
            {
              id: "1",
              title: "Complete Your Profile",
              description: "Fill out your profile information",
              category: "Onboarding",
              difficulty: "Easy",
              reward: 50,
              isActive: true,
              createdBy: "system",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "2", 
              title: "First Submission",
              description: "Submit your first quest completion",
              category: "Getting Started",
              difficulty: "Easy", 
              reward: 100,
              isActive: true,
              createdBy: "system",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "3",
              title: "Help a Community Member",
              description: "Assist another user with their quest",
              category: "Community",
              difficulty: "Medium",
              reward: 150,
              isActive: true,
              createdBy: "system", 
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          ];
        }

        // Fetch submissions
        let submissionsData: Submission[] = [];
        try {
          const submissionsRes = await apiGet("/submissions/my") as any;
          submissionsData = submissionsRes.data || submissionsRes || [];
        } catch (err) {
          console.warn("Failed to fetch submissions:", err);
          submissionsData = [
            {
              id: "1",
              questId: "Complete Your Profile",
              userId: user?.id || "1",
              content: "Profile completed successfully",
              status: "approved",
              submittedAt: new Date().toISOString(),
              reviewedAt: new Date().toISOString(),
              feedback: "Great job!",
              score: 50,
            }
          ];
        }

        // Fetch leaderboard
        let leaderboardData: LeaderboardEntry[] = [];
        try {
          const leaderboardRes = await apiGet("/leaderboard") as any;
          leaderboardData = leaderboardRes.data || leaderboardRes || [];
        } catch (err) {
          console.warn("Failed to fetch leaderboard:", err);
          leaderboardData = [
            {
              rank: 1,
              user: {
                id: "1",
                email: "admin@example.com",
                name: "Admin User",
              },
              points: 1000,
              achievementCount: 15,
              totalReward: 500,
              averageReward: 33.33,
              rankChange: 0,
              badges: ["🏆", "⭐", "🎯"],
            },
            {
              rank: 2,
              user: {
                id: "2", 
                email: "user@example.com",
                name: "Demo User",
              },
              points: 750,
              achievementCount: 10,
              totalReward: 400,
              averageReward: 40,
              rankChange: 1,
              badges: ["🌟", "🎯"],
            },
            {
              rank: 3,
              user: {
                id: "3",
                email: "player@example.com", 
                name: "Active Player",
              },
              points: 500,
              achievementCount: 8,
              totalReward: 300,
              averageReward: 37.5,
              rankChange: -1,
              badges: ["⭐"],
            }
          ];
        }

        setQuests(questsData);
        setSubmissions(submissionsData);
        setLeaderboard(leaderboardData);
      } catch (error: unknown) {
        console.error("Failed to fetch data:", error);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Welcome back, {user?.name || "User"}! 👋</span>
              <div className="flex items-center gap-2 text-sm font-normal">
                <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs">
                  {user?.role || 'user'}
                </span>
                <span className="text-muted-foreground">
                  {user?.email || ''}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <div className="text-2xl">🏆</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{submissions.filter(s => s.status === 'approved').length}</p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{submissions.filter(s => s.status === 'pending').length}</p>
              </div>
              <div className="text-2xl">⏳</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rank</p>
                <p className="text-2xl font-bold">#5</p>
              </div>
              <div className="text-2xl">🎯</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              📋 Available Quests
              <Button variant="outline" size="sm" onClick={() => navigate('/quests')}>
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quests && quests.length > 0 ? (
                quests.slice(0, 3).map((quest) => (
                  <div
                    key={quest.id}
                    className="flex justify-between items-center p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                    onClick={() => navigate(`/quests/${quest.id}`)}
                  >
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground mb-1">
                        {quest.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="px-1.5 py-0.5 bg-background rounded">
                          {quest.category}
                        </span>
                        <span className="px-1.5 py-0.5 bg-background rounded">
                          {quest.difficulty}
                        </span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600 ml-3">
                      +{quest.reward} pts
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No quests available</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Create Quest
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              📝 My Submissions
              <Button variant="outline" size="sm" onClick={() => navigate('/submissions')}>
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submissions && submissions.length > 0 ? (
                submissions.slice(0, 3).map((submission) => (
                  <div
                    key={submission.id}
                    className="p-3 bg-secondary rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-foreground">
                        {submission.questId}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        submission.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : submission.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {submission.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Score: {submission.score || "Pending"}</span>
                      <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                    </div>
                    {submission.feedback && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        "{submission.feedback}"
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No submissions yet</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Start First Quest
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              🏆 Leaderboard
              <Button variant="outline" size="sm" onClick={() => navigate('/leaderboard')}>
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.slice(0, 5).map((entry) => (
                  <div
                    key={entry.user.id}
                    className={`flex justify-between items-center p-3 bg-secondary rounded-lg ${
                      entry.user.email === user?.email ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold min-w-8 ${
                        entry.rank === 1 ? 'text-yellow-500' :
                        entry.rank === 2 ? 'text-gray-400' :
                        entry.rank === 3 ? 'text-amber-600' : 'text-foreground'
                      }`}>
                        #{entry.rank}
                      </span>
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-1">
                          {entry.user.name}
                          {entry.user.email === user?.email && (
                            <span className="ml-1 text-xs text-primary">(You)</span>
                          )}
                        </h4>
                        <p className="text-xs text-muted-foreground m-0">
                          {entry.points} points
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground">
                        {entry.achievementCount} 🏅
                      </div>
                      {entry.rankChange !== 0 && (
                        <span className={`text-xs ${
                          entry.rankChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {entry.rankChange > 0 ? '↑' : '↓'}{Math.abs(entry.rankChange)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Leaderboard data unavailable</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🚀 Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/quests')}>
              Browse Quests
            </Button>
            <Button variant="outline" onClick={() => navigate('/submissions')}>
              My Submissions
            </Button>
            <Button variant="outline" onClick={() => navigate('/leaderboard')}>
              View Leaderboard
            </Button>
            {user?.role === 'admin' && (
              <Button variant="outline" onClick={() => navigate('/admin/users')}>
                Manage Users
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};

// Register Page
const RegisterPage: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">
              Create your account
            </h2>
          </div>
          <Card className="p-8">
            <p className="text-center text-muted-foreground">
              Registration coming soon! For now, use demo accounts on login
              page.
            </p>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes with Navigation */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Navigation user={authService.getStoredUser()} />
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quests"
            element={
              <ProtectedRoute>
                <Layout>
                  <Navigation user={authService.getStoredUser()} />
                  <QuestsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quests/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <Navigation user={authService.getStoredUser()} />
                  <QuestDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/submissions"
            element={
              <ProtectedRoute>
                <Layout>
                  <Navigation user={authService.getStoredUser()} />
                  <SubmissionsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Navigation user={authService.getStoredUser()} />
                  <LeaderboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Navigation user={authService.getStoredUser()} />
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <Navigation user={authService.getStoredUser()} />
                  <AdminDashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quests/create"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <Navigation user={authService.getStoredUser()} />
                  <QuestCreatePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <Navigation user={authService.getStoredUser()} />
                  <AdminUsersPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#22c55e",
                secondary: "#fff",
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </div>
    </Router>
  );
};

export default App;
