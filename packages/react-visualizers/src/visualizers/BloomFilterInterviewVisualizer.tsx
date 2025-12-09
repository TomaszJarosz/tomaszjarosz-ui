import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface BloomFilterStep {
  operation: 'init' | 'add' | 'query' | 'done';
  element?: string;
  bitArray: boolean[];
  highlightBits?: number[];
  description: string;
  result?: 'probably_yes' | 'definitely_no';
}

interface BloomFilterInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'bloomfilter-interview-visualizer';
const BIT_ARRAY_SIZE = 16;
const K_HASH_FUNCTIONS = 3;

const BADGES = [
  { label: 'Interview Mode', variant: 'purple' as const },
  { label: 'Probabilistic', variant: 'pink' as const },
  { label: 'No False Negatives', variant: 'indigo' as const },
];

const OPERATIONS: Array<{ op: 'add' | 'query'; element: string }> = [
  { op: 'add', element: 'apple' },
  { op: 'add', element: 'banana' },
  { op: 'add', element: 'cherry' },
  { op: 'query', element: 'apple' },
  { op: 'query', element: 'grape' },
  { op: 'query', element: 'banana' },
];

const LEGEND_ITEMS = [
  { color: 'bg-gray-200', label: 'Bit = 0' },
  { color: 'bg-purple-500', label: 'Bit = 1' },
  { color: 'bg-pink-400', label: 'Current hash position' },
];

// Interview questions about Bloom Filter
const BLOOM_FILTER_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'bf-1',
    question: 'What type of data structure is a Bloom Filter?',
    options: [
      'Exact set membership',
      'Probabilistic set membership',
      'Key-value store',
      'Sorted collection',
    ],
    correctAnswer: 1,
    explanation: 'Bloom Filter is a probabilistic data structure that can tell you "definitely not in set" or "possibly in set". It trades exactness for space efficiency.',
    hint: 'It can have false positives but never false negatives.',
    difficulty: 'easy',
    topic: 'Basics',
  },
  {
    id: 'bf-2',
    question: 'Which of these is possible in a standard Bloom Filter?',
    options: ['False negative', 'False positive', 'Both', 'Neither'],
    correctAnswer: 1,
    explanation: 'Bloom Filters can have false positives (saying "maybe yes" when element was never added) but NEVER false negatives. If it says "no", the element was definitely not added.',
    hint: 'Think about what happens when multiple elements set the same bits.',
    difficulty: 'easy',
    topic: 'False Positives',
  },
  {
    id: 'bf-3',
    question: 'What is the time complexity of add() and contains() in a Bloom Filter?',
    options: ['O(1)', 'O(k) where k = number of hash functions', 'O(n)', 'O(log n)'],
    correctAnswer: 1,
    explanation: 'Both operations are O(k) where k is the number of hash functions. We compute k hashes and check/set k bits. Since k is typically small and constant, this is effectively O(1).',
    difficulty: 'easy',
    topic: 'Complexity',
  },
  {
    id: 'bf-4',
    question: 'Why does a Bloom Filter use multiple hash functions?',
    options: [
      'To make it faster',
      'To reduce false positive rate',
      'To enable deletion',
      'To store more data',
    ],
    correctAnswer: 1,
    explanation: 'Multiple hash functions reduce false positives. For a false positive, ALL k bits must be set by other elements. With more hash functions, this becomes less likely (though using too many increases false positives again).',
    hint: 'More bits to check = harder to get a false positive.',
    difficulty: 'medium',
    topic: 'Hash Functions',
  },
  {
    id: 'bf-5',
    question: 'Can you delete elements from a standard Bloom Filter?',
    options: [
      'Yes, by setting bits back to 0',
      'No, because bits may be shared by multiple elements',
      'Yes, using a special delete operation',
      'Only if the element was added recently',
    ],
    correctAnswer: 1,
    explanation: 'Standard Bloom Filters don\'t support deletion because multiple elements may share the same bits. Clearing a bit could cause false negatives for other elements. Counting Bloom Filters solve this with counters instead of bits.',
    difficulty: 'medium',
    topic: 'Deletion',
  },
  {
    id: 'bf-6',
    question: 'What happens to the false positive rate as you add more elements?',
    options: ['Decreases', 'Increases', 'Stays constant', 'Becomes zero'],
    correctAnswer: 1,
    explanation: 'As more elements are added, more bits get set to 1. This increases the probability that a non-existent element\'s hash positions are all 1, causing a false positive.',
    hint: 'More 1s in the bit array = higher chance of collision.',
    difficulty: 'easy',
    topic: 'False Positive Rate',
  },
  {
    id: 'bf-7',
    question: 'What is the optimal number of hash functions for a Bloom Filter?',
    options: [
      '1',
      'k = (m/n) × ln(2)',
      'As many as possible',
      'Equal to the bit array size',
    ],
    correctAnswer: 1,
    explanation: 'The optimal k is (m/n) × ln(2) ≈ 0.693 × (m/n), where m is bit array size and n is expected elements. This minimizes the false positive rate for given m and n.',
    difficulty: 'hard',
    topic: 'Optimization',
  },
  {
    id: 'bf-8',
    question: 'Which is a common use case for Bloom Filters?',
    options: [
      'Storing user passwords',
      'Database query optimization to avoid disk reads',
      'Sorting large datasets',
      'Encrypting sensitive data',
    ],
    correctAnswer: 1,
    explanation: 'Bloom Filters are used to avoid expensive operations. In databases, they can quickly determine if a key definitely doesn\'t exist, avoiding unnecessary disk reads. Also used in caches, spell checkers, and network routers.',
    difficulty: 'medium',
    topic: 'Use Cases',
  },
  {
    id: 'bf-9',
    question: 'How much space does a Bloom Filter use compared to storing actual elements?',
    options: [
      'More space than storing elements',
      'About the same',
      'Significantly less space',
      'Depends on element size',
    ],
    correctAnswer: 2,
    explanation: 'Bloom Filters use a fixed number of bits regardless of element size. For 1% false positive rate, you need only ~10 bits per element (~1.2 bytes). Storing actual strings would require much more.',
    difficulty: 'medium',
    topic: 'Space Efficiency',
  },
  {
    id: 'bf-10',
    question: 'What is a Counting Bloom Filter?',
    options: [
      'A Bloom Filter that counts elements',
      'A variant using counters instead of bits to support deletion',
      'A Bloom Filter with count of false positives',
      'A Bloom Filter that uses counting sort',
    ],
    correctAnswer: 1,
    explanation: 'Counting Bloom Filter uses counters (typically 4-bit) instead of single bits. On add, counters increment. On delete, counters decrement. This enables deletion at the cost of ~4× more space.',
    difficulty: 'hard',
    topic: 'Variants',
  },
];

