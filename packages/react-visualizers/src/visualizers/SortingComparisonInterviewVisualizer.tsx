import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Shuffle } from 'lucide-react';
import {
  BaseVisualizerLayout,
  InterviewModePanel,
  useInterviewMode,
  ALGORITHM_NAMES,
  ALGORITHM_COMPLEXITIES,
} from '../shared';
import type { SortingAlgorithm, InterviewQuestion } from '../shared';

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

interface SortingComparisonInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
  shuffleQuestions?: boolean;
  onComplete?: (session: ReturnType<typeof useInterviewMode>['session']) => void;
}

const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'sort-1',
    question: 'Which sorting algorithm has the best average-case time complexity?',
    options: [
      'Bubble Sort - O(n^2)',
      'Quick Sort - O(n log n)',
      'Selection Sort - O(n^2)',
      'Insertion Sort - O(n^2)',
    ],
    correctAnswer: 1,
    explanation: 'Quick Sort has O(n log n) average case, which is optimal for comparison-based sorts. Bubble, Selection, and Insertion are O(n^2) average case.',
    hint: 'Divide-and-conquer algorithms are usually faster.',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'sort-2',
    question: 'Which sorting algorithm is "stable" (preserves relative order of equal elements)?',
    options: [
      'Quick Sort',
      'Heap Sort',
      'Merge Sort',
      'Selection Sort',
    ],
    correctAnswer: 2,
    explanation: 'Merge Sort is stable - equal elements maintain their original relative order. Quick Sort and Heap Sort are unstable; their partitioning can reorder equal elements.',
    hint: 'Think about how merging preserves order.',
    difficulty: 'medium',
    topic: 'Stability',
  },
  {
    id: 'sort-3',
    question: 'What is Quick Sort worst-case time complexity and when does it occur?',
    options: [
      'O(n log n) - always',
      'O(n^2) - already sorted or reverse sorted array',
      'O(n) - with optimal pivot',
      'O(n^2) - random array',
    ],
    correctAnswer: 1,
    explanation: 'Quick Sort degrades to O(n^2) when the pivot consistently divides the array poorly (e.g., always smallest/largest element). This happens with sorted/reverse-sorted input.',
    hint: 'What if pivot is always at one end?',
    difficulty: 'medium',
    topic: 'Quick Sort',
  },
  {
    id: 'sort-4',
    question: 'Which sorting algorithm is best for nearly-sorted data?',
    options: [
      'Quick Sort',
      'Merge Sort',
      'Insertion Sort',
      'Heap Sort',
    ],
    correctAnswer: 2,
    explanation: 'Insertion Sort runs in O(n) for nearly-sorted data because elements only need to move short distances. Other algorithms dont adapt to existing order.',
    hint: 'Which algorithm does minimal work when data is almost sorted?',
    difficulty: 'medium',
    topic: 'Adaptive Sorting',
  },
  {
    id: 'sort-5',
    question: 'What is the space complexity of Merge Sort?',
    options: [
      'O(1)',
      'O(log n)',
      'O(n)',
      'O(n log n)',
    ],
    correctAnswer: 2,
    explanation: 'Merge Sort requires O(n) auxiliary space for merging. During merge, elements are copied to temporary arrays. This is why its not "in-place" like Quick Sort.',
    hint: 'Merging requires extra space.',
    difficulty: 'medium',
    topic: 'Space Complexity',
  },
  {
    id: 'sort-6',
    question: 'Which sorting algorithm does Java Arrays.sort() use for primitives?',
    options: [
      'Merge Sort',
      'Quick Sort (Dual-Pivot)',
      'Heap Sort',
      'Tim Sort',
    ],
    correctAnswer: 1,
    explanation: 'Java uses Dual-Pivot Quick Sort for primitives (faster in practice). For objects, it uses Tim Sort (stable, hybrid of merge sort and insertion sort).',
    hint: 'Primitives dont need stability.',
    difficulty: 'hard',
    topic: 'Java Implementation',
  },
  {
    id: 'sort-7',
    question: 'What makes Bubble Sort inefficient?',
    options: [
      'It uses too much memory',
      'It makes many unnecessary comparisons even when array is sorted',
      'It cant handle negative numbers',
      'It only works on small arrays',
    ],
    correctAnswer: 1,
    explanation: 'Bubble Sort always makes O(n^2) comparisons unless optimized with a "swapped" flag. Even then, its slow due to many element swaps (O(n^2) swaps worst case).',
    hint: 'Think about the nested loops.',
    difficulty: 'easy',
    topic: 'Bubble Sort',
  },
  {
    id: 'sort-8',
    question: 'What is the key advantage of Selection Sort over Bubble Sort?',
    options: [
      'Better time complexity',
      'Fewer swaps - O(n) swaps vs O(n^2)',
      'Its stable',
      'Uses less memory',
    ],
    correctAnswer: 1,
    explanation: 'Selection Sort makes only O(n) swaps (one per iteration). Bubble Sort can make O(n^2) swaps. Both have O(n^2) comparisons, but fewer swaps can matter for expensive moves.',
    hint: 'Selection finds minimum, then swaps once.',
    difficulty: 'medium',
    topic: 'Selection Sort',
  },
  {
    id: 'sort-9',
    question: 'Which is NOT a divide-and-conquer sorting algorithm?',
    options: [
      'Merge Sort',
      'Quick Sort',
      'Heap Sort',
      'All of the above are divide-and-conquer',
    ],
    correctAnswer: 2,
    explanation: 'Heap Sort uses a heap data structure, not divide-and-conquer. It builds a max-heap, then repeatedly extracts the maximum. Merge and Quick Sort divide the array recursively.',
    hint: 'One uses a special data structure.',
    difficulty: 'medium',
    topic: 'Algorithm Paradigms',
  },
  {
    id: 'sort-10',
    question: 'What is the lower bound for comparison-based sorting?',
    options: [
      'O(n)',
      'O(n log n)',
      'O(n^2)',
      'O(log n)',
    ],
    correctAnswer: 1,
    explanation: 'Any comparison-based sort must make at least O(n log n) comparisons. This is proven via decision trees: n! permutations require log(n!) = O(n log n) comparisons to distinguish.',
    hint: 'Information theory gives us the lower bound.',
    difficulty: 'hard',
    topic: 'Theory',
  },
];

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

