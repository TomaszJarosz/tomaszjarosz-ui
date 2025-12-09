import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Shuffle } from 'lucide-react';
import {
  BaseVisualizerLayout,
  CodePanel,
  ALGORITHM_NAMES,
  ALGORITHM_COMPLEXITIES,
  ALGORITHM_CODE,
} from '../shared';
import type { SortingAlgorithm } from '../shared';

interface SortingStep {
  array: number[];
  comparing?: [number, number];
  swapping?: [number, number];
  sorted?: number[];
  pivot?: number;
  description: string;
  comparisons: number;
  swaps: number;
}

interface AlgorithmState {
  steps: SortingStep[];
  currentStep: number;
  isFinished: boolean;
}

interface SortingComparisonVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

// Step generators (simplified from main visualizer)
function generateBubbleSortSteps(arr: number[]): SortingStep[] {
  const steps: SortingStep[] = [];
  const array = [...arr];
  const n = array.length;
  const sorted: number[] = [];
  let comparisons = 0;
  let swaps = 0;

  steps.push({ array: [...array], description: 'Start', comparisons: 0, swaps: 0 });

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      steps.push({
        array: [...array],
        comparing: [j, j + 1],
        sorted: [...sorted],
        description: `Compare ${array[j]} vs ${array[j + 1]}`,
        comparisons,
        swaps,
      });

      if (array[j] > array[j + 1]) {
        swaps++;
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        steps.push({
          array: [...array],
          swapping: [j, j + 1],
          sorted: [...sorted],
          description: `Swap`,
          comparisons,
          swaps,
        });
      }
    }
    sorted.unshift(n - 1 - i);
  }
  sorted.unshift(0);

  steps.push({
    array: [...array],
    sorted: Array.from({ length: n }, (_, i) => i),
    description: 'Done!',
    comparisons,
    swaps,
  });

  return steps;
}

function generateSelectionSortSteps(arr: number[]): SortingStep[] {
  const steps: SortingStep[] = [];
  const array = [...arr];
  const n = array.length;
  const sorted: number[] = [];
  let comparisons = 0;
  let swaps = 0;

  steps.push({ array: [...array], description: 'Start', comparisons: 0, swaps: 0 });

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    for (let j = i + 1; j < n; j++) {
      comparisons++;
      steps.push({
        array: [...array],
        comparing: [minIdx, j],
        sorted: [...sorted],
        description: `Find min`,
        comparisons,
        swaps,
      });

      if (array[j] < array[minIdx]) {
        minIdx = j;
      }
    }

    if (minIdx !== i) {
      swaps++;
      [array[i], array[minIdx]] = [array[minIdx], array[i]];
      steps.push({
        array: [...array],
        swapping: [i, minIdx],
        sorted: [...sorted],
        description: `Swap min`,
        comparisons,
        swaps,
      });
    }

    sorted.push(i);
  }
  sorted.push(n - 1);

  steps.push({
    array: [...array],
    sorted: Array.from({ length: n }, (_, i) => i),
    description: 'Done!',
    comparisons,
    swaps,
  });

  return steps;
}

function generateInsertionSortSteps(arr: number[]): SortingStep[] {
  const steps: SortingStep[] = [];
  const array = [...arr];
  const n = array.length;
  let comparisons = 0;
  let swaps = 0;

  steps.push({ array: [...array], sorted: [0], description: 'Start', comparisons: 0, swaps: 0 });

  for (let i = 1; i < n; i++) {
    const key = array[i];
    let j = i - 1;

    while (j >= 0 && array[j] > key) {
      comparisons++;
      swaps++;
      steps.push({
        array: [...array],
        swapping: [j, j + 1],
        sorted: Array.from({ length: i }, (_, idx) => idx),
        description: `Shift ${array[j]}`,
        comparisons,
        swaps,
      });
      array[j + 1] = array[j];
      j--;
    }
    if (j >= 0) comparisons++;

    array[j + 1] = key;
    steps.push({
      array: [...array],
      sorted: Array.from({ length: i + 1 }, (_, idx) => idx),
      description: `Insert ${key}`,
      comparisons,
      swaps,
    });
  }

  steps.push({
    array: [...array],
    sorted: Array.from({ length: n }, (_, i) => i),
    description: 'Done!',
    comparisons,
    swaps,
  });

  return steps;
}

