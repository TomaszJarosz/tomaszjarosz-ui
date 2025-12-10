import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface HeapStep {
  operation: 'offer' | 'poll' | 'siftUp' | 'siftDown' | 'init' | 'done';
  value?: number;
  heap: number[];
  description: string;
  highlightIndex?: number;
  swapIndices?: [number, number];
  compareIndices?: [number, number];
}

interface PriorityQueueInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'priorityqueue-interview-visualizer';

const BADGES = [
  { label: 'Interview Mode', variant: 'purple' as const },
  { label: 'O(log n)', variant: 'purple' as const },
];

const OPERATIONS: Array<{ op: 'offer' | 'poll'; value?: number }> = [
  { op: 'offer', value: 50 },
  { op: 'offer', value: 30 },
  { op: 'offer', value: 70 },
  { op: 'offer', value: 20 },
  { op: 'poll' },
  { op: 'offer', value: 10 },
];

const LEGEND_ITEMS = [
  { color: 'bg-purple-100', label: 'Root (min)', border: '#c4b5fd' },
  { color: 'bg-purple-500', label: 'Active' },
  { color: 'bg-yellow-300', label: 'Comparing' },
  { color: 'bg-green-400', label: 'Swapped' },
];

const PRIORITYQUEUE_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'pq-1',
    question: 'What is the time complexity of offer() in a binary heap?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 1,
    explanation: 'offer() adds element at the end and sifts up. In worst case, element bubbles up to root through log(n) levels.',
    hint: 'How many levels does a complete binary tree have?',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'pq-2',
    question: 'What is the time complexity of poll() in a binary heap?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 1,
    explanation: 'poll() removes root, moves last element to root, then sifts down. Sift-down traverses at most log(n) levels.',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'pq-3',
    question: 'What is the time complexity of peek() in a PriorityQueue?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 0,
    explanation: 'peek() simply returns the root element without removing it. No restructuring needed, so O(1).',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'pq-4',
    question: 'How do you get the parent index from child index i in a binary heap?',
    options: ['(i + 1) / 2', '(i - 1) / 2', 'i / 2', '2 * i'],
    correctAnswer: 1,
    explanation: 'In 0-indexed heap: parent(i) = (i-1)/2. For left child: 2i+1, right child: 2i+2. These formulas enable O(1) navigation.',
    hint: 'The heap is 0-indexed, not 1-indexed.',
    difficulty: 'medium',
    topic: 'Index Formulas',
  },
  {
    id: 'pq-5',
    question: 'What is the time complexity of building a heap from n elements?',
    options: ['O(n)', 'O(n log n)', 'O(log n)', 'O(n²)'],
    correctAnswer: 0,
    explanation: 'Using bottom-up heapify (sift-down from n/2 to 0), building a heap is O(n). Most nodes are near leaves and require few swaps.',
    hint: 'Think about how many nodes are at each level.',
    difficulty: 'hard',
    topic: 'Build Heap',
  },
  {
    id: 'pq-6',
    question: 'What is the heap property of a min-heap?',
    options: [
      'Parent >= children',
      'Parent <= children',
      'Left child < right child',
      'All leaves are equal'
    ],
    correctAnswer: 1,
    explanation: 'In min-heap, every parent is smaller than or equal to its children. This ensures root is always the minimum element.',
    difficulty: 'easy',
    topic: 'Heap Property',
  },
  {
    id: 'pq-7',
    question: 'What data structure does Java\'s PriorityQueue use internally?',
    options: ['Balanced BST', 'Binary Heap (array)', 'Fibonacci Heap', 'Sorted ArrayList'],
    correctAnswer: 1,
    explanation: 'PriorityQueue uses a binary heap stored in an array. Array representation is cache-friendly and avoids pointer overhead.',
    difficulty: 'medium',
    topic: 'Implementation',
  },
  {
    id: 'pq-8',
    question: 'What is the time complexity of remove(Object) in PriorityQueue?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 2,
    explanation: 'remove(Object) requires linear search O(n) to find the element, then O(log n) to restore heap. Total: O(n).',
    difficulty: 'medium',
    topic: 'Operations',
  },
  {
    id: 'pq-9',
    question: 'Which statement about PriorityQueue iterator is TRUE?',
    options: [
      'Elements are returned in sorted order',
      'Elements are NOT guaranteed to be in sorted order',
      'Iterator is fail-safe',
      'Iterator supports remove() with O(1)'
    ],
    correctAnswer: 1,
    explanation: 'PriorityQueue iterator traverses the internal array in storage order, NOT priority order. Only poll() returns elements in order.',
    hint: 'The heap array is not fully sorted.',
    difficulty: 'hard',
    topic: 'Iterator Behavior',
  },
  {
    id: 'pq-10',
    question: 'What happens when you call offer(null) on PriorityQueue?',
    options: [
      'null is added successfully',
      'NullPointerException is thrown',
      'null is ignored silently',
      'Queue is cleared'
    ],
    correctAnswer: 1,
    explanation: 'PriorityQueue doesn\'t permit null elements because it needs to compare elements for ordering. NPE is thrown.',
    difficulty: 'easy',
    topic: 'Null Handling',
  },
];

