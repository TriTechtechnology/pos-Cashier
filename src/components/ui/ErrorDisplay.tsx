import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = React.memo(({
  error,
  onRetry,
  showRetryButton = true,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center space-y-3 ${className}`}>
      <AlertCircle className="w-12 h-12 text-destructive" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-text-primary">Something went wrong</h3>
        <p className="text-text-secondary max-w-md">{error}</p>
      </div>
      
      {showRetryButton && onRetry && (
        <Button
          variant="line"
          onClick={onRetry}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
});

ErrorDisplay.displayName = 'ErrorDisplay';
