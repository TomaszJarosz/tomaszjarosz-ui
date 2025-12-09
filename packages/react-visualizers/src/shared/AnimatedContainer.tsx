import React, { useEffect, useState } from 'react';

export interface AnimatedContainerProps {
  /** Content to animate */
  children: React.ReactNode;
  /** Whether the container is visible */
  show?: boolean;
  /** Animation type */
  animation?: 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'slide-right';
  /** Duration in milliseconds */
  duration?: number;
  /** Delay before animation in milliseconds */
  delay?: number;
  /** Additional CSS classes */
  className?: string;
}

const ANIMATION_CLASSES: Record<string, { enter: string; exit: string; base: string }> = {
  fade: {
    base: 'transition-opacity',
    enter: 'opacity-100',
    exit: 'opacity-0',
  },
  'slide-up': {
    base: 'transition-all',
    enter: 'opacity-100 translate-y-0',
    exit: 'opacity-0 translate-y-4',
  },
  'slide-down': {
    base: 'transition-all',
    enter: 'opacity-100 translate-y-0',
    exit: 'opacity-0 -translate-y-4',
  },
  scale: {
    base: 'transition-all',
    enter: 'opacity-100 scale-100',
    exit: 'opacity-0 scale-95',
  },
  'slide-right': {
    base: 'transition-all',
    enter: 'opacity-100 translate-x-0',
    exit: 'opacity-0 -translate-x-4',
  },
};

/**
 * Container component with enter/exit animations
 */
export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  show = true,
  animation = 'fade',
  duration = 200,
  delay = 0,
  className = '',
}) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      const timer = setTimeout(() => setIsVisible(true), delay + 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, delay]);

  if (!shouldRender) return null;

  const animationConfig = ANIMATION_CLASSES[animation] || ANIMATION_CLASSES.fade;
  const durationClass = `duration-${duration}`;

  return (
    <div
      className={`${animationConfig.base} ${durationClass} ${
        isVisible ? animationConfig.enter : animationConfig.exit
      } ${className}`}
      style={{ transitionDuration: `${duration}ms`, transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default AnimatedContainer;
