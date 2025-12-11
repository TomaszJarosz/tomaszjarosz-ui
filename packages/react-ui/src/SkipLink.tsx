import React from 'react';

export interface SkipLinkProps {
  /** Target element ID (with #) to skip to */
  href: string;
  /** Link text (usually "Skip to main content") */
  children: React.ReactNode;
  /** Additional CSS class */
  className?: string;
}

/**
 * Skip Link component for keyboard accessibility
 *
 * Allows keyboard users to skip navigation and jump directly to main content.
 * Only visible when focused (via Tab key), hidden otherwise.
 *
 * Should be placed as the first focusable element in the page.
 *
 * @example
 * // In your layout/App component
 * <SkipLink href="#main-content">Skip to main content</SkipLink>
 * <Header />
 * <main id="main-content">...</main>
 *
 * @example
 * // Multiple skip links
 * <SkipLink href="#main-content">Skip to content</SkipLink>
 * <SkipLink href="#search">Skip to search</SkipLink>
 */
export function SkipLink({
  href,
  children,
  className = '',
}: SkipLinkProps): React.ReactElement {
  return (
    <a href={href} className={`skip-link ${className}`}>
      {children}
    </a>
  );
}

export default SkipLink;
