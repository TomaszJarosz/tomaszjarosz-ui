import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import {
  BaseVisualizerLayout,
} from '../shared';

interface SearchStep {
  left: number;
  right: number;
  mid: number;
  comparison: 'less' | 'greater' | 'equal' | null;
  description: string;
  found?: boolean;
  codeLine?: number;
  variables?: Record<string, string | number>;
}

interface BinarySearchVisualizerProps {
  initialSize?: number;
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

// Algorithm code snippets
const BINARY_SEARCH_CODE = [
  'binarySearch(arr, target):',
  '  left = 0, right = n - 1',
  '  while left <= right:',
  '    mid = (left + right) / 2',
  '    if arr[mid] == target:',
  '      return mid  // Found!',
  '    elif arr[mid] < target:',
  '      left = mid + 1',
  '    else:',
  '      right = mid - 1',
  '  return -1  // Not found',
];

const LEGEND_ITEMS = [
  { color: 'bg-blue-100', label: 'Search Space' },
  { color: 'bg-gray-200', label: 'Eliminated' },
  { color: 'bg-purple-500', label: 'Mid' },
  { color: 'bg-green-500', label: 'Found' },
];

const BADGES = [
  { label: 'Time: O(log n)', variant: 'green' as const },
  { label: 'Space: O(1)', variant: 'green' as const },
];

function generateSortedArray(size: number): number[] {
  const arr: number[] = [];
  let current = Math.floor(Math.random() * 5) + 1;
  for (let i = 0; i < size; i++) {
    arr.push(current);
    current += Math.floor(Math.random() * 5) + 1;
  }
  return arr;
}

function generateSearchSteps(arr: number[], target: number): SearchStep[] {
  const steps: SearchStep[] = [];
  let left = 0;
  let right = arr.length - 1;

  steps.push({
    left,
    right,
    mid: -1,
    comparison: null,
    description: `Initialize: searching for ${target} in sorted array [${arr[0]}...${arr[arr.length - 1]}]`,
    codeLine: 1,
    variables: { target, left, right, n: arr.length },
  });

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    steps.push({
      left,
      right,
      mid,
      comparison: null,
      description: `Calculate mid = (${left} + ${right}) / 2 = ${mid}. Check arr[${mid}] = ${arr[mid]}`,
      codeLine: 3,
      variables: { left, right, mid, 'arr[mid]': arr[mid], target },
    });

    if (arr[mid] === target) {
      steps.push({
        left,
        right,
        mid,
        comparison: 'equal',
        description: `✓ Found! arr[${mid}] = ${arr[mid]} equals target ${target}`,
        found: true,
        codeLine: 5,
        variables: { mid, 'arr[mid]': arr[mid], target },
      });
      return steps;
    } else if (arr[mid] < target) {
      steps.push({
        left,
        right,
        mid,
        comparison: 'less',
        description: `arr[${mid}] = ${arr[mid]} < ${target} → search right half, set left = ${mid + 1}`,
        codeLine: 7,
        variables: { 'arr[mid]': arr[mid], target, 'new left': mid + 1 },
      });
      left = mid + 1;
    } else {
      steps.push({
        left,
        right,
        mid,
        comparison: 'greater',
        description: `arr[${mid}] = ${arr[mid]} > ${target} → search left half, set right = ${mid - 1}`,
        codeLine: 9,
        variables: { 'arr[mid]': arr[mid], target, 'new right': mid - 1 },
      });
      right = mid - 1;
    }
  }

  steps.push({
    left,
    right,
    mid: -1,
    comparison: null,
    description: `✗ Not found! ${target} is not in the array (left > right)`,
    found: false,
    codeLine: 10,
    variables: { left, right, target },
  });

  return steps;
}

const BinarySearchVisualizerComponent: React.FC<
  BinarySearchVisualizerProps
