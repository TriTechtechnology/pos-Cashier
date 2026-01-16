/**
 * ERROR BOUNDARY - PRODUCTION SAFETY
 *
 * Catches React render errors and prevents white screen crashes
 * Displays user-friendly error UI instead of crashing the entire app
 *
 * Usage: Wrap around components that might error
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so next render shows fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details
    logger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack
    });

    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send to error tracking service
    // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    // Optionally reload page or navigate home
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            {/* Error Icon */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Title */}
            <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h2>

            {/* Error Message */}
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
              We encountered an unexpected error. Don&apos;t worry, your data is safe.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Error Details (Dev Mode)
                </summary>
                <pre className="text-red-600 dark:text-red-400 whitespace-pre-wrap overflow-auto">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre className="mt-2 text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/home'}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go Home
              </button>
            </div>

            {/* Support Message */}
            <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-4">
              If this problem persists, please contact support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for easier use in Next.js app router
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const Wrapped: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  Wrapped.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return Wrapped;
}

/**
 * Hook to manually trigger error boundary from functional components
 */
export function useErrorHandler() {
  const [, setState] = React.useState();

  return React.useCallback((error: Error) => {
    setState(() => {
      throw error;
    });
  }, []);
}

export default ErrorBoundary;
