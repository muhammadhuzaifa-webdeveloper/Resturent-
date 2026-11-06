import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
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
import { registerSchema, type RegisterFormValues } from '@/api/schemas';
import { authApi } from '@/api/endpoints';
import { useAuthStore } from '@/features/auth/authStore';
import { AppApiError } from '@/api/client';
import { toast } from 'sonner';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [adminRegisteredSuccess, setAdminRegisteredSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'client',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      const res = await authApi.register(values);

      if (values.role === 'admin') {
        // Admin registration does not log in automatically. Dedicated success screen:
        setAdminRegisteredSuccess(true);
      } else {
        // Client signup logs in directly if accessToken returned
        if (res.data.accessToken) {
          setAuth(res.data.user, res.data.accessToken);
          toast.success('Account created successfully! Welcome to DineFlow.');
          navigate('/', { replace: true });
        } else {
          toast.success('Registration successful. Please sign in.');
          navigate('/auth/login', { replace: true });
        }
      }
    } catch (err) {
      if (err instanceof AppApiError) {
        // Map backend 422 field details onto react-hook-form fields
        if (err.details && Array.isArray(err.details)) {
          err.details.forEach((item) => {
            setError(item.field as keyof RegisterFormValues, {
              type: 'server',
              message: item.message,
            });
          });
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError('Registration failed. Please check the form and try again.');
      }
    }
  };

  // Dedicated Admin Awaiting Approval Screen after successful registration
  if (adminRegisteredSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
        <Card className="max-w-md w-full shadow-lg border-emerald-200 dark:border-emerald-900/50">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mb-3">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground">
              Registration Request Received
            </CardTitle>
            <CardDescription className="pt-2 text-sm text-foreground">
              Your account is awaiting approval from an existing admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground text-center pt-2">
            <div className="flex items-center gap-2 p-3 bg-muted/60 rounded-lg text-xs text-left">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span>
                Under restaurant security policies, newly registered admin accounts cannot log in
                until an active manager verifies and approves them.
              </span>
            </div>
            <p className="text-xs">
              Once approved, you will be able to log in with your email and password to access the
              admin operations board.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-2">
            <Button className="w-full" onClick={() => navigate('/auth/login')}>
              Return to Login
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
            Create an Account
          </CardTitle>
          <CardDescription>
            Join DineFlow as a hungry foodie or a restaurant staff member
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Role Toggle Switch */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl mb-5">
            <button
              type="button"
              onClick={() => setValue('role', 'client')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedRole === 'client'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserCheck className="h-4 w-4 text-emerald-600" />
              Customer / Client
            </button>
            <button
              type="button"
              onClick={() => setValue('role', 'admin')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedRole === 'admin'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-primary" />
              Restaurant Admin
            </button>
          </div>

          {selectedRole === 'admin' && (
            <div className="mb-4 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <Clock className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                Note: Admin accounts require authorization from an existing admin before login.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            {serverError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2.5 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="e.g. Ali Khan"
                {...register('name')}
                error={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                error={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                placeholder="e.g. +92 300 1234567"
                {...register('phone')}
                error={!!errors.phone}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password (8 to 72 characters)</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full font-semibold h-10 mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : `Sign Up as ${selectedRole === 'admin' ? 'Admin' : 'Customer'}`}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t py-4 text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link to="/auth/login" className="ml-1 text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