> = ({
  initialSize = 12,
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const [arraySize] = useState(initialSize);
  const [array, setArray] = useState<number[]>([]);
  const [, setTarget] = useState<number>(0);
  const [targetInput, setTargetInput] = useState<string>('');
  const [speed, setSpeed] = useState(25); // Slower default
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<SearchStep[]>([]);

  const playingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize array
  const initializeArray = useCallback(() => {
    const newArray = generateSortedArray(arraySize);
    setArray(newArray);
    // Pick a random target - 70% chance it exists in array
    const existsInArray = Math.random() < 0.7;
    const newTarget = existsInArray
      ? newArray[Math.floor(Math.random() * newArray.length)]
      : newArray[Math.floor(newArray.length / 2)] + 1;
    setTarget(newTarget);
    setTargetInput(String(newTarget));
    const newSteps = generateSearchSteps(newArray, newTarget);
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
    playingRef.current = false;
  }, [arraySize]);

  useEffect(() => {
    initializeArray();
  }, [initializeArray]);

  // Animation loop
  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      playingRef.current = true;
      // Slower: min 100ms, max 2000ms
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
    setIsPlaying(!isPlaying);
    playingRef.current = !isPlaying;
  }, [currentStep, steps.length, isPlaying]);

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

  // Keyboard shortcuts (P = play/pause, [ = back, ] = forward, R = reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [handleStep, handleStepBack, handlePlayPause, isPlaying]);

  const handleReset = () => {
    setIsPlaying(false);
    playingRef.current = false;
    setCurrentStep(0);
  };

  const handleNewSearch = () => {
    const newTarget = parseInt(targetInput, 10);
    if (!isNaN(newTarget)) {
      setTarget(newTarget);
      const newSteps = generateSearchSteps(array, newTarget);
      setSteps(newSteps);
      setCurrentStep(0);
      setIsPlaying(false);
      playingRef.current = false;
    }
  };

  const handleShuffle = () => {
    initializeArray();
  };

  const currentStepData = steps[currentStep] || {
    left: 0,
    right: array.length - 1,
    mid: -1,
  };
  const { left, right, mid, found } = currentStepData;

  const getElementStyle = (index: number): string => {
    if (found === true && index === mid) {
      return 'bg-green-500 text-white scale-110';
    }
    if (index === mid) {
      return 'bg-purple-500 text-white';
    }
    if (index < left || index > right) {
      return 'bg-gray-200 text-gray-400';
    }
    if (index === left || index === right) {
      return 'bg-blue-400 text-white';
    }
    return 'bg-blue-100 text-blue-800';
  };

  const currentDescription = steps[currentStep]?.description || '';

  const getStatusVariant = () => {
    if (found === true) return 'success' as const;
    if (found === false) return 'error' as const;
    return 'default' as const;
  };

  const headerExtra = (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Target:</label>
      <input
        type="number"
        value={targetInput}
        onChange={(e) => setTargetInput(e.target.value)}
        className="w-20 px-2 py-1 text-sm font-semibold text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
        disabled={isPlaying}
      />
      <button
        onClick={handleNewSearch}
        disabled={isPlaying}
        className="p-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
        title="Search"
      >
        <Search className="w-4 h-4" />
      </button>
    </div>
  );

  const visualization = (
    <>
      {/* Binary Search Invariant - Prominent */}
      <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
        <div className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
          <span className="text-lg">🎯</span> Binary Search Invariant
        </div>
        <div className="font-mono text-sm bg-white rounded-lg p-3 border border-green-200">
          <div className="text-center text-green-700 font-bold mb-2">
            target ∈ arr[left..right]
          </div>
          <div className="text-xs text-gray-500 text-center">
            If target exists, it must be within current search bounds
          </div>
        </div>
        {/* Search space info - always visible with min-height */}
        <div className="mt-3 p-2 bg-white rounded-lg border border-green-200 min-h-[60px]">
          {left <= right ? (
            <>
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-green-700">Search space:</span>{' '}
                  <span className="font-mono">[{left}..{right}]</span> = <span className="font-bold text-green-600">{right - left + 1}</span> elements
                </div>
                <div className="text-gray-500">
                  {currentStep > 0 && (
                    <span>
                      Eliminated: <span className="font-bold text-red-500">{Math.round((1 - (right - left + 1) / array.length) * 100)}%</span>
                    </span>
                  )}
                </div>
              </div>
              {mid >= 0 && (
                <div className="mt-2 text-xs text-center text-gray-600">
                  mid = ⌊({left} + {right}) / 2⌋ = <span className="font-bold text-purple-600">{mid}</span>
                </div>
              )}
            </>
          ) : found === true ? (
            <div className="text-center py-1">
              <span className="text-green-800 font-bold">✓ Found in {currentStep} steps (log₂{array.length} ≈ {Math.ceil(Math.log2(array.length))} max)</span>
            </div>
          ) : found === false ? (
            <div className="text-center py-1">
              <span className="text-red-800 font-bold">✗ Not found - search space exhausted</span>
            </div>
          ) : (
            <div className="text-center text-xs text-gray-400 py-2">Ready to search...</div>
          )}
        </div>
      </div>

      {/* Array Display */}
      <div className="flex items-center justify-center gap-1 flex-wrap mb-4">
        {array.map((value, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium text-sm transition-colors duration-300 ${getElementStyle(index)}`}
            >
              {value}
            </div>
            <span className="text-[10px] text-gray-400 mt-1">
              {index}
            </span>
          </div>
        ))}
      </div>

      {/* Pointers Legend */}
      <div className="flex items-center justify-center gap-6 mb-4 text-sm">
        {left <= right && (
          <>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-400 rounded" />
              <span className="text-gray-600">L={left}</span>
            </div>
            {mid >= 0 && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded" />
                <span className="text-gray-600">M={mid}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-400 rounded" />
              <span className="text-gray-600">R={right}</span>
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <BaseVisualizerLayout
      id="binarysearch-visualizer"
      title="Binary Search"
      badges={BADGES}
      gradient="green"
      className={className}
      minHeight={350}
      headerExtra={headerExtra}
      status={{
        description: currentDescription,
        currentStep,
        totalSteps: steps.length,
        variant: getStatusVariant(),
      }}
      controls={{
        isPlaying,
        currentStep,
        totalSteps: steps.length,
        speed,
        onPlayPause: handlePlayPause,
        onStep: handleStep,
        onStepBack: handleStepBack,
        onReset: handleReset,
        onSpeedChange: setSpeed,
        onShuffle: handleShuffle,
        showShuffle: true,
        shuffleLabel: 'New Array',
        accentColor: 'green',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? BINARY_SEARCH_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const BinarySearchVisualizer = React.memo(
  BinarySearchVisualizerComponent
);
export default BinarySearchVisualizer;
