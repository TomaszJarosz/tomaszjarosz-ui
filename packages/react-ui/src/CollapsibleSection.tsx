import React, { useState, ReactNode } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';

export interface CollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Icon component to display next to title */
  icon: LucideIcon;
  /** Section content */
  children: ReactNode;
  /** Optional action button (e.g., "View all") */
  actionButton?: ReactNode;
  /** Whether section is expanded by default (mobile only, always expanded on desktop) */
  defaultExpanded?: boolean;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * Reusable collapsible section component
 *
 * Features:
 * - Mobile: Collapsible with chevron indicator
 * - Desktop (lg+): Always expanded, no chevron (via CSS)
 * - Gradient title styling
 * - Hover effects
 *
 * @example
 * import { TrendingUp } from 'lucide-react';
 *
 * <CollapsibleSection
 *   title="Popular Tags"
 *   icon={TrendingUp}
 *   actionButton={<button onClick={handleViewAll}>View all</button>}
 * >
 *   <TagsList />
 * </CollapsibleSection>
 */
export function CollapsibleSection({
  title,
  icon: Icon,
  children,
  actionButton,
  defaultExpanded = false,
  className = '',
}: CollapsibleSectionProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Generate IDs for ARIA attributes
  const sectionId = `section-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const headingId = `heading-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`collapsible-section ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={sectionId}
        className="collapsible-section__header"
      >
        <div className="collapsible-section__title-wrapper">
          <Icon className="collapsible-section__icon" aria-hidden="true" />
          <h3 id={headingId} className="collapsible-section__title">
            {title}
          </h3>
        </div>

        <div className="collapsible-section__actions">
          {/* Optional action button */}
          {actionButton}

          {/* Chevron - only visible on mobile (via CSS) */}
          <ChevronDown
            className={`collapsible-section__chevron ${
              isExpanded ? 'collapsible-section__chevron--expanded' : ''
            }`}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Content - collapsible on mobile, always visible on desktop (via CSS) */}
      <div
        id={sectionId}
        role="region"
        aria-labelledby={headingId}
        className={`collapsible-section__content ${
          isExpanded ? 'collapsible-section__content--expanded' : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default CollapsibleSection;
