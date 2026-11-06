import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Settings,
  User,
  KeyRound,
  Bell,
  Volume2,
  VolumeX,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header/PageHeader';
import {
  profileUpdateSchema,
  changePasswordSchema,
  type ProfileUpdateFormValues,
  type ChangePasswordFormValues,
} from '@/api/schemas';
import { authApi } from '@/api/endpoints';
import { useAuthStore } from '@/features/auth/authStore';
import { soundManager } from '@/lib/sound';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const { user, updateUser, clearAuth } = useAuthStore();
  const [soundMuted, setSoundMuted] = useState(soundManager.getMuted());
  const [pollInterval, setPollInterval] = useState('15');

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
    try {
      const res = await authApi.updateMe(values);
      updateUser(res.data);
      toast.success('Admin profile credentials updated');
    } catch {
      toast.error('Failed to update credentials');
    }
  };

  const onPasswordSubmit = async (values: ChangePasswordFormValues) => {
    try {
      await authApi.changePassword(values.currentPassword, values.newPassword);
      toast.success('Password changed successfully! You will be signed out.');
      resetPasswordForm();
      setTimeout(() => {
        clearAuth();
        window.location.href = '/auth/login';
      }, 2000);
    } catch {
      toast.error('Failed to change password. Verify your current password.');
    }
  };

  const toggleSound = (checked: boolean) => {
    const nextMuted = !checked;
    soundManager.setMuted(nextMuted);
    setSoundMuted(nextMuted);
    toast.info(nextMuted ? 'Order chimes muted' : 'Order chimes enabled');
  };

  // Mock Activity Log
  const activities = [
    { action: 'Admin Approval Granted', target: 'Usman Tariq', time: '10 mins ago' },
    { action: 'Order Status Transition', target: 'Order DF-9082 -> Preparing', time: '28 mins ago' },
    { action: 'Catalog Updated', target: 'Chicken Biryani price updated', time: '2 hours ago' },
    { action: 'Admin Login', target: 'Successful session established', time: '4 hours ago' },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Admin Settings & Profile"
        description="Configure operational alerts, personal administrator credentials, and review activity audit logs"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Settings' }]}
      />

      <div className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Administrator Profile
            </CardTitle>
            <CardDescription className="text-xs">
              Manage your display name and official restaurant phone number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input
                  id="admin-email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted text-muted-foreground"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-name">Full Name</Label>
                  <Input
                    id="admin-name"
                    {...registerProfile('name')}
                    error={!!profileErrors.name}
                  />
                  {profileErrors.name && (
                    <p className="text-xs text-destructive">{profileErrors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-phone">Contact Phone</Label>
                  <Input
                    id="admin-phone"
                    placeholder="+92 300 1234567"
                    {...registerProfile('phone')}
                    error={!!profileErrors.phone}
                  />
                </div>
              </div>

              <Button type="submit" size="sm" disabled={isProfileSubmitting}>
                {isProfileSubmitting ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notification & Sound Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Notification & Alert Settings
            </CardTitle>
            <CardDescription className="text-xs">
              Control audio chimes and live polling frequencies for incoming orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 border rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  {!soundMuted ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </div>
                <div>
                  <Label className="font-semibold text-sm">Order Bell Sound Chime</Label>
                  <p className="text-xs text-muted-foreground">
                    Play a two-tone kitchen chime whenever a new order is received
                  </p>
                </div>
              </div>
              <Switch
                checked={!soundMuted}
                onCheckedChange={toggleSound}
                aria-label="Toggle sound chime"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 border rounded-xl">
              <div>
                <Label className="font-semibold text-sm">Order Polling Interval</Label>
                <p className="text-xs text-muted-foreground">
                  Frequency for querying background kitchen tickets (Default: 15s)
                </p>
              </div>
              <span className="text-xs font-bold bg-muted px-2.5 py-1 rounded-md">
                Every 15 Seconds
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              Change Administrator Password
            </CardTitle>
            <CardDescription className="text-xs">
              Updating your password immediately signs out all sessions per security protocol
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                All active administrator logins will be invalidated once you update your credentials.
              </span>
            </div>

            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="cur-pass">Current Password</Label>
                <Input
                  id="cur-pass"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="n-pass">New Password</Label>
                  <Input
                    id="n-pass"
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
                  <Label htmlFor="c-pass">Confirm New Password</Label>
                  <Input
                    id="c-pass"
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
              </div>

              <Button type="submit" size="sm" disabled={isPasswordSubmitting}>
                {isPasswordSubmitting ? 'Updating...' : 'Update Password & Sign Out'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Activity Log Audit Trail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Security & Activity Log
            </CardTitle>
            <CardDescription className="text-xs">
              Recent events conducted by this administrative session
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border/60 text-xs">
            {activities.map((act, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{act.action}</p>
                  <p className="text-[11px] text-muted-foreground">{act.target}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">{act.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