const STEP_GENERATORS: Record<'bubble' | 'quick', (arr: number[]) => SortingStep[]> = {
  bubble: generateBubbleSortSteps,
  quick: generateQuickSortSteps,
};

function generateRandomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 5);
}

const SortingComparisonInterviewVisualizerComponent: React.FC<SortingComparisonInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
  shuffleQuestions = false,
  onComplete,
}) => {
  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');
  const [algorithm1] = useState<'bubble'>('bubble');
  const [algorithm2] = useState<'quick'>('quick');
  const [arraySize] = useState(8);
  const [speed, setSpeed] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [baseArray, setBaseArray] = useState<number[]>([]);

  const [state1, setState1] = useState<AlgorithmState>({ steps: [], currentStep: 0, isFinished: false });
  const [state2, setState2] = useState<AlgorithmState>({ steps: [], currentStep: 0, isFinished: false });

  const playingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const interview = useInterviewMode({
    questions: INTERVIEW_QUESTIONS,
    shuffleQuestions,
    onComplete,
  });

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
    panelColor: string
  ) => {
    const step = state.steps[state.currentStep];
    if (!step) return null;

    const maxValue = Math.max(...step.array, 1);
    const complexity = ALGORITHM_COMPLEXITIES[algorithm];
    const finalStep = state.steps[state.steps.length - 1];

    return (
      <div className={`flex-1 border-2 rounded-lg overflow-hidden ${panelColor}`}>
        <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{ALGORITHM_NAMES[algorithm]}</span>
            <span className="text-xs text-gray-500">{complexity.time}</span>
          </div>
          {state.isFinished && (
            <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded">
              Done!
            </span>
          )}
        </div>

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

        <div className="px-3 py-2 bg-gray-50 border-t">
          <div className="flex justify-between text-xs">
            <div>
              <span className="text-gray-500">Steps: </span>
              <span className="font-medium">{state.currentStep + 1}/{state.steps.length}</span>
            </div>
            <div>
              <span className="text-yellow-600 font-medium">C: {step.comparisons}</span>
              <span className="text-gray-400 mx-1">|</span>
              <span className="text-red-600 font-medium">S: {step.swaps}</span>
            </div>
          </div>
          {state.isFinished && finalStep && (
            <div className="mt-1 text-xs text-gray-600 text-center">
              Total: {finalStep.comparisons} comparisons, {finalStep.swaps} swaps
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
    <div className="flex items-center gap-2">
      <button
        onClick={() => setMode('visualize')}
        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
          mode === 'visualize'
            ? 'bg-indigo-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
          mode === 'interview'
            ? 'bg-indigo-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Interview ({interview.session.results.length}/{INTERVIEW_QUESTIONS.length})
      </button>
      {mode === 'visualize' && (
        <span className="text-xs text-gray-500 ml-2">
          [{baseArray.slice(0, 4).join(', ')}...]
        </span>
      )}
    </div>
  );

  const visualization = mode === 'interview' ? (
    <InterviewModePanel
      currentQuestion={interview.currentQuestion}
      currentQuestionIndex={interview.session.currentQuestionIndex}
      totalQuestions={interview.session.questions.length}
      selectedAnswer={interview.selectedAnswer}
      showExplanation={interview.showExplanation}
      showHint={interview.showHint}
      isAnswered={interview.isAnswered}
      isComplete={interview.isComplete}
      score={interview.score}
      onSelectAnswer={interview.selectAnswer}
      onNextQuestion={interview.nextQuestion}
      onPreviousQuestion={interview.previousQuestion}
      onUseHint={interview.useHint}
      onRestart={interview.restartSession}
      accentColor="indigo"
    />
  ) : (
    <div className="flex gap-4">
      {renderAlgorithmPanel(algorithm1, state1, 'border-indigo-200')}
      <div className="flex items-center text-2xl font-bold text-gray-300">VS</div>
      {renderAlgorithmPanel(algorithm2, state2, 'border-purple-200')}
    </div>
  );

  const customControls = showControls && mode === 'visualize' ? (
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
  ) : undefined;

  const dynamicBadges = mode === 'interview'
    ? [{ label: 'Interview Mode', variant: 'indigo' as const }]
    : BADGES;

  return (
    <BaseVisualizerLayout
      id="sorting-comparison-interview-visualizer"
      title="Sorting Algorithm Race"
      badges={dynamicBadges}
      gradient="indigo"
      className={className}
      minHeight={350}
      headerExtra={headerExtra}
      showControls={false}
      footer={customControls}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const SortingComparisonInterviewVisualizer = React.memo(SortingComparisonInterviewVisualizerComponent);
export default SortingComparisonInterviewVisualizer;
