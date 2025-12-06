import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook that tracks reading progress as a percentage
 * @returns Progress percentage (0-100)
 */
export const useReadingProgress = (): number => {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastProgressRef = useRef<number>(0);

  const calculateProgress = useCallback(() => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;

    const scrollableHeight = documentHeight - windowHeight;
    const scrollPercentage =
      scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;

    const newProgress = Math.min(Math.max(Math.round(scrollPercentage), 0), 100);

    if (newProgress !== lastProgressRef.current) {
      lastProgressRef.current = newProgress;
      setProgress(newProgress);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(calculateProgress);
  }, [calculateProgress]);

  useEffect(() => {
    calculateProgress();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [calculateProgress, handleScroll]);

  return progress;
};
