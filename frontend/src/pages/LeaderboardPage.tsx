import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { leaderboardService } from "@/services/leaderboard";
import { LeaderboardEntry, LeaderboardFilters } from "@/types";

export const LeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeaderboardFilters>({
    page: 1,
    limit: 50,
    timeRange: "all",
  });

  useEffect(() => {
    loadLeaderboard();
    loadTopUsers();
  }, [filters]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await leaderboardService.getLeaderboard(filters);
      setLeaderboard(response.data);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopUsers = async () => {
    try {
      const topUsersData = await leaderboardService.getTopUsers(10);
      setTopUsers(topUsersData);
    } catch (error) {
      console.error("Failed to load top users:", error);
    }
  };

  const handleTimeRangeChange = (
    timeRange: "all" | "week" | "month" | "year",
  ) => {
    setFilters((prev) => ({ ...prev, timeRange, page: 1 }));
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return "📈";
    if (change < 0) return "📉";
    return "➡️";
  };

  const getRankChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-muted rounded animate-pulse"
                    >
                      <div className="h-8 w-8 bg-muted rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/2 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-3 bg-muted rounded animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>

        {/* Time Range Filter */}
        <div className="flex gap-2 mb-6">
          {(["all", "week", "month", "year"] as const).map((timeRange) => (
            <Button
              key={timeRange}
              variant={filters.timeRange === timeRange ? "default" : "outline"}
              size="sm"
              onClick={() => handleTimeRangeChange(timeRange)}
            >
              {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Leaderboard */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏆 Leaderboard
                <Badge variant="outline">
                  {filters.timeRange.charAt(0).toUpperCase() +
                    filters.timeRange.slice(1)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      index === 0
                        ? "bg-yellow-50 border border-yellow-200"
                        : index === 1
                          ? "bg-gray-50 border border-gray-200"
                          : index === 2
                            ? "bg-orange-50 border border-orange-200"
                            : "bg-secondary"
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      {entry.rank}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          {entry.user.email.split("@")[0]}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {entry.user.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{entry.points} points</span>
                        <span>{entry.achievementCount} achievements</span>
                        <span>{entry.totalReward} total rewards</span>
                      </div>
                    </div>

                    {/* Rank Change */}
                    <div
                      className={`flex items-center gap-1 text-sm ${getRankChangeColor(entry.rankChange)}`}
                    >
                      <span>{getRankChangeIcon(entry.rankChange)}</span>
                      <span>{Math.abs(entry.rankChange)}</span>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-1">
                      {entry.badges.slice(0, 2).map((badge, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                      {entry.badges.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{entry.badges.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Users Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🥇 Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topUsers &&
                  topUsers.length > 0 &&
                  topUsers.slice(0, 5).map((entry, index) => (
                    <div
                      key={entry.user.id}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                              ? "bg-gray-500"
                              : index === 2
                                ? "bg-orange-500"
                                : "bg-primary"
                        }`}
                      >
                        {entry.rank}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">
                          {entry.user.email.split("@")[0]}
                        </h4>
                        <div className="text-xs text-muted-foreground">
                          {entry.points} points • {entry.achievementCount}{" "}
                          achievements
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>📊 Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Total Users:</span>
                  <span className="font-semibold">{leaderboard.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Points:</span>
                  <span className="font-semibold">
                    {Math.round(
                      leaderboard.reduce(
                        (acc, entry) => acc + entry.points,
                        0,
                      ) / leaderboard.length,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Highest Score:</span>
                  <span className="font-semibold">
                    {leaderboard.length > 0
                      ? Math.max(...leaderboard.map((e) => e.points))
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Achievements:</span>
                  <span className="font-semibold">
                    {leaderboard.reduce(
                      (acc, entry) => acc + entry.achievementCount,
                      0,
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