function simpleHash(str: string, seed: number): number {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash % BIT_ARRAY_SIZE;
}

function getHashPositions(element: string): number[] {
  const positions: number[] = [];
  for (let i = 0; i < K_HASH_FUNCTIONS; i++) {
    positions.push(simpleHash(element, i * 31 + 7));
  }
  return positions;
}

function generateBloomFilterSteps(): BloomFilterStep[] {
  const steps: BloomFilterStep[] = [];
  const bitArray = new Array(BIT_ARRAY_SIZE).fill(false);

  steps.push({
    operation: 'init',
    bitArray: [...bitArray],
    description: `Initialize Bloom Filter: ${BIT_ARRAY_SIZE} bits, ${K_HASH_FUNCTIONS} hash functions`,
  });

  for (const { op, element } of OPERATIONS) {
    const positions = getHashPositions(element);

    if (op === 'add') {
      steps.push({
        operation: 'add',
        element,
        bitArray: [...bitArray],
        highlightBits: positions,
        description: `add("${element}"): Hash positions = [${positions.join(', ')}]`,
      });

      for (const pos of positions) {
        bitArray[pos] = true;
      }

      steps.push({
        operation: 'add',
        element,
        bitArray: [...bitArray],
        highlightBits: positions,
        description: `add("${element}"): Set bits at positions [${positions.join(', ')}]`,
      });
    } else {
      const allBitsSet = positions.every((pos) => bitArray[pos]);

      steps.push({
        operation: 'query',
        element,
        bitArray: [...bitArray],
        highlightBits: positions,
        description: `contains("${element}"): Check positions [${positions.join(', ')}]`,
        result: allBitsSet ? 'probably_yes' : 'definitely_no',
      });

      steps.push({
        operation: 'query',
        element,
        bitArray: [...bitArray],
        highlightBits: positions,
        description: allBitsSet
          ? `contains("${element}"): All bits are 1 → Probably YES`
          : `contains("${element}"): Some bits are 0 → Definitely NO`,
        result: allBitsSet ? 'probably_yes' : 'definitely_no',
      });
    }
  }

  steps.push({
    operation: 'done',
    bitArray: [...bitArray],
    description: `Done! ${bitArray.filter(Boolean).length}/${BIT_ARRAY_SIZE} bits set`,
  });

  return steps;
}

