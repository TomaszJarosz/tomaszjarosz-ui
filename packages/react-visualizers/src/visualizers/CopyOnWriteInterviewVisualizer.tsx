import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface COWStep {
  operation: 'read' | 'write' | 'copy' | 'init' | 'done';
  thread: string;
  value?: string;
  oldArray: string[];
  newArray: string[];
  description: string;
  showCopy?: boolean;
  highlightIndex?: number;
}

interface CopyOnWriteInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'copyonwrite-interview-visualizer';

const BADGES = [
  { label: 'Interview Mode', variant: 'green' as const },
  { label: 'Read: O(1)', variant: 'green' as const },
];

const OPERATIONS: Array<{ thread: string; op: 'read' | 'write'; value?: string }> = [
  { thread: 'R1', op: 'read' },
  { thread: 'R2', op: 'read' },
  { thread: 'W1', op: 'write', value: 'D' },
  { thread: 'R1', op: 'read' },
  { thread: 'W1', op: 'write', value: 'E' },
];

const LEGEND_ITEMS = [
  { color: 'bg-blue-500', label: 'Reader' },
  { color: 'bg-orange-500', label: 'Writer' },
  { color: 'bg-green-500', label: 'New element' },
];

const COPYONWRITE_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'cow-1',
    question: 'What is the time complexity of get() in CopyOnWriteArrayList?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctAnswer: 0,
    explanation: 'get() is O(1) - just array[index]. No locking needed because readers always see a consistent snapshot.',
    hint: 'Reads don\'t need synchronization.',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'cow-2',
    question: 'What is the time complexity of add() in CopyOnWriteArrayList?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctAnswer: 2,
    explanation: 'add() is O(n) - must copy entire array to new array. Very expensive for large lists with frequent writes.',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'cow-3',
    question: 'What happens to iterators during write operations?',
    options: [
      'They fail with ConcurrentModificationException',
      'They see updated values',
      'They continue on old snapshot, never throw',
      'They block until write completes'
    ],
    correctAnswer: 2,
    explanation: 'Iterators work on snapshot of array at creation time. Never see modifications, never throw ConcurrentModificationException.',
    difficulty: 'medium',
    topic: 'Iterator Behavior',
  },
  {
    id: 'cow-4',
    question: 'Why is CopyOnWriteArrayList thread-safe without locking reads?',
    options: [
      'Uses volatile array reference',
      'Uses CAS for all operations',
      'Readers always see consistent immutable snapshot',
      'Java arrays are inherently thread-safe'
    ],
    correctAnswer: 2,
    explanation: 'Array reference is volatile. Writes create new array, then atomically swap reference. Readers see either old or new, never partial state.',
    hint: 'Think about what "atomic swap" means.',
    difficulty: 'hard',
    topic: 'Thread Safety',
  },
  {
    id: 'cow-5',
    question: 'When should you use CopyOnWriteArrayList?',
    options: [
      'When you have many writes',
      'When reads greatly outnumber writes',
      'When list is very large',
      'When you need sorted order'
    ],
    correctAnswer: 1,
    explanation: 'Ideal for read-heavy, rarely-modified data like listener lists. Writes are expensive (O(n) copy), reads are cheap (no locking).',
    difficulty: 'medium',
    topic: 'Use Cases',
  },
  {
    id: 'cow-6',
    question: 'What synchronization does CopyOnWriteArrayList use for writes?',
    options: [
      'synchronized keyword',
      'ReentrantLock',
      'No synchronization needed',
      'CAS operations only'
    ],
    correctAnswer: 1,
    explanation: 'Uses ReentrantLock for write operations to ensure only one thread modifies at a time. Reads don\'t acquire lock.',
    difficulty: 'medium',
    topic: 'Implementation',
  },
  {
    id: 'cow-7',
    question: 'CopyOnWriteArrayList iterator does NOT support which method?',
    options: ['hasNext()', 'next()', 'remove()', 'All methods work'],
    correctAnswer: 2,
    explanation: 'Iterator\'s remove() throws UnsupportedOperationException. Iterator works on snapshot - modifications not allowed.',
    difficulty: 'medium',
    topic: 'Iterator',
  },
  {
    id: 'cow-8',
    question: 'What is the space overhead during a write operation?',
    options: ['O(1)', 'O(n) - temporary second array', 'O(n²)', 'O(log n)'],
    correctAnswer: 1,
    explanation: 'During write, both old and new arrays exist briefly. O(n) extra space. Old array is garbage collected after all readers finish.',
    difficulty: 'hard',
    topic: 'Space Complexity',
  },
  {
    id: 'cow-9',
    question: 'How does CopyOnWriteArraySet differ from CopyOnWriteArrayList?',
    options: [
      'Different underlying data structure',
      'Uses COWAL internally, prevents duplicates',
      'Uses HashSet internally',
      'Better write performance'
    ],
    correctAnswer: 1,
    explanation: 'CopyOnWriteArraySet wraps CopyOnWriteArrayList and adds duplicate checking. contains() is O(n), not O(1) like HashSet.',
    difficulty: 'medium',
    topic: 'Variants',
  },
  {
    id: 'cow-10',
    question: 'What is the main advantage of copy-on-write over synchronized collection?',
    options: [
      'Faster writes',
      'Less memory usage',
      'Readers never block, even during writes',
      'Smaller code size'
    ],
    correctAnswer: 2,
    explanation: 'In synchronized collections, readers block during writes. In COW, readers never block - they use snapshot. Great for read-heavy workloads.',
    hint: 'Think about concurrency.',
    difficulty: 'medium',
    topic: 'Benefits',
  },
];

