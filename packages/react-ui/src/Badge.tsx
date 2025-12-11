import React from 'react';
import { LucideIcon, X } from 'lucide-react';

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'gray'
  | 'featured'
  | 'new'
  | 'series'
  | 'premium';

export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps {
  /** Badge content */
  children: React.ReactNode;
  /** Visual style variant */
  variant?: BadgeVariant;
  /** Size of the badge */
  size?: BadgeSize;
  /** Icon to display on the left */
  leftIcon?: LucideIcon;
  /** Make badge removable with close button */
  onRemove?: () => void;
  /** Use pill shape (rounded-full) instead of rounded corners */
  pill?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Badge Component
 *
 * Displays small, compact information labels with:
 * - Multiple color variants (primary, success, warning, danger, etc.)
 * - Special variants with gradients (featured, new, premium)
 * - Different sizes (xs, sm, md)
 * - Optional icons
 * - Optional remove functionality
 * - Pill or rounded shape
 *
 * @example
 * ```tsx
 * // Basic badge
 * <Badge variant="primary">New</Badge>
 *
 * // Featured badge with gradient
 * <Badge variant="featured" leftIcon={Star} pill>Featured</Badge>
 *
 * // Removable badge (tag)
 * <Badge variant="primary" onRemove={() => removeTag(id)} pill>
 *   JavaScript
 * </Badge>
 * ```
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'sm',
  leftIcon: LeftIcon,
  onRemove,
  pill = false,
  className = '',
}) => {
  const badgeClasses = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    pill ? 'badge--pill' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={badgeClasses}>
      {LeftIcon && <LeftIcon className="badge__icon" />}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="badge__remove"
          aria-label="Remove"
        >
          <X className="badge__icon" />
        </button>
      )}
    </span>
  );
};

export default Badge;
