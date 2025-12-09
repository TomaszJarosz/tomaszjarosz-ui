import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  BaseVisualizerLayout,
  CodePanel,
  HelpPanel,
  ArrayInput,
  StepHistory,
  useUrlState,
  ALGORITHM_NAMES,
  ALGORITHM_COMPLEXITIES,
} from '../shared';
import type { SortingAlgorithm } from '../shared';

interface ArrayBar {
  value: number;
  state: 'default' | 'comparing' | 'swapping' | 'sorted' | 'pivot';
}

interface SortingStep {
  array: number[];
  comparing?: [number, number];
  swapping?: [number, number];
  sorted?: number[];
  pivot?: number;
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  comparisons: number;
  swaps: number;
}

interface SortingVisualizerProps {
  algorithm?: SortingAlgorithm;
  initialSize?: number;
  showControls?: boolean;
  showAlgorithmSelector?: boolean;
  showCode?: boolean;
  className?: string;
}

// Extended code with detailed comments - kept local as it differs from shared version
const ALGORITHM_CODE: Record<SortingAlgorithm, string[]> = {
  bubble: [
    'for (i = 0; i < n-1; i++)',
    '  for (j = 0; j < n-i-1; j++)',
    '    if (arr[j] > arr[j+1])',
    '      swap(arr[j], arr[j+1])',
  ],
  selection: [
    'for (i = 0; i < n-1; i++)',
    '  minIdx = i',
    '  for (j = i+1; j < n; j++)',
    '    if (arr[j] < arr[minIdx])',
    '      minIdx = j',
    '  swap(arr[i], arr[minIdx])',
  ],
  insertion: [
    'for (i = 1; i < n; i++)',
    '  key = arr[i]',
    '  j = i - 1',
    '  while (j >= 0 && arr[j] > key)',
    '    arr[j+1] = arr[j]',
    '    j--',
    '  arr[j+1] = key',
  ],
  quick: [
    'quickSort(arr, low, high):',
    '  if (low < high)',
    '    pivot = partition(arr, low, high)',
    '    quickSort(arr, low, pivot-1)',
    '    quickSort(arr, pivot+1, high)',
    '',
    'partition(arr, low, high):',
    '  pivot = arr[high]',
    '  i = low - 1',
    '  for (j = low; j < high; j++)',
    '    if (arr[j] <= pivot)',
    '      i++; swap(arr[i], arr[j])',
    '  swap(arr[i+1], arr[high])',
    '  return i + 1',
  ],
  merge: [
    'mergeSort(arr, l, r):',
    '  if (l < r)',
    '    mid = (l + r) / 2',
    '    mergeSort(arr, l, mid)',
    '    mergeSort(arr, mid+1, r)',
    '    merge(arr, l, mid, r)',
    '',
    'merge(arr, l, mid, r):',
    '  // merge left and right subarrays',
    '  while (i < left.len && j < right.len)',
    '    if (left[i] <= right[j])',
    '      arr[k++] = left[i++]',
    '    else arr[k++] = right[j++]',
  ],
};

const LEGEND_ITEMS = [
  { color: 'bg-blue-500', label: 'Default' },
  { color: 'bg-amber-400', label: 'Comparing' },
  { color: 'bg-red-500', label: 'Swapping' },
  { color: 'bg-purple-500', label: 'Pivot' },
  { color: 'bg-green-500', label: 'Sorted' },
];

