import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface BlockingStep {
  operation: 'put' | 'take' | 'blocked' | 'init' | 'done';
  thread: string;
  value?: string;
  queue: string[];
  capacity: number;
  description: string;
  blockedProducers: string[];
  blockedConsumers: string[];
  activeThread?: string;
}

interface BlockingQueueInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'blockingqueue-interview-visualizer';

const BADGES = [
  { label: 'Interview Mode', variant: 'cyan' as const },
  { label: 'Thread-safe', variant: 'blue' as const },
];

const CAPACITY = 3;

const OPERATIONS: Array<{ thread: string; role: 'producer' | 'consumer'; value?: string }> = [
  { thread: 'P1', role: 'producer', value: 'A' },
  { thread: 'P2', role: 'producer', value: 'B' },
  { thread: 'C1', role: 'consumer' },
  { thread: 'P1', role: 'producer', value: 'C' },
  { thread: 'P2', role: 'producer', value: 'D' },
  { thread: 'P1', role: 'producer', value: 'E' },
  { thread: 'P2', role: 'producer', value: 'F' },
  { thread: 'C1', role: 'consumer' },
];

const LEGEND_ITEMS = [
  { color: 'bg-green-100', label: 'Producer' },
  { color: 'bg-blue-100', label: 'Consumer' },
  { color: 'bg-red-100', label: 'Blocked', border: '#fca5a5' },
];

const BLOCKINGQUEUE_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'bq-1',
    question: 'What happens when you call put() on a full BlockingQueue?',
    options: [
      'Returns false immediately',
      'Throws exception',
      'Blocks until space available',
      'Overwrites oldest element'
    ],
    correctAnswer: 2,
    explanation: 'put() blocks indefinitely until space becomes available. Use offer() with timeout for non-blocking behavior.',
    hint: 'It\'s called "Blocking" Queue for a reason.',
    difficulty: 'easy',
    topic: 'Blocking Behavior',
  },
  {
    id: 'bq-2',
    question: 'What happens when you call take() on an empty BlockingQueue?',
    options: [
      'Returns null',
      'Throws NoSuchElementException',
      'Blocks until element available',
      'Returns empty Optional'
    ],
    correctAnswer: 2,
    explanation: 'take() blocks until an element becomes available. Use poll() with timeout for non-blocking variant.',
    difficulty: 'easy',
    topic: 'Blocking Behavior',
  },
  {
    id: 'bq-3',
    question: 'Which BlockingQueue implementation uses array?',
    options: ['LinkedBlockingQueue', 'ArrayBlockingQueue', 'PriorityBlockingQueue', 'DelayQueue'],
    correctAnswer: 1,
    explanation: 'ArrayBlockingQueue uses fixed-size array. LinkedBlockingQueue uses linked nodes. Both are bounded (LBQ default is Integer.MAX_VALUE).',
    difficulty: 'easy',
    topic: 'Implementations',
  },
  {
    id: 'bq-4',
    question: 'What synchronization mechanism does ArrayBlockingQueue use?',
    options: [
      'synchronized keyword',
      'Single ReentrantLock with 2 Conditions',
      'Two separate locks (put/take)',
      'Lock-free CAS'
    ],
    correctAnswer: 1,
    explanation: 'ArrayBlockingQueue uses single ReentrantLock with notEmpty and notFull Conditions. LinkedBlockingQueue uses two separate locks for better throughput.',
    hint: 'Think about the Condition pattern.',
    difficulty: 'hard',
    topic: 'Implementation',
  },
  {
    id: 'bq-5',
    question: 'What is the difference between offer() and put()?',
    options: [
      'offer() is faster',
      'put() blocks, offer() returns boolean immediately',
      'offer() throws exception on failure',
      'No difference'
    ],
    correctAnswer: 1,
    explanation: 'put() blocks until space available. offer() returns false immediately if full. offer(e, timeout, unit) waits up to timeout.',
    difficulty: 'medium',
    topic: 'API',
  },
  {
    id: 'bq-6',
    question: 'Which BlockingQueue orders elements by priority?',
    options: ['ArrayBlockingQueue', 'LinkedBlockingQueue', 'PriorityBlockingQueue', 'SynchronousQueue'],
    correctAnswer: 2,
    explanation: 'PriorityBlockingQueue orders by priority (natural order or Comparator). It\'s unbounded and uses binary heap.',
    difficulty: 'easy',
    topic: 'Implementations',
  },
  {
    id: 'bq-7',
    question: 'What is special about SynchronousQueue?',
    options: [
      'It\'s the fastest implementation',
      'Capacity is 0 - direct handoff between threads',
      'It\'s lock-free',
      'Supports priority ordering'
    ],
    correctAnswer: 1,
    explanation: 'SynchronousQueue has no internal capacity. Each put() must wait for take() and vice versa. Used for direct thread handoffs.',
    hint: 'It\'s a rendezvous point.',
    difficulty: 'hard',
    topic: 'SynchronousQueue',
  },
  {
    id: 'bq-8',
    question: 'Why use BlockingQueue over synchronized ArrayList for producer-consumer?',
    options: [
      'BlockingQueue is faster',
      'BlockingQueue handles blocking/signaling automatically',
      'ArrayList can\'t be synchronized',
      'BlockingQueue uses less memory'
    ],
    correctAnswer: 1,
    explanation: 'BlockingQueue encapsulates wait/notify logic. With ArrayList you must manually manage locks, conditions, and signaling - error-prone!',
    difficulty: 'medium',
    topic: 'Design',
  },
  {
    id: 'bq-9',
    question: 'What does drainTo(Collection) do?',
    options: [
      'Removes all elements without returning',
      'Atomically removes all elements and adds to collection',
      'Copies elements without removing',
      'Waits until queue is empty'
    ],
    correctAnswer: 1,
    explanation: 'drainTo() atomically removes all available elements and adds to given collection. More efficient than loop of poll() calls.',
    difficulty: 'medium',
    topic: 'API',
  },
  {
    id: 'bq-10',
    question: 'LinkedBlockingQueue vs ArrayBlockingQueue: which has higher throughput?',
    options: [
      'ArrayBlockingQueue always',
      'LinkedBlockingQueue due to separate put/take locks',
      'Same throughput',
      'Depends on element size'
    ],
    correctAnswer: 1,
    explanation: 'LinkedBlockingQueue uses separate locks for head and tail, allowing concurrent put/take. ArrayBlockingQueue uses single lock.',
    hint: 'Think about lock contention.',
    difficulty: 'hard',
    topic: 'Performance',
  },
];

