import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'react-hot-toast';
import { questService } from '../services/quest';
import { CreateQuestData } from '../types';

export const QuestCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateQuestData>({
    title: '',
    description: '',
    reward: 0,
    difficulty: 'Easy',
    category: '',
  });

  const categories = [
    'Programming',
    'Design',
    'Marketing',
    'Writing',
    'Research',
    'Data Analysis',
    'Testing',
    'Documentation',
    'Other'
  ];

  const difficulties = [
    { value: 'Easy', label: 'Easy' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Hard', label: 'Hard' }
  ];

  const handleInputChange = (field: keyof CreateQuestData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFillDemoData = () => {
    setFormData({
      title: 'Build a React Component Library',
      description: 'Create a reusable component library using React and TypeScript. The library should include common UI components like buttons, inputs, cards, and modals. Focus on accessibility, documentation, and ease of use. Include proper TypeScript definitions and Storybook stories for each component.',
      reward: 150,
      difficulty: 'Medium',
      category: 'Programming',
    });
    toast.success('Demo data filled!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.category.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.reward <= 0) {
      toast.error('Reward must be greater than 0');
      return;
    }

    setIsLoading(true);

    try {
      await questService.createQuest(formData);
      toast.success('Quest created successfully!');
      navigate('/admin');
    } catch (error: any) {
      console.error('Failed to create quest:', error);
      toast.error(error?.message || 'Failed to create quest. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create New Quest</h1>
        <p className="text-muted-foreground">
          Fill in the details below to create a new quest for users to complete.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quest Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter quest title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Enter quest description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
                disabled={isLoading}
                rows={4}
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                disabled={isLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <Label htmlFor="difficulty">Difficulty *</Label>
              <select
                id="difficulty"
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value as 'Easy' | 'Medium' | 'Hard')}
                disabled={isLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reward */}
            <div>
              <Label htmlFor="reward">Reward Points *</Label>
              <Input
                id="reward"
                type="number"
                placeholder="Enter reward points"
                value={formData.reward}
                onChange={(e) => handleInputChange('reward', parseInt(e.target.value) || 0)}
                required
                disabled={isLoading}
                min="1"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleFillDemoData}
                disabled={isLoading}
                className="flex-1"
              >
                Fill Demo Data
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Creating...' : 'Create Quest'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
