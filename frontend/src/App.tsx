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
      const data = await apiPost("/auth/login", { email, password });

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
        const [questsRes, submissionsRes, leaderboardRes] = await Promise.all([
          apiGet("/quests") as Promise<Quest[]>,
          apiGet("/submissions/my") as Promise<Submission[]>,
          apiGet("/leaderboard") as Promise<LeaderboardEntry[]>,
        ]);

        setQuests(questsRes);
        setSubmissions(submissionsRes);
        setLeaderboard(leaderboardRes);
      } catch (error: unknown) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Layout>
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome back, {user?.name || "User"}! 👋</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>📋 Available Quests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quests &&
                quests.length > 0 &&
                quests.slice(0, 3).map((quest) => (
                  <div
                    key={quest.id}
                    className="flex justify-between items-center p-3 bg-secondary rounded-lg"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1">
                        {quest.title}
                      </h4>
                      <p className="text-xs text-muted-foreground m-0">
                        {quest.category} • {quest.difficulty}
                      </p>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {quest.reward} pts
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📝 My Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submissions &&
                submissions.length > 0 &&
                submissions.slice(0, 3).map((submission) => (
                  <div
                    key={submission.id}
                    className="p-3 bg-secondary rounded-lg"
                  >
                    <h4 className="text-sm font-medium text-foreground mb-1">
                      {submission.questId}
                    </h4>
                    <p className="text-xs text-muted-foreground m-0">
                      Status: {submission.status}
                    </p>
                    <p className="text-xs text-muted-foreground m-0">
                      Score: {submission.score || "Pending"}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🏆 Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard &&
                leaderboard.length > 0 &&
                leaderboard.slice(0, 5).map((entry) => (
                  <div
                    key={entry.user.id}
                    className="flex justify-between items-center p-3 bg-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-foreground min-w-8">
                        #{entry.rank}
                      </span>
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-1">
                          {entry.user.name}
                        </h4>
                        <p className="text-xs text-muted-foreground m-0">
                          {entry.points} points
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.achievementCount} achievements
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
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
