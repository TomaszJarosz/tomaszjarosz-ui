import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface ArrayDequeStep {
  operation: 'init' | 'addFirst' | 'addLast' | 'removeFirst' | 'removeLast' | 'resize' | 'done';
  value?: number;
  array: (number | null)[];
  head: number;
  tail: number;
  capacity: number;
  description: string;
  highlightIndex?: number;
}

interface ArrayDequeInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'arraydeque-interview-visualizer';

const BADGES = [
  { label: 'Interview Mode', variant: 'cyan' as const },
  { label: 'O(1) all ops', variant: 'cyan' as const },
];

const INITIAL_CAPACITY = 8;

const OPERATIONS: Array<{ op: 'addFirst' | 'addLast' | 'removeFirst' | 'removeLast'; value?: number }> = [
  { op: 'addLast', value: 10 },
  { op: 'addLast', value: 20 },
  { op: 'addFirst', value: 5 },
  { op: 'addLast', value: 30 },
  { op: 'removeFirst' },
  { op: 'removeLast' },
];

const LEGEND_ITEMS = [
  { color: 'bg-cyan-500', label: 'Head' },
  { color: 'bg-indigo-500', label: 'Tail' },
  { color: 'bg-green-400', label: 'Added' },
  { color: 'bg-blue-100', label: 'Used slot' },
];

const ARRAYDEQUE_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'ad-1',
    question: 'What is the time complexity of addFirst() in ArrayDeque?',
    options: ['O(1) amortized', 'O(log n)', 'O(n)', 'O(n²)'],
    correctAnswer: 0,
    explanation: 'ArrayDeque uses circular buffer with head/tail pointers. addFirst() just decrements head and writes - O(1). Resize is rare and amortized.',
    hint: 'Think about how circular buffers work.',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'ad-2',
    question: 'How does ArrayDeque handle the wrap-around when head reaches index 0?',
    options: [
      'Throws IndexOutOfBoundsException',
      'head = (head - 1) & (capacity - 1)',
      'Shifts all elements right',
      'Creates new array'
    ],
    correctAnswer: 1,
    explanation: 'Bitwise AND with (capacity-1) for power-of-2 capacity wraps around efficiently. (0-1) & 7 = 7. Faster than modulo.',
    difficulty: 'medium',
    topic: 'Circular Buffer',
  },
  {
    id: 'ad-3',
    question: 'Why must ArrayDeque capacity always be a power of 2?',
    options: [
      'JVM memory alignment requirement',
      'Enables fast bitwise modulo: index & (capacity-1)',
      'Required by Java spec',
      'It doesn\'t have to be'
    ],
    correctAnswer: 1,
    explanation: 'Power-of-2 capacity allows index & (capacity-1) instead of index % capacity. Bitwise AND is much faster than modulo division.',
    hint: 'Think about bitwise operations.',
    difficulty: 'hard',
    topic: 'Implementation',
  },
  {
    id: 'ad-4',
    question: 'What is the space complexity of ArrayDeque with n elements?',
    options: ['O(1)', 'O(n)', 'O(n²)', 'O(log n)'],
    correctAnswer: 1,
    explanation: 'ArrayDeque uses O(n) space. Internal array may be up to 2n (after resize before filling), but still O(n).',
    difficulty: 'easy',
    topic: 'Space Complexity',
  },
  {
    id: 'ad-5',
    question: 'Which statement about ArrayDeque is FALSE?',
    options: [
      'It can be used as a stack (LIFO)',
      'It can be used as a queue (FIFO)',
      'It allows null elements',
      'It\'s not thread-safe'
    ],
    correctAnswer: 2,
    explanation: 'ArrayDeque does NOT allow null elements. Null is used internally to detect empty slots. Use it as stack (push/pop) or queue (offer/poll).',
    difficulty: 'medium',
    topic: 'Null Handling',
  },
  {
    id: 'ad-6',
    question: 'When should you prefer ArrayDeque over LinkedList for stack/queue?',
    options: [
      'When you need null elements',
      'When you need random access',
      'Almost always - better cache locality',
      'When memory is limited'
    ],
    correctAnswer: 2,
    explanation: 'ArrayDeque is faster than LinkedList for stack/queue operations due to better cache locality (contiguous memory). LinkedList has 24+ bytes overhead per node.',
    hint: 'Think about CPU cache.',
    difficulty: 'medium',
    topic: 'Performance',
  },
  {
    id: 'ad-7',
    question: 'What is the initial capacity of new ArrayDeque<>()?',
    options: ['8', '10', '16', '32'],
    correctAnswer: 2,
    explanation: 'Default initial capacity is 16. You can specify initial capacity in constructor, and it\'s rounded up to next power of 2.',
    difficulty: 'easy',
    topic: 'Implementation Details',
  },
  {
    id: 'ad-8',
    question: 'How does ArrayDeque detect that it needs to resize?',
    options: [
      'size > capacity',
      'head == tail (after operation)',
      'size > capacity * 0.75',
      'Manual resize only'
    ],
    correctAnswer: 1,
    explanation: 'When head == tail after add, the deque is full. This works because one slot is always empty to distinguish full from empty.',
    hint: 'Empty deque also has head == tail.',
    difficulty: 'hard',
    topic: 'Resize Logic',
  },
  {
    id: 'ad-9',
    question: 'What happens when you call removeFirst() on empty ArrayDeque?',
    options: [
      'Returns null',
      'Throws NoSuchElementException',
      'Returns -1',
      'Throws IllegalStateException'
    ],
    correctAnswer: 1,
    explanation: 'removeFirst() throws NoSuchElementException on empty deque. Use pollFirst() for null-returning variant.',
    difficulty: 'easy',
    topic: 'API',
  },
  {
    id: 'ad-10',
    question: 'ArrayDeque implements which interfaces?',
    options: [
      'List and Queue',
      'Deque and Queue',
      'List and Deque',
      'Set and Queue'
    ],
    correctAnswer: 1,
    explanation: 'ArrayDeque implements Deque (which extends Queue). It does NOT implement List - no random access by index, no get(int index) method.',
    difficulty: 'medium',
    topic: 'Interfaces',
  },
];

