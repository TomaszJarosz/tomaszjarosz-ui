import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';
import {
  BaseVisualizerLayout,
  InterviewModePanel,
  useInterviewMode,
} from '../shared';
import type { InterviewQuestion } from '../shared';

interface ImmutableStep {
  operation: 'create' | 'tryModify' | 'derive' | 'init' | 'done';
  method?: string;
  original: string[];
  derived?: string[];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  error?: boolean;
  showDerived?: boolean;
}

interface ImmutableCollectionsInterviewVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
  shuffleQuestions?: boolean;
  onComplete?: (session: ReturnType<typeof useInterviewMode>['session']) => void;
}

const IMMUTABLE_CODE = [
  '// Java 9+ Immutable Collections',
  '',
  '// Creation - O(1) for small, O(n) copy',
  'List.of("A", "B", "C")',
  'Set.of(1, 2, 3)',
  'Map.of("k1", "v1", "k2", "v2")',
  '',
  '// Modification attempts throw!',
  'list.add("D")  // UnsupportedOp!',
  'list.set(0, "X")  // UnsupportedOp!',
  '',
  '// Safe derivation pattern',
  'var newList = new ArrayList<>(list)',
  'newList.add("D")  // Works!',
];

const LEGEND_ITEMS = [
  { color: 'bg-violet-100', label: 'Immutable', border: '#c4b5fd' },
  { color: 'bg-green-100', label: 'Mutable copy', border: '#86efac' },
  { color: 'bg-red-100', label: 'Error', border: '#fca5a5' },
];

const BADGES = [
  { label: 'Unmodifiable', variant: 'purple' as const },
  { label: 'Thread-safe', variant: 'purple' as const },
];

const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'imm-1',
    question: 'What happens when you call add() on a List created with List.of()?',
    options: [
      'The element is added successfully',
      'The element is ignored silently',
      'UnsupportedOperationException is thrown',
      'NullPointerException is thrown',
    ],
    correctAnswer: 2,
    explanation: 'Collections created with List.of(), Set.of(), Map.of() are truly immutable. Any modification attempt throws UnsupportedOperationException at runtime.',
    hint: 'Immutable means no changes are allowed.',
    difficulty: 'easy',
    topic: 'Immutability',
  },
  {
    id: 'imm-2',
    question: 'Which Java version introduced List.of(), Set.of(), Map.of() factory methods?',
    options: [
      'Java 8',
      'Java 9',
      'Java 11',
      'Java 17',
    ],
    correctAnswer: 1,
    explanation: 'Java 9 introduced immutable collection factory methods: List.of(), Set.of(), Map.of(), Map.ofEntries(). These provide a concise way to create unmodifiable collections.',
    hint: 'It came with the module system.',
    difficulty: 'easy',
    topic: 'Java Version',
  },
  {
    id: 'imm-3',
    question: 'Why are immutable collections inherently thread-safe?',
    options: [
      'They use internal synchronization',
      'They use volatile fields',
      'No state can change, so no race conditions are possible',
      'They copy data on every access',
    ],
    correctAnswer: 2,
    explanation: 'Immutable collections are thread-safe because their state cannot change after creation. Race conditions require mutable shared state, which immutable collections eliminate by design.',
    hint: 'No locks needed when nothing changes.',
    difficulty: 'medium',
    topic: 'Thread Safety',
  },
  {
    id: 'imm-4',
    question: 'What is the difference between List.of() and Collections.unmodifiableList()?',
    options: [
      'No difference, they are equivalent',
      'List.of() creates a new immutable list; unmodifiableList() wraps existing list (changes reflect)',
      'unmodifiableList() is faster',
      'List.of() allows null values',
    ],
    correctAnswer: 1,
    explanation: 'List.of() creates a truly immutable copy. Collections.unmodifiableList() creates a view - if the underlying list changes, those changes are visible through the wrapper.',
    hint: 'One wraps, one copies.',
    difficulty: 'medium',
    topic: 'API Differences',
  },
  {
    id: 'imm-5',
    question: 'Can List.of() contain null values?',
    options: [
      'Yes, any number of nulls',
      'Yes, but only one null',
      'No, it throws NullPointerException',
      'No, it ignores null values',
    ],
    correctAnswer: 2,
    explanation: 'List.of(), Set.of(), and Map.of() do not allow null values. Passing null throws NullPointerException immediately. This is a design decision to prevent NPEs later.',
    hint: 'Java 9+ factories are strict about null.',
    difficulty: 'medium',
    topic: 'Null Handling',
  },
  {
    id: 'imm-6',
    question: 'How do you create a modified copy of an immutable collection?',
    options: [
      'Use the modify() method',
      'Create a new ArrayList/HashSet from it, modify, optionally wrap again',
      'Use reflection to bypass immutability',
      'Immutable collections cannot be modified at all',
    ],
    correctAnswer: 1,
    explanation: 'Create a mutable copy: new ArrayList<>(immutableList), modify it, then optionally create a new immutable: List.copyOf(mutableList). This is the functional update pattern.',
    hint: 'Copy, modify, optionally wrap.',
    difficulty: 'easy',
    topic: 'Modification Pattern',
  },
  {
    id: 'imm-7',
    question: 'What is List.copyOf() introduced in Java 10?',
    options: [
      'Creates a mutable copy of any collection',
      'Creates an immutable copy of any collection',
      'Creates a lazy view of a collection',
      'Copies a list to an array',
    ],
    correctAnswer: 1,
    explanation: 'List.copyOf() creates an immutable list from any collection. If the source is already an immutable list (created by List.of()), it may return the same instance (optimization).',
    hint: 'Java 10 added this convenience method.',
    difficulty: 'medium',
    topic: 'Java 10 API',
  },
  {
    id: 'imm-8',
    question: 'What is the space complexity of immutable collections vs regular collections?',
    options: [
      'Immutable use 2x more memory',
      'Immutable use 50% more memory',
      'Immutable are more memory-efficient (no resizing overhead)',
      'No difference',
    ],
    correctAnswer: 2,
    explanation: 'Immutable collections are typically more memory-efficient. They use compact internal representations (field-based for small sizes) and dont need capacity buffer for growth.',
    hint: 'No need for growth buffer.',
    difficulty: 'hard',
    topic: 'Memory',
  },
  {
    id: 'imm-9',
    question: 'Which statement about Set.of() is true?',
    options: [
      'Allows duplicate elements',
      'Throws IllegalArgumentException if duplicates provided',
      'Silently ignores duplicates',
      'Keeps first occurrence of duplicates',
    ],
    correctAnswer: 1,
    explanation: 'Set.of() throws IllegalArgumentException if you provide duplicate elements. Unlike HashSet which silently ignores duplicates, Set.of() is strict about input validity.',
    hint: 'Fails fast on invalid input.',
    difficulty: 'medium',
    topic: 'Set.of() Behavior',
  },
  {
    id: 'imm-10',
    question: 'What is the iteration order of List.of() elements?',
    options: [
      'Random order',
      'Sorted order',
      'Insertion order (same as provided)',
      'Reverse order',
    ],
    correctAnswer: 2,
    explanation: 'List.of() preserves insertion order - elements are returned in the same order they were provided. This is consistent with List interface contract.',
    hint: 'List maintains order.',
    difficulty: 'easy',
    topic: 'Ordering',
  },
];

