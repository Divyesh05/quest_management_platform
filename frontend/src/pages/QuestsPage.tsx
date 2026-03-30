import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { questService } from '@/services/quest';
import { Quest, QuestFilters } from '@/types';

export const QuestsPage: React.FC = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<QuestFilters>({
    page: 1,
    limit: 12,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  useEffect(() => {
    loadQuests();
  }, [filters]);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const response = await questService.getQuests(filters);
      setQuests(response.data);
    } catch (error) {
      console.error('Failed to load quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, search: value || undefined, page: 1 }));
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    setFilters(prev => ({ 
      ...prev, 
      category: category || undefined, 
      page: 1 
    }));
  };

  const handleDifficultyFilter = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    setFilters(prev => ({ 
      ...prev, 
      difficulty: difficulty as 'easy' | 'medium' | 'hard' || undefined, 
      page: 1 
    }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <Skeleton className="h-4 w-1/4" />
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
        <h1 className="text-3xl font-bold mb-6">Available Quests</h1>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Search quests..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="">All Categories</option>
            <option value="education">Education</option>
            <option value="development">Development</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
          </select>
          
          <select
            value={selectedDifficulty}
            onChange={(e) => handleDifficultyFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Quest Grid */}
      {quests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests.map((quest) => (
            <Card key={quest.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{quest.title}</CardTitle>
                  <div className="text-lg font-bold text-green-600">
                    {quest.reward} pts
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {quest.description}
                </p>
                
                <div className="flex justify-between items-center mb-4">
                  <Badge className={getDifficultyColor(quest.difficulty)}>
                    {quest.difficulty}
                  </Badge>
                  <Badge variant="outline">
                    {quest.category}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {quest.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Link to={`/quests/${quest.id}`}>
                    <Button size="sm">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No quests found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or check back later for new quests.
          </p>
        </div>
      )}
    </div>
  );
};
