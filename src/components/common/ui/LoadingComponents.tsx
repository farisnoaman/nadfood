import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = 'جاري التحميل...',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-primary-500 border-t-transparent ${sizeClasses[size]}`} />
      {message && <span className="ml-3 text-secondary-600 dark:text-secondary-400">{message}</span>}
    </div>
  );
};

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  rows = 3,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-full mb-2" />
          <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
};

interface PageLoadingProps {
  title?: string;
  subtitle?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  title = 'جاري تحميل الصفحة...',
  subtitle = 'يرجى الانتظار'
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary-100 dark:bg-secondary-900">
      <div className="flex flex-col items-center text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mb-4" />
        <h2 className="text-xl font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
          {title}
        </h2>
        <p className="text-secondary-500 dark:text-secondary-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
};