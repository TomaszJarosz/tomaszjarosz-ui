import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface ArrayListStep {
  operation: 'add' | 'addAt' | 'get' | 'remove' | 'resize' | 'init' | 'done';
  value?: number;
  index?: number;
  array: (number | null)[];
  size: number;
  capacity: number;
  description: string;
  highlightIndex?: number;
  shiftIndices?: number[];
}

interface ArrayListInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'arraylist-interview-visualizer';

const BADGES = [
  { label: 'Interview Mode', variant: 'orange' as const },
  { label: 'Dynamic Array', variant: 'orange' as const },
];

const INITIAL_CAPACITY = 4;

const OPERATIONS: Array<{ op: 'add' | 'get' | 'remove'; value?: number; index?: number }> = [
  { op: 'add', value: 10 },
  { op: 'add', value: 20 },
  { op: 'add', value: 30 },
  { op: 'add', value: 40 },
  { op: 'add', value: 50 },
  { op: 'get', index: 2 },
  { op: 'remove', index: 1 },
];

const LEGEND_ITEMS = [
  { color: 'bg-white border-gray-300', label: 'Used', border: '#d1d5db' },
  { color: 'bg-gray-100', label: 'Empty' },
  { color: 'bg-orange-500', label: 'Active' },
  { color: 'bg-yellow-200', label: 'Shifted', border: '#fbbf24' },
];

const ARRAYLIST_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'arraylist-1',
    question: 'What is the time complexity of get(index) in ArrayList?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctAnswer: 0,
    explanation: 'ArrayList provides O(1) random access because elements are stored in a contiguous array. Direct index calculation: address = base + (index × element_size).',
    hint: 'Think about how arrays store elements in memory.',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'arraylist-2',
    question: 'What is the amortized time complexity of add(element) at the end?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctAnswer: 0,
    explanation: 'Amortized O(1). Usually O(1), but occasionally O(n) when resizing. Since we double capacity, the average cost per operation is constant over many operations.',
    difficulty: 'medium',
    topic: 'Amortized Analysis',
  },
  {
    id: 'arraylist-3',
    question: 'What is the time complexity of add(index, element) in the middle?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctAnswer: 2,
    explanation: 'O(n) because we must shift all elements after the insertion point to make room. Inserting at index 0 is worst case - shifts all n elements.',
    hint: 'What happens to existing elements?',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'arraylist-4',
    question: 'By what factor does ArrayList typically grow when it needs more space?',
    options: ['1.5x', '2x', '3x', '10 elements'],
    correctAnswer: 1,
    explanation: 'ArrayList doubles its capacity (2x growth factor). This ensures amortized O(1) for additions. Growth factor of 1.5x is used in some implementations (like C++ std::vector) for better memory utilization.',
    difficulty: 'medium',
    topic: 'Growth Strategy',
  },
  {
    id: 'arraylist-5',
    question: 'Why does ArrayList NOT shrink automatically when elements are removed?',
    options: [
      'It\'s a bug in the implementation',
      'To avoid frequent resize operations (thrashing)',
      'The JVM doesn\'t support shrinking',
      'It always shrinks automatically'
    ],
    correctAnswer: 1,
    explanation: 'Automatic shrinking could cause thrashing: repeatedly grow/shrink if size hovers around threshold. Manual trimToSize() is provided if memory is a concern.',
    difficulty: 'medium',
    topic: 'Design Decision',
  },
  {
    id: 'arraylist-6',
    question: 'What is the space complexity of an ArrayList with n elements?',
    options: ['O(1)', 'O(n)', 'O(2n)', 'O(n²)'],
    correctAnswer: 1,
    explanation: 'O(n) space. The internal array may have up to 2n capacity due to doubling, but this is still O(n). Some extra space is used for size counter and array reference.',
    difficulty: 'easy',
    topic: 'Space Complexity',
  },
  {
    id: 'arraylist-7',
    question: 'When should you prefer LinkedList over ArrayList?',
    options: [
      'When you need fast random access',
      'When you frequently insert/remove at the beginning',
      'When memory is limited',
      'Almost never in practice'
    ],
    correctAnswer: 1,
    explanation: 'LinkedList has O(1) insertion at head, while ArrayList is O(n). However, in practice ArrayList is often faster even for this due to cache locality. LinkedList has high memory overhead per element.',
    hint: 'Think about where the operations happen.',
    difficulty: 'hard',
    topic: 'Comparison',
  },
  {
    id: 'arraylist-8',
    question: 'What happens when you call ensureCapacity(100) on an ArrayList with capacity 10?',
    options: [
      'Nothing happens',
      'Capacity increases to exactly 100',
      'Capacity increases to at least 100',
      'An exception is thrown'
    ],
    correctAnswer: 2,
    explanation: 'ensureCapacity() guarantees minimum capacity. The actual capacity may be larger due to growth policy. It\'s useful to avoid multiple resizes when you know you\'ll add many elements.',
    difficulty: 'medium',
    topic: 'API Knowledge',
  },
  {
    id: 'arraylist-9',
    question: 'Is ArrayList thread-safe?',
    options: [
      'Yes, fully thread-safe',
      'Yes, but only for reads',
      'No, use Collections.synchronizedList() or CopyOnWriteArrayList',
      'No, and there\'s no way to make it thread-safe'
    ],
    correctAnswer: 2,
    explanation: 'ArrayList is NOT thread-safe. For concurrent access, use Collections.synchronizedList(new ArrayList<>()) or CopyOnWriteArrayList (better for read-heavy workloads).',
    difficulty: 'medium',
    topic: 'Thread Safety',
  },
  {
    id: 'arraylist-10',
    question: 'What is the initial capacity of new ArrayList<>() in Java?',
    options: ['0', '10', '16', 'Unspecified'],
    correctAnswer: 1,
    explanation: 'Default initial capacity is 10 in most Java implementations. Use new ArrayList<>(expectedSize) to set initial capacity and avoid early resizes if you know the approximate size.',
    difficulty: 'easy',
    topic: 'Implementation Details',
  },
];

