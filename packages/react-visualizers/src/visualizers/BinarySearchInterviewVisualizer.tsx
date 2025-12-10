import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface SearchStep {
  left: number;
  right: number;
  mid: number;
  comparison: 'less' | 'greater' | 'equal' | null;
  description: string;
  found?: boolean;
}

interface BinarySearchInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'binarysearch-interview-visualizer';

const BADGES = [
  { label: 'Interview Mode', variant: 'green' as const },
  { label: 'O(log n)', variant: 'green' as const },
];

const SORTED_ARRAY = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
const TARGET = 23;

const LEGEND_ITEMS = [
  { color: 'bg-blue-100', label: 'Search Space' },
  { color: 'bg-gray-200', label: 'Eliminated' },
  { color: 'bg-purple-500', label: 'Mid' },
  { color: 'bg-green-500', label: 'Found' },
];

const BINARY_SEARCH_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'bs-1',
    question: 'What is the time complexity of binary search?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 1,
    explanation: 'Binary search eliminates half the remaining elements with each comparison, resulting in O(log₂n) comparisons. For 1 million elements, at most ~20 comparisons are needed.',
    hint: 'How many times can you halve n before reaching 1?',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'bs-2',
    question: 'What is the space complexity of iterative binary search?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctAnswer: 0,
    explanation: 'Iterative binary search uses O(1) space - just a few variables (left, right, mid). Recursive version uses O(log n) stack space.',
    difficulty: 'easy',
    topic: 'Space Complexity',
  },
  {
    id: 'bs-3',
    question: 'What is the prerequisite for binary search to work?',
    options: [
      'Array must be unsorted',
      'Array must be sorted',
      'Array must have unique elements',
      'Array must have even number of elements'
    ],
    correctAnswer: 1,
    explanation: 'Binary search requires a sorted array. The algorithm decides which half to search based on comparing mid element with target - this only works if elements are ordered.',
    difficulty: 'easy',
    topic: 'Prerequisites',
  },
  {
    id: 'bs-4',
    question: 'How do you calculate mid to avoid integer overflow?',
    options: [
      'mid = (left + right) / 2',
      'mid = left + (right - left) / 2',
      'mid = right - left / 2',
      'mid = (left * right) / 2'
    ],
    correctAnswer: 1,
    explanation: 'left + (right - left) / 2 avoids overflow when left + right exceeds Integer.MAX_VALUE. Equivalent to (left + right) / 2 mathematically, but safer.',
    hint: 'What if left and right are both very large?',
    difficulty: 'medium',
    topic: 'Implementation',
  },
  {
    id: 'bs-5',
    question: 'In binary search, what condition indicates the element is NOT found?',
    options: ['left == right', 'left > right', 'mid == target', 'left < 0'],
    correctAnswer: 1,
    explanation: 'When left > right, the search space is empty. This means we\'ve searched all possible positions without finding the target.',
    difficulty: 'easy',
    topic: 'Termination',
  },
  {
    id: 'bs-6',
    question: 'What is the worst-case number of comparisons for binary search on 1000 elements?',
    options: ['10', '500', '1000', '100'],
    correctAnswer: 0,
    explanation: 'log₂(1000) ≈ 10. Each comparison halves the search space: 1000→500→250→125→62→31→15→7→3→1. At most 10 comparisons needed.',
    difficulty: 'medium',
    topic: 'Analysis',
  },
  {
    id: 'bs-7',
    question: 'If the array has duplicates and you want the FIRST occurrence, what should you do when arr[mid] == target?',
    options: [
      'Return mid immediately',
      'Set right = mid - 1 and continue',
      'Set left = mid + 1 and continue',
      'Binary search cannot handle duplicates'
    ],
    correctAnswer: 1,
    explanation: 'To find the first occurrence, keep searching left even when found (right = mid - 1). Track the found index and continue until left > right. This is "lower bound" binary search.',
    hint: 'The target at mid might not be the first one.',
    difficulty: 'hard',
    topic: 'Variants',
  },
  {
    id: 'bs-8',
    question: 'What is the "binary search invariant"?',
    options: [
      'The array is always sorted',
      'If target exists, it\'s in arr[left..right]',
      'left is always less than mid',
      'mid is always the middle element'
    ],
    correctAnswer: 1,
    explanation: 'The invariant "if target exists, it\'s in arr[left..right]" must hold before each iteration. This is maintained by correctly updating left/right boundaries.',
    difficulty: 'medium',
    topic: 'Correctness',
  },
  {
    id: 'bs-9',
    question: 'When is linear search preferred over binary search?',
    options: [
      'When the array is large',
      'When the array is unsorted and one-time search',
      'When the array is already sorted',
      'Never, binary search is always better'
    ],
    correctAnswer: 1,
    explanation: 'For unsorted arrays with single search, linear O(n) beats sort O(n log n) + binary search O(log n). But for multiple searches on same data, sort once then binary search.',
    difficulty: 'medium',
    topic: 'Trade-offs',
  },
  {
    id: 'bs-10',
    question: 'What is "exponential search" used for?',
    options: [
      'Searching exponentially large arrays',
      'Finding range for binary search in unbounded/infinite arrays',
      'Searching unsorted arrays',
      'A slower alternative to binary search'
    ],
    correctAnswer: 1,
    explanation: 'Exponential search finds a range [2^k, 2^(k+1)] containing the target by doubling the index, then binary searches that range. Useful for unbounded arrays or when target is near the start.',
    difficulty: 'hard',
    topic: 'Advanced',
  },
];

