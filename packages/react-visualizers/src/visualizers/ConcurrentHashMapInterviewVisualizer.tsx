import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface Segment {
  id: number;
  entries: Array<{ key: string; value: number }>;
  locked: boolean;
  lockOwner?: string;
}

interface ConcurrentStep {
  operation: 'put' | 'get' | 'lock' | 'unlock' | 'init' | 'done';
  thread: string;
  key?: string;
  value?: number;
  segmentId?: number;
  segments: Segment[];
  description: string;
  highlightSegment?: number;
  activeThreads?: string[];
}

interface ConcurrentHashMapInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'chm-interview-visualizer';

const BADGES = [
  { label: 'Interview Mode', variant: 'purple' as const },
  { label: 'Thread-Safe', variant: 'orange' as const },
];

const SEGMENT_COUNT = 4;

const OPERATIONS: Array<{ thread: string; op: 'put' | 'get'; key: string; value?: number }> = [
  { thread: 'T1', op: 'put', key: 'Alice', value: 100 },
  { thread: 'T2', op: 'put', key: 'Bob', value: 200 },
  { thread: 'T1', op: 'get', key: 'Alice' },
  { thread: 'T2', op: 'put', key: 'Carol', value: 150 },
];

const LEGEND_ITEMS = [
  { color: 'bg-blue-50', label: 'Active', border: '#60a5fa' },
  { color: 'bg-red-50', label: 'Locked', border: '#f87171' },
  { color: 'bg-gray-50', label: 'Unlocked', border: '#d1d5db' },
];

