import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'ghost'
  | 'outline'
  | 'gradient'
  | 'action-edit'
  | 'action-delete'
  | 'action-view';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button visual variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Show loading spinner */
  loading?: boolean;
  /** Loading text (optional, defaults to children) */
  loadingText?: string;
  /** Icon to display before text */
  icon?: LucideIcon;
  /** Icon to display after text */
  iconRight?: LucideIcon;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon-only button (no text) */
  iconOnly?: boolean;
  /** Additional className */
  className?: string;
  /** Children content */
  children?: React.ReactNode;
}

/**
 * Universal Button Component
 *
 * Provides consistent button styling with:
 * - Multiple variants (primary, secondary, danger, success, ghost, outline, gradient)
 * - Size options (xs, sm, md, lg)
 * - Loading state with spinner
 * - Icon support (left/right)
 * - Full accessibility
 *
 * @example
 * ```tsx
 * // Primary button
 * <Button variant="primary" onClick={handleSave}>
 *   Save
 * </Button>
 *
 * // Button with icon and loading
 * <Button
 *   variant="danger"
 *   icon={Trash}
 *   loading={isDeleting}
 *   loadingText="Deleting..."
 * >
 *   Delete
 * </Button>
 *
 * // Icon-only button
 * <Button
 *   variant="ghost"
 *   icon={Edit}
 *   iconOnly
 *   aria-label="Edit item"
 * />
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      icon: Icon,
      iconRight: IconRight,
      fullWidth = false,
      iconOnly = false,
      className = '',
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: 'btn--xs',
      sm: 'btn--sm',
      md: 'btn--md',
      lg: 'btn--lg',
    };

    const iconOnlySizeClasses = {
      xs: 'btn--icon-xs',
      sm: 'btn--icon-sm',
      md: 'btn--icon-md',
      lg: 'btn--icon-lg',
    };

    const variantClasses = {
      primary: 'btn--primary',
      secondary: 'btn--secondary',
      danger: 'btn--danger',
      success: 'btn--success',
      ghost: 'btn--ghost',
      outline: 'btn--outline',
      gradient: 'btn--gradient',
      'action-edit': 'btn--action-edit',
      'action-delete': 'btn--action-delete',
      'action-view': 'btn--action-view',
    };

    const isDisabled = disabled || loading;

    const appliedSizeClass = iconOnly
      ? iconOnlySizeClasses[size]
      : sizeClasses[size];

    const buttonClasses = [
      'btn',
      appliedSizeClass,
      variantClasses[variant],
      fullWidth ? 'btn--full-width' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={buttonClasses}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner
              size="xs"
              variant={
                variant === 'primary' ||
                variant === 'danger' ||
                variant === 'success' ||
                variant === 'gradient'
                  ? 'secondary'
                  : 'primary'
              }
              centered={false}
            />
            {!iconOnly && (loadingText || children)}
          </>
        ) : iconOnly ? (
          Icon && <Icon className="btn__icon" aria-hidden="true" />
        ) : (
          <>
            {Icon && <Icon className="btn__icon" aria-hidden="true" />}
            {children}
            {IconRight && <IconRight className="btn__icon" aria-hidden="true" />}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
