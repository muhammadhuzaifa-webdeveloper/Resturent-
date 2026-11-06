import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  UtensilsCrossed,
  Clock,
  ShieldX,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { loginSchema, type LoginFormValues } from '@/api/schemas';
import { authApi } from '@/api/endpoints';
import { useAuthStore } from '@/features/auth/authStore';
import { AppApiError } from '@/api/client';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '';

  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [pendingApprovalScreen, setPendingApprovalScreen] = useState(false);
  const [rejectedScreen, setRejectedScreen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const res = await authApi.login(values);
      const { user, accessToken } = res.data;

      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.name}!`);

      if (redirectUrl) {
        navigate(decodeURIComponent(redirectUrl), { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      if (err instanceof AppApiError) {
        if (err.code === 'ADMIN_PENDING_APPROVAL') {
          setPendingApprovalScreen(true);
          return;
        }
        if (err.code === 'ADMIN_REJECTED') {
          setRejectedScreen(true);
          return;
        }
        setServerError(err.message);
      } else {
        setServerError('Unable to sign in. Please verify your credentials and try again.');
      }
    }
  };

  // Dedicated Screen for ADMIN_PENDING_APPROVAL
  if (pendingApprovalScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
        <Card className="max-w-md w-full shadow-lg border-amber-200 dark:border-amber-900/50">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 mb-3">
              <Clock className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">
              Account Awaiting Approval
            </CardTitle>
            <CardDescription className="pt-2 text-sm">
              Your administrator account is registered and currently in the review queue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground text-center pt-2">
            <p>
              Under our restaurant security protocol, a super administrator must approve your
              account before access is granted.
            </p>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300 text-left border border-amber-200/60 dark:border-amber-800/60">
              💡 <strong>Tip for Demo Testing:</strong> You can sign in with the pre-approved
              super admin account: <code>admin@dineflow.pk</code> (any password).
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                setPendingApprovalScreen(false);
                setServerError(null);
              }}
            >
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Dedicated Screen for ADMIN_REJECTED
  if (rejectedScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
        <Card className="max-w-md w-full shadow-lg border-rose-200 dark:border-rose-900/50">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 mb-3">
              <ShieldX className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">
              Registration Request Declined
            </CardTitle>
            <CardDescription className="pt-2 text-sm text-destructive font-medium">
              Your administrator application was not approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground text-center pt-2">
            <p>
              Your account access has been restricted by management. If you believe this is in
              error, please speak directly to the restaurant head office.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                setRejectedScreen(false);
                setServerError(null);
              }}
            >
              Sign in with another account
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-2 shadow">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welcome to DineFlow
          </CardTitle>
          <CardDescription>
            Sign in to order food or manage restaurant operations
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
                error={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  {...register('password')}
                  error={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full font-semibold h-10"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Quick Mock Login Helper for Demo */}
          <div className="mt-6 pt-4 border-t text-xs text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground">Demo Accounts:</p>
            <div className="flex flex-col gap-1 text-[11px]">
              <div>
                <span className="font-medium text-primary">Super Admin:</span>{' '}
                <code>admin@dineflow.pk</code> (Full dashboard)
              </div>
              <div>
                <span className="font-medium text-emerald-600">Client:</span>{' '}
                <code>zainab.ahmed@example.pk</code> (Browse & Order)
              </div>
              <div>
                <span className="font-medium text-amber-600">Pending Admin:</span>{' '}
                <code>usman.tariq@dineflow.pk</code> (Shows Pending state)
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center border-t py-4 text-xs text-muted-foreground">
          Don't have an account?{' '}
          <Link
            to="/auth/register"
            className="ml-1 text-primary font-semibold hover:underline"
          >
            Create an account
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
