import React from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, Info } from 'lucide-react';
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

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your email address to receive password recovery instructions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-3.5 flex items-start gap-3 border text-xs text-muted-foreground">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Feature coming soon</p>
              <p className="mt-0.5">
                Automated password reset via email is currently under development. To reset your
                credentials, please contact your restaurant system administrator directly.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 opacity-60">
            <Label htmlFor="forgot-email">Account Email</Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="you@example.com"
              disabled
            />
          </div>

          <Button className="w-full" disabled>
            Send Reset Link (Coming Soon)
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center border-t py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/auth/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