function generateImmutableSteps(): ImmutableStep[] {
  const steps: ImmutableStep[] = [];

  steps.push({
    operation: 'init',
    original: [],
    description: 'Immutable Collections (Java 9+): Thread-safe by design. No locks needed!',
    codeLine: -1,
  });

  steps.push({
    operation: 'create',
    method: 'List.of()',
    original: ['A', 'B', 'C'],
    description: 'List.of("A", "B", "C") - Creates unmodifiable List. Compact, no extra memory overhead.',
    codeLine: 3,
    variables: { size: 3, type: 'ImmutableList' },
  });

  steps.push({
    operation: 'tryModify',
    method: 'add()',
    original: ['A', 'B', 'C'],
    description: 'list.add("D") - UnsupportedOperationException! Immutable means NO modifications.',
    codeLine: 8,
    variables: { method: 'add', result: 'Exception!' },
    error: true,
  });

  steps.push({
    operation: 'tryModify',
    method: 'set()',
    original: ['A', 'B', 'C'],
    description: 'list.set(0, "X") - UnsupportedOperationException! Even index-based changes fail.',
    codeLine: 9,
    variables: { method: 'set', result: 'Exception!' },
    error: true,
  });

  steps.push({
    operation: 'derive',
    method: 'new ArrayList<>()',
    original: ['A', 'B', 'C'],
    derived: ['A', 'B', 'C'],
    description: 'new ArrayList<>(list) - Create mutable copy. Original stays unchanged forever!',
    codeLine: 12,
    variables: { copied: 3 },
    showDerived: true,
  });

  steps.push({
    operation: 'derive',
    method: 'newList.add()',
    original: ['A', 'B', 'C'],
    derived: ['A', 'B', 'C', 'D'],
    description: 'newList.add("D") - Works! Mutable copy can be modified. Original unchanged.',
    codeLine: 13,
    variables: { newSize: 4, originalSize: 3 },
    showDerived: true,
  });

  steps.push({
    operation: 'done',
    original: ['A', 'B', 'C'],
    description: 'Immutable = Thread-safe without locks. Share freely between threads!',
    codeLine: -1,
    variables: { 'thread-safe': 'always' },
  });

  return steps;
}

const ImmutableCollectionsInterviewVisualizerComponent: React.FC<
  ImmutableCollectionsInterviewVisualizerProps