function generateBlockingQueueSteps(): BlockingStep[] {
  const steps: BlockingStep[] = [];
  const queue: string[] = [];
  const blockedProducers: string[] = [];
  const blockedConsumers: string[] = [];

  steps.push({
    operation: 'init',
    thread: '',
    queue: [],
    capacity: CAPACITY,
    description: `Initialize BlockingQueue capacity=${CAPACITY}`,
    blockedProducers: [],
    blockedConsumers: [],
  });

  for (const { thread, role, value } of OPERATIONS) {
    if (role === 'producer') {
      if (queue.length >= CAPACITY) {
        blockedProducers.push(thread);
        steps.push({
          operation: 'blocked',
          thread,
          value,
          queue: [...queue],
          capacity: CAPACITY,
          description: `${thread}: put("${value}") - FULL! Producer blocked`,
          blockedProducers: [...blockedProducers],
          blockedConsumers: [...blockedConsumers],
          activeThread: thread,
        });
      } else {
        queue.push(value ?? '');
        steps.push({
          operation: 'put',
          thread,
          value,
          queue: [...queue],
          capacity: CAPACITY,
          description: `${thread}: put("${value}") → ${queue.length}/${CAPACITY}`,
          blockedProducers: [...blockedProducers],
          blockedConsumers: [...blockedConsumers],
          activeThread: thread,
        });
      }
    } else {
      if (queue.length === 0) {
        blockedConsumers.push(thread);
        steps.push({
          operation: 'blocked',
          thread,
          queue: [...queue],
          capacity: CAPACITY,
          description: `${thread}: take() - EMPTY! Consumer blocked`,
          blockedProducers: [...blockedProducers],
          blockedConsumers: [...blockedConsumers],
          activeThread: thread,
        });
      } else {
        const item = queue.shift();
        if (blockedProducers.length > 0 && queue.length === CAPACITY - 1) {
          blockedProducers.shift();
        }
        steps.push({
          operation: 'take',
          thread,
          value: item,
          queue: [...queue],
          capacity: CAPACITY,
          description: `${thread}: take() → "${item}" | ${queue.length}/${CAPACITY}`,
          blockedProducers: [...blockedProducers],
          blockedConsumers: [...blockedConsumers],
          activeThread: thread,
        });
      }
    }
  }

  steps.push({
    operation: 'done',
    thread: '',
    queue: [...queue],
    capacity: CAPACITY,
    description: `Done! BlockingQueue coordinates producer-consumer`,
    blockedProducers: [...blockedProducers],
    blockedConsumers: [...blockedConsumers],
  });

  return steps;
}