function generatePriorityQueueSteps(): HeapStep[] {
  const steps: HeapStep[] = [];
  const heap: number[] = [];

  steps.push({
    operation: 'init',
    heap: [],
    description: 'Initialize min-heap PriorityQueue. Parent ≤ children.',
  });

  for (const { op, value } of OPERATIONS) {
    if (op === 'offer' && value !== undefined) {
      heap.push(value);
      let idx = heap.length - 1;

      steps.push({
        operation: 'offer',
        value,
        heap: [...heap],
        description: `offer(${value}): Add at index ${idx}`,
        highlightIndex: idx,
      });

      while (idx > 0) {
        const parentIdx = Math.floor((idx - 1) / 2);
        if (heap[idx] < heap[parentIdx]) {
          steps.push({
            operation: 'siftUp',
            heap: [...heap],
            description: `siftUp: ${heap[idx]} < ${heap[parentIdx]}, swap`,
            compareIndices: [idx, parentIdx],
          });

          [heap[idx], heap[parentIdx]] = [heap[parentIdx], heap[idx]];

          steps.push({
            operation: 'siftUp',
            heap: [...heap],
            description: `Swapped! Continue from index ${parentIdx}`,
            swapIndices: [idx, parentIdx],
            highlightIndex: parentIdx,
          });

          idx = parentIdx;
        } else {
          steps.push({
            operation: 'siftUp',
            heap: [...heap],
            description: `${heap[idx]} >= ${heap[parentIdx]}, heap OK`,
            highlightIndex: idx,
          });
          break;
        }
      }
    } else if (op === 'poll') {
      if (heap.length === 0) continue;

      const removed = heap[0];
      const last = heap.pop();
      if (last === undefined) continue;

      if (heap.length === 0) {
        steps.push({
          operation: 'poll',
          value: removed,
          heap: [],
          description: `poll() → ${removed}, heap empty`,
        });
        continue;
      }

      heap[0] = last;
      steps.push({
        operation: 'poll',
        value: removed,
        heap: [...heap],
        description: `poll() → ${removed}, move ${last} to root`,
        highlightIndex: 0,
      });

      let idx = 0;
      while (true) {
        const leftIdx = 2 * idx + 1;
        const rightIdx = 2 * idx + 2;
        let smallestIdx = idx;

        if (leftIdx < heap.length && heap[leftIdx] < heap[smallestIdx]) {
          smallestIdx = leftIdx;
        }
        if (rightIdx < heap.length && heap[rightIdx] < heap[smallestIdx]) {
          smallestIdx = rightIdx;
        }

        if (smallestIdx === idx) {
          steps.push({
            operation: 'siftDown',
            heap: [...heap],
            description: `siftDown: heap property satisfied`,
            highlightIndex: idx,
          });
          break;
        }

        steps.push({
          operation: 'siftDown',
          heap: [...heap],
          description: `siftDown: swap with smaller child`,
          compareIndices: [idx, smallestIdx],
        });

        [heap[idx], heap[smallestIdx]] = [heap[smallestIdx], heap[idx]];

        steps.push({
          operation: 'siftDown',
          heap: [...heap],
          description: `Swapped, continue from ${smallestIdx}`,
          swapIndices: [idx, smallestIdx],
          highlightIndex: smallestIdx,
        });

        idx = smallestIdx;
      }
    }
  }

  steps.push({
    operation: 'done',
    heap: [...heap],
    description: `Done! Min-heap with ${heap.length} elements. Root = ${heap[0]}`,
  });

  return steps;
}

