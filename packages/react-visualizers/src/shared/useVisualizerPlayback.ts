import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseVisualizerPlaybackOptions<T> {
  generateSteps: () => T[];
  onReset?: () => void;
}

export interface UseVisualizerPlaybackReturn<T> {
  steps: T[];
  currentStep: number;
  currentStepData: T | undefined;
  isPlaying: boolean;
  speed: number;
  setSpeed: (speed: number) => void;
  handlePlayPause: () => void;
  handleStep: () => void;
  handleStepBack: () => void;
  handleReset: () => void;
  reinitialize: () => void;
}

export function useVisualizerPlayback<T>({
  generateSteps,
  onReset,
}: UseVisualizerPlaybackOptions<T>): UseVisualizerPlaybackReturn<T> {
  const [speed, setSpeed] = useState(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  // Initialize steps immediately to avoid undefined on first render
  const [steps, setSteps] = useState<T[]>(() => generateSteps());

  const playingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initialize = useCallback(() => {
    const newSteps = generateSteps();
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
    playingRef.current = false;
  }, [generateSteps]);

  // Re-initialize when generateSteps changes (e.g., props change)
  const generateStepsRef = useRef(generateSteps);
  useEffect(() => {
    if (generateStepsRef.current !== generateSteps) {
      generateStepsRef.current = generateSteps;
      initialize();
    }
  }, [generateSteps, initialize]);

  // Animation loop
  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      playingRef.current = true;
      const delay = Math.max(100, 2000 - speed * 19);

      timeoutRef.current = setTimeout(() => {
        if (playingRef.current) {
          setCurrentStep((prev) => prev + 1);
        }
      }, delay);
    } else if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      playingRef.current = false;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, currentStep, steps.length, speed]);

  const handlePlayPause = useCallback(() => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying((prev) => !prev);
    playingRef.current = !playingRef.current;
  }, [currentStep, steps.length]);

  const handleStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, steps.length]);

  const handleStepBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    playingRef.current = false;
    setCurrentStep(0);
    onReset?.();
  }, [onReset]);

  const reinitialize = useCallback(() => {
    setIsPlaying(false);
    playingRef.current = false;
    initialize();
  }, [initialize]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      // Don't intercept browser shortcuts (Ctrl/Cmd + key)
      if (e.ctrlKey || e.metaKey) {
        return;
      }
      switch (e.key) {
        case 'p':
        case 'P':
          e.preventDefault();
          handlePlayPause();
          break;
        case '[':
          e.preventDefault();
          if (!isPlaying) handleStepBack();
          break;
        case ']':
          e.preventDefault();
          if (!isPlaying) handleStep();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          handleReset();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStep, handleStepBack, handlePlayPause, handleReset, isPlaying]);

  return {
    steps,
    currentStep,
    currentStepData: steps[currentStep],
    isPlaying,
    speed,
    setSpeed,
    handlePlayPause,
    handleStep,
    handleStepBack,
    handleReset,
    reinitialize,
  };
}

export default useVisualizerPlayback;
