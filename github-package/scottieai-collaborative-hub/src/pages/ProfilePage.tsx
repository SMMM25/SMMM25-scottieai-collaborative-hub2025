import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, User, KeyRound, Save } from 'lucide-react';
import { z } from 'zod';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updatePassword, updateProfile, signOut } = useAuth();
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Validation schemas
  const usernameSchema = z.string().min(3, 'Username must be at least 3 characters');
  const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Fetch user profile data
    const fetchProfile = async () => {
      try {
        // Simplified for build
        setUsername(user.email?.split('@')[0] || '');
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const validateUsername = (username: string) => {
    try {
      usernameSchema.parse(username);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, username: error.errors[0].message }));
      }
      return false;
    }
  };

  const validateNewPassword = (password: string) => {
    try {
      passwordSchema.parse(password);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, newPassword: error.errors[0].message }));
      }
      return false;
    }
  };

  const validateConfirmPassword = (password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return false;
    }
    return true;
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate inputs
    const isUsernameValid = validateUsername(username);
    
    if (!isUsernameValid) {
      return;
    }
    
    setIsLoading(true);
    await updateProfile({ username, avatar_url: avatarUrl });
    setIsLoading(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate inputs
    const isNewPasswordValid = validateNewPassword(newPassword);
    const isConfirmPasswordValid = validateConfirmPassword(newPassword, confirmPassword);
    
    if (!isNewPasswordValid || !isConfirmPasswordValid) {
      return;
    }
    
    setIsPasswordLoading(true);
    await updatePassword(newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <div className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </div>
        </Button>
        
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-4">
                  <User className="h-16 w-16 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-lg">{username || 'Set a username'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <User className="mr-2 h-4 w-4" />
                  Change Picture
                </Button>
              </CardFooter>
            </Card>
            
            <div>
              <Tabs defaultValue="profile">
                <TabsList className="mb-4">
                  <TabsTrigger value="profile">Profile Information</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your profile information
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleProfileUpdate}>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={user?.email || ''}
                            disabled
                          />
                          <p className="text-xs text-muted-foreground">
                            Email cannot be changed
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={username}
                            onChange={(e) => {
                              setUsername(e.target.value);
                              setErrors(prev => ({ ...prev, username: undefined }));
                            }}
                            className={errors.username ? "border-red-500" : ""}
                          />
                          {errors.username && (
                            <p className="text-xs text-red-500">{errors.username}</p>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          type="submit" 
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            "Saving..."
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </TabsContent>
                
                <TabsContent value="security">
                  <Card>
                    <CardHeader>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>
                        Update your password to keep your account secure
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={handlePasswordUpdate}>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => {
                              setNewPassword(e.target.value);
                              setErrors(prev => ({ ...prev, newPassword: undefined }));
                            }}
                            className={errors.newPassword ? "border-red-500" : ""}
                          />
                          {errors.newPassword && (
                            <p className="text-xs text-red-500">{errors.newPassword}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Password must be at least 6 characters
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                            }}
                            className={errors.confirmPassword ? "border-red-500" : ""}
                          />
                          {errors.confirmPassword && (
                            <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          type="submit" 
                          disabled={isPasswordLoading}
                        >
                          {isPasswordLoading ? (
                            "Updating..."
                          ) : (
                            <>
                              <KeyRound className="mr-2 h-4 w-4" />
                              Update Password
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
