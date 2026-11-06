import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/authStore';

export default function ForbiddenPage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            403 - Access Forbidden
          </h1>
          <p className="text-sm text-muted-foreground">
            You do not have administrative privileges to view this page.
            {user?.role === 'client' && ' Your account has client access only.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button asChild>
            <Link to={user?.role === 'admin' ? '/admin' : '/'}>
              <Home className="mr-2 h-4 w-4" />
              {user?.role === 'admin' ? 'Admin Dashboard' : 'Client Homepage'}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
