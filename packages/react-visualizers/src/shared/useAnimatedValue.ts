import { useState, useEffect, useRef } from 'react';

export interface UseAnimatedValueOptions {
  /** Duration of animation in milliseconds */
  duration?: number;
  /** Easing function name */
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
  /** Delay before animation starts in milliseconds */
  delay?: number;
}

/**
 * Hook for animating numeric values
 * Provides smooth transitions between value changes
 */
export function useAnimatedValue(
  targetValue: number,
  options: UseAnimatedValueOptions = {}
): number {
  const { duration = 300, easing = 'ease-out', delay = 0 } = options;

  const [currentValue, setCurrentValue] = useState(targetValue);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startValueRef = useRef<number>(targetValue);

  useEffect(() => {
    if (currentValue === targetValue) return;

    const startValue = currentValue;
    startValueRef.current = startValue;

    const easingFunctions: Record<string, (t: number) => number> = {
      linear: (t) => t,
      'ease-in': (t) => t * t,
      'ease-out': (t) => t * (2 - t),
      'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
      spring: (t) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0
          ? 0
          : t === 1
          ? 1
          : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
      },
    };

    const easingFn = easingFunctions[easing] || easingFunctions['ease-out'];

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp + delay;
      }

      const elapsed = timestamp - startTimeRef.current;

      if (elapsed < 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);
      const newValue = startValue + (targetValue - startValue) * easedProgress;

      setCurrentValue(newValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        startTimeRef.current = 0;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, easing, delay, currentValue]);

  return currentValue;
}

export default useAnimatedValue;
