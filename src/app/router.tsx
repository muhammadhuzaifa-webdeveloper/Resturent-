import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ClientLayout } from './layouts/ClientLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { RequireAuth } from './guards/RequireAuth';
import { RequireRole } from './guards/RequireRole';
import { RouteErrorBoundary } from '@/components/error-boundary/RouteErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

// Suspense Fallback Loader
function PageLoader() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-6 max-w-5xl">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

// Lazy Loaded Auth Pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));

// Lazy Loaded Client Pages
const HomePage = lazy(() => import('@/pages/client/HomePage'));
const RestaurantsListPage = lazy(() => import('@/pages/client/RestaurantsListPage'));
const RestaurantDetailPage = lazy(() => import('@/pages/client/RestaurantDetailPage'));
const CheckoutPage = lazy(() => import('@/pages/client/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('@/pages/client/OrderSuccessPage'));
const MyOrdersPage = lazy(() => import('@/pages/client/MyOrdersPage'));
const OrderDetailPage = lazy(() => import('@/pages/client/OrderDetailPage'));
const ProfilePage = lazy(() => import('@/pages/client/ProfilePage'));

// Lazy Loaded Admin Pages
const AdminOverviewPage = lazy(() => import('@/pages/admin/AdminOverviewPage'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'));
const AdminMenuPage = lazy(() => import('@/pages/admin/AdminMenuPage'));
const AdminRestaurantsPage = lazy(() => import('@/pages/admin/AdminRestaurantsPage'));
const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminCustomersPage'));
const AdminApprovalsPage = lazy(() => import('@/pages/admin/AdminApprovalsPage'));
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));

// Lazy Loaded Fallbacks
const ForbiddenPage = lazy(() => import('@/pages/ForbiddenPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export const router = createBrowserRouter([
  // Public Auth Routes
  {
    path: '/auth/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/auth/register',
    element: (
      <Suspense fallback={<PageLoader />}>
        <RegisterPage />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/auth/forgot-password',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ForgotPasswordPage />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
  },

  // Client App Routes
  {
    path: '/',
    element: <ClientLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'restaurants',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RestaurantsListPage />
          </Suspense>
        ),
      },
      {
        path: 'restaurants/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <RestaurantDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'checkout',
        element: (
          <RequireAuth>
            <Suspense fallback={<PageLoader />}>
              <CheckoutPage />
            </Suspense>
          </RequireAuth>
        ),
      },
      {
        path: 'orders/:id/success',
        element: (
          <RequireAuth>
            <Suspense fallback={<PageLoader />}>
              <OrderSuccessPage />
            </Suspense>
          </RequireAuth>
        ),
      },
      {
        path: 'orders',
        element: (
          <RequireAuth>
            <Suspense fallback={<PageLoader />}>
              <MyOrdersPage />
            </Suspense>
          </RequireAuth>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <RequireAuth>
            <Suspense fallback={<PageLoader />}>
              <OrderDetailPage />
            </Suspense>
          </RequireAuth>
        ),
      },
      {
        path: 'profile',
        element: (
          <RequireAuth>
            <Suspense fallback={<PageLoader />}>
              <ProfilePage />
            </Suspense>
          </RequireAuth>
        ),
      },
    ],
  },

  // Admin Dashboard Routes (Strictly role-guarded)
  {
    path: '/admin',
    element: (
      <RequireAuth>
        <RequireRole role="admin">
          <AdminLayout />
        </RequireRole>
      </RequireAuth>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminOverviewPage />
          </Suspense>
        ),
      },
      {
        path: 'orders',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminOrdersPage />
          </Suspense>
        ),
      },
      {
        path: 'menu',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminMenuPage />
          </Suspense>
        ),
      },
      {
        path: 'restaurants',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminRestaurantsPage />
          </Suspense>
        ),
      },
      {
        path: 'customers',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminCustomersPage />
          </Suspense>
        ),
      },
      {
        path: 'admins',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminApprovalsPage />
          </Suspense>
        ),
      },
      {
        path: 'reports',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminReportsPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminSettingsPage />
          </Suspense>
        ),
      },
    ],
  },

  // Error Pages
  {
    path: '/403',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ForbiddenPage />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);
