import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export interface BackToTopProps {
  /** Scroll threshold to show button (pixels) */
  threshold?: number;
  /** Additional CSS class */
  className?: string;
  /** Aria label for accessibility */
  ariaLabel?: string;
}

/**
 * BackToTop component - Floating button to scroll back to top
 *
 * Appears after scrolling down past threshold, allows smooth scroll back to top.
 * Fixed position in bottom-right corner with fade-in/out animation.
 *
 * @example
 * // Basic usage
 * <BackToTop />
 *
 * @example
 * // Custom threshold
 * <BackToTop threshold={500} />
 */
export function BackToTop({
  threshold = 300,
  className = '',
  ariaLabel = 'Back to top',
}: BackToTopProps): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`back-top ${isVisible ? 'back-top--visible' : ''} ${className}`}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <ArrowUp className="back-top__icon" aria-hidden="true" />
    </button>
  );
}

export default BackToTop;