const CHM_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'chm-1',
    question: 'What is the main advantage of ConcurrentHashMap over synchronized HashMap?',
    options: [
      'Uses less memory',
      'Allows multiple threads to read/write different segments simultaneously',
      'Faster single-threaded performance',
      'Simpler API'
    ],
    correctAnswer: 1,
    explanation: 'ConcurrentHashMap uses segment-level (or bucket-level in Java 8+) locking instead of a single lock for the entire map. Multiple threads can access different segments concurrently.',
    hint: 'Think about what "concurrent" means.',
    difficulty: 'easy',
    topic: 'Concurrency',
  },
  {
    id: 'chm-2',
    question: 'Does get() operation require locking in ConcurrentHashMap?',
    options: [
      'Yes, always',
      'No, it uses volatile reads',
      'Only if the key doesn\'t exist',
      'Only during resize'
    ],
    correctAnswer: 1,
    explanation: 'get() is lock-free! It uses volatile reads to ensure visibility of the latest values. This makes reads extremely fast and never block other operations.',
    difficulty: 'medium',
    topic: 'Lock-free Reads',
  },
  {
    id: 'chm-3',
    question: 'What synchronization technique does Java 8+ ConcurrentHashMap primarily use for put()?',
    options: [
      'synchronized keyword on entire map',
      'CAS (Compare-And-Swap) and synchronized on individual buckets',
      'ReentrantLock on all operations',
      'No synchronization needed'
    ],
    correctAnswer: 1,
    explanation: 'Java 8+ uses CAS for empty bucket insertion and synchronized blocks on the first node of non-empty buckets. This is more fine-grained than the segment-based locking of earlier versions.',
    difficulty: 'hard',
    topic: 'Implementation',
  },
  {
    id: 'chm-4',
    question: 'What happens if you iterate over ConcurrentHashMap while another thread modifies it?',
    options: [
      'ConcurrentModificationException is thrown',
      'Iterator reflects some consistent state, no exception',
      'Iterator always shows empty map',
      'JVM crashes'
    ],
    correctAnswer: 1,
    explanation: 'ConcurrentHashMap iterators are "weakly consistent" - they don\'t throw ConcurrentModificationException and reflect the state at some point during iteration. They may or may not show concurrent updates.',
    difficulty: 'medium',
    topic: 'Iteration',
  },
  {
    id: 'chm-5',
    question: 'What is the default concurrency level in early ConcurrentHashMap implementations?',
    options: ['4', '8', '16', '32'],
    correctAnswer: 2,
    explanation: 'Default concurrency level was 16 (number of segments). This means up to 16 threads could write concurrently. Java 8+ moved away from segments to bucket-level locking.',
    difficulty: 'medium',
    topic: 'Configuration',
  },
  {
    id: 'chm-6',
    question: 'Can ConcurrentHashMap have null keys or null values?',
    options: [
      'Yes for both',
      'Only null keys allowed',
      'Only null values allowed',
      'Neither null keys nor null values allowed'
    ],
    correctAnswer: 3,
    explanation: 'ConcurrentHashMap prohibits null keys and values. This is because null is used internally as a sentinel and ambiguity would exist (is null the value or does key not exist?).',
    hint: 'Think about the get() method returning null.',
    difficulty: 'easy',
    topic: 'API Restrictions',
  },
  {
    id: 'chm-7',
    question: 'What atomic operation does ConcurrentHashMap provide that HashMap doesn\'t?',
    options: [
      'get()',
      'put()',
      'putIfAbsent()',
      'containsKey()'
    ],
    correctAnswer: 2,
    explanation: 'putIfAbsent() atomically checks if key exists and puts if not. Also: compute(), computeIfAbsent(), computeIfPresent(), merge() - all atomic compound operations.',
    difficulty: 'medium',
    topic: 'Atomic Operations',
  },
  {
    id: 'chm-8',
    question: 'How does size() work in ConcurrentHashMap?',
    options: [
      'Returns exact size with full lock',
      'Returns approximate size without locking',
      'Always returns 0',
      'Throws UnsupportedOperationException'
    ],
    correctAnswer: 1,
    explanation: 'size() returns an approximate count as calculating exact size would require locking all segments. Use mappingCount() for long values. Both are approximations in concurrent scenarios.',
    difficulty: 'medium',
    topic: 'API Behavior',
  },
  {
    id: 'chm-9',
    question: 'When should you prefer Collections.synchronizedMap() over ConcurrentHashMap?',
    options: [
      'Never, ConcurrentHashMap is always better',
      'When you need to lock the entire map for compound operations',
      'When you have more reads than writes',
      'When using Java 7'
    ],
    correctAnswer: 1,
    explanation: 'If you need to lock entire map for multiple operations as one atomic unit, synchronizedMap with external synchronization is clearer. ConcurrentHashMap doesn\'t support full-map locking.',
    difficulty: 'hard',
    topic: 'Design Choice',
  },
  {
    id: 'chm-10',
    question: 'What data structure does ConcurrentHashMap use when bucket has many collisions (Java 8+)?',
    options: [
      'Linked List',
      'Red-Black Tree',
      'Array',
      'Skip List'
    ],
    correctAnswer: 1,
    explanation: 'Like HashMap in Java 8+, ConcurrentHashMap converts bucket to Red-Black Tree when entries exceed threshold (8), improving worst-case from O(n) to O(log n). Converts back when entries < 6.',
    difficulty: 'hard',
    topic: 'Tree Bins',
  },
];

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

function generateConcurrentSteps(): ConcurrentStep[] {
  const steps: ConcurrentStep[] = [];
  const segments: Segment[] = Array.from({ length: SEGMENT_COUNT }, (_, i) => ({
    id: i,
    entries: [],
    locked: false,
  }));

  steps.push({
    operation: 'init',
    thread: '',
    segments: segments.map((s) => ({ ...s, entries: [...s.entries] })),
    description: `ConcurrentHashMap with ${SEGMENT_COUNT} segments`,
    activeThreads: [],
  });

  for (const { thread, op, key, value } of OPERATIONS) {
    const hash = simpleHash(key);
    const segmentId = hash % SEGMENT_COUNT;

    if (op === 'put') {
      segments[segmentId].locked = true;
      segments[segmentId].lockOwner = thread;

      steps.push({
        operation: 'lock',
        thread,
        key,
        segmentId,
        segments: segments.map((s) => ({ ...s, entries: [...s.entries] })),
        description: `${thread}: Lock segment ${segmentId} for put("${key}")`,
        highlightSegment: segmentId,
        activeThreads: [thread],
      });

      const existingIdx = segments[segmentId].entries.findIndex((e) => e.key === key);
      if (existingIdx >= 0) {
        segments[segmentId].entries[existingIdx].value = value ?? 0;
      } else {
        segments[segmentId].entries.push({ key, value: value ?? 0 });
      }

      steps.push({
        operation: 'put',
        thread,
        key,
        value,
        segmentId,
        segments: segments.map((s) => ({ ...s, entries: [...s.entries] })),
        description: `${thread}: Insert ("${key}", ${value})`,
        highlightSegment: segmentId,
        activeThreads: [thread],
      });

      segments[segmentId].locked = false;
      segments[segmentId].lockOwner = undefined;

      steps.push({
        operation: 'unlock',
        thread,
        segmentId,
        segments: segments.map((s) => ({ ...s, entries: [...s.entries] })),
        description: `${thread}: Unlock segment ${segmentId}`,
        highlightSegment: segmentId,
        activeThreads: [thread],
      });
    } else {
      const entry = segments[segmentId].entries.find((e) => e.key === key);

      steps.push({
        operation: 'get',
        thread,
        key,
        value: entry?.value,
        segmentId,
        segments: segments.map((s) => ({ ...s, entries: [...s.entries] })),
        description: `${thread}: get("${key}") = ${entry?.value ?? 'null'} (NO LOCK!)`,
        highlightSegment: segmentId,
        activeThreads: [thread],
      });
    }
  }

  steps.push({
    operation: 'done',
    thread: '',
    segments: segments.map((s) => ({ ...s, entries: [...s.entries] })),
    description: 'Done! Lock-free reads, segment-level writes.',
    activeThreads: [],
  });

  return steps;
}

