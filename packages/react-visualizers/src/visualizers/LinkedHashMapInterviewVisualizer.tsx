import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface LinkedHashMapStep {
  operation: 'init' | 'put' | 'get' | 'access' | 'done';
  key: string;
  value?: number;
  linkedOrder: string[];
  description: string;
  highlightKey?: string;
}

interface LinkedHashMapInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'linkedhashmap-interview-visualizer';

const BADGES = [
  { label: 'Interview Mode', variant: 'orange' as const },
  { label: 'O(1) + Order', variant: 'orange' as const },
];

const OPERATIONS: Array<{ op: 'put' | 'get'; key: string; value?: number }> = [
  { op: 'put', key: 'A', value: 10 },
  { op: 'put', key: 'B', value: 20 },
  { op: 'put', key: 'C', value: 30 },
  { op: 'get', key: 'A' },
  { op: 'put', key: 'D', value: 40 },
  { op: 'get', key: 'B' },
];

const LEGEND_ITEMS = [
  { color: 'bg-orange-500', label: 'Current' },
  { color: 'bg-orange-100', label: 'Linked entry' },
  { color: 'bg-green-400', label: 'Found' },
];

const LINKEDHASHMAP_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'lhm-1',
    question: 'What is the iteration order of LinkedHashMap (default mode)?',
    options: ['Random order', 'Sorted by key', 'Insertion order', 'Access order'],
    correctAnswer: 2,
    explanation: 'By default, LinkedHashMap maintains insertion order. You can set accessOrder=true in constructor for LRU-style access ordering.',
    hint: 'Think about what "Linked" in LinkedHashMap means.',
    difficulty: 'easy',
    topic: 'Iteration Order',
  },
  {
    id: 'lhm-2',
    question: 'What is the time complexity of get() in LinkedHashMap?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 0,
    explanation: 'LinkedHashMap inherits HashMap\'s O(1) get(). The linked list is only for iteration order, not for lookup.',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'lhm-3',
    question: 'How to create a LinkedHashMap with LRU (access order)?',
    options: [
      'new LinkedHashMap<>(16, 0.75f, true)',
      'new LinkedHashMap<>().setLRU(true)',
      'new LinkedHashMap<>(LRU)',
      'LinkedHashMap.createLRU()'
    ],
    correctAnswer: 0,
    explanation: 'The third constructor parameter sets accessOrder. true = access order (LRU), false (default) = insertion order.',
    difficulty: 'medium',
    topic: 'LRU Mode',
  },
  {
    id: 'lhm-4',
    question: 'In access-order mode, what happens when you call get(key)?',
    options: [
      'Nothing changes',
      'Entry moves to the end of iteration order',
      'Entry moves to the beginning',
      'Entry is removed'
    ],
    correctAnswer: 1,
    explanation: 'In access-order mode, get() moves the accessed entry to the end (most recently used). Enables LRU cache implementation.',
    hint: 'Think about LRU cache behavior.',
    difficulty: 'medium',
    topic: 'Access Order',
  },
  {
    id: 'lhm-5',
    question: 'How to implement bounded LRU cache with LinkedHashMap?',
    options: [
      'Override removeEldestEntry() to return true when size > max',
      'Call setMaxSize(n)',
      'Use LinkedHashMap.bounded(n)',
      'It\'s not possible'
    ],
    correctAnswer: 0,
    explanation: 'Override removeEldestEntry(Map.Entry eldest) to return true when eviction needed. Called after each put().',
    difficulty: 'hard',
    topic: 'LRU Cache',
  },
  {
    id: 'lhm-6',
    question: 'What is the space overhead of LinkedHashMap vs HashMap?',
    options: [
      'Same - no overhead',
      '2 extra pointers per entry (before/after)',
      '4 extra pointers per entry',
      '1 extra pointer per entry'
    ],
    correctAnswer: 1,
    explanation: 'Each entry stores before/after pointers for doubly linked list, plus head/tail for the map. ~16 bytes overhead per entry.',
    difficulty: 'medium',
    topic: 'Space Complexity',
  },
  {
    id: 'lhm-7',
    question: 'What happens when you call put(existingKey, newValue) in insertion-order mode?',
    options: [
      'Entry moves to end (like new insertion)',
      'Entry stays in its original position',
      'Entry moves to beginning',
      'Old entry removed, new one at end'
    ],
    correctAnswer: 1,
    explanation: 'In insertion-order mode, replacing value doesn\'t change position. Entry stays where it was originally inserted.',
    difficulty: 'hard',
    topic: 'Update Behavior',
  },
  {
    id: 'lhm-8',
    question: 'LinkedHashMap inherits from which class?',
    options: ['TreeMap', 'HashMap', 'AbstractMap', 'Hashtable'],
    correctAnswer: 1,
    explanation: 'LinkedHashMap extends HashMap and overrides entry creation to add linked list functionality. Inherits all HashMap performance.',
    difficulty: 'easy',
    topic: 'Inheritance',
  },
  {
    id: 'lhm-9',
    question: 'What is the time complexity of iteration in LinkedHashMap?',
    options: ['O(n)', 'O(n + buckets)', 'O(n log n)', 'O(n²)'],
    correctAnswer: 0,
    explanation: 'LinkedHashMap iteration is O(n) - just follows the linked list. HashMap iteration is O(n + buckets) as it traverses empty buckets.',
    hint: 'Compare with HashMap iteration.',
    difficulty: 'medium',
    topic: 'Iteration',
  },
  {
    id: 'lhm-10',
    question: 'Is LinkedHashMap thread-safe?',
    options: [
      'Yes, fully thread-safe',
      'Yes, for reads only',
      'No, use Collections.synchronizedMap()',
      'No, but there\'s ConcurrentLinkedHashMap'
    ],
    correctAnswer: 2,
    explanation: 'LinkedHashMap is NOT thread-safe. Use Collections.synchronizedMap() or consider Caffeine/Guava caches for concurrent LRU.',
    difficulty: 'easy',
    topic: 'Thread Safety',
  },
];

