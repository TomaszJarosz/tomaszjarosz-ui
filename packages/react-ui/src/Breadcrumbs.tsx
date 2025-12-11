import React, { ElementType, ComponentPropsWithoutRef } from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  /** Display text for the breadcrumb */
  label: string;
  /** URL/path for the breadcrumb link */
  href?: string;
  /** Whether this is the current/active page */
  isCurrent?: boolean;
}

type LinkComponentProps<C extends ElementType> = {
  /** Custom link component (e.g., React Router's Link or Next.js Link) */
  linkComponent?: C;
  /** Props to pass to the link component */
  linkProps?: Omit<ComponentPropsWithoutRef<C>, 'href' | 'to' | 'children' | 'className'>;
};

export type BreadcrumbsProps<C extends ElementType = 'a'> = {
  /** Array of breadcrumb items to display */
  items: BreadcrumbItem[];
  /** Additional CSS class */
  className?: string;
  /** Whether to show home icon as first item */
  showHome?: boolean;
  /** Home URL (default: "/") */
  homeHref?: string;
  /** Aria label for navigation */
  ariaLabel?: string;
} & LinkComponentProps<C>;

/**
 * Breadcrumbs navigation component
 *
 * Router-agnostic - works with any link component (React Router, Next.js, plain anchors)
 *
 * @example
 * // With plain anchors (default)
 * <Breadcrumbs items={[{ label: 'Blog', href: '/blog' }, { label: 'Article', isCurrent: true }]} />
 *
 * @example
 * // With React Router
 * import { Link } from 'react-router-dom';
 * <Breadcrumbs
 *   linkComponent={Link}
 *   linkProps={{ to: '' }} // 'to' will be overridden by href
 *   items={[{ label: 'Blog', href: '/blog' }]}
 * />
 *
 * @example
 * // With Next.js
 * import Link from 'next/link';
 * <Breadcrumbs linkComponent={Link} items={items} />
 */
export function Breadcrumbs<C extends ElementType = 'a'>({
  items,
  className = '',
  showHome = true,
  homeHref = '/',
  ariaLabel = 'Breadcrumb',
  linkComponent,
  linkProps,
}: BreadcrumbsProps<C>): React.ReactElement | null {
  if (items.length === 0 && !showHome) return null;

  // Use provided link component or default to 'a'
  const LinkComponent = linkComponent || 'a';

  // Determine the href prop name based on component
  const getHrefProp = (href: string) => {
    // React Router uses 'to', Next.js and anchors use 'href'
    if (linkComponent) {
      // Check if it's likely React Router (has 'to' prop pattern)
      return { to: href, href };
    }
    return { href };
  };

  return (
    <nav aria-label={ariaLabel} className={`breadcrumbs ${className}`}>
      <ol className="breadcrumbs__list">
        {/* Home link */}
        {showHome && (
          <li className="breadcrumbs__item">
            <LinkComponent
              {...linkProps}
              {...getHrefProp(homeHref)}
              className="breadcrumbs__link"
              aria-label="Home"
            >
              <Home className="breadcrumbs__home-icon" />
            </LinkComponent>
          </li>
        )}

        {items.map((item, index) => (
          <li key={index} className="breadcrumbs__item">
            <ChevronRight className="breadcrumbs__separator" aria-hidden="true" />
            {item.isCurrent || !item.href ? (
              <span
                className="breadcrumbs__current"
                aria-current={item.isCurrent ? 'page' : undefined}
                title={item.label}
              >
                {item.label}
              </span>
            ) : (
              <LinkComponent
                {...linkProps}
                {...getHrefProp(item.href)}
                className="breadcrumbs__link breadcrumbs__link--truncate"
                title={item.label}
              >
                {item.label}
              </LinkComponent>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
