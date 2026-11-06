import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  User,
  KeyRound,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  profileUpdateSchema,
  changePasswordSchema,
  type ProfileUpdateFormValues,
  type ChangePasswordFormValues,
} from '@/api/schemas';
import { authApi } from '@/api/endpoints';
import { useAuthStore } from '@/features/auth/authStore';
import { toast } from 'sonner';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, clearAuth } = useAuthStore();

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  });

  // Change Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (values: ProfileUpdateFormValues) => {
    setProfileSuccess(false);
    try {
      const res = await authApi.updateMe(values);
      updateUser(res.data);
      setProfileSuccess(true);
      toast.success('Profile details updated successfully');
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      toast.error('Failed to update profile details');
    }
  };

  const onPasswordSubmit = async (values: ChangePasswordFormValues) => {
    setPasswordSuccess(false);
    try {
      await authApi.changePassword(values.currentPassword, values.newPassword);
      setPasswordSuccess(true);
      toast.success('Password changed successfully! You will be signed out.');
      resetPasswordForm();

      // Backend signs out all sessions afterwards per contract!
      setTimeout(() => {
        clearAuth();
        navigate('/auth/login', { replace: true });
      }, 2000);
    } catch {
      toast.error('Failed to change password. Please check your current password.');
    }
  };

  const handleLogout = () => {
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="container mx-auto px-4 max-w-3xl py-8 space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Account & Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your contact credentials and security preferences
        </p>
      </div>

      <div className="space-y-8">
        {/* Profile Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your name and primary phone number used for delivery contact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-email">Email Address</Label>
                <div className="relative">
                  <Input
                    id="profile-email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted pl-9 text-muted-foreground"
                  />
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Email address is linked to your login identity and cannot be changed.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profile-name">Full Name</Label>
                <Input
                  id="profile-name"
                  {...registerProfile('name')}
                  error={!!profileErrors.name}
                />
                {profileErrors.name && (
                  <p className="text-xs text-destructive">{profileErrors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profile-phone">Contact Phone</Label>
                <div className="relative">
                  <Input
                    id="profile-phone"
                    placeholder="+92 300 1234567"
                    {...registerProfile('phone')}
                    error={!!profileErrors.phone}
                    className="pl-9"
                  />
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
                {profileErrors.phone && (
                  <p className="text-xs text-destructive">{profileErrors.phone.message}</p>
                )}
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button type="submit" disabled={isProfileSubmitting}>
                  {isProfileSubmitting ? 'Saving...' : 'Save Profile Changes'}
                </Button>
                {profileSuccess && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> Saved!
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your account password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Critical requirement: Explain that changing password signs user out everywhere */}
            <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Important Notice:</strong> For your security, changing your password
                will immediately invalidate your session and log you out from all devices. You
                will need to log in again with your new password.
              </span>
            </div>

            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current-pw">Current Password</Label>
                <Input
                  id="current-pw"
                  type="password"
                  placeholder="••••••••"
                  {...registerPassword('currentPassword')}
                  error={!!passwordErrors.currentPassword}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-destructive">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-pw">New Password (8-72 characters)</Label>
                <Input
                  id="new-pw"
                  type="password"
                  placeholder="••••••••"
                  {...registerPassword('newPassword')}
                  error={!!passwordErrors.newPassword}
                />
                {passwordErrors.newPassword && (
                  <p className="text-xs text-destructive">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-pw">Confirm New Password</Label>
                <Input
                  id="confirm-pw"
                  type="password"
                  placeholder="••••••••"
                  {...registerPassword('confirmPassword')}
                  error={!!passwordErrors.confirmPassword}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button type="submit" variant="default" disabled={isPasswordSubmitting}>
                  {isPasswordSubmitting ? 'Updating Password...' : 'Update Password & Sign Out Everywhere'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Sign Out Card */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </CardTitle>
            <CardDescription>
              Terminate your session on this browser
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="destructive" size="sm" onClick={handleLogout}>
              Sign Out from Account
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