function generateBinarySearchSteps(): SearchStep[] {
  const steps: SearchStep[] = [];
  let left = 0;
  let right = SORTED_ARRAY.length - 1;

  steps.push({
    left,
    right,
    mid: -1,
    comparison: null,
    description: `Search for ${TARGET} in sorted array`,
  });

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    steps.push({
      left,
      right,
      mid,
      comparison: null,
      description: `mid = (${left}+${right})/2 = ${mid}, arr[${mid}] = ${SORTED_ARRAY[mid]}`,
    });

    if (SORTED_ARRAY[mid] === TARGET) {
      steps.push({
        left,
        right,
        mid,
        comparison: 'equal',
        description: `Found! arr[${mid}] = ${TARGET}`,
        found: true,
      });
      return steps;
    } else if (SORTED_ARRAY[mid] < TARGET) {
      steps.push({
        left,
        right,
        mid,
        comparison: 'less',
        description: `${SORTED_ARRAY[mid]} < ${TARGET} → search right`,
      });
      left = mid + 1;
    } else {
      steps.push({
        left,
        right,
        mid,
        comparison: 'greater',
        description: `${SORTED_ARRAY[mid]} > ${TARGET} → search left`,
      });
      right = mid - 1;
    }
  }

  steps.push({
    left,
    right,
    mid: -1,
    comparison: null,
    description: `Not found! ${TARGET} not in array`,
    found: false,
  });

  return steps;
}

const BinarySearchInterviewVisualizerComponent: React.FC<BinarySearchInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'bs-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateBinarySearchSteps, []);

  const playback = useVisualizerPlayback<SearchStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: BINARY_SEARCH_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: SearchStep = playback.currentStepData || {
    left: 0,
    right: SORTED_ARRAY.length - 1,
    mid: -1,
    comparison: null,
    description: '',
  };

  const { left, right, mid, found } = stepData;

  const getElementStyle = (index: number): string => {
    if (found === true && index === mid) return 'bg-green-500 text-white';
    if (index === mid) return 'bg-purple-500 text-white';
    if (index < left || index > right) return 'bg-gray-200 text-gray-400';
    if (index === left || index === right) return 'bg-blue-400 text-white';
    return 'bg-blue-100 text-blue-800';
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const visualization = (
    <>
      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="text-sm text-green-800 text-center">
          <span className="font-medium">Binary Search:</span> O(log n) by halving search space each step
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg min-h-[60px]">
        {left <= right ? (
          <div className="text-xs text-center">
            <div>Search space: [{left}..{right}] = <span className="font-bold text-green-600">{right - left + 1}</span> elements</div>
            {mid >= 0 && <div className="mt-1">mid = ⌊({left}+{right})/2⌋ = <span className="font-bold text-purple-600">{mid}</span></div>}
          </div>
        ) : found === true ? (
          <div className="text-center text-green-800 font-bold">Found at index {mid}!</div>
        ) : (
          <div className="text-center text-red-800 font-bold">Not found</div>
        )}
      </div>

      <div className="flex items-center justify-center gap-1 flex-wrap mb-4">
        {SORTED_ARRAY.map((value, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={`w-9 h-9 flex items-center justify-center rounded-lg font-medium text-sm transition-colors ${getElementStyle(index)}`}>
              {value}
            </div>
            <span className="text-[9px] text-gray-400 mt-1">{index}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 text-xs">
        {left <= right && (
          <>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-400 rounded" />
              <span>L={left}</span>
            </div>
            {mid >= 0 && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-500 rounded" />
                <span>M={mid}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-400 rounded" />
              <span>R={right}</span>
            </div>
          </>
        )}
      </div>
    </>
  );

  const modeToggle = (
    <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
      <button
        onClick={() => setMode('visualize')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'visualize' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'interview' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
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
      accentColor="green"
    />
  ) : undefined;

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="Binary Search (Interview Mode)"
      badges={BADGES}
      gradient="green"
      className={className}
      minHeight={320}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description: stepData.description,
        currentStep: playback.currentStep,
        totalSteps: playback.steps.length,
        variant: found === true ? 'success' : found === false ? 'error' : 'default',
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
        accentColor: 'green',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      sidePanel={sidePanel}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const BinarySearchInterviewVisualizer = React.memo(BinarySearchInterviewVisualizerComponent);
export default BinarySearchInterviewVisualizer;