function getTreePositions(size: number): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const width = 280;

  for (let i = 0; i < size; i++) {
    const level = Math.floor(Math.log2(i + 1));
    const levelStart = Math.pow(2, level) - 1;
    const posInLevel = i - levelStart;
    const nodesInLevel = Math.pow(2, level);
    const spacing = width / (nodesInLevel + 1);

    positions.push({
      x: spacing * (posInLevel + 1),
      y: level * 50 + 25,
    });
  }

  return positions;
}

const PriorityQueueInterviewVisualizerComponent: React.FC<PriorityQueueInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'pq-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generatePriorityQueueSteps, []);

  const playback = useVisualizerPlayback<HeapStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: PRIORITYQUEUE_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: HeapStep = playback.currentStepData || {
    operation: 'init',
    heap: [],
    description: '',
  };

  const { heap, highlightIndex, swapIndices, compareIndices } = stepData;
  const positions = getTreePositions(heap.length);

  const getNodeStyle = (idx: number): string => {
    if (idx === highlightIndex) return 'fill-purple-500 stroke-purple-600';
    if (swapIndices?.includes(idx)) return 'fill-green-400 stroke-green-500';
    if (compareIndices?.includes(idx)) return 'fill-yellow-300 stroke-yellow-400';
    if (idx === 0) return 'fill-purple-100 stroke-purple-300';
    return 'fill-white stroke-gray-300';
  };

  const getTextColor = (idx: number): string => {
    if (idx === highlightIndex || swapIndices?.includes(idx)) return 'white';
    return '#374151';
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const visualization = (
    <>
      <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <div className="text-sm text-purple-800 text-center">
          <span className="font-medium">PriorityQueue:</span> O(log n) offer/poll, O(1) peek
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <div className="text-xs text-center text-gray-600 mb-2">
          parent(i) = (i-1)/2 | left(i) = 2i+1 | right(i) = 2i+2
        </div>
      </div>

      <div className="mb-4 bg-gray-50 rounded-lg p-2 overflow-x-auto">
        {heap.length > 0 ? (
          <svg
            width="280"
            height={Math.floor(Math.log2(heap.length)) * 50 + 70}
            className="mx-auto"
          >
            {heap.map((_, idx) => {
              if (idx === 0) return null;
              const parentIdx = Math.floor((idx - 1) / 2);
              const parentPos = positions[parentIdx];
              const childPos = positions[idx];
              if (!parentPos || !childPos) return null;

              const isHighlighted =
                (compareIndices?.includes(idx) && compareIndices?.includes(parentIdx)) ||
                (swapIndices?.includes(idx) && swapIndices?.includes(parentIdx));

              return (
                <line
                  key={`edge-${idx}`}
                  x1={parentPos.x}
                  y1={parentPos.y}
                  x2={childPos.x}
                  y2={childPos.y}
                  stroke={isHighlighted ? '#a855f7' : '#d1d5db'}
                  strokeWidth={isHighlighted ? 2 : 1}
                />
              );
            })}
            {heap.map((val, idx) => {
              const pos = positions[idx];
              if (!pos) return null;

              return (
                <g key={idx} transform={`translate(${pos.x}, ${pos.y})`}>
                  <circle r="16" className={`${getNodeStyle(idx)} stroke-2`} />
                  <text textAnchor="middle" dy="5" className="text-xs font-medium" fill={getTextColor(idx)}>
                    {val}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="h-16 flex items-center justify-center text-gray-400 text-sm">Empty heap</div>
        )}
      </div>

      {heap.length > 0 && (
        <div className="mb-4 p-2 bg-gray-100 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">Array representation:</div>
          <div className="flex gap-1 overflow-x-auto">
            {heap.map((val, idx) => (
              <div
                key={idx}
                className={`w-8 h-8 flex items-center justify-center rounded text-xs font-mono ${
                  idx === highlightIndex
                    ? 'bg-purple-500 text-white'
                    : idx === 0
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-white border border-gray-300'
                }`}
              >
                {val}
              </div>
            ))}
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
          mode === 'visualize' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'interview' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
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
      accentColor="purple"
    />
  ) : undefined;

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="PriorityQueue (Interview Mode)"
      badges={BADGES}
      gradient="purple"
      className={className}
      minHeight={350}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description: stepData.description,
        currentStep: playback.currentStep,
        totalSteps: playback.steps.length,
        variant: stepData.operation === 'done' ? 'success' : 'default',
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
        accentColor: 'purple',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      sidePanel={sidePanel}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const PriorityQueueInterviewVisualizer = React.memo(PriorityQueueInterviewVisualizerComponent);
export default PriorityQueueInterviewVisualizer;
