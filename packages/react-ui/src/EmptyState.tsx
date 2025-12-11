import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type EmptyStateSize = 'sm' | 'md' | 'lg';
export type EmptyStateVariant = 'default' | 'subtle';

export interface EmptyStateProps {
  /** Icon component to display */
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  /** Main title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** Primary action button or component */
  action?: React.ReactNode;
  /** Additional suggestions/links to display */
  suggestions?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Size variant */
  size?: EmptyStateSize;
  /** Visual variant */
  variant?: EmptyStateVariant;
}

/**
 * EmptyState Component
 *
 * Displays consistent empty states with:
 * - Optional icon
 * - Title and description
 * - Primary action button
 * - Additional suggestions/links
 * - Multiple size and visual variants
 *
 * @example
 * ```tsx
 * // Basic empty state
 * <EmptyState
 *   icon={FileText}
 *   title="No articles yet"
 *   description="Start writing your first article"
 *   action={<Button>Create Article</Button>}
 * />
 *
 * // With suggestions
 * <EmptyState
 *   icon={Search}
 *   title="No results found"
 *   description="Try different keywords"
 *   suggestions={<Link to="/browse">Browse all</Link>}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = React.memo(
  ({
    icon: Icon,
    title,
    description,
    action = null,
    suggestions = null,
    className = '',
    size = 'md',
    variant = 'default',
  }) => {
    const emptyStateClasses = [
      'empty-state',
      `empty-state--${size}`,
      `empty-state--${variant}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        className={emptyStateClasses}
        role="region"
        aria-label={`Empty state: ${title}`}
      >
        {Icon && <Icon className="empty-state__icon" aria-hidden="true" />}

        <h3 className="empty-state__title">{title}</h3>

        {description && (
          <p className="empty-state__description">{description}</p>
        )}

        {action && <div className="empty-state__action">{action}</div>}

        {suggestions && (
          <div className="empty-state__suggestions">{suggestions}</div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

export default EmptyState;
