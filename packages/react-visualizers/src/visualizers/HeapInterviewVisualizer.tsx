import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface HeapStep {
  operation: 'init' | 'insert' | 'siftUp' | 'extractMax' | 'siftDown' | 'done';
  array: number[];
  heapSize: number;
  highlightIndex?: number;
  compareIndices?: [number, number];
  swapIndices?: [number, number];
  description: string;
}

interface HeapInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'heap-interview-visualizer';

const BADGES = [
  { label: 'Interview Mode', variant: 'orange' as const },
  { label: 'Max-Heap', variant: 'amber' as const },
];

const OPERATIONS: Array<{ op: 'insert' | 'extractMax'; value?: number }> = [
  { op: 'insert', value: 40 },
  { op: 'insert', value: 20 },
  { op: 'insert', value: 60 },
  { op: 'insert', value: 10 },
  { op: 'insert', value: 50 },
  { op: 'extractMax' },
  { op: 'insert', value: 55 },
  { op: 'extractMax' },
];

const LEGEND_ITEMS = [
  { color: 'bg-orange-500', label: 'Root (max)' },
  { color: 'bg-amber-400', label: 'Comparing' },
  { color: 'bg-green-400', label: 'Swapped' },
  { color: 'bg-blue-200', label: 'Current', border: '#60a5fa' },
];

// Interview questions about Heap
const HEAP_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'heap-1',
    question: 'What is the time complexity of inserting an element into a heap?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 1,
    explanation: 'Insertion is O(log n) because after adding the element at the end, we may need to "sift up" through at most log n levels (height of the tree) to restore the heap property.',
    hint: 'Think about the height of a complete binary tree.',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'heap-2',
    question: 'What is the time complexity of building a heap from an unsorted array?',
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
    correctAnswer: 0,
    explanation: 'Building a heap using bottom-up heapify is O(n), not O(n log n)! This is because most nodes are near the bottom and require few swaps. The mathematical analysis shows the total work is O(n).',
    hint: 'It\'s better than calling insert() n times.',
    difficulty: 'medium',
    topic: 'Build Heap',
  },
  {
    id: 'heap-3',
    question: 'In a max-heap stored as an array, what is the index of the left child of node at index i?',
    options: ['i + 1', '2i', '2i + 1', '(i - 1) / 2'],
    correctAnswer: 2,
    explanation: 'For 0-indexed arrays: left child = 2i + 1, right child = 2i + 2, parent = ⌊(i-1)/2⌋. For 1-indexed: left = 2i, right = 2i + 1, parent = ⌊i/2⌋.',
    hint: 'The formula depends on whether the array is 0-indexed or 1-indexed.',
    difficulty: 'easy',
    topic: 'Index Formulas',
  },
  {
    id: 'heap-4',
    question: 'What type of binary tree is a heap?',
    options: ['Full binary tree', 'Complete binary tree', 'Perfect binary tree', 'Binary search tree'],
    correctAnswer: 1,
    explanation: 'A heap is a complete binary tree: all levels are fully filled except possibly the last, which is filled from left to right. This allows efficient array storage without pointers.',
    difficulty: 'easy',
    topic: 'Structure',
  },
  {
    id: 'heap-5',
    question: 'What is the time complexity of HeapSort?',
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
    correctAnswer: 1,
    explanation: 'HeapSort is O(n log n): O(n) to build the heap, then n extract operations each taking O(log n). Unlike QuickSort, HeapSort has guaranteed O(n log n) worst case.',
    difficulty: 'easy',
    topic: 'HeapSort',
  },
  {
    id: 'heap-6',
    question: 'Which operation is NOT efficiently supported by a standard heap?',
    options: ['Find min/max', 'Insert', 'Delete min/max', 'Search for arbitrary element'],
    correctAnswer: 3,
    explanation: 'Heaps don\'t support efficient search - finding an arbitrary element requires O(n) time as you may need to scan the entire array. Heaps are optimized for min/max operations only.',
    hint: 'A heap is not ordered like a BST.',
    difficulty: 'medium',
    topic: 'Limitations',
  },
  {
    id: 'heap-7',
    question: 'What is the space complexity of HeapSort?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 0,
    explanation: 'HeapSort is an in-place sorting algorithm with O(1) extra space. The heap is built within the original array. Only O(log n) stack space is used if implemented recursively.',
    difficulty: 'medium',
    topic: 'Space Complexity',
  },
  {
    id: 'heap-8',
    question: 'In a min-heap with n elements, where can the maximum element be?',
    options: ['Only at the root', 'Only at the last level', 'At any leaf node', 'Anywhere in the heap'],
    correctAnswer: 2,
    explanation: 'In a min-heap, the maximum must be at a leaf node (it cannot have any children smaller than it). The maximum could be any of the ⌈n/2⌉ leaf nodes.',
    hint: 'Think about the heap property and where max cannot be.',
    difficulty: 'medium',
    topic: 'Heap Property',
  },
  {
    id: 'heap-9',
    question: 'What data structure is typically used to implement a priority queue?',
    options: ['Sorted array', 'Linked list', 'Binary heap', 'Hash table'],
    correctAnswer: 2,
    explanation: 'Binary heaps are the standard implementation for priority queues because they provide O(log n) insert and extract-min/max operations. Sorted arrays have O(n) insert, and hash tables don\'t maintain order.',
    difficulty: 'easy',
    topic: 'Applications',
  },
  {
    id: 'heap-10',
    question: 'What is a Fibonacci heap\'s advantage over a binary heap?',
    options: [
      'Simpler implementation',
      'Better worst-case insert and decrease-key: O(1) amortized',
      'Uses less memory',
      'Faster extract-min operation',
    ],
    correctAnswer: 1,
    explanation: 'Fibonacci heaps have O(1) amortized insert and decrease-key operations (vs O(log n) for binary heaps). This makes them theoretically better for Dijkstra\'s algorithm, though binary heaps are often faster in practice due to constants.',
    difficulty: 'hard',
    topic: 'Advanced',
  },
];