// Generate sorting steps for each algorithm
function generateBubbleSortSteps(arr: number[]): SortingStep[] {
  const steps: SortingStep[] = [];
  const array = [...arr];
  const n = array.length;
  const sorted: number[] = [];
  let comparisons = 0;
  let swaps = 0;

  steps.push({
    array: [...array],
    description:
      'Starting Bubble Sort - will compare adjacent elements and swap if needed',
    codeLine: -1,
    comparisons: 0,
    swaps: 0,
  });

  for (let i = 0; i < n - 1; i++) {
    steps.push({
      array: [...array],
      sorted: [...sorted],
      description: `Pass ${i + 1}: Bubbling largest unsorted element to position ${n - 1 - i}`,
      codeLine: 0,
      variables: { i, n: n - 1 },
      comparisons,
      swaps,
    });

    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      steps.push({
        array: [...array],
        comparing: [j, j + 1],
        sorted: [...sorted],
        description: `Comparing arr[${j}]=${array[j]} with arr[${j + 1}]=${array[j + 1]}`,
        codeLine: 2,
        variables: { i, j, 'arr[j]': array[j], 'arr[j+1]': array[j + 1] },
        comparisons,
        swaps,
      });

      if (array[j] > array[j + 1]) {
        swaps++;
        steps.push({
          array: [...array],
          swapping: [j, j + 1],
          sorted: [...sorted],
          description: `${array[j]} > ${array[j + 1]} → Swapping!`,
          codeLine: 3,
          variables: { i, j, 'arr[j]': array[j], 'arr[j+1]': array[j + 1] },
          comparisons,
          swaps,
        });
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
      } else {
        steps.push({
          array: [...array],
          comparing: [j, j + 1],
          sorted: [...sorted],
          description: `${array[j]} ≤ ${array[j + 1]} → No swap needed`,
          codeLine: 2,
          variables: { i, j, 'arr[j]': array[j], 'arr[j+1]': array[j + 1] },
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
    description: '✓ Array sorted! All elements are in correct positions.',
    codeLine: -1,
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

  steps.push({
    array: [...array],
    description:
      'Starting Selection Sort - will find minimum and place it at the beginning',
    codeLine: -1,
    comparisons: 0,
    swaps: 0,
  });

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    steps.push({
      array: [...array],
      sorted: [...sorted],
      description: `Finding minimum in unsorted portion [${i}..${n - 1}]`,
      codeLine: 0,
      variables: { i, minIdx },
      comparisons,
      swaps,
    });

    for (let j = i + 1; j < n; j++) {
      comparisons++;
      steps.push({
        array: [...array],
        comparing: [minIdx, j],
        sorted: [...sorted],
        description: `Comparing current min arr[${minIdx}]=${array[minIdx]} with arr[${j}]=${array[j]}`,
        codeLine: 3,
        variables: {
          i,
          j,
          minIdx,
          'arr[minIdx]': array[minIdx],
          'arr[j]': array[j],
        },
        comparisons,
        swaps,
      });

      if (array[j] < array[minIdx]) {
        minIdx = j;
        steps.push({
          array: [...array],
          comparing: [minIdx, j],
          sorted: [...sorted],
          description: `Found new minimum: ${array[minIdx]} at index ${minIdx}`,
          codeLine: 4,
          variables: { i, j, minIdx, 'new min': array[minIdx] },
          comparisons,
          swaps,
        });
      }
    }

    if (minIdx !== i) {
      swaps++;
      steps.push({
        array: [...array],
        swapping: [i, minIdx],
        sorted: [...sorted],
        description: `Placing minimum ${array[minIdx]} at position ${i} (swapping with ${array[i]})`,
        codeLine: 5,
        variables: {
          i,
          minIdx,
          'arr[i]': array[i],
          'arr[minIdx]': array[minIdx],
        },
        comparisons,
        swaps,
      });
      [array[i], array[minIdx]] = [array[minIdx], array[i]];
    }

    sorted.push(i);
  }
  sorted.push(n - 1);

  steps.push({
    array: [...array],
    sorted: Array.from({ length: n }, (_, i) => i),
    description: '✓ Array sorted! All elements are in correct positions.',
    codeLine: -1,
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

  steps.push({
    array: [...array],
    sorted: [0],
    description: 'Starting Insertion Sort - first element is already "sorted"',
    codeLine: -1,
    comparisons: 0,
    swaps: 0,
  });

  for (let i = 1; i < n; i++) {
    const key = array[i];
    let j = i - 1;

    steps.push({
      array: [...array],
      comparing: [i, j],
      sorted: Array.from({ length: i }, (_, idx) => idx),
      description: `Taking key=${key} from index ${i}, will insert into sorted portion [0..${i - 1}]`,
      codeLine: 1,
      variables: { i, key, j },
      comparisons,
      swaps,
    });

    while (j >= 0 && array[j] > key) {
      comparisons++;
      swaps++;
      steps.push({
        array: [...array],
        swapping: [j, j + 1],
        sorted: Array.from({ length: i }, (_, idx) => idx),
        description: `arr[${j}]=${array[j]} > key=${key} → Shifting ${array[j]} right`,
        codeLine: 4,
        variables: { i, key, j, 'arr[j]': array[j] },
        comparisons,
        swaps,
      });
      array[j + 1] = array[j];
      j--;
    }
    if (j >= 0) comparisons++; // Final comparison that exits the while

    array[j + 1] = key;

    steps.push({
      array: [...array],
      sorted: Array.from({ length: i + 1 }, (_, idx) => idx),
      description: `Inserted key=${key} at position ${j + 1}`,
      codeLine: 6,
      variables: { i, key, position: j + 1 },
      comparisons,
      swaps,
    });
  }

  steps.push({
    array: [...array],
    sorted: Array.from({ length: n }, (_, i) => i),
    description: '✓ Array sorted! All elements are in correct positions.',
    codeLine: -1,
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

  steps.push({
    array: [...array],
    description: 'Starting QuickSort - will pick pivot and partition array',
    codeLine: -1,
    comparisons: 0,
    swaps: 0,
  });

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

    steps.push({
      array: [...array],
      pivot: high,
      sorted: [...sorted],
      description: `Partitioning [${low}..${high}]: pivot=${pivot} (rightmost element)`,
      codeLine: 7,
      variables: { low, high, pivot },
      comparisons: stats.comparisons,
      swaps: stats.swaps,
    });

    let i = low - 1;

    for (let j = low; j < high; j++) {
      stats.comparisons++;
      steps.push({
        array: [...array],
        comparing: [j, high],
        pivot: high,
        sorted: [...sorted],
        description: `Comparing arr[${j}]=${array[j]} with pivot=${pivot}`,
        codeLine: 10,
        variables: { i, j, pivot, 'arr[j]': array[j] },
        comparisons: stats.comparisons,
        swaps: stats.swaps,
      });

      if (array[j] <= pivot) {
        i++;
        if (i !== j) {
          stats.swaps++;
          steps.push({
            array: [...array],
            swapping: [i, j],
            pivot: high,
            sorted: [...sorted],
            description: `${array[j]} ≤ ${pivot} → Swapping arr[${i}]=${array[i]} with arr[${j}]=${array[j]}`,
            codeLine: 11,
            variables: { i, j, pivot },
            comparisons: stats.comparisons,
            swaps: stats.swaps,
          });
          [array[i], array[j]] = [array[j], array[i]];
        } else {
          steps.push({
            array: [...array],
            comparing: [j, high],
            pivot: high,
            sorted: [...sorted],
            description: `${array[j]} ≤ ${pivot} → Element already in correct position`,
            codeLine: 11,
            variables: { i, j, pivot },
            comparisons: stats.comparisons,
            swaps: stats.swaps,
          });
        }
      }
    }

    if (i + 1 !== high) {
      stats.swaps++;
      steps.push({
        array: [...array],
        swapping: [i + 1, high],
        sorted: [...sorted],
        description: `Placing pivot ${pivot} at its final position ${i + 1}`,
        codeLine: 12,
        variables: { 'pivot position': i + 1, pivot },
        comparisons: stats.comparisons,
        swaps: stats.swaps,
      });
      [array[i + 1], array[high]] = [array[high], array[i + 1]];
    }

    return i + 1;
  }

  quickSort(0, array.length - 1);

  steps.push({
    array: [...array],
    sorted: Array.from({ length: array.length }, (_, i) => i),
    description: '✓ Array sorted! All elements are in correct positions.',
    codeLine: -1,
    comparisons: stats.comparisons,
    swaps: stats.swaps,
  });

  return steps;
}

function generateMergeSortSteps(arr: number[]): SortingStep[] {
  const steps: SortingStep[] = [];
  const array = [...arr];
  const stats = { comparisons: 0, swaps: 0 }; // swaps = array writes for merge sort

  steps.push({
    array: [...array],
    description:
      'Starting MergeSort - will divide array and merge sorted halves',
    codeLine: -1,
    comparisons: 0,
    swaps: 0,
  });

  function mergeSort(start: number, end: number) {
    if (start >= end) return;

    const mid = Math.floor((start + end) / 2);

    steps.push({
      array: [...array],
      comparing: [start, end],
      description: `Dividing [${start}..${end}] into [${start}..${mid}] and [${mid + 1}..${end}]`,
      codeLine: 2,
      variables: { l: start, r: end, mid },
      comparisons: stats.comparisons,
      swaps: stats.swaps,
    });

    mergeSort(start, mid);
    mergeSort(mid + 1, end);
    merge(start, mid, end);
  }

  function merge(start: number, mid: number, end: number) {
    const left = array.slice(start, mid + 1);
    const right = array.slice(mid + 1, end + 1);

    steps.push({
      array: [...array],
      description: `Merging [${start}..${mid}]=[${left.join(',')}] and [${mid + 1}..${end}]=[${right.join(',')}]`,
      codeLine: 5,
      variables: { l: start, mid, r: end },
      comparisons: stats.comparisons,
      swaps: stats.swaps,
    });

    let i = 0,
      j = 0,
      k = start;

    while (i < left.length && j < right.length) {
      stats.comparisons++;
      steps.push({
        array: [...array],
        comparing: [start + i, mid + 1 + j],
        description: `Comparing left[${i}]=${left[i]} with right[${j}]=${right[j]}`,
        codeLine: 10,
        variables: { i, j, 'left[i]': left[i], 'right[j]': right[j] },
        comparisons: stats.comparisons,
        swaps: stats.swaps,
      });

      if (left[i] <= right[j]) {
        array[k] = left[i];
        stats.swaps++;
        steps.push({
          array: [...array],
          description: `${left[i]} ≤ ${right[j]} → Taking ${left[i]} from left`,
          codeLine: 11,
          variables: { k, value: left[i] },
          comparisons: stats.comparisons,
          swaps: stats.swaps,
        });
        i++;
      } else {
        array[k] = right[j];
        stats.swaps++;
        steps.push({
          array: [...array],
          description: `${left[i]} > ${right[j]} → Taking ${right[j]} from right`,
          codeLine: 12,
          variables: { k, value: right[j] },
          comparisons: stats.comparisons,
          swaps: stats.swaps,
        });
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
      description: `Merged result: [${array.slice(start, end + 1).join(', ')}]`,
      codeLine: -1,
      comparisons: stats.comparisons,
      swaps: stats.swaps,
    });
  }

  mergeSort(0, array.length - 1);

  steps.push({
    array: [...array],
    sorted: Array.from({ length: array.length }, (_, i) => i),
    description: '✓ Array sorted! All elements are in correct positions.',
    codeLine: -1,
    comparisons: stats.comparisons,
    swaps: stats.swaps,
  });

  return steps;
}

const STEP_GENERATORS: Record<
  SortingAlgorithm,
  (arr: number[]) => SortingStep[]
> = {
  bubble: generateBubbleSortSteps,
  selection: generateSelectionSortSteps,
  insertion: generateInsertionSortSteps,
  quick: generateQuickSortSteps,
  merge: generateMergeSortSteps,
};

function generateRandomArray(size: number): number[] {
  return Array.from(
    { length: size },
    () => Math.floor(Math.random() * 100) + 5
  );
}

const SortingVisualizerComponent: React.FC<SortingVisualizerProps> = ({
  algorithm: initialAlgorithm = 'bubble',
  initialSize = 10,
  showControls = true,
  showAlgorithmSelector = true,
  showCode = true,
  className = '',
}) => {
  const [algorithm, setAlgorithm] =
    useState<SortingAlgorithm>(initialAlgorithm);
  const [arraySize, setArraySize] = useState(initialSize);
  const [speed, setSpeed] = useState(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<SortingStep[]>([]);
  const [bars, setBars] = useState<ArrayBar[]>([]);
  const [customArray, setCustomArray] = useState<number[] | null>(null);
  const [historyCollapsed, setHistoryCollapsed] = useState(true);
  const [urlStateLoaded, setUrlStateLoaded] = useState(false);
  const [showComplexityTable, setShowComplexityTable] = useState(false);

  const playingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const VISUALIZER_ID = 'sorting-visualizer';

  // URL state management
  const { state: urlState, copyUrlToClipboard } = useUrlState({ prefix: 'sort', scrollToId: VISUALIZER_ID });

  const initializeArray = useCallback((useCustom?: number[]) => {
    const arrayToUse = useCustom ?? customArray ?? generateRandomArray(arraySize);
    const newSteps = STEP_GENERATORS[algorithm](arrayToUse);
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
    playingRef.current = false;
  }, [algorithm, arraySize, customArray]);

  const handleCustomArrayChange = useCallback((newArray: number[]) => {
    setCustomArray(newArray);
    setArraySize(newArray.length);
    initializeArray(newArray);
  }, [initializeArray]);

  // Load from URL state on mount
  useEffect(() => {
    if (urlState && !urlStateLoaded) {
      setUrlStateLoaded(true);
      if (urlState.algorithm && Object.keys(ALGORITHM_NAMES).includes(urlState.algorithm)) {
        setAlgorithm(urlState.algorithm as SortingAlgorithm);
      }
      if (urlState.array && urlState.array.length > 0) {
        setCustomArray(urlState.array);
        setArraySize(urlState.array.length);
      }
      if (urlState.speed !== undefined) {
        setSpeed(urlState.speed);
      }
    }
  }, [urlState, urlStateLoaded]);

  useEffect(() => {
    initializeArray();
  }, [initializeArray]);

  useEffect(() => {
    if (steps.length === 0) return;

    const step = steps[currentStep];
    const newBars: ArrayBar[] = step.array.map((value, index) => {
      let state: ArrayBar['state'] = 'default';

      if (step.sorted?.includes(index)) {
        state = 'sorted';
      } else if (step.pivot === index) {
        state = 'pivot';
      } else if (step.swapping?.includes(index)) {
        state = 'swapping';
      } else if (step.comparing?.includes(index)) {
        state = 'comparing';
      }

      return { value, state };
    });

    setBars(newBars);
  }, [currentStep, steps]);

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

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    playingRef.current = false;
    setCurrentStep(0);
  }, []);

  const handleShuffle = useCallback(() => {
    setIsPlaying(false);
    playingRef.current = false;
    setCustomArray(null); // Reset custom array on shuffle
    const newArray = generateRandomArray(arraySize);
    const newSteps = STEP_GENERATORS[algorithm](newArray);
    setSteps(newSteps);
    setCurrentStep(0);
  }, [algorithm, arraySize]);

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

  const getBarColor = (state: ArrayBar['state']): string => {
    switch (state) {
      case 'comparing':
        return 'bg-amber-400';
      case 'swapping':
        return 'bg-red-500';
      case 'sorted':
        return 'bg-green-500';
      case 'pivot':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  const maxValue = Math.max(...bars.map((b) => b.value), 1);
  const currentStepData = steps[currentStep];
  const currentDescription = currentStepData?.description || '';
  const complexity = ALGORITHM_COMPLEXITIES[algorithm];

  const currentArray = useMemo(() => {
    if (steps.length === 0) return [];
    return steps[0].array;
  }, [steps]);

  const historySteps = useMemo(() => {
    return steps.map((step) => ({
      description: step.description,
      comparisons: step.comparisons,
      swaps: step.swaps,
    }));
  }, [steps]);

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({
      array: currentArray,
      algorithm,
      speed,
    });
  }, [copyUrlToClipboard, currentArray, algorithm, speed]);

  const BADGES = useMemo(() => [
    { label: `Time: ${complexity.time}`, variant: 'indigo' as const },
    { label: `Space: ${complexity.space}`, variant: 'purple' as const },
    { label: `Comparisons: ${currentStepData?.comparisons ?? 0}`, variant: 'amber' as const },
    { label: `${algorithm === 'merge' ? 'Writes' : 'Swaps'}: ${currentStepData?.swaps ?? 0}`, variant: 'red' as const },
  ], [complexity, currentStepData, algorithm]);

  const sizeControl = useMemo(
    () => (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Size</label>
          <input
            type="range"
            min="5"
            max="20"
            value={arraySize}
            onChange={(e) => {
              setCustomArray(null);
              setArraySize(Number(e.target.value));
            }}
            disabled={isPlaying}
            className="w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
          />
          <span className="text-xs text-gray-500 w-6">{arraySize}</span>
        </div>
        <ArrayInput
          array={currentArray}
          onArrayChange={handleCustomArrayChange}
          disabled={isPlaying}
          accentColor="indigo"
        />
      </div>
    ),
    [arraySize, isPlaying, currentArray, handleCustomArrayChange]
  );

  const headerExtra = showAlgorithmSelector ? (
    <select
      value={algorithm}
      onChange={(e) => setAlgorithm(e.target.value as SortingAlgorithm)}
      className="px-3 py-1.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      disabled={isPlaying}
    >
      {Object.entries(ALGORITHM_NAMES).map(([key, name]) => (
        <option key={key} value={key}>
          {name}
        </option>
      ))}
    </select>
  ) : undefined;

  const visualization = (
    <>
            <div className="flex items-end justify-center gap-1 h-48 bg-gray-50 rounded-lg p-4">
              {bars.map((bar, index) => (
                <div
                  key={index}
                  className={`${getBarColor(bar.state)} rounded-t transition-colors duration-200 flex items-end justify-center relative group`}
                  style={{
                    height: `${(bar.value / maxValue) * 100}%`,
                    width: `${Math.max(100 / bars.length - 1, 8)}%`,
                    minWidth: '12px',
                    maxWidth: '50px',
                  }}
                >
                  {bars.length <= 15 && (
                    <span className="text-[10px] text-white font-bold mb-1">
                      {bar.value}
                    </span>
                  )}
                  <span className="absolute -bottom-5 text-[9px] text-gray-400">
                    {index}
                  </span>
                </div>
              ))}
            </div>

    </>
  );

  const sidePanel = showCode ? (
    <>
      <StepHistory
        steps={historySteps}
        currentStep={currentStep}
        onStepClick={setCurrentStep}
        maxHeight="180px"
        showStats={true}
        accentColor="indigo"
        collapsed={historyCollapsed}
        onToggleCollapse={() => setHistoryCollapsed(!historyCollapsed)}
      />
    </>
  ) : undefined;

  const footer = (
    <>
      {/* Complexity Comparison Table */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setShowComplexityTable(!showComplexityTable)}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showComplexityTable ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Algorithm Complexity Comparison
        </button>

        {showComplexityTable && (
          <div className="mt-3 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-indigo-900">
                    <th className="pb-2 pr-4 font-semibold">Algorithm</th>
                    <th className="pb-2 px-3 font-semibold text-center">Best</th>
                    <th className="pb-2 px-3 font-semibold text-center">Average</th>
                    <th className="pb-2 px-3 font-semibold text-center">Worst</th>
                    <th className="pb-2 px-3 font-semibold text-center">Space</th>
                    <th className="pb-2 pl-3 font-semibold text-center">Stable</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {(Object.keys(ALGORITHM_NAMES) as SortingAlgorithm[]).map((alg) => {
                    const comp = ALGORITHM_COMPLEXITIES[alg];
                    const isCurrentAlgorithm = alg === algorithm;
                    return (
                      <tr
                        key={alg}
                        className={`border-t border-indigo-100 ${isCurrentAlgorithm ? 'bg-indigo-100/50 font-medium' : ''}`}
                      >
                        <td className="py-2 pr-4">
                          <span className={isCurrentAlgorithm ? 'text-indigo-700' : ''}>
                            {ALGORITHM_NAMES[alg]}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            comp.best.includes('log') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {comp.best}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            comp.average.includes('log') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {comp.average}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            comp.worst.includes('log') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {comp.worst}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            comp.space === 'O(1)' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {comp.space}
                          </span>
                        </td>
                        <td className="py-2 pl-3 text-center">
                          {comp.stable ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-400">✗</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-indigo-600">
              <strong>Stable:</strong> A sorting algorithm is stable if elements with equal keys maintain their relative order.
            </p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title={ALGORITHM_NAMES[algorithm]}
      badges={BADGES}
      gradient="indigo"
      className={className}
      minHeight={300}
      onShare={handleShare}
      headerExtra={headerExtra}
      status={{
        description: currentDescription,
        currentStep,
        totalSteps: steps.length,
        variant: currentDescription.startsWith('✓') ? 'success' : 'default',
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
        accentColor: 'indigo',
        showShuffle: true,
        extraControls: sizeControl,
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? ALGORITHM_CODE[algorithm] : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
      sidePanel={sidePanel}
      footer={footer}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const SortingVisualizer = React.memo(SortingVisualizerComponent);
export default SortingVisualizer;
