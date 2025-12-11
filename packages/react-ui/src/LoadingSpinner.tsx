import React from 'react';

export interface LoadingSpinnerProps {
  /** Spinner size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Additional className */
  className?: string;
  /** Accessible message for screen readers */
  message?: string;
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  /** Center the spinner */
  centered?: boolean;
}

/**
 * Loading spinner component with accessibility features.
 * Provides visual loading indicator with proper ARIA attributes.
 *
 * @example
 * ```tsx
 * // Basic spinner
 * <LoadingSpinner />
 *
 * // Large danger spinner
 * <LoadingSpinner size="lg" variant="danger" />
 *
 * // Non-centered spinner
 * <LoadingSpinner centered={false} />
 * ```
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(
  ({
    size = 'md',
    className = '',
    message = 'Loading...',
    variant = 'primary',
    centered = true,
  }) => {
    const spinnerClasses = [
      'spinner',
      `spinner--${size}`,
      `spinner--${variant}`,
      centered ? 'spinner--centered' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        className={spinnerClasses}
        role="status"
        aria-label={message}
      >
        <div className="spinner__circle" aria-hidden="true" />
        <span className="sr-only">{message}</span>
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