function generateQuickSortSteps(arr: number[]): SortingStep[] {
  const steps: SortingStep[] = [];
  const array = [...arr];
  const sorted: Set<number> = new Set();
  const stats = { comparisons: 0, swaps: 0 };

  steps.push({ array: [...array], description: 'Start', comparisons: 0, swaps: 0 });

  function quickSort(low: number, high: number) {
    if (low < high) {
      const pivotIdx = partition(low, high);
      sorted.add(pivotIdx);
      quickSort(low, pivotIdx - 1);
      quickSort(pivotIdx + 1, high);
    } else if (low === high) {
      sorted.add(low);
    }
  }

  function partition(low: number, high: number): number {
    const pivot = array[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      stats.comparisons++;
      steps.push({
        array: [...array],
        comparing: [j, high],
        pivot: high,
        sorted: [...sorted],
        description: `Compare with pivot`,
        comparisons: stats.comparisons,
        swaps: stats.swaps,
      });

      if (array[j] <= pivot) {
        i++;
        if (i !== j) {
          stats.swaps++;
          [array[i], array[j]] = [array[j], array[i]];
          steps.push({
            array: [...array],
            swapping: [i, j],
            pivot: high,
            sorted: [...sorted],
            description: `Swap`,
            comparisons: stats.comparisons,
            swaps: stats.swaps,
          });
        }
      }
    }

    if (i + 1 !== high) {
      stats.swaps++;
      [array[i + 1], array[high]] = [array[high], array[i + 1]];
      steps.push({
        array: [...array],
        swapping: [i + 1, high],
        sorted: [...sorted],
        description: `Place pivot`,
        comparisons: stats.comparisons,
        swaps: stats.swaps,
      });
    }

    return i + 1;
  }

  quickSort(0, array.length - 1);

  steps.push({
    array: [...array],
    sorted: Array.from({ length: array.length }, (_, i) => i),
    description: 'Done!',
    comparisons: stats.comparisons,
    swaps: stats.swaps,
  });

  return steps;
}

function generateMergeSortSteps(arr: number[]): SortingStep[] {
  const steps: SortingStep[] = [];
  const array = [...arr];
  const stats = { comparisons: 0, swaps: 0 };

  steps.push({ array: [...array], description: 'Start', comparisons: 0, swaps: 0 });

  function mergeSort(start: number, end: number) {
    if (start >= end) return;

    const mid = Math.floor((start + end) / 2);
    mergeSort(start, mid);
    mergeSort(mid + 1, end);
    merge(start, mid, end);
  }

  function merge(start: number, mid: number, end: number) {
    const left = array.slice(start, mid + 1);
    const right = array.slice(mid + 1, end + 1);
    let i = 0, j = 0, k = start;

    while (i < left.length && j < right.length) {
      stats.comparisons++;
      if (left[i] <= right[j]) {
        array[k] = left[i];
        stats.swaps++;
        i++;
      } else {
        array[k] = right[j];
        stats.swaps++;
        j++;
      }
      k++;
    }

    while (i < left.length) {
      array[k] = left[i];
      stats.swaps++;
      i++;
      k++;
    }

    while (j < right.length) {
      array[k] = right[j];
      stats.swaps++;
      j++;
      k++;
    }

    steps.push({
      array: [...array],
      description: `Merge [${start}..${end}]`,
      comparisons: stats.comparisons,
      swaps: stats.swaps,
    });
  }

  mergeSort(0, array.length - 1);

  steps.push({
    array: [...array],
    sorted: Array.from({ length: array.length }, (_, i) => i),
    description: 'Done!',
    comparisons: stats.comparisons,
    swaps: stats.swaps,
  });

  return steps;
}

const STEP_GENERATORS: Record<SortingAlgorithm, (arr: number[]) => SortingStep[]> = {
  bubble: generateBubbleSortSteps,
  selection: generateSelectionSortSteps,
  insertion: generateInsertionSortSteps,
  quick: generateQuickSortSteps,
  merge: generateMergeSortSteps,
};

function generateRandomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 5);
}

