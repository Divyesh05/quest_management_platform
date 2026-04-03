import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { authService } from "@/services/auth";
import { achievementService } from "@/services/achievement";
import { User, Achievement } from "@/types";

export const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadProfile();
    loadAchievements();
  }, []);

  const loadProfile = async () => {
    try {
      const userData = authService.getStoredUser();
      if (userData) {
        setUser(userData);
        setFormData((prev) => ({ ...prev, email: userData.email }));
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAchievements = async () => {
    try {
      const response = await achievementService.getMyAchievements({
        limit: 10,
      });
      setAchievements(response.data || []);
    } catch (error) {
      console.error("Failed to load achievements:", error);
      setAchievements([]); // Set empty array on error
    }
  };

  const handleUpdateProfile = async () => {
    try {
      if (formData.email !== user?.email) {
        await authService.updateProfile({ email: formData.email });
        await loadProfile(); // Reload to get updated user data
        setEditing(false);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    try {
      await authService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      alert("Password changed successfully!");
    } catch (error) {
      console.error("Failed to change password:", error);
      alert("Failed to change password. Please check your current password.");
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
          <Button onClick={() => (window.location.href = "/login")}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-2">Profile</CardTitle>
                <div className="flex gap-2">
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                  >
                    {user.role}
                  </Badge>
                  <Badge variant="outline">
                    Level {Math.floor(user.points / 100) + 1}
                  </Badge>
                </div>
              </div>
              <Button variant="destructive" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Account Info</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {user.email}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Member Since:</span>{" "}
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Updated:</span>{" "}
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Statistics</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Points:</span>{" "}
                    <span className="font-bold text-green-600">
                      {user.points}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Achievements:</span>{" "}
                    {achievements?.length || 0}
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Current Level:
                    </span>{" "}
                    {Math.floor(user?.points / 100) + 1}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Next Level:</span>{" "}
                    {100 - (user?.points % 100)} points
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Progress</h3>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Level Progress</span>
                      <span>{user?.points % 100}/100</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${user?.points % 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Edit Profile</CardTitle>
              <Button variant="outline" onClick={() => setEditing(!editing)}>
                {editing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button onClick={handleUpdateProfile}>Update Profile</Button>
              </div>
            ) : (
              <div className="text-muted-foreground">
                Click "Edit" to update your profile information.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={
                  !formData.currentPassword ||
                  !formData.newPassword ||
                  !formData.confirmPassword
                }
              >
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            {achievements?.length > 0 ? (
              <div className="space-y-3">
                {achievements?.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 p-3 bg-secondary rounded-lg"
                  >
                    <div className="text-2xl">🏆</div>
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {achievement.quest.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Earned on{" "}
                        {new Date(achievement.earnedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {achievement.quest.difficulty}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold mb-2">
                  No achievements yet
                </h3>
                <p className="text-muted-foreground">
                  Start completing quests to earn your first achievements!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