function generateCOWSteps(): COWStep[] {
  const steps: COWStep[] = [];
  let array = ['A', 'B', 'C'];

  steps.push({
    operation: 'init',
    thread: '',
    oldArray: [...array],
    newArray: [...array],
    description: 'Initialize CopyOnWriteArrayList. Reads lock-free, writes copy.',
  });

  for (const { thread, op, value } of OPERATIONS) {
    if (op === 'read') {
      steps.push({
        operation: 'read',
        thread,
        oldArray: [...array],
        newArray: [...array],
        description: `${thread}: get() - NO LOCK! Always sees consistent snapshot.`,
      });
    } else {
      const oldArray = [...array];

      steps.push({
        operation: 'write',
        thread,
        value,
        oldArray: [...oldArray],
        newArray: [...oldArray],
        description: `${thread}: add("${value}") - Acquiring lock...`,
      });

      const newArray = [...oldArray, value ?? ''];

      steps.push({
        operation: 'copy',
        thread,
        value,
        oldArray: [...oldArray],
        newArray: [...newArray],
        description: `${thread}: Creating NEW array copy (${oldArray.length} → ${newArray.length})`,
        showCopy: true,
      });

      array = newArray;

      steps.push({
        operation: 'write',
        thread,
        value,
        oldArray: [...oldArray],
        newArray: [...array],
        description: `${thread}: Atomic swap! New readers see updated array.`,
        highlightIndex: array.length - 1,
      });
    }
  }

  steps.push({
    operation: 'done',
    thread: '',
    oldArray: [...array],
    newArray: [...array],
    description: `Done! O(1) reads, O(n) writes. Best for read-heavy.`,
  });

  return steps;
}

const CopyOnWriteInterviewVisualizerComponent: React.FC<CopyOnWriteInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'cow-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateCOWSteps, []);

  const playback = useVisualizerPlayback<COWStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: COPYONWRITE_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: COWStep = playback.currentStepData || {
    operation: 'init',
    thread: '',
    oldArray: [],
    newArray: [],
    description: '',
  };

  const { oldArray, newArray, showCopy, highlightIndex } = stepData;

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const renderArray = (arr: string[], label: string, isNew: boolean = false) => (
    <div className="flex-1">
      <div className="text-xs font-medium text-gray-500 mb-2 text-center">{label}</div>
      <div className="flex justify-center gap-1">
        {arr.map((item, idx) => (
          <div
            key={idx}
            className={`w-10 h-10 flex items-center justify-center rounded border-2 font-medium transition-colors ${
              isNew && idx === highlightIndex
                ? 'bg-green-500 border-green-600 text-white'
                : isNew
                  ? 'bg-green-100 border-green-300 text-green-700'
                  : 'bg-gray-100 border-gray-300 text-gray-700'
            }`}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );

  const visualization = (
    <>
      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="text-sm text-green-800 text-center">
          <span className="font-medium">CopyOnWriteArrayList:</span> Lock-free reads, O(n) copy on write
        </div>
      </div>

      <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-lime-50 rounded-xl border-2 border-green-200">
        <div className="text-sm font-bold text-green-800 mb-3">📋 Copy-on-Write Pattern</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-blue-100 p-2 rounded-lg border border-blue-300 text-center">
            <div className="font-bold text-blue-700">Read (get)</div>
            <div className="text-2xl text-blue-600">O(1)</div>
            <div className="text-[10px] text-blue-500">No lock, no copy</div>
          </div>
          <div className="bg-orange-100 p-2 rounded-lg border border-orange-300 text-center">
            <div className="font-bold text-orange-700">Write (add/set)</div>
            <div className="text-2xl text-orange-600">O(n)</div>
            <div className="text-[10px] text-orange-500">Full array copy</div>
          </div>
        </div>
      </div>

      <div className="mb-4 p-4 bg-gray-50 rounded-lg min-h-[80px]">
        {showCopy ? (
          <div className="flex items-center gap-4">
            {renderArray(oldArray, 'Old Array (readers use)')}
            <div className="text-2xl text-gray-400">→</div>
            {renderArray(newArray, 'New Array (creating)', true)}
          </div>
        ) : (
          <div className="flex justify-center">
            {renderArray(newArray, 'Current Array', highlightIndex !== undefined)}
          </div>
        )}
      </div>

      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="text-xs text-green-800">
          <strong>Key insight:</strong> During writes, old array serves readers. No reader ever sees partial state!
        </div>
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
      title="CopyOnWriteArrayList (Interview Mode)"
      badges={BADGES}
      gradient="green"
      className={className}
      minHeight={350}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description: stepData.description,
        currentStep: playback.currentStep,
        totalSteps: playback.steps.length,
        variant: stepData.operation === 'copy' ? 'warning' : stepData.operation === 'done' ? 'success' : 'default',
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

export const CopyOnWriteInterviewVisualizer = React.memo(CopyOnWriteInterviewVisualizerComponent);
export default CopyOnWriteInterviewVisualizer;