const SortingComparisonVisualizerComponent: React.FC<SortingComparisonVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const [algorithm1, setAlgorithm1] = useState<SortingAlgorithm>('bubble');
  const [algorithm2, setAlgorithm2] = useState<SortingAlgorithm>('quick');
  const [arraySize, setArraySize] = useState(8);
  const [speed, setSpeed] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [baseArray, setBaseArray] = useState<number[]>([]);

  const [state1, setState1] = useState<AlgorithmState>({ steps: [], currentStep: 0, isFinished: false });
  const [state2, setState2] = useState<AlgorithmState>({ steps: [], currentStep: 0, isFinished: false });

  const playingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initialize = useCallback(() => {
    const newArray = generateRandomArray(arraySize);
    setBaseArray(newArray);

    const steps1 = STEP_GENERATORS[algorithm1]([...newArray]);
    const steps2 = STEP_GENERATORS[algorithm2]([...newArray]);

    setState1({ steps: steps1, currentStep: 0, isFinished: false });
    setState2({ steps: steps2, currentStep: 0, isFinished: false });
    setIsPlaying(false);
    playingRef.current = false;
  }, [algorithm1, algorithm2, arraySize]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const bothFinished = state1.isFinished && state2.isFinished;

    if (isPlaying && !bothFinished) {
      playingRef.current = true;
      const delay = Math.max(50, 1000 - speed * 9.5);

      timeoutRef.current = setTimeout(() => {
        if (playingRef.current) {
          setState1(prev => {
            if (prev.currentStep < prev.steps.length - 1) {
              return { ...prev, currentStep: prev.currentStep + 1 };
            }
            return { ...prev, isFinished: true };
          });

          setState2(prev => {
            if (prev.currentStep < prev.steps.length - 1) {
              return { ...prev, currentStep: prev.currentStep + 1 };
            }
            return { ...prev, isFinished: true };
          });
        }
      }, delay);
    } else if (bothFinished) {
      setIsPlaying(false);
      playingRef.current = false;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, state1.currentStep, state2.currentStep, state1.isFinished, state2.isFinished, speed]);

  const handlePlayPause = useCallback(() => {
    if (state1.isFinished && state2.isFinished) {
      setState1(prev => ({ ...prev, currentStep: 0, isFinished: false }));
      setState2(prev => ({ ...prev, currentStep: 0, isFinished: false }));
    }
    setIsPlaying(!isPlaying);
    playingRef.current = !isPlaying;
  }, [state1.isFinished, state2.isFinished, isPlaying]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    playingRef.current = false;
    setState1(prev => ({ ...prev, currentStep: 0, isFinished: false }));
    setState2(prev => ({ ...prev, currentStep: 0, isFinished: false }));
  }, []);

  const handleShuffle = useCallback(() => {
    setIsPlaying(false);
    playingRef.current = false;
    initialize();
  }, [initialize]);

  const getBarColor = (step: SortingStep, index: number): string => {
    if (step.sorted?.includes(index)) return 'bg-green-500';
    if (step.pivot === index) return 'bg-purple-500';
    if (step.swapping?.includes(index)) return 'bg-red-500';
    if (step.comparing?.includes(index)) return 'bg-yellow-400';
    return 'bg-blue-500';
  };

  const renderAlgorithmPanel = (
    algorithm: SortingAlgorithm,
    state: AlgorithmState,
    setAlgorithm: (alg: SortingAlgorithm) => void,
    otherAlgorithm: SortingAlgorithm,
    panelColor: string
  ) => {
    const step = state.steps[state.currentStep];
    if (!step) return null;

    const maxValue = Math.max(...step.array, 1);
    const complexity = ALGORITHM_COMPLEXITIES[algorithm];
    const finalStep = state.steps[state.steps.length - 1];
    const winner = state.isFinished && state1.isFinished && state2.isFinished;

    return (
      <div className={`flex-1 border-2 rounded-lg overflow-hidden ${panelColor}`}>
        {/* Header */}
        <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as SortingAlgorithm)}
              className="px-2 py-1 text-sm font-medium bg-white border border-gray-300 rounded shadow-sm"
              disabled={isPlaying}
            >
              {Object.entries(ALGORITHM_NAMES)
                .filter(([key]) => key !== otherAlgorithm)
                .map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
            </select>
            <span className="text-xs text-gray-500">{complexity.time}</span>
          </div>
          {state.isFinished && winner && (
            <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded">
              Finished!
            </span>
          )}
        </div>

        {/* Bars */}
        <div className="p-3">
          <div className="flex items-end justify-center gap-0.5 h-32 bg-gray-50 rounded p-2">
            {step.array.map((value, index) => (
              <div
                key={index}
                className={`${getBarColor(step, index)} rounded-t transition-colors duration-150`}
                style={{
                  height: `${(value / maxValue) * 100}%`,
                  width: `${Math.max(100 / step.array.length - 1, 6)}%`,
                  minWidth: '8px',
                }}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="px-3 py-2 bg-gray-50 border-t">
          <div className="flex justify-between text-xs">
            <div>
              <span className="text-gray-500">Steps: </span>
              <span className="font-medium">{state.currentStep + 1}/{state.steps.length}</span>
            </div>
            <div>
              <span className="text-yellow-600 font-medium">C: {step.comparisons}</span>
              <span className="text-gray-400 mx-1">|</span>
              <span className="text-red-600 font-medium">
                {algorithm === 'merge' ? 'W' : 'S'}: {step.swaps}
              </span>
            </div>
          </div>
          {state.isFinished && finalStep && (
            <div className="mt-1 text-xs text-gray-600 text-center">
              Total: {finalStep.comparisons} comparisons, {finalStep.swaps} {algorithm === 'merge' ? 'writes' : 'swaps'}
            </div>
          )}
        </div>
      </div>
    );
  };

  const BADGES = [
    { label: 'Race Mode', variant: 'indigo' as const },
  ];

  const headerExtra = (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span>Array: [{baseArray.slice(0, 5).join(', ')}{baseArray.length > 5 ? '...' : ''}]</span>
    </div>
  );

  const visualization = (
    <>
      <div className="flex gap-4">
        {renderAlgorithmPanel(algorithm1, state1, setAlgorithm1, algorithm2, 'border-indigo-200')}
        <div className="flex items-center text-2xl font-bold text-gray-300">VS</div>
        {renderAlgorithmPanel(algorithm2, state2, setAlgorithm2, algorithm1, 'border-purple-200')}
      </div>
    </>
  );

  const sidePanel = showCode ? (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="text-xs font-medium text-indigo-600 mb-2">{ALGORITHM_NAMES[algorithm1]}</div>
        <CodePanel code={ALGORITHM_CODE[algorithm1]} activeLine={-1} />
      </div>
      <div>
        <div className="text-xs font-medium text-purple-600 mb-2">{ALGORITHM_NAMES[algorithm2]}</div>
        <CodePanel code={ALGORITHM_CODE[algorithm2]} activeLine={-1} />
      </div>
    </div>
  ) : undefined;

  const customControls = showControls ? (
    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {isPlaying && (
                <span className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  Racing
                </span>
              )}
              <button
                onClick={handlePlayPause}
                className={`p-2 text-white rounded-lg transition-colors ${
                  isPlaying ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
                title="Play/Pause"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={handleReset}
                className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleShuffle}
                disabled={isPlaying}
                className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                title="New Array"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Size</label>
                <input
                  type="range"
                  min="5"
                  max="15"
                  value={arraySize}
                  onChange={(e) => setArraySize(Number(e.target.value))}
                  disabled={isPlaying}
                  className="w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
                <span className="text-xs text-gray-500 w-4">{arraySize}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Speed</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
    </div>
  ) : undefined;

  return (
    <BaseVisualizerLayout
      id="sorting-comparison-visualizer"
      title="Algorithm Comparison"
      badges={BADGES}
      gradient="indigo"
      className={className}
      minHeight={350}
      headerExtra={headerExtra}
      showControls={false}
      footer={
        <>
          {sidePanel && (
            <div className="px-4 py-3 border-t border-gray-200">
              {sidePanel}
            </div>
          )}
          {customControls}
        </>
      }
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const SortingComparisonVisualizer = React.memo(SortingComparisonVisualizerComponent);
export default SortingComparisonVisualizer;