const ConcurrentHashMapInterviewVisualizerComponent: React.FC<ConcurrentHashMapInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'chm-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateConcurrentSteps, []);

  const playback = useVisualizerPlayback<ConcurrentStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: CHM_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: ConcurrentStep = playback.currentStepData || {
    operation: 'init',
    thread: '',
    segments: [],
    description: '',
    activeThreads: [],
  };

  const getSegmentStyle = (seg: Segment, idx: number): string => {
    if (idx === stepData.highlightSegment) {
      return seg.locked ? 'border-red-400 bg-red-50' : 'border-blue-400 bg-blue-50';
    }
    return seg.locked ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-gray-50';
  };

  const getThreadColor = (thread: string): string => {
    const colors: Record<string, string> = { T1: 'bg-blue-500', T2: 'bg-green-500', T3: 'bg-purple-500' };
    return colors[thread] || 'bg-gray-500';
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const visualization = (
    <>
      <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <div className="text-sm text-purple-800 text-center">
          <span className="font-medium">ConcurrentHashMap:</span> Segment locks + lock-free reads
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-3">
        {['T1', 'T2'].map((t) => (
          <div
            key={t}
            className={`px-2 py-0.5 text-xs font-medium rounded ${getThreadColor(t)} text-white ${
              stepData.activeThreads?.includes(t) ? 'opacity-100' : 'opacity-30'
            }`}
          >
            {t}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        {stepData.segments.map((seg, idx) => (
          <div key={idx} className={`rounded-lg border-2 p-2 transition-colors ${getSegmentStyle(seg, idx)}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium text-gray-600">Seg {idx}</span>
              {seg.locked && (
                <span className="text-[9px] text-red-600 font-medium flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  {seg.lockOwner}
                </span>
              )}
            </div>
            <div className="space-y-0.5 min-h-[40px]">
              {seg.entries.length > 0 ? (
                seg.entries.map((entry, eIdx) => (
                  <div key={eIdx} className="flex justify-between px-1.5 py-0.5 bg-white rounded text-[10px] border border-gray-200">
                    <span className="text-gray-700">{entry.key}</span>
                    <span className="text-gray-500">{entry.value}</span>
                  </div>
                ))
              ) : (
                <div className="text-[9px] text-gray-400 text-center py-1">Empty</div>
              )}
            </div>
          </div>
        ))}
      </div>
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
      title="ConcurrentHashMap (Interview Mode)"
      badges={BADGES}
      gradient="purple"
      className={className}
      minHeight={320}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description: stepData.description,
        currentStep: playback.currentStep,
        totalSteps: playback.steps.length,
        variant: stepData.operation === 'done' ? 'success' : stepData.operation === 'lock' ? 'warning' : 'default',
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

export const ConcurrentHashMapInterviewVisualizer = React.memo(ConcurrentHashMapInterviewVisualizerComponent);
export default ConcurrentHashMapInterviewVisualizer;
