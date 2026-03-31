import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { questService } from '@/services/quest';
import { submissionService } from '@/services/submission';
import { authService } from '@/services/auth';
import { Quest, Submission, User } from '@/types';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuests: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    rejectedSubmissions: 0,
  });
  const [recentQuests, setRecentQuests] = useState<Quest[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = authService.getStoredUser();
    setUser(userData);
    
    if (userData?.role === 'admin') {
      loadAdminData();
    }
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load quests and submissions
      const [questsResponse, submissionsResponse] = await Promise.all([
        questService.getQuests({ limit: 5 }),
        submissionService.getSubmissions({ status: 'pending', limit: 5 }),
      ]);

      setRecentQuests(questsResponse.data);
      setPendingSubmissions(submissionsResponse.data);

      // Calculate stats (simplified - in real app you'd have dedicated stats endpoints)
      const allSubmissions = await submissionService.getSubmissions();
      const approved = allSubmissions.data.filter(s => s.status === 'approved').length;
      const rejected = allSubmissions.data.filter(s => s.status === 'rejected').length;
      const pending = allSubmissions.data.filter(s => s.status === 'pending').length;

      setStats({
        totalUsers: 0, // Would need user service
        totalQuests: questsResponse.total,
        totalSubmissions: allSubmissions.total,
        pendingSubmissions: pending,
        approvedSubmissions: approved,
        rejectedSubmissions: rejected,
      });
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access this page.
          </p>
          <Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage quests, review submissions, and monitor platform activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Quests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuests}</div>
            <p className="text-xs text-muted-foreground">Active quests on platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">All time submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approval Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalSubmissions > 0 
                ? Math.round((stats.approvedSubmissions / stats.totalSubmissions) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.approvedSubmissions} approved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link to="/admin/quests/create">
                <Button className="w-full">Create New Quest</Button>
              </Link>
              <Link to="/submissions?status=pending">
                <Button variant="outline" className="w-full">
                  Review Pending Submissions
                </Button>
              </Link>
              <Link to="/admin/users">
                <Button variant="outline" className="w-full">
                  Manage Users
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Quests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentQuests.slice(0, 3).map((quest) => (
                <div key={quest.id} className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium">{quest.title}</h4>
                    <div className="flex gap-1">
                      <Badge className={getDifficultyColor(quest.difficulty)} variant="outline">
                        {quest.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {quest.category}
                      </Badge>
                    </div>
                  </div>
                  <Link to={`/quests/${quest.id}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </div>
              ))}
            </div>
            <Link to="/quests" className="block mt-4">
              <Button variant="outline" className="w-full">View All Quests</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingSubmissions.slice(0, 3).map((submission) => (
                <div key={submission.id} className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium">{submission.quest.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      by {submission.user.email}
                    </p>
                  </div>
                  <Link to={`/submissions/${submission.id}`}>
                    <Button size="sm" variant="outline">Review</Button>
                  </Link>
                </div>
              ))}
            </div>
            {pendingSubmissions.length > 0 && (
              <Link to="/submissions?status=pending" className="block mt-4">
                <Button variant="outline" className="w-full">
                  Review All ({stats.pendingSubmissions})
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.approvedSubmissions}
              </div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.rejectedSubmissions}
              </div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pendingSubmissions}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats.totalSubmissions}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
