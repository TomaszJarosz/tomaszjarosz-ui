import React from 'react';

export interface LinkProps {
  children: React.ReactNode;
  href?: string;
  /** Custom class name */
  className?: string;
  /** Patterns for internal links (default: starts with /blog/ or #) */
  internalPatterns?: (string | RegExp)[];
  /** Whether to open external links in new tab */
  externalInNewTab?: boolean;
}

/**
 * Check if a URL matches internal link patterns
 */
const isInternalUrl = (
  href: string | undefined,
  patterns: (string | RegExp)[]
): boolean => {
  if (!href) return false;

  return patterns.some((pattern) => {
    if (typeof pattern === 'string') {
      return href.startsWith(pattern);
    }
    return pattern.test(href);
  });
};

export const LinkComponent: React.FC<LinkProps> = ({
  children,
  href,
  className,
  internalPatterns = ['/blog/', '#'],
  externalInNewTab = true,
}) => {
  const isInternal = isInternalUrl(href, internalPatterns);

  return (
    <a
      href={href}
      className={className || 'rm-link'}
      {...(!isInternal && externalInNewTab && {
        target: '_blank',
        rel: 'noopener noreferrer',
      })}
    >
      {children}
    </a>
  );
};