function generateHeapSteps(): HeapStep[] {
  const steps: HeapStep[] = [];
  const heap: number[] = [];

  steps.push({
    operation: 'init',
    array: [],
    heapSize: 0,
    description: 'Initialize empty Max-Heap. Parent ≥ children.',
  });

  for (const { op, value } of OPERATIONS) {
    if (op === 'insert' && value !== undefined) {
      heap.push(value);
      let idx = heap.length - 1;

      steps.push({
        operation: 'insert',
        array: [...heap],
        heapSize: heap.length,
        highlightIndex: idx,
        description: `insert(${value}): Add at index ${idx}`,
      });

      // Sift up
      while (idx > 0) {
        const parentIdx = Math.floor((idx - 1) / 2);

        steps.push({
          operation: 'siftUp',
          array: [...heap],
          heapSize: heap.length,
          compareIndices: [idx, parentIdx],
          description: `Compare ${heap[idx]} with parent ${heap[parentIdx]}`,
        });

        if (heap[idx] > heap[parentIdx]) {
          [heap[idx], heap[parentIdx]] = [heap[parentIdx], heap[idx]];

          steps.push({
            operation: 'siftUp',
            array: [...heap],
            heapSize: heap.length,
            swapIndices: [idx, parentIdx],
            description: `${heap[parentIdx]} > ${heap[idx]}, swap!`,
          });

          idx = parentIdx;
        } else {
          break;
        }
      }
    } else if (op === 'extractMax') {
      if (heap.length === 0) continue;

      const max = heap[0];
      const last = heap.pop()!;

      if (heap.length === 0) {
        steps.push({
          operation: 'extractMax',
          array: [],
          heapSize: 0,
          description: `extractMax() = ${max}, heap is now empty`,
        });
        continue;
      }

      heap[0] = last;

      steps.push({
        operation: 'extractMax',
        array: [...heap],
        heapSize: heap.length,
        highlightIndex: 0,
        description: `extractMax() = ${max}, move ${last} to root`,
      });

      // Sift down
      let idx = 0;
      while (true) {
        const left = 2 * idx + 1;
        const right = 2 * idx + 2;
        let largest = idx;

        if (left < heap.length && heap[left] > heap[largest]) {
          largest = left;
        }
        if (right < heap.length && heap[right] > heap[largest]) {
          largest = right;
        }

        if (largest === idx) break;

        steps.push({
          operation: 'siftDown',
          array: [...heap],
          heapSize: heap.length,
          compareIndices: [idx, largest],
          description: `Compare ${heap[idx]} with larger child ${heap[largest]}`,
        });

        [heap[idx], heap[largest]] = [heap[largest], heap[idx]];

        steps.push({
          operation: 'siftDown',
          array: [...heap],
          heapSize: heap.length,
          swapIndices: [idx, largest],
          description: `Swap! ${heap[idx]} moved up`,
        });

        idx = largest;
      }
    }
  }

  steps.push({
    operation: 'done',
    array: [...heap],
    heapSize: heap.length,
    description: `Done! Heap has ${heap.length} elements. Max = ${heap[0] || 'none'}`,
  });

  return steps;
}

