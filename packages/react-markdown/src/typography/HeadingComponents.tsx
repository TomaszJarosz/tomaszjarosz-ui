import React, { useCallback } from 'react';
import { Link } from 'lucide-react';

export interface HeadingProps {
  children: React.ReactNode;
  id: string;
  /** Custom class name for the heading */
  className?: string;
  /** Whether to show anchor link on hover */
  showAnchor?: boolean;
  /** Callback when anchor is clicked */
  onAnchorClick?: (id: string, url: string) => void;
}

interface AnchorLinkProps {
  id: string;
  onAnchorClick?: (id: string, url: string) => void;
}

/**
 * Anchor link component that appears on hover.
 * Clicking copies the heading URL to clipboard and updates browser URL.
 */
const AnchorLink: React.FC<AnchorLinkProps> = ({ id, onAnchorClick }) => {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const url = `${window.location.origin}${window.location.pathname}#${id}`;

      if (onAnchorClick) {
        onAnchorClick(id, url);
      } else {
        navigator.clipboard.writeText(url).catch(() => {
          // Fallback: just update URL without copying
        });
        window.history.pushState(null, '', `#${id}`);
      }
    },
    [id, onAnchorClick]
  );

  return (
    <a
      href={`#${id}`}
      onClick={handleClick}
      className="opacity-0 group-hover:opacity-100 ml-2 text-gray-400 hover:text-indigo-600 transition-opacity inline-flex items-center"
      aria-label="Copy link to section"
      title="Copy link to section"
    >
      <Link className="w-3.5 h-3.5" />
    </a>
  );
};

export const H1: React.FC<HeadingProps> = ({
  children,
  id,
  className,
  showAnchor = true,
  onAnchorClick
}) => {
  if (!children) return null;

  return (
    <h1
      id={id}
      className={className || "group text-lg lg:text-xl font-bold mb-1 mt-2 text-gray-900 border-b border-gray-200 pb-0.5 scroll-mt-20 leading-tight"}
    >
      {children}
      {showAnchor && <AnchorLink id={id} onAnchorClick={onAnchorClick} />}
    </h1>
  );
};

export const H2: React.FC<HeadingProps> = ({
  children,
  id,
  className,
  showAnchor = true,
  onAnchorClick
}) => {
  if (!children) return null;

  return (
    <h2
      id={id}
      className={className || "group text-base lg:text-lg font-bold mb-1 mt-2 text-gray-800 scroll-mt-20 leading-tight"}
    >
      {children}
      {showAnchor && <AnchorLink id={id} onAnchorClick={onAnchorClick} />}
    </h2>
  );
};

export const H3: React.FC<HeadingProps> = ({
  children,
  id,
  className,
  showAnchor = true,
  onAnchorClick
}) => {
  if (!children) return null;

  return (
    <h3
      id={id}
      className={className || "group text-base font-bold mb-0.5 mt-1.5 text-gray-800 scroll-mt-20 leading-snug"}
    >
      {children}
      {showAnchor && <AnchorLink id={id} onAnchorClick={onAnchorClick} />}
    </h3>
  );
};

export const H4: React.FC<HeadingProps> = ({
  children,
  id,
  className,
  showAnchor = true,
  onAnchorClick
}) => (
  <h4
    id={id}
    className={className || "group text-sm font-semibold mb-0.5 mt-1.5 text-gray-700 scroll-mt-20 leading-snug"}
  >
    {children}
    {showAnchor && <AnchorLink id={id} onAnchorClick={onAnchorClick} />}
  </h4>
);

export const H5: React.FC<HeadingProps> = ({
  children,
  id,
  className,
  showAnchor = true,
  onAnchorClick
}) => (
  <h5
    id={id}
    className={className || "group text-sm font-semibold mb-0.5 mt-1 text-gray-700 scroll-mt-20 leading-snug"}
  >
    {children}
    {showAnchor && <AnchorLink id={id} onAnchorClick={onAnchorClick} />}
  </h5>
);

export const H6: React.FC<HeadingProps> = ({
  children,
  id,
  className,
  showAnchor = true,
  onAnchorClick
}) => (
  <h6
    id={id}
    className={className || "group text-xs font-semibold mb-0.5 mt-1 text-gray-700 scroll-mt-20 leading-snug"}
  >
    {children}
    {showAnchor && <AnchorLink id={id} onAnchorClick={onAnchorClick} />}
  </h6>
);