> = ({
  showControls = true,
  showCode = true,
  className = '',
  shuffleQuestions = false,
  onComplete,
}) => {
  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');
  const [speed, setSpeed] = useState(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ImmutableStep[]>([]);

  const playingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const interview = useInterviewMode({
    questions: INTERVIEW_QUESTIONS,
    shuffleQuestions,
    onComplete,
  });

  const initialize = useCallback(() => {
    const newSteps = generateImmutableSteps();
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
    playingRef.current = false;
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      playingRef.current = true;
      const delay = Math.max(100, 2000 - speed * 19);

      timeoutRef.current = setTimeout(() => {
        if (playingRef.current) {
          setCurrentStep((prev) => prev + 1);
        }
      }, delay);
    } else if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      playingRef.current = false;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, currentStep, steps.length, speed]);

  const handlePlayPause = () => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
    playingRef.current = !isPlaying;
  };

  const handleStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, steps.length]);

  const handleStepBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleReset = () => {
    setIsPlaying(false);
    playingRef.current = false;
    setCurrentStep(0);
  };

  const currentStepData = steps[currentStep] || {
    operation: 'init',
    original: [],
    description: '',
  };

  const { original, derived, description, error, showDerived } = currentStepData;

  const getStatusVariant = () => {
    if (error) return 'error' as const;
    if (currentStepData.operation === 'done') return 'success' as const;
    return 'default' as const;
  };

  const headerExtra = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setMode('visualize')}
        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
          mode === 'visualize'
            ? 'bg-purple-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
          mode === 'interview'
            ? 'bg-purple-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Interview ({interview.session.results.length}/{INTERVIEW_QUESTIONS.length})
      </button>
    </div>
  );

  const visualization = mode === 'interview' ? (
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
  ) : (
    <>
      {/* Collections Display */}
      <div className="mb-4 space-y-4 min-h-[180px]">
        {/* Original Immutable */}
        <div className={`p-4 bg-violet-50 rounded-lg border-2 border-violet-200 min-h-[80px] ${original.length === 0 ? 'hidden' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-medium text-violet-700">
              Immutable List (List.of)
            </span>
          </div>
          <div className="flex gap-2 min-h-[48px]">
            {original.map((item, idx) => (
              <div
                key={idx}
                className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 font-bold transition-colors ${
                  error
                    ? 'bg-red-100 border-red-300 text-red-700 animate-pulse'
                    : 'bg-violet-100 border-violet-300 text-violet-700'
                }`}
              >
                {item}
              </div>
            ))}
            {error && (
              <div className="flex items-center text-red-600 text-sm font-medium ml-2">
                Cannot modify!
              </div>
            )}
          </div>
        </div>

        {/* Derived Mutable */}
        <div className={`p-4 bg-green-50 rounded-lg border-2 border-green-200 min-h-[80px] ${!(showDerived && derived) ? 'invisible' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-green-700">
              Mutable Copy (ArrayList)
            </span>
          </div>
          <div className="flex gap-2 min-h-[48px]">
            {derived && derived.map((item, idx) => (
              <div
                key={idx}
                className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 font-bold ${
                  idx === derived.length - 1 && derived.length > original.length
                    ? 'bg-green-500 border-green-600 text-white'
                    : 'bg-green-100 border-green-300 text-green-700'
                }`}
              >
                {item}
              </div>
            ))}
            {showDerived && (
              <div className="flex items-center text-green-600 text-sm font-medium ml-2">
                Modifiable
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <div className="text-xs text-gray-600 grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="font-medium text-violet-700">No Locks</div>
            <div className="text-gray-500">Thread-safe by nature</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-violet-700">Compact</div>
            <div className="text-gray-500">Optimized memory</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-violet-700">Safe Sharing</div>
            <div className="text-gray-500">Pass freely</div>
          </div>
        </div>
      </div>
    </>
  );

  const dynamicBadges = mode === 'interview'
    ? [{ label: 'Interview Mode', variant: 'purple' as const }]
    : BADGES;

  return (
    <BaseVisualizerLayout
      id="immutablecollections-interview-visualizer"
      title="Immutable Collections"
      badges={dynamicBadges}
      gradient="purple"
      className={className}
      minHeight={350}
      headerExtra={headerExtra}
      status={mode === 'visualize' ? {
        description,
        currentStep,
        totalSteps: steps.length,
        variant: getStatusVariant(),
      } : undefined}
      controls={mode === 'visualize' ? {
        isPlaying,
        currentStep,
        totalSteps: steps.length,
        speed,
        onPlayPause: handlePlayPause,
        onStep: handleStep,
        onStepBack: handleStepBack,
        onReset: handleReset,
        onSpeedChange: setSpeed,
        accentColor: 'purple',
      } : undefined}
      showControls={showControls && mode === 'visualize'}
      legendItems={mode === 'visualize' ? LEGEND_ITEMS : undefined}
      code={showCode && mode === 'visualize' ? IMMUTABLE_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode && mode === 'visualize'}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const ImmutableCollectionsInterviewVisualizer = React.memo(
  ImmutableCollectionsInterviewVisualizerComponent
);
export default ImmutableCollectionsInterviewVisualizer;
