import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

interface EnumSetStep {
  operation: 'init' | 'add' | 'remove' | 'contains' | 'done';
  value?: DayOfWeek;
  bitmask: number;
  description: string;
  highlightBit?: number;
  result?: boolean;
}

interface EnumSetInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'enumset-interview-visualizer';

const BADGES = [
  { label: 'Interview Mode', variant: 'green' as const },
  { label: 'O(1) all ops', variant: 'green' as const },
];

const OPERATIONS: Array<{ op: 'add' | 'remove' | 'contains'; value: DayOfWeek }> = [
  { op: 'add', value: 'MON' },
  { op: 'add', value: 'WED' },
  { op: 'add', value: 'FRI' },
  { op: 'contains', value: 'WED' },
  { op: 'contains', value: 'TUE' },
  { op: 'remove', value: 'WED' },
];

const LEGEND_ITEMS = [
  { color: 'bg-green-500', label: 'Bit set (1)' },
  { color: 'bg-gray-200', label: 'Bit clear (0)' },
  { color: 'bg-blue-500', label: 'Current op' },
];

const ENUMSET_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'es-1',
    question: 'What data structure does EnumSet use internally?',
    options: ['HashSet', 'TreeSet', 'Bit vector (long)', 'ArrayList'],
    correctAnswer: 2,
    explanation: 'EnumSet uses bit vector stored in one or more longs. Each enum constant maps to a bit position via ordinal().',
    hint: 'Think about how you can represent set membership with bits.',
    difficulty: 'easy',
    topic: 'Internal Structure',
  },
  {
    id: 'es-2',
    question: 'What is the time complexity of add() in EnumSet?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctAnswer: 0,
    explanation: 'add() is O(1) - just sets a bit: elements |= (1L << ordinal). Single bitwise OR operation.',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'es-3',
    question: 'How does EnumSet.contains(element) work?',
    options: [
      'Linear search through array',
      'Binary search',
      'Bitwise AND: (elements & (1L << ordinal)) != 0',
      'Hash lookup'
    ],
    correctAnswer: 2,
    explanation: 'contains() checks if bit is set using bitwise AND. (elements & (1L << ordinal)) != 0. Single CPU instruction!',
    difficulty: 'medium',
    topic: 'Implementation',
  },
  {
    id: 'es-4',
    question: 'What is the maximum number of enum constants EnumSet can handle with single long?',
    options: ['32', '64', '128', '256'],
    correctAnswer: 1,
    explanation: 'A long has 64 bits, so RegularEnumSet handles up to 64 enum constants. JumboEnumSet uses long[] for larger enums.',
    difficulty: 'medium',
    topic: 'Capacity',
  },
  {
    id: 'es-5',
    question: 'What is the space complexity of EnumSet with n elements (n < 64)?',
    options: ['O(1)', 'O(n)', 'O(n²)', 'O(log n)'],
    correctAnswer: 0,
    explanation: 'EnumSet uses fixed 8 bytes (one long) regardless of how many elements. True O(1) space for enums with ≤64 constants.',
    hint: 'The bit vector size is fixed.',
    difficulty: 'medium',
    topic: 'Space Complexity',
  },
  {
    id: 'es-6',
    question: 'How much memory does EnumSet save vs HashSet for 7 enum values?',
    options: ['About the same', '~10x less', '~35x less', '~100x less'],
    correctAnswer: 2,
    explanation: 'EnumSet: 8 bytes (one long). HashSet: ~280 bytes (40 bytes per entry + overhead). ~35x memory savings!',
    difficulty: 'hard',
    topic: 'Memory Efficiency',
  },
  {
    id: 'es-7',
    question: 'Which statement about EnumSet is TRUE?',
    options: [
      'EnumSet allows null elements',
      'EnumSet iterator is in natural order (ordinal)',
      'EnumSet is slower than HashSet',
      'EnumSet works with any type'
    ],
    correctAnswer: 1,
    explanation: 'EnumSet iterates in ordinal order (declaration order). No null allowed. Faster than HashSet. Only works with enum types.',
    difficulty: 'medium',
    topic: 'Behavior',
  },
  {
    id: 'es-8',
    question: 'How do you create EnumSet with all enum constants?',
    options: [
      'new EnumSet<>(DayOfWeek.class)',
      'EnumSet.allOf(DayOfWeek.class)',
      'EnumSet.full(DayOfWeek.class)',
      'EnumSet.of(DayOfWeek.values())'
    ],
    correctAnswer: 1,
    explanation: 'EnumSet.allOf(EnumClass.class) creates set with all constants. EnumSet.noneOf() for empty, EnumSet.of() for specific values.',
    difficulty: 'easy',
    topic: 'API',
  },
  {
    id: 'es-9',
    question: 'Is EnumSet thread-safe?',
    options: [
      'Yes, fully synchronized',
      'Yes, uses CAS operations',
      'No, use Collections.synchronizedSet()',
      'No, but reads are safe'
    ],
    correctAnswer: 2,
    explanation: 'EnumSet is NOT thread-safe. Wrap with Collections.synchronizedSet() for concurrent access.',
    difficulty: 'easy',
    topic: 'Thread Safety',
  },
  {
    id: 'es-10',
    question: 'Why can\'t EnumSet use new EnumSet<>() constructor?',
    options: [
      'It\'s deprecated',
      'EnumSet is abstract, must use factory methods',
      'Java doesn\'t support it',
      'It throws exception'
    ],
    correctAnswer: 1,
    explanation: 'EnumSet is abstract class. Factory methods (of, allOf, noneOf) return RegularEnumSet or JumboEnumSet based on enum size.',
    hint: 'EnumSet uses factory pattern.',
    difficulty: 'hard',
    topic: 'Design Pattern',
  },
];