const BlockingQueueInterviewVisualizerComponent: React.FC<BlockingQueueInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'bq-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateBlockingQueueSteps, []);

  const playback = useVisualizerPlayback<BlockingStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: BLOCKINGQUEUE_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: BlockingStep = playback.currentStepData || {
    operation: 'init',
    thread: '',
    queue: [],
    capacity: CAPACITY,
    description: '',
    blockedProducers: [],
    blockedConsumers: [],
  };

  const { queue, capacity, blockedProducers, blockedConsumers, activeThread } = stepData;

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const visualization = (
    <>
      <div className="mb-4 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
        <div className="text-sm text-cyan-800 text-center">
          <span className="font-medium">BlockingQueue:</span> put() blocks if full, take() blocks if empty
        </div>
      </div>

      <div className="mb-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200">
        <div className="text-sm font-bold text-cyan-800 mb-3">🔄 Producer-Consumer Pattern</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-green-100 p-2 rounded-lg border border-green-300 text-center">
            <div className="font-bold text-green-700">Producers</div>
            <div className="text-green-600">put() → queue</div>
            <div className="text-[10px] text-green-500">Block if FULL</div>
          </div>
          <div className="bg-gray-100 p-2 rounded-lg border border-gray-300 text-center">
            <div className="font-bold text-gray-700">Queue</div>
            <div className="text-gray-600">{queue.length}/{capacity}</div>
          </div>
          <div className="bg-blue-100 p-2 rounded-lg border border-blue-300 text-center">
            <div className="font-bold text-blue-700">Consumers</div>
            <div className="text-blue-600">take() ← queue</div>
            <div className="text-[10px] text-blue-500">Block if EMPTY</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-500 mb-2 text-center">Producers</div>
          <div className="flex flex-col gap-2">
            {['P1', 'P2'].map((p) => (
              <div
                key={p}
                className={`px-3 py-2 rounded-lg text-center text-sm font-medium ${
                  activeThread === p
                    ? 'bg-green-500 text-white'
                    : blockedProducers.includes(p)
                      ? 'bg-red-100 text-red-700 border-2 border-red-300'
                      : 'bg-green-100 text-green-700'
                }`}
              >
                {p}
                {blockedProducers.includes(p) && <span className="block text-[10px]">BLOCKED</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="text-xs font-medium text-gray-500 mb-2 text-center">Queue ({queue.length}/{capacity})</div>
          <div className="bg-gray-100 rounded-lg p-2 min-h-[80px]">
            <div className="mb-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${queue.length === capacity ? 'bg-red-500' : 'bg-cyan-500'}`}
                style={{ width: `${(queue.length / capacity) * 100}%` }}
              />
            </div>
            <div className="flex flex-col gap-1">
              {queue.length > 0 ? (
                queue.map((item, idx) => (
                  <div key={idx} className="px-2 py-1 bg-white rounded border text-xs font-medium text-center">
                    {item}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 text-xs py-2">Empty</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="text-xs font-medium text-gray-500 mb-2 text-center">Consumers</div>
          <div className="flex flex-col gap-2">
            {['C1', 'C2'].map((c) => (
              <div
                key={c}
                className={`px-3 py-2 rounded-lg text-center text-sm font-medium ${
                  activeThread === c
                    ? 'bg-blue-500 text-white'
                    : blockedConsumers.includes(c)
                      ? 'bg-red-100 text-red-700 border-2 border-red-300'
                      : 'bg-blue-100 text-blue-700'
                }`}
              >
                {c}
                {blockedConsumers.includes(c) && <span className="block text-[10px]">BLOCKED</span>}
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
      title="BlockingQueue (Interview Mode)"
      badges={BADGES}
      gradient="cyan"
      className={className}
      minHeight={380}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description: stepData.description,
        currentStep: playback.currentStep,
        totalSteps: playback.steps.length,
        variant: stepData.operation === 'blocked' ? 'error' : stepData.operation === 'done' ? 'success' : 'default',
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

export const BlockingQueueInterviewVisualizer = React.memo(BlockingQueueInterviewVisualizerComponent);
export default BlockingQueueInterviewVisualizer;
