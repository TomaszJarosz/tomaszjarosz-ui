import React from 'react';
import { useInView } from './hooks';

export interface FadeInProps {
  /** Content to animate */
  children: React.ReactNode;
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Animation duration (seconds) */
  duration?: number;
  /** Additional CSS class */
  className?: string;
  /** Only animate once when entering viewport */
  triggerOnce?: boolean;
  /** Percentage of element visible before triggering (0-1) */
  threshold?: number;
  /** Vertical offset for slide-up effect (pixels) */
  translateY?: number;
}

/**
 * FadeIn component - Wraps content with fade-in animation on scroll
 *
 * Uses Intersection Observer to detect when element enters viewport
 * and applies smooth fade-in + slide-up animation.
 *
 * @example
 * <FadeIn delay={0.2} triggerOnce>
 *   <h1>My Content</h1>
 * </FadeIn>
 *
 * @example
 * // Staggered animation
 * {items.map((item, i) => (
 *   <FadeIn key={item.id} delay={i * 0.1}>
 *     <Card>{item.title}</Card>
 *   </FadeIn>
 * ))}
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  className = '',
  triggerOnce = true,
  threshold = 0.1,
  translateY = 20,
}: FadeInProps): React.ReactElement {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold, triggerOnce });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : `translateY(${translateY}px)`,
        transition: `opacity ${duration}s ease-out ${delay}s, transform ${duration}s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default FadeIn;
