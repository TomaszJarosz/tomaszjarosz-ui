import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ReadingProgressBarProps {
  /** Show percentage indicator */
  showPercentage?: boolean;
  /** Custom class for the progress bar container */
  className?: string;
  /** Color when reading is complete (default: green gradient) */
  completedColor?: string;
  /** Color while reading (default: blue gradient) */
  progressColor?: string;
}

/**
 * ReadingProgressBar component - Shows reading progress at the top of the page
 *
 * Calculates scroll progress and displays a fixed progress bar at the top.
 * Uses requestAnimationFrame for smooth updates without flickering.
 *
 * @example
 * <ReadingProgressBar showPercentage />
 */
export const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({
  showPercentage = true,
  className = '',
  completedColor = 'bg-gradient-to-r from-green-500 to-emerald-500',
  progressColor = 'bg-gradient-to-r from-blue-500 to-indigo-600',
}) => {
  const [progress, setProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const rafRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProgressRef = useRef<number>(0);

  const calculateProgress = useCallback(() => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;

    const scrollableHeight = documentHeight - windowHeight;
    const scrollPercentage =
      scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0;

    const newProgress = Math.min(Math.max(scrollPercentage, 0), 100);

    if (Math.abs(newProgress - lastProgressRef.current) >= 0.5) {
      lastProgressRef.current = newProgress;
      setProgress(newProgress);
    }

    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 1500);
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
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [calculateProgress, handleScroll]);

  const roundedProgress = Math.round(progress);

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50 ${className}`}
        role="progressbar"
        aria-valuenow={roundedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      >
        <div
          className={`h-full transition-all duration-150 ease-out ${
            progress >= 100 ? completedColor : progressColor
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {showPercentage && (
        <div
          className={`fixed top-3 left-4 z-50 transition-all duration-300 ${
            isScrolling && progress > 0 && progress < 100
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
        >
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${
              progress >= 80
                ? 'bg-green-500/90 text-white'
                : 'bg-white/90 text-gray-700 border border-gray-200'
            }`}
          >
            {roundedProgress}%
          </div>
        </div>
      )}
    </>
  );
};
