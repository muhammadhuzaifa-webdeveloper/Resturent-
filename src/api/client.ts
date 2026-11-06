import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/features/auth/authStore';
import type { ApiErrorResponse } from './types';
import { handleMockRequest } from './mockAdapter';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true' || import.meta.env.VITE_USE_MOCKS === true;

export class AppApiError extends Error {
  code: string;
  requestId?: string;
  details?: Array<{ field: string; message: string }>;
  status: number;

  constructor(
    message: string,
    code = 'UNKNOWN_ERROR',
    status = 500,
    requestId?: string,
    details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'AppApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
    this.details = details;
  }
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  adapter: USE_MOCKS ? handleMockRequest : undefined,
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Envelope Handling & 401 Session Clear
apiClient.interceptors.response.use(
  (response) => {
    // If backend returns the standard envelope { success: true, data }
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status || 500;
    const errorData = error.response?.data;
    const requestId = errorData?.requestId;
    const firstError = errorData?.errors?.[0];
    const code = firstError?.code || 'NETWORK_ERROR';
    const message =
      errorData?.message ||
      firstError?.message ||
      getFriendlyErrorMessage(code) ||
      error.message ||
      'An unexpected error occurred';

    // 401 Handling: Session expiry or invalid token
    if (status === 401) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.startsWith('/auth');

      // Clear session from memory & sessionStorage
      useAuthStore.getState().clearAuth();

      if (!isAuthPage) {
        const currentSearch = window.location.search;
        const redirectParam = encodeURIComponent(currentPath + currentSearch);
        window.location.href = `/auth/login?redirect=${redirectParam}`;
      }
    }

    const appError = new AppApiError(
      message,
      code,
      status,
      requestId,
      firstError?.details
    );

    return Promise.reject(appError);
  }
);

/**
 * Friendly translations for known backend error codes
 */
export function getFriendlyErrorMessage(code: string): string {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return 'Incorrect email or password. Please try again.';
    case 'EMAIL_ALREADY_EXISTS':
      return 'An account with this email address already exists.';
    case 'ADMIN_PENDING_APPROVAL':
      return 'Your admin account is pending approval from an existing administrator.';
    case 'ADMIN_REJECTED':
      return 'Your admin registration request has been declined.';
    case 'TOKEN_REVOKED':
    case 'INVALID_TOKEN':
      return 'Your session has expired. Please sign in again.';
    case 'FORBIDDEN':
      return 'You do not have permission to perform this action.';
    case 'CANNOT_REVIEW_SELF':
      return 'You cannot approve or reject your own admin account.';
    case 'ALREADY_REVIEWED':
      return 'This admin account has already been reviewed.';
    case 'ADMIN_NOT_FOUND':
      return 'Admin account could not be found.';
    case 'RATE_LIMITED':
      return 'Too many attempts. Please wait 15 minutes before trying again.';
    case 'VALIDATION_ERROR':
      return 'Please check the form fields and resolve highlighted errors.';
    case 'PAYLOAD_TOO_LARGE':
      return 'The uploaded file or payload exceeds the allowed size.';
    default:
      return '';
  }
}
