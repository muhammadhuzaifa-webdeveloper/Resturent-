import React, { useState } from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertTriangle, Copy, Check, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomAppError {
  message?: string;
  requestId?: string;
  status?: number;
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  const [copied, setCopied] = useState(false);

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred while loading this section.';
  let requestId: string | undefined;

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? 'Page Not Found' : `Error ${error.status}`;
    message = error.statusText || error.data?.message || message;
    requestId = error.data?.requestId;
  } else if (error instanceof Error) {
    message = error.message;
    const custom = error as unknown as CustomAppError;
    requestId = custom.requestId;
  } else if (typeof error === 'object' && error !== null) {
    const custom = error as CustomAppError;
    if (custom.message) message = custom.message;
    requestId = custom.requestId;
  }

  const handleCopyRequestId = () => {
    if (!requestId) return;
    navigator.clipboard.writeText(requestId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 mb-4">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>

        {requestId && (
          <div className="mb-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Error ID: <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">{requestId}</code></span>
            <button
              onClick={handleCopyRequestId}
              className="inline-flex items-center gap-1 hover:text-foreground text-primary transition-colors focus:outline-none"
              title="Copy Error ID for support"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