function generateArrayDequeSteps(): ArrayDequeStep[] {
  const steps: ArrayDequeStep[] = [];
  let array: (number | null)[] = new Array(INITIAL_CAPACITY).fill(null);
  let head = 0;
  let tail = 0;
  const capacity = INITIAL_CAPACITY;

  steps.push({
    operation: 'init',
    array: [...array],
    head,
    tail,
    capacity,
    description: `Initialize ArrayDeque capacity=${capacity}. Circular buffer.`,
  });

  for (const { op, value } of OPERATIONS) {
    if (op === 'addFirst' && value !== undefined) {
      head = (head - 1 + capacity) % capacity;
      array[head] = value;

      steps.push({
        operation: 'addFirst',
        value,
        array: [...array],
        head,
        tail,
        capacity,
        description: `addFirst(${value}): head wraps to ${head}`,
        highlightIndex: head,
      });
    } else if (op === 'addLast' && value !== undefined) {
      array[tail] = value;
      const oldTail = tail;
      tail = (tail + 1) % capacity;

      steps.push({
        operation: 'addLast',
        value,
        array: [...array],
        head,
        tail,
        capacity,
        description: `addLast(${value}) at [${oldTail}], tail → ${tail}`,
        highlightIndex: oldTail,
      });
    } else if (op === 'removeFirst') {
      const removed = array[head];
      array[head] = null;
      const oldHead = head;
      head = (head + 1) % capacity;

      steps.push({
        operation: 'removeFirst',
        value: removed ?? undefined,
        array: [...array],
        head,
        tail,
        capacity,
        description: `removeFirst() → ${removed}, head → ${head}`,
        highlightIndex: oldHead,
      });
    } else if (op === 'removeLast') {
      tail = (tail - 1 + capacity) % capacity;
      const removed = array[tail];
      array[tail] = null;

      steps.push({
        operation: 'removeLast',
        value: removed ?? undefined,
        array: [...array],
        head,
        tail,
        capacity,
        description: `removeLast() → ${removed}, tail → ${tail}`,
        highlightIndex: tail,
      });
    }
  }

  const size = (tail - head + capacity) % capacity;
  steps.push({
    operation: 'done',
    array: [...array],
    head,
    tail,
    capacity,
    description: `Done! size=${size}, O(1) for all operations!`,
  });

  return steps;
}

