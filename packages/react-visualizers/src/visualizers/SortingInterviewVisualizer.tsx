import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface SortingStep {
  array: number[];
  comparing?: [number, number];
  swapping?: [number, number];
  sorted?: number[];
  pivot?: number;
  description: string;
}

interface SortingInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'sorting-interview-visualizer';
const INITIAL_ARRAY = [64, 34, 25, 12, 22, 11, 90];

const BADGES = [
  { label: 'O(n log n) avg', variant: 'amber' as const },
];

const LEGEND_ITEMS = [
  { color: 'bg-amber-400', label: 'Comparing' },
  { color: 'bg-red-400', label: 'Swapping' },
  { color: 'bg-green-400', label: 'Sorted' },
  { color: 'bg-purple-400', label: 'Pivot' },
];

// Interview questions about sorting algorithms
const SORTING_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'sort-1',
    question: 'What is the time complexity of QuickSort in the average case?',
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
    correctAnswer: 1,
    explanation: 'QuickSort has O(n log n) average time complexity. It partitions the array and recursively sorts each partition. The partitioning takes O(n) and occurs O(log n) times on average.',
    hint: 'Think about how the array is divided in each recursive call.',
    difficulty: 'easy',
    topic: 'QuickSort',
  },
  {
    id: 'sort-2',
    question: 'What is the worst-case time complexity of QuickSort?',
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
    correctAnswer: 2,
    explanation: 'QuickSort degrades to O(n²) when the pivot selection is poor (e.g., always picking smallest/largest element). This happens with already sorted arrays if using first/last element as pivot.',
    hint: 'Consider what happens with a sorted array and bad pivot choice.',
    difficulty: 'easy',
    topic: 'QuickSort',
  },
  {
    id: 'sort-3',
    question: 'Which sorting algorithm is stable?',
    options: ['QuickSort', 'HeapSort', 'MergeSort', 'Selection Sort'],
    correctAnswer: 2,
    explanation: 'MergeSort is stable - it preserves the relative order of equal elements. QuickSort and HeapSort are typically not stable. Selection Sort can be implemented stably but usually isn\'t.',
    hint: 'Stable means equal elements keep their original relative order.',
    difficulty: 'medium',
    topic: 'Stability',
  },
  {
    id: 'sort-4',
    question: 'What is the space complexity of MergeSort?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 2,
    explanation: 'MergeSort requires O(n) auxiliary space for merging. While the recursion depth is O(log n), the merge operation needs a temporary array of size n.',
    hint: 'Think about where merged elements are stored.',
    difficulty: 'medium',
    topic: 'MergeSort',
  },
  {
    id: 'sort-5',
    question: 'Which sorting algorithm is best for nearly sorted data?',
    options: ['QuickSort', 'Insertion Sort', 'Selection Sort', 'HeapSort'],
    correctAnswer: 1,
    explanation: 'Insertion Sort is O(n) for nearly sorted data because elements only need to move a few positions. QuickSort can degrade to O(n²) on sorted data with bad pivot selection.',
    difficulty: 'medium',
    topic: 'Best Case',
  },
  {
    id: 'sort-6',
    question: 'What is the time complexity of Counting Sort?',
    options: ['O(n log n)', 'O(n + k)', 'O(n²)', 'O(k log k)'],
    correctAnswer: 1,
    explanation: 'Counting Sort runs in O(n + k) where n is the number of elements and k is the range of input values. It\'s efficient when k is O(n), but impractical for large ranges.',
    hint: 'It\'s not comparison-based, so it can beat O(n log n).',
    difficulty: 'hard',
    topic: 'Non-comparison Sorts',
  },
  {
    id: 'sort-7',
    question: 'Why is HeapSort preferred over QuickSort in some systems?',
    options: [
      'HeapSort is faster on average',
      'HeapSort has guaranteed O(n log n) worst case',
      'HeapSort uses less memory',
      'HeapSort is stable',
    ],
    correctAnswer: 1,
    explanation: 'HeapSort guarantees O(n log n) in all cases, unlike QuickSort which can degrade to O(n²). HeapSort also sorts in-place with O(1) extra space. However, QuickSort is often faster in practice due to better cache performance.',
    difficulty: 'medium',
    topic: 'HeapSort',
  },
  {
    id: 'sort-8',
    question: 'What is the lower bound for comparison-based sorting?',
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
    correctAnswer: 1,
    explanation: 'Any comparison-based sorting algorithm must make at least Ω(n log n) comparisons in the worst case. This is proven using decision tree analysis - there are n! possible permutations requiring log(n!) = Θ(n log n) comparisons to distinguish.',
    hint: 'Think about how many comparisons are needed to distinguish n! permutations.',
    difficulty: 'hard',
    topic: 'Theory',
  },
  {
    id: 'sort-9',
    question: 'Which algorithm does Java\'s Arrays.sort() use for primitive arrays?',
    options: ['MergeSort', 'QuickSort', 'Dual-Pivot QuickSort', 'TimSort'],
    correctAnswer: 2,
    explanation: 'Java uses Dual-Pivot QuickSort for primitives (since Java 7). For objects, it uses TimSort (a hybrid of MergeSort and Insertion Sort) to guarantee stability and good performance on partially sorted data.',
    difficulty: 'hard',
    topic: 'Implementation',
  },
  {
    id: 'sort-10',
    question: 'What makes TimSort efficient for real-world data?',
    options: [
      'It uses O(1) extra space',
      'It exploits existing order in the data (runs)',
      'It has O(n) worst case',
      'It uses parallel processing',
    ],
    correctAnswer: 1,
    explanation: 'TimSort identifies and exploits "runs" (already sorted subsequences) in the data. Real-world data often has some order, so TimSort\'s adaptive approach outperforms pure MergeSort or QuickSort.',
    difficulty: 'hard',
    topic: 'TimSort',
  },
];