function getBitPosition(day: DayOfWeek): number {
  return DAYS_OF_WEEK.indexOf(day);
}

function generateEnumSetSteps(): EnumSetStep[] {
  const steps: EnumSetStep[] = [];
  let bitmask = 0;

  steps.push({
    operation: 'init',
    bitmask: 0,
    description: 'Initialize EnumSet with empty bitmask (0)',
  });

  for (const { op, value } of OPERATIONS) {
    const bitPos = getBitPosition(value);
    const bitMaskForValue = 1 << bitPos;

    if (op === 'add') {
      const wasSet = (bitmask & bitMaskForValue) !== 0;
      bitmask |= bitMaskForValue;

      steps.push({
        operation: 'add',
        value,
        bitmask,
        description: wasSet
          ? `add(${value}): Bit ${bitPos} already set`
          : `add(${value}): Set bit ${bitPos}. elements |= (1L << ${bitPos})`,
        highlightBit: bitPos,
      });
    } else if (op === 'remove') {
      const wasSet = (bitmask & bitMaskForValue) !== 0;
      bitmask &= ~bitMaskForValue;

      steps.push({
        operation: 'remove',
        value,
        bitmask,
        description: wasSet
          ? `remove(${value}): Clear bit ${bitPos}`
          : `remove(${value}): Bit ${bitPos} already clear`,
        highlightBit: bitPos,
      });
    } else {
      const isSet = (bitmask & bitMaskForValue) !== 0;

      steps.push({
        operation: 'contains',
        value,
        bitmask,
        result: isSet,
        description: `contains(${value}): (elements & (1L << ${bitPos})) ${isSet ? '!= 0 → true' : '== 0 → false'}`,
        highlightBit: bitPos,
      });
    }
  }

  let count = 0;
  let temp = bitmask;
  while (temp > 0) {
    count += temp & 1;
    temp >>= 1;
  }

  steps.push({
    operation: 'done',
    bitmask,
    description: `Done! EnumSet contains ${count} elements. 8 bytes total!`,
  });

  return steps;
}

const EnumSetInterviewVisualizerComponent: React.FC<EnumSetInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'es-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateEnumSetSteps, []);

  const playback = useVisualizerPlayback<EnumSetStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: ENUMSET_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: EnumSetStep = playback.currentStepData || {
    operation: 'init',
    bitmask: 0,
    description: '',
  };

  const { bitmask, highlightBit, result } = stepData;

  const getBitStyle = (bitIndex: number): string => {
    const isSet = (bitmask & (1 << bitIndex)) !== 0;
    const isHighlighted = highlightBit === bitIndex;

    if (isHighlighted) {
      if (stepData.operation === 'contains') {
        return result
          ? 'bg-green-500 text-white ring-2 ring-green-300'
          : 'bg-red-400 text-white ring-2 ring-red-300';
      }
      return 'bg-blue-500 text-white ring-2 ring-blue-300';
    }

    return isSet ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600';
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const visualization = (
    <>
      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="text-sm text-green-800 text-center">
          <span className="font-medium">EnumSet:</span> Bit vector implementation, O(1) all ops
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Bitmask Representation</div>
        <div className="flex flex-wrap gap-1 mb-4 justify-center">
          {DAYS_OF_WEEK.map((day, idx) => {
            const isSet = (bitmask & (1 << idx)) !== 0;
            return (
              <div key={day} className="flex flex-col items-center">
                <div className={`w-12 h-10 flex flex-col items-center justify-center text-xs font-medium rounded transition-colors ${getBitStyle(idx)}`}>
                  <span className="text-[10px] opacity-80">bit {idx}</span>
                  <span>{isSet ? '1' : '0'}</span>
                </div>
                <div className="text-[9px] text-gray-500 mt-1">{day}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-900 rounded-lg font-mono text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-green-400">elements</span>
          <span>=</span>
          <span className="text-yellow-300">0b{bitmask.toString(2).padStart(7, '0')}</span>
          <span className="text-gray-500">({bitmask})</span>
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600 mb-2 font-medium">Set Contents:</div>
        <div className="flex flex-wrap gap-1">
          {DAYS_OF_WEEK.filter((_, idx) => (bitmask & (1 << idx)) !== 0).map((day) => (
            <span key={day} className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
              {day}
            </span>
          ))}
          {bitmask === 0 && <span className="text-xs text-gray-400 italic">Empty set</span>}
        </div>
      </div>

      <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-lime-50 rounded-xl border-2 border-green-200">
        <div className="text-sm font-bold text-green-800 mb-2">💡 Memory Comparison</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-2 rounded-lg border-2 border-green-300 text-center">
            <div className="font-bold text-green-700">EnumSet</div>
            <div className="text-xl font-bold text-green-600">8 bytes</div>
          </div>
          <div className="bg-white p-2 rounded-lg border-2 border-gray-300 text-center">
            <div className="font-bold text-gray-500">HashSet</div>
            <div className="text-xl font-bold text-gray-500">~280 bytes</div>
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
      title="EnumSet (Interview Mode)"
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
        variant: stepData.operation === 'contains' ? (result ? 'success' : 'error') : stepData.operation === 'done' ? 'success' : 'default',
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

export const EnumSetInterviewVisualizer = React.memo(EnumSetInterviewVisualizerComponent);
export default EnumSetInterviewVisualizer;
