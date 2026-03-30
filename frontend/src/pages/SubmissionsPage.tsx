import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { submissionService } from '@/services/submission';
import { authService } from '@/services/auth';
import { Submission, User } from '@/types';

export const SubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = authService.getStoredUser();
    setUser(userData);
    loadSubmissions(userData);
  }, []);

  const loadSubmissions = async (userData: User | null) => {
    try {
      setLoading(true);
      if (userData?.role === 'admin') {
        const response = await submissionService.getSubmissions();
        setSubmissions(response.data);
      } else {
        const response = await submissionService.getMySubmissions();
        setSubmissions(response.data);
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmission = async (submissionId: string, status: 'approved' | 'rejected') => {
    if (!feedback.trim()) {
      alert('Please provide feedback before reviewing.');
      return;
    }

    try {
      setReviewing(submissionId);
      await submissionService.reviewSubmission(submissionId, { status, feedback });
      
      // Reload submissions
      const userData = authService.getStoredUser();
      await loadSubmissions(userData);
      
      setFeedback('');
      alert(`Submission ${status} successfully!`);
    } catch (error) {
      console.error('Failed to review submission:', error);
      alert('Failed to review submission. Please try again.');
    } finally {
      setReviewing(null);
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

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2 animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse"></div>
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
        <h1 className="text-3xl font-bold mb-2">
          {user?.role === 'admin' ? 'All Submissions' : 'My Submissions'}
        </h1>
        <p className="text-muted-foreground">
          {user?.role === 'admin' 
            ? 'Review and manage all user submissions'
            : 'Track your quest submissions and their status'
          }
        </p>
      </div>

      {submissions.length > 0 ? (
        <div className="space-y-6">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg mb-2">
                      <Link to={`/quests/${submission.questId}`} className="hover:text-primary">
                        {submission.quest.title}
                      </Link>
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status}
                      </Badge>
                      <Badge variant="outline">
                        {submission.quest.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        {submission.quest.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {submission.quest.reward} pts
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {submission.quest.reward * (submission.status === 'approved' ? 1 : 0)} earned
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Submission Content */}
                  <div>
                    <h4 className="font-semibold mb-2">Submission:</h4>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {submission.content || 'No content provided'}
                      </p>
                    </div>
                  </div>

                  {/* Feedback (if available) */}
                  {submission.feedback && (
                    <div>
                      <h4 className="font-semibold mb-2">Feedback:</h4>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {submission.feedback}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Admin Review Section */}
                  {user?.role === 'admin' && submission.status === 'pending' && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">Review Submission:</h4>
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Provide feedback for this submission..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleReviewSubmission(submission.id, 'approved')}
                            disabled={reviewing === submission.id}
                            variant="default"
                          >
                            {reviewing === submission.id ? 'Reviewing...' : 'Approve'}
                          </Button>
                          <Button
                            onClick={() => handleReviewSubmission(submission.id, 'rejected')}
                            disabled={reviewing === submission.id}
                            variant="destructive"
                          >
                            {reviewing === submission.id ? 'Reviewing...' : 'Reject'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submission Info */}
                  <div className="text-sm text-muted-foreground border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Submitted by:</span> {submission.user.email}
                      </div>
                      <div>
                        <span className="font-medium">Submitted:</span>{' '}
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </div>
                      {submission.reviewedAt && (
                        <>
                          <div>
                            <span className="font-medium">Reviewed:</span>{' '}
                            {new Date(submission.reviewedAt).toLocaleDateString()}
                          </div>
                          {submission.reviewedBy && (
                            <div>
                              <span className="font-medium">Reviewed by:</span> {submission.reviewedBy}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">
            {user?.role === 'admin' ? 'No submissions found' : 'No submissions yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {user?.role === 'admin' 
              ? 'There are no submissions to review at this time.'
              : 'Start completing quests to see your submissions here.'
            }
          </p>
          {user?.role !== 'admin' && (
            <Link to="/quests">
              <Button>Browse Quests</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
