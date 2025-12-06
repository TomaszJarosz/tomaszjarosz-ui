import { useState, useEffect, useCallback, useRef } from 'react';

export interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
  originalText: string;
}

/**
 * Hook that tracks which section heading is currently visible in viewport
 * @param items - Array of table of contents items with IDs matching element IDs in the DOM
 * @param options - Configuration options
 * @returns ID of the currently active section
 */
export const useActiveSection = (
  items: TableOfContentsItem[],
  options: {
    rootMargin?: string;
    threshold?: number;
  } = {}
): string | null => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { rootMargin = '-80px 0px -60% 0px', threshold = 0 } = options;

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      // Find the first visible heading from top
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => {
          const aIndex = items.findIndex((item) => item.id === a.target.id);
          const bIndex = items.findIndex((item) => item.id === b.target.id);
          return aIndex - bIndex;
        });

      if (visibleEntries.length > 0) {
        setActiveSection(visibleEntries[0].target.id);
      }
    },
    [items]
  );

  useEffect(() => {
    if (items.length === 0) return;

    // Create intersection observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold,
    });

    // Observe all headings
    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [items, handleIntersection, rootMargin, threshold]);

  return activeSection;
};
