import { useEffect, useRef, useState } from 'react';

export interface UseInViewOptions {
  /** Percentage of element that must be visible (0-1) */
  threshold?: number;
  /** Margin around root element */
  rootMargin?: string;
  /** If true, stops observing after first intersection */
  triggerOnce?: boolean;
}

/**
 * Custom hook that uses Intersection Observer to detect when an element is visible in viewport
 *
 * @param options - Intersection Observer configuration
 * @returns [ref, isInView] - Ref to attach to element and boolean indicating visibility
 *
 * @example
 * const [ref, isInView] = useInView({ threshold: 0.5, triggerOnce: true });
 * return <div ref={ref} className={isInView ? 'animate-fadeIn' : 'opacity-0'}>Content</div>
 *
 * @example
 * // Lazy load images
 * const [ref, isInView] = useInView({ rootMargin: '100px', triggerOnce: true });
 * return <div ref={ref}>{isInView && <img src={imageSrc} />}</div>
 */
export function useInView<T extends HTMLElement = HTMLElement>(
  options: UseInViewOptions = {}
): [React.RefObject<T | null>, boolean] {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = false } = options;

  const ref = useRef<T>(null);
  // Start visible when triggerOnce is true (most common case for content)
  const [isInView, setIsInView] = useState(triggerOnce);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // If triggerOnce and already visible, no need to observe
    if (triggerOnce) {
      setIsInView(true);
      return;
    }

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isInView];
}

export default useInView;