function generateQuickSortSteps(initialArray: number[]): SortingStep[] {
  const steps: SortingStep[] = [];
  const arr = [...initialArray];
  const sorted = new Set<number>();

  steps.push({
    array: [...arr],
    description: 'Initial array - starting QuickSort',
  });

  function quickSort(low: number, high: number): void {
    if (low < high) {
      const pivotIndex = partition(low, high);
      quickSort(low, pivotIndex - 1);
      quickSort(pivotIndex + 1, high);
    } else if (low === high) {
      sorted.add(low);
      steps.push({
        array: [...arr],
        sorted: Array.from(sorted),
        description: `Element at index ${low} is in final position`,
      });
    }
  }

  function partition(low: number, high: number): number {
    const pivot = arr[high];
    steps.push({
      array: [...arr],
      pivot: high,
      sorted: Array.from(sorted),
      description: `Pivot selected: ${pivot} at index ${high}`,
    });

    let i = low - 1;

    for (let j = low; j < high; j++) {
      steps.push({
        array: [...arr],
        comparing: [j, high],
        pivot: high,
        sorted: Array.from(sorted),
        description: `Comparing ${arr[j]} with pivot ${pivot}`,
      });

      if (arr[j] <= pivot) {
        i++;
        if (i !== j) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          steps.push({
            array: [...arr],
            swapping: [i, j],
            pivot: high,
            sorted: Array.from(sorted),
            description: `Swapping ${arr[j]} and ${arr[i]}`,
          });
        }
      }
    }

    if (i + 1 !== high) {
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      steps.push({
        array: [...arr],
        swapping: [i + 1, high],
        sorted: Array.from(sorted),
        description: `Placing pivot ${pivot} in final position ${i + 1}`,
      });
    }

    sorted.add(i + 1);
    steps.push({
      array: [...arr],
      sorted: Array.from(sorted),
      description: `Pivot ${pivot} is now in its final sorted position`,
    });

    return i + 1;
  }

  quickSort(0, arr.length - 1);

  // Mark all as sorted at the end
  steps.push({
    array: [...arr],
    sorted: arr.map((_, i) => i),
    description: 'Array is now sorted!',
  });

  return steps;
}

const SortingInterviewVisualizerComponent: React.FC<SortingInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'sort-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => () => generateQuickSortSteps(INITIAL_ARRAY), []);

  const playback = useVisualizerPlayback<SortingStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: SORTING_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: SortingStep = playback.currentStepData || {
    array: INITIAL_ARRAY,
    description: '',
  };

  const { array, comparing, swapping, sorted, pivot, description } = stepData;

  const maxValue = Math.max(...array);

  const getBarColor = (index: number): string => {
    if (swapping?.includes(index)) return 'bg-red-400';
    if (comparing?.includes(index)) return 'bg-amber-400';
    if (index === pivot) return 'bg-purple-400';
    if (sorted?.includes(index)) return 'bg-green-400';
    return 'bg-blue-400';
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const visualization = (
    <>
      {/* Bar Chart */}
      <div className="mb-4">
        <div className="flex items-end justify-center gap-2 h-48 px-4">
          {array.map((value, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-10 transition-all duration-200 rounded-t ${getBarColor(index)}`}
                style={{ height: `${(value / maxValue) * 160}px` }}
              />
              <div className="text-xs mt-1 font-mono">{value}</div>
              <div className="text-[10px] text-gray-400">[{index}]</div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Operation Info */}
      {pivot !== undefined && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-800">
            <span className="font-medium">Pivot:</span> {array[pivot]} at index {pivot}
          </div>
        </div>
      )}
    </>
  );

  const modeToggle = (
    <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
      <button
        onClick={() => setMode('visualize')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'visualize'
            ? 'bg-white text-orange-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'interview'
            ? 'bg-white text-orange-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Interview
      </button>
    </div>
  );

  const sidePanel = mode === 'interview' ? (
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
      accentColor="orange"
    />
  ) : undefined;

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="QuickSort (Interview Mode)"
      badges={BADGES}
      gradient="orange"
      className={className}
      minHeight={500}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description,
        currentStep: playback.currentStep,
        totalSteps: playback.steps.length,
        variant: sorted?.length === array.length ? 'success' : swapping ? 'warning' : 'default',
      }}
      controls={{
        isPlaying: playback.isPlaying,
        currentStep: playback.currentStep,
        totalSteps: playback.steps.length,
        speed: playback.speed,
        onPlayPause: playback.handlePlayPause,
        onStep: playback.handleStep,
        onStepBack: playback.handleStepBack,
        onReset: playback.handleReset,
        onSpeedChange: playback.setSpeed,
        accentColor: 'orange',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      sidePanel={sidePanel}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const SortingInterviewVisualizer = React.memo(SortingInterviewVisualizerComponent);
export default SortingInterviewVisualizer;