function generateArrayListSteps(): ArrayListStep[] {
  const steps: ArrayListStep[] = [];
  let array: (number | null)[] = new Array(INITIAL_CAPACITY).fill(null);
  let size = 0;
  let capacity = INITIAL_CAPACITY;

  steps.push({
    operation: 'init',
    array: [...array],
    size: 0,
    capacity,
    description: `ArrayList capacity=${capacity}. Auto-grows when full.`,
  });

  for (const { op, value, index } of OPERATIONS) {
    if (op === 'add' && value !== undefined) {
      if (size === capacity) {
        const oldCapacity = capacity;
        capacity *= 2;
        const newArray: (number | null)[] = new Array(capacity).fill(null);
        for (let i = 0; i < size; i++) newArray[i] = array[i];
        array = newArray;

        steps.push({
          operation: 'resize',
          array: [...array],
          size,
          capacity,
          description: `Resize! ${oldCapacity} → ${capacity} (double capacity)`,
        });
      }

      array[size] = value;
      size++;

      steps.push({
        operation: 'add',
        value,
        array: [...array],
        size,
        capacity,
        description: `add(${value}) at index ${size - 1}. O(1) amortized.`,
        highlightIndex: size - 1,
      });
    } else if (op === 'get' && index !== undefined) {
      steps.push({
        operation: 'get',
        index,
        value: array[index] ?? undefined,
        array: [...array],
        size,
        capacity,
        description: `get(${index}) = ${array[index]}. O(1) direct access.`,
        highlightIndex: index,
      });
    } else if (op === 'remove' && index !== undefined) {
      const removed = array[index];
      const shiftIndices: number[] = [];
      for (let i = index; i < size - 1; i++) {
        array[i] = array[i + 1];
        shiftIndices.push(i);
      }
      array[size - 1] = null;
      size--;

      steps.push({
        operation: 'remove',
        index,
        value: removed ?? undefined,
        array: [...array],
        size,
        capacity,
        description: `remove(${index}) = ${removed}. Shifted ${shiftIndices.length} elements. O(n).`,
        shiftIndices,
      });
    }
  }

  steps.push({
    operation: 'done',
    array: [...array],
    size,
    capacity,
    description: `Done! size=${size}, capacity=${capacity}`,
  });

  return steps;
}

const ArrayListInterviewVisualizerComponent: React.FC<ArrayListInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'arrlist-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateArrayListSteps, []);

  const playback = useVisualizerPlayback<ArrayListStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: ARRAYLIST_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: ArrayListStep = playback.currentStepData || {
    operation: 'init',
    array: [],
    size: 0,
    capacity: INITIAL_CAPACITY,
    description: '',
  };

  const getCellStyle = (idx: number): string => {
    if (idx === stepData.highlightIndex) return 'bg-orange-500 border-orange-600 text-white';
    if (stepData.shiftIndices?.includes(idx)) return 'bg-yellow-200 border-yellow-400 text-yellow-800';
    if (idx < stepData.size) return 'bg-white border-gray-300 text-gray-700';
    return 'bg-gray-100 border-gray-200 text-gray-300';
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const visualization = (
    <>
      <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
        <div className="text-sm text-orange-800 text-center">
          <span className="font-medium">ArrayList:</span> O(1) get, O(1) amortized add, O(n) insert/remove
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-orange-500 transition-all"
            style={{ width: `${(stepData.size / stepData.capacity) * 100}%` }}
          />
        </div>
        <div className="flex gap-4 text-xs">
          <div>size: <span className="text-orange-600 font-mono">{stepData.size}</span></div>
          <div>capacity: <span className="text-gray-600 font-mono">{stepData.capacity}</span></div>
          <div>load: <span className="font-mono">{Math.round((stepData.size / stepData.capacity) * 100)}%</span></div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs font-medium text-gray-600 mb-1">Internal Array</div>
        <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {stepData.array.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className={`w-10 h-10 flex items-center justify-center rounded border-2 font-medium text-sm ${getCellStyle(idx)}`}>
                  {val !== null ? val : ''}
                </div>
                <div className="text-[9px] text-gray-400 mt-1">[{idx}]</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const modeToggle = (
    <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
      <button
        onClick={() => setMode('visualize')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'visualize' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'interview' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
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
      title="ArrayList (Interview Mode)"
      badges={BADGES}
      gradient="orange"
      className={className}
      minHeight={350}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description: stepData.description,
        currentStep: playback.currentStep,
        totalSteps: playback.steps.length,
        variant: stepData.operation === 'resize' ? 'warning' : stepData.operation === 'done' ? 'success' : 'default',
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

export const ArrayListInterviewVisualizer = React.memo(ArrayListInterviewVisualizerComponent);
export default ArrayListInterviewVisualizer;
