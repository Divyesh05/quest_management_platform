import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { questService } from '../services/quest';
import { submissionService } from '../services/submission';
import { Quest, Submission } from '../types';

export const QuestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [userSubmission, setUserSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const loadingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadUserSubmission = useCallback(async (questId: string) => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      const response = await submissionService.getMySubmissions({
        questId,
        limit: 1,
      });
      if (response.data.length > 0) {
        setUserSubmission(response.data[0]);
      }
    } catch (error: any) {
      console.error('Failed to load user submission:', error);
      // Don't show toast for 429 errors here to avoid spam
      if (error.response?.status !== 429) {
        // Optional: Add toast notification here if needed
      }
    } finally {
      loadingRef.current = false;
    }
  }, []);

  const loadQuest = async (questId: string) => {
    try {
      const questData = await questService.getQuestById(questId);
      setQuest(questData);
    } catch (error) {
      console.error('Failed to load quest:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadQuest(id);
      
      // Debounce the submission loading to prevent rapid API calls
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        loadUserSubmission(id);
      }, 300); // 300ms delay
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [id, loadUserSubmission]);

  const handleSubmitSubmission = async () => {
    if (!quest || !submissionContent.trim()) return;

    try {
      setSubmitting(true);
      const submission = await submissionService.createSubmission({
        questId: quest.id,
        content: submissionContent,
      });
      setUserSubmission(submission);
      setSubmissionContent('');
    } catch (error) {
      console.error('Failed to submit quest:', error);
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-4 bg-muted rounded w-4/6"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Quest not found</h2>
          <Link to="/quests">
            <Button>Back to Quests</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-2">{quest.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge className={getDifficultyColor(quest.difficulty)}>
                    {quest.difficulty}
                  </Badge>
                  <Badge variant="outline">{quest.category}</Badge>
                  <Badge variant={quest.isActive ? 'default' : 'secondary'}>
                    {quest.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {quest.reward} pts
                </div>
                <div className="text-sm text-muted-foreground">
                  Reward
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="prose max-w-none mb-8">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {quest.description}
              </p>
            </div>

            {/* User's Submission */}
            {userSubmission ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Submission</CardTitle>
                  <Badge className={getStatusColor(userSubmission.status)}>
                    {userSubmission.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {userSubmission.content}
                    </p>
                  </div>
                  
                  {userSubmission.feedback && (
                    <div className="mb-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Feedback:</h4>
                      <p className="text-muted-foreground">{userSubmission.feedback}</p>
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    Submitted: {new Date(userSubmission.submittedAt).toLocaleDateString()}
                    {userSubmission.reviewedAt && (
                      <span>
                        {' • Reviewed: '}{new Date(userSubmission.reviewedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Submission Form */
              quest.isActive && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Submit Quest</CardTitle>
                    <p className="text-muted-foreground">
                      Complete this quest by submitting your work below.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="submission" className="block text-sm font-medium mb-2">
                          Your Submission
                        </label>
                        <Textarea
                          id="submission"
                          placeholder="Describe your work, include links, screenshots, or any relevant information..."
                          value={submissionContent}
                          onChange={(e) => setSubmissionContent(e.target.value)}
                          rows={6}
                        />
                      </div>
                      
                      <Button
                        onClick={handleSubmitSubmission}
                        disabled={!submissionContent.trim() || submitting}
                        className="w-full"
                      >
                        {submitting ? 'Submitting...' : 'Submit Quest'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            )}

            {/* Quest Info */}
            <div className="mt-8 pt-8 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(quest.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>{' '}
                  {new Date(quest.updatedAt).toLocaleDateString()}
                </div>
                {quest.createdByUser && (
                  <div>
                    <span className="font-medium">Created By:</span> {quest.createdByUser.email}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