// Tree positions
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

const HeapInterviewVisualizerComponent: React.FC<HeapInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'heap-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateHeapSteps, []);

  const playback = useVisualizerPlayback<HeapStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: HEAP_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: HeapStep = playback.currentStepData || {
    operation: 'init',
    array: [],
    heapSize: 0,
    description: '',
  };

  const { array, highlightIndex, compareIndices, swapIndices, description } = stepData;
  const positions = getTreePositions(array.length);

  const getNodeStyle = (idx: number): string => {
    if (swapIndices?.includes(idx)) return 'fill-green-400 stroke-green-500';
    if (compareIndices?.includes(idx)) return 'fill-amber-400 stroke-amber-500';
    if (idx === highlightIndex) return 'fill-blue-200 stroke-blue-400';
    if (idx === 0) return 'fill-orange-500 stroke-orange-600';
    return 'fill-white stroke-gray-300';
  };

  const getTextColor = (idx: number): string => {
    if (swapIndices?.includes(idx) || idx === 0) return 'white';
    return '#374151';
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const visualization = (
    <>
      {/* Heap Property */}
      <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
        <div className="text-sm text-orange-800 text-center">
          <span className="font-medium">Max-Heap Property:</span> parent ≥ children
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="mb-4 bg-gray-50 rounded-lg p-2 min-h-[160px] flex items-center justify-center">
        {array.length > 0 ? (
          <svg width="280" height={Math.max(Math.floor(Math.log2(array.length)) * 50 + 60, 80)} className="mx-auto">
            {/* Edges */}
            {array.map((_, idx) => {
              if (idx === 0) return null;
              const parentIdx = Math.floor((idx - 1) / 2);
              const parentPos = positions[parentIdx];
              const childPos = positions[idx];
              if (!parentPos || !childPos) return null;

              const isActive = (compareIndices?.includes(idx) && compareIndices?.includes(parentIdx)) ||
                             (swapIndices?.includes(idx) && swapIndices?.includes(parentIdx));

              return (
                <line
                  key={`edge-${idx}`}
                  x1={parentPos.x}
                  y1={parentPos.y}
                  x2={childPos.x}
                  y2={childPos.y}
                  stroke={isActive ? '#f59e0b' : '#d1d5db'}
                  strokeWidth={isActive ? 2 : 1}
                />
              );
            })}

            {/* Nodes */}
            {array.map((val, idx) => {
              const pos = positions[idx];
              if (!pos) return null;

              return (
                <g key={idx} transform={`translate(${pos.x}, ${pos.y})`}>
                  <circle r="16" className={`${getNodeStyle(idx)} stroke-2`} />
                  <text textAnchor="middle" dy="5" className="text-xs font-bold" fill={getTextColor(idx)}>
                    {val}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <span className="text-gray-400 text-sm">Empty heap</span>
        )}
      </div>

      {/* Array representation - always visible */}
      <div className="mb-4 p-3 bg-gray-100 rounded-lg min-h-[60px]">
        <div className="text-xs text-gray-600 mb-1">Array: </div>
        {array.length > 0 ? (
          <div className="flex gap-1 flex-wrap">
            {array.map((val, idx) => (
              <div
                key={idx}
                className={`w-8 h-8 flex items-center justify-center rounded text-xs font-mono ${
                  swapIndices?.includes(idx)
                    ? 'bg-green-400 text-white'
                    : compareIndices?.includes(idx)
                      ? 'bg-amber-400 text-white'
                      : idx === 0
                        ? 'bg-orange-500 text-white'
                        : 'bg-white border border-gray-300'
                }`}
              >
                {val}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-gray-400 text-xs italic">Elements will appear here...</span>
        )}
      </div>
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
      title="Heap (Interview Mode)"
      badges={BADGES}
      gradient="orange"
      className={className}
      minHeight={450}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description,
        currentStep: playback.currentStep,
        totalSteps: playback.steps.length,
        variant: stepData.operation === 'done' ? 'success' : swapIndices ? 'warning' : 'default',
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

export const HeapInterviewVisualizer = React.memo(HeapInterviewVisualizerComponent);
export default HeapInterviewVisualizer;