const BloomFilterInterviewVisualizerComponent: React.FC<BloomFilterInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'bf-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateBloomFilterSteps, []);

  const {
    currentStep,
    currentStepData,
    steps,
    isPlaying,
    speed,
    handlePlayPause,
    handleStep,
    handleStepBack,
    handleReset,
    setSpeed,
  } = useVisualizerPlayback<BloomFilterStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: BLOOM_FILTER_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: BloomFilterStep = currentStepData || {
    operation: 'init',
    bitArray: new Array(BIT_ARRAY_SIZE).fill(false),
    description: '',
  };

  const { bitArray, highlightBits, description, result } = stepData;

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const getStatusVariant = () => {
    if (result === 'definitely_no') return 'success';
    if (result === 'probably_yes') return 'warning';
    return 'default';
  };

  const visualization = (
    <>
      {/* Key Property */}
      <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <div className="text-sm text-purple-800 text-center">
          <span className="font-medium">Key Property:</span> No false negatives!
          <br />
          <span className="text-xs">If it says "no" → definitely not in set</span>
        </div>
      </div>

      {/* Bit Array Visualization */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Bit Array ({BIT_ARRAY_SIZE} bits, {K_HASH_FUNCTIONS} hash functions)
        </div>
        <div className="flex flex-wrap gap-1 justify-center">
          {bitArray.map((bit, idx) => {
            const isHighlighted = highlightBits?.includes(idx);
            return (
              <div
                key={idx}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-xs font-mono transition-all ${
                  isHighlighted
                    ? 'bg-pink-400 text-white ring-2 ring-pink-500 scale-110'
                    : bit
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}
              >
                <div className="text-center">
                  <div className="text-[10px] opacity-70">{idx}</div>
                  <div>{bit ? '1' : '0'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Result Display - always visible container */}
      <div
        className={`mb-4 p-3 rounded-lg border min-h-[44px] ${
          result === 'probably_yes'
            ? 'bg-amber-50 border-amber-200'
            : result === 'definitely_no'
              ? 'bg-green-50 border-green-200'
              : 'bg-gray-50 border-gray-200'
        }`}
      >
        <div
          className={`text-sm font-medium text-center ${
            result === 'probably_yes'
              ? 'text-amber-800'
              : result === 'definitely_no'
                ? 'text-green-800'
                : 'text-gray-400 italic'
          }`}
        >
          {result === 'probably_yes'
            ? '⚠️ Probably in set (could be false positive)'
            : result === 'definitely_no'
              ? '✓ Definitely NOT in set'
              : 'Query result will appear here...'}
        </div>
      </div>
    </>
  );

  const modeToggle = (
    <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
      <button
        onClick={() => setMode('visualize')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'visualize'
            ? 'bg-white text-purple-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'interview'
            ? 'bg-white text-purple-600 shadow-sm'
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
      accentColor="purple"
    />
  ) : undefined;

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="Bloom Filter (Interview Mode)"
      badges={BADGES}
      gradient="purple"
      className={className}
      minHeight={500}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description,
        currentStep,
        totalSteps: steps.length,
        variant: getStatusVariant(),
      }}
      controls={{
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
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      sidePanel={sidePanel}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const BloomFilterInterviewVisualizer = React.memo(BloomFilterInterviewVisualizerComponent);
export default BloomFilterInterviewVisualizer;