const ArrayDequeInterviewVisualizerComponent: React.FC<ArrayDequeInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'ad-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateArrayDequeSteps, []);

  const playback = useVisualizerPlayback<ArrayDequeStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: ARRAYDEQUE_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: ArrayDequeStep = playback.currentStepData || {
    operation: 'init',
    array: [],
    head: 0,
    tail: 0,
    capacity: INITIAL_CAPACITY,
    description: '',
  };

  const { array, head, tail, capacity, highlightIndex } = stepData;

  const getCellStyle = (index: number): string => {
    const isHead = index === head;
    const isTail = index === tail;
    const isHighlighted = index === highlightIndex;
    const hasValue = array[index] !== null;

    let style = 'border-2 transition-colors ';

    if (isHighlighted) {
      style += 'bg-green-400 border-green-500 text-white ';
    } else if (hasValue) {
      style += 'bg-blue-100 border-blue-300 ';
    } else {
      style += 'bg-gray-100 border-gray-200 ';
    }

    if (isHead) style += 'ring-2 ring-cyan-500 ';
    else if (isTail) style += 'ring-2 ring-indigo-500 ';

    return style;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const getLogicalElements = (): (number | null)[] => {
    const result: (number | null)[] = [];
    let i = head;
    while (i !== tail) {
      result.push(array[i]);
      i = (i + 1) % capacity;
    }
    return result;
  };

  const visualization = (
    <>
      <div className="mb-4 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
        <div className="text-sm text-cyan-800 text-center">
          <span className="font-medium">ArrayDeque:</span> Circular buffer, O(1) add/remove at both ends
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <div className="text-xs text-center text-gray-600">
          next = (index + 1) & (capacity - 1) | prev = (index - 1) & (capacity - 1)
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-4 justify-center">
        {array.map((val, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded flex flex-col items-center justify-center text-xs font-medium ${getCellStyle(idx)}`}>
              <span className="text-[8px] text-gray-400">{idx}</span>
              <span>{val ?? '∅'}</span>
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5">
              {idx === head && idx === tail ? 'H/T' : idx === head ? 'H' : idx === tail ? 'T' : ''}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600 mb-2 font-medium">Logical Order (front → back):</div>
        <div className="flex flex-wrap items-center gap-1">
          {getLogicalElements().length > 0 ? (
            <>
              <span className="text-[10px] text-cyan-600">FRONT →</span>
              {getLogicalElements().map((val, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-gray-400">→</span>}
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">{val}</span>
                </React.Fragment>
              ))}
              <span className="text-[10px] text-indigo-600">→ BACK</span>
            </>
          ) : (
            <span className="text-xs text-gray-400 italic">Empty deque</span>
          )}
        </div>
      </div>
    </>
  );

  const modeToggle = (
    <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
      <button
        onClick={() => setMode('visualize')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'visualize' ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'interview' ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
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
      accentColor="cyan"
    />
  ) : undefined;

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="ArrayDeque (Interview Mode)"
      badges={BADGES}
      gradient="cyan"
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
        accentColor: 'cyan',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      sidePanel={sidePanel}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const ArrayDequeInterviewVisualizer = React.memo(ArrayDequeInterviewVisualizerComponent);
export default ArrayDequeInterviewVisualizer;
