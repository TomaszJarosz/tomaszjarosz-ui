import React from 'react';
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  X,
  LucideIcon,
} from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  /** Alert content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: AlertVariant;
  /** Optional title */
  title?: string;
  /** Custom icon (overrides default variant icon) */
  icon?: LucideIcon;
  /** Show close button */
  onClose?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * Alert Component
 *
 * Displays contextual feedback messages with:
 * - Multiple variants (info, success, warning, error)
 * - Optional title and close button
 * - Custom or default icons
 * - Accessible with proper ARIA attributes
 *
 * @example
 * ```tsx
 * // Error alert
 * <Alert variant="error">
 *   Invalid credentials. Please try again.
 * </Alert>
 *
 * // Success alert with title
 * <Alert variant="success" title="Success!">
 *   Your changes have been saved successfully.
 * </Alert>
 *
 * // Dismissible warning
 * <Alert variant="warning" onClose={() => setShowAlert(false)}>
 *   Your session will expire in 5 minutes.
 * </Alert>
 * ```
 */
export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  icon: CustomIcon,
  onClose,
  className = '',
}) => {
  const defaultIcons: Record<AlertVariant, LucideIcon> = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
  };

  const IconComponent = CustomIcon || defaultIcons[variant];

  const role = variant === 'error' ? 'alert' : 'status';
  const ariaLive = variant === 'error' ? 'assertive' : 'polite';

  const alertClasses = ['alert', `alert--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div role={role} aria-live={ariaLive} className={alertClasses}>
      <div className="alert__content">
        <div className="alert__icon-wrapper">
          <IconComponent className="alert__icon" />
        </div>

        <div className="alert__body">
          {title && <h3 className="alert__title">{title}</h3>}
          <div className="alert__message">{children}</div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="alert__close"
            aria-label="Dismiss alert"
          >
            <X className="alert__icon" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