function generateLinkedHashMapSteps(): LinkedHashMapStep[] {
  const steps: LinkedHashMapStep[] = [];
  const linkedOrder: string[] = [];
  const map: Map<string, number> = new Map();

  steps.push({
    operation: 'init',
    key: '',
    linkedOrder: [],
    description: 'Initialize LinkedHashMap (access-order for LRU)',
  });

  for (const { op, key, value } of OPERATIONS) {
    if (op === 'put') {
      const existed = map.has(key);
      map.set(key, value ?? 0);

      if (existed) {
        const idx = linkedOrder.indexOf(key);
        linkedOrder.splice(idx, 1);
      }
      linkedOrder.push(key);

      steps.push({
        operation: 'put',
        key,
        value,
        linkedOrder: [...linkedOrder],
        description: existed
          ? `put("${key}", ${value}): Update & move to end`
          : `put("${key}", ${value}): Add at end of list`,
        highlightKey: key,
      });
    } else {
      const found = map.get(key);
      if (found !== undefined) {
        const idx = linkedOrder.indexOf(key);
        linkedOrder.splice(idx, 1);
        linkedOrder.push(key);

        steps.push({
          operation: 'access',
          key,
          value: found,
          linkedOrder: [...linkedOrder],
          description: `get("${key}") → ${found}. Move to end (LRU)`,
          highlightKey: key,
        });
      } else {
        steps.push({
          operation: 'get',
          key,
          linkedOrder: [...linkedOrder],
          description: `get("${key}") → null (not found)`,
        });
      }
    }
  }

  steps.push({
    operation: 'done',
    key: '',
    linkedOrder: [...linkedOrder],
    description: `Done! Order: ${linkedOrder.join(' → ')}`,
  });

  return steps;
}

const LinkedHashMapInterviewVisualizerComponent: React.FC<LinkedHashMapInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'lhm-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateLinkedHashMapSteps, []);

  const playback = useVisualizerPlayback<LinkedHashMapStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: LINKEDHASHMAP_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: LinkedHashMapStep = playback.currentStepData || {
    operation: 'init',
    key: '',
    linkedOrder: [],
    description: '',
  };

  const { linkedOrder, highlightKey } = stepData;

  const getNodeStyle = (key: string): string => {
    if (key === highlightKey) {
      return stepData.operation === 'access' || stepData.operation === 'get'
        ? 'bg-green-400 text-white ring-2 ring-green-300'
        : 'bg-orange-500 text-white ring-2 ring-orange-300';
    }
    return 'bg-orange-100 text-orange-700';
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const visualization = (
    <>
      <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
        <div className="text-sm text-orange-800 text-center">
          <span className="font-medium">LinkedHashMap:</span> HashMap + doubly linked list for order
        </div>
      </div>

      <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
        <div className="text-sm font-bold text-orange-800 mb-2">Structure: HashMap + DLL</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-white p-2 rounded-lg border border-orange-200">
            <div className="font-semibold text-gray-700">🗂️ Hash Table</div>
            <div className="text-gray-500">O(1) get/put</div>
          </div>
          <div className="bg-white p-2 rounded-lg border border-orange-200">
            <div className="font-semibold text-gray-700">🔗 Doubly Linked List</div>
            <div className="text-gray-500">Maintains order</div>
          </div>
        </div>
      </div>

      <div className="mb-4 p-3 bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl border-2 border-orange-300">
        <div className="text-sm font-semibold text-orange-800 mb-2">🔗 Iteration Order (access-order / LRU)</div>
        <div className="bg-white rounded-lg p-3 border border-orange-200">
          <div className="flex flex-wrap items-center gap-1">
            {linkedOrder.length > 0 ? (
              <>
                <div className="px-2 py-1 bg-gray-100 text-[10px] text-gray-600 rounded font-semibold">HEAD (eldest)</div>
                <span className="text-orange-400 font-bold">→</span>
                {linkedOrder.map((key, idx) => (
                  <React.Fragment key={key}>
                    {idx > 0 && <span className="text-orange-400 font-bold">⇄</span>}
                    <div className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${getNodeStyle(key)}`}>
                      {key}
                    </div>
                  </React.Fragment>
                ))}
                <span className="text-orange-400 font-bold">→</span>
                <div className="px-2 py-1 bg-gray-100 text-[10px] text-gray-600 rounded font-semibold">TAIL (newest)</div>
              </>
            ) : (
              <span className="text-xs text-gray-400 italic">Empty map</span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-xs text-blue-700">
          <strong>LRU Cache:</strong> In access-order mode, oldest entry (head) is evicted first.
          {linkedOrder.length > 0 && (
            <span className="ml-2">
              Oldest: <strong>{linkedOrder[0]}</strong> | Newest: <strong>{linkedOrder[linkedOrder.length - 1]}</strong>
            </span>
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
      title="LinkedHashMap (Interview Mode)"
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
        variant: stepData.operation === 'done' ? 'success' : stepData.operation === 'access' ? 'warning' : 'default',
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

export const LinkedHashMapInterviewVisualizer = React.memo(LinkedHashMapInterviewVisualizerComponent);
export default LinkedHashMapInterviewVisualizer;
