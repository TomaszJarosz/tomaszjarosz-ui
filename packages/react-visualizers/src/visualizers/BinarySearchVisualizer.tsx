import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import {
  CodePanel,
  HelpPanel,
  ControlPanel,
  Legend,
  StatusPanel,
  VisualizationArea,
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

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">Binary Search</h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                Time: O(log n)
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded">
                Space: O(1)
              </span>
            </div>
          </div>

          {/* Target Input */}
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
        </div>
      </div>

      {/* Visualization Area */}
      <div className="p-4">
        <div className={`flex gap-4 ${showCode ? 'flex-col lg:flex-row' : ''}`}>
          {/* Main Visualization */}
          <VisualizationArea minHeight={350}>
            {/* Array Display */}
            <div className="flex items-center justify-center gap-1 flex-wrap mb-4">
              {array.map((value, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium text-sm transition-all duration-300 ${getElementStyle(index)}`}
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

            {/* Status */}
            <StatusPanel
              description={currentDescription}
              currentStep={currentStep}
              totalSteps={steps.length}
              variant={getStatusVariant()}
            />
          </VisualizationArea>

          {/* Code Panel */}
          {showCode && (
            <div className="w-full lg:w-56 flex-shrink-0 space-y-2">
              <CodePanel
                code={BINARY_SEARCH_CODE}
                activeLine={currentStepData?.codeLine ?? -1}
                variables={currentStepData?.variables}
              />
              <HelpPanel />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <ControlPanel
            isPlaying={isPlaying}
            currentStep={currentStep}
            totalSteps={steps.length}
            speed={speed}
            onPlayPause={handlePlayPause}
            onStep={handleStep}
            onStepBack={handleStepBack}
            onReset={handleReset}
            onSpeedChange={setSpeed}
            onShuffle={handleShuffle}
            showShuffle={true}
            shuffleLabel="New Array"
            accentColor="green"
          />
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
};

export const BinarySearchVisualizer = React.memo(
  BinarySearchVisualizerComponent
);
export default BinarySearchVisualizer;
