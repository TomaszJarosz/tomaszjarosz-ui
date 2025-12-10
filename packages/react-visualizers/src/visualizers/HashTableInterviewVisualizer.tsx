import React, { useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import {
  BaseVisualizerLayout,
  InterviewModePanel,
  useVisualizerPlayback,
  useInterviewMode,
} from '../shared';
import type { InterviewQuestion } from '../shared';

interface HashStep {
  operation: 'insert' | 'collision' | 'placed' | 'rehash' | 'done';
  key: string;
  hashValue: number;
  bucketIndex: number;
  buckets: (string | null)[][];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
}

interface HashTableInterviewVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
  shuffleQuestions?: boolean;
  onComplete?: (session: ReturnType<typeof useInterviewMode>['session']) => void;
}

const INITIAL_SIZE = 7;
const LOAD_FACTOR_THRESHOLD = 0.7;

const SAMPLE_KEYS = ['apple', 'banana', 'cherry', 'date', 'elderberry'];

const HASH_TABLE_CODE = [
  'function insert(key):',
  '  hash = hashFunction(key)',
  '  index = hash % tableSize',
  '  if bucket[index] has collision:',
  '    chain to existing bucket',
  '  bucket[index].append(key)',
  '  if loadFactor > threshold:',
  '    rehash(newSize = size * 2)',
];

const LEGEND_ITEMS = [
  { color: 'bg-gray-50', label: 'Empty', border: '#d1d5db' },
  { color: 'bg-yellow-50', label: 'Hashing', border: '#facc15' },
  { color: 'bg-red-50', label: 'Collision', border: '#f87171' },
  { color: 'bg-green-50', label: 'Placed', border: '#4ade80' },
];

const BADGES = [
  { label: 'Avg: O(1)', variant: 'purple' as const },
  { label: 'Worst: O(n)', variant: 'purple' as const },
];

const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'hash-1',
    question: 'What is the average time complexity for hash table lookup?',
    options: [
      'O(1)',
      'O(log n)',
      'O(n)',
      'O(n log n)',
    ],
    correctAnswer: 0,
    explanation: 'Hash tables provide O(1) average lookup by computing hash(key) % tableSize to directly find the bucket. Good hash functions distribute keys uniformly.',
    hint: 'Hash gives direct bucket access.',
    difficulty: 'easy',
    topic: 'Complexity',
  },
  {
    id: 'hash-2',
    question: 'What is the worst-case time complexity for hash table lookup?',
    options: [
      'O(1)',
      'O(log n)',
      'O(n)',
      'O(n^2)',
    ],
    correctAnswer: 2,
    explanation: 'If all keys hash to the same bucket (worst case), lookup degrades to O(n) linear search through the chain. This is why good hash functions are critical.',
    hint: 'What if all keys collide?',
    difficulty: 'medium',
    topic: 'Complexity',
  },
  {
    id: 'hash-3',
    question: 'What is "separate chaining" in hash tables?',
    options: [
      'Using two hash functions',
      'Storing colliding elements in a linked list at each bucket',
      'Creating a chain of hash tables',
      'Linking adjacent buckets together',
    ],
    correctAnswer: 1,
    explanation: 'Separate chaining handles collisions by maintaining a linked list (or tree in Java 8+) at each bucket. Multiple keys with the same hash coexist in the same bucket.',
    hint: 'Its about collision resolution.',
    difficulty: 'medium',
    topic: 'Collision Resolution',
  },
  {
    id: 'hash-4',
    question: 'What is the "load factor" in a hash table?',
    options: [
      'The maximum capacity of the table',
      'The ratio of filled buckets to total buckets (n/capacity)',
      'The number of collisions',
      'The time to compute hash',
    ],
    correctAnswer: 1,
    explanation: 'Load factor = number of entries / table capacity. Higher load factor means more collisions. Java HashMap default threshold is 0.75, triggering resize when exceeded.',
    hint: 'Its a ratio measuring fullness.',
    difficulty: 'medium',
    topic: 'Load Factor',
  },
  {
    id: 'hash-5',
    question: 'What happens during rehashing?',
    options: [
      'All entries are deleted',
      'Table size increases and all entries are re-inserted with new hash positions',
      'Only collided entries are moved',
      'Hash function is changed',
    ],
    correctAnswer: 1,
    explanation: 'Rehashing creates a larger table (typically 2x) and re-inserts all entries. Since bucket index = hash % size, the new size changes where keys land.',
    hint: 'Think about hash % newSize.',
    difficulty: 'medium',
    topic: 'Rehashing',
  },
  {
    id: 'hash-6',
    question: 'What is "open addressing" (linear probing)?',
    options: [
      'Storing all elements in a linked list',
      'Finding next empty slot when collision occurs',
      'Using multiple hash tables',
      'Randomly placing elements',
    ],
    correctAnswer: 1,
    explanation: 'Open addressing stores all entries in the array itself. On collision, it probes for the next empty slot (linear: +1, quadratic: +1,+4,+9...). No linked lists used.',
    hint: 'Alternative to chaining.',
    difficulty: 'medium',
    topic: 'Collision Resolution',
  },
  {
    id: 'hash-7',
    question: 'Why must hashCode() and equals() be consistent?',
    options: [
      'For better performance only',
      'If equals() returns true, hashCode() must return same value (contract)',
      'They are always auto-generated',
      'Only equals() matters for hash tables',
    ],
    correctAnswer: 1,
    explanation: 'Contract: if a.equals(b), then a.hashCode() == b.hashCode(). Violating this breaks hash tables - equal objects might be in different buckets, making lookup fail.',
    hint: 'Equal objects must be in same bucket.',
    difficulty: 'hard',
    topic: 'Hash Contract',
  },
  {
    id: 'hash-8',
    question: 'What is a good hash function property?',
    options: [
      'Always returns 0',
      'Returns same value for all inputs',
      'Distributes keys uniformly across buckets',
      'Returns consecutive numbers',
    ],
    correctAnswer: 2,
    explanation: 'A good hash function distributes keys uniformly (avalanche effect: small input change -> large output change). This minimizes collisions and keeps chains short.',
    hint: 'Minimize collisions.',
    difficulty: 'medium',
    topic: 'Hash Functions',
  },
  {
    id: 'hash-9',
    question: 'Why does Java HashMap use power-of-2 table sizes?',
    options: [
      'For simpler code',
      'hash & (size-1) is faster than hash % size',
      'Its required by the spec',
      'To reduce memory usage',
    ],
    correctAnswer: 1,
    explanation: 'When size is power of 2, index = hash & (size-1) replaces modulo (hash % size). Bitwise AND is much faster than division. This is a micro-optimization.',
    hint: 'Bitwise operations are faster.',
    difficulty: 'hard',
    topic: 'Implementation',
  },
  {
    id: 'hash-10',
    question: 'What happens to HashMap chains when they get too long (Java 8+)?',
    options: [
      'They are deleted',
      'They convert to balanced trees (red-black)',
      'Table is always rehashed',
      'Exception is thrown',
    ],
    correctAnswer: 1,
    explanation: 'Java 8+ converts chains to red-black trees when length >= 8 (TREEIFY_THRESHOLD). This improves worst-case from O(n) to O(log n). Trees revert to lists when < 6.',
    hint: 'Worst case improvement in Java 8.',
    difficulty: 'hard',
    topic: 'Java 8 Optimization',
  },
];

function simpleHash(key: string, size: number): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) % size;
  }
  return hash;
}

function generateHashSteps(keys: string[]): HashStep[] {
  const steps: HashStep[] = [];
  let buckets: (string | null)[][] = Array(INITIAL_SIZE).fill(null).map(() => []);
  let itemCount = 0;

  steps.push({
    operation: 'done',
    key: '',
    hashValue: 0,
    bucketIndex: -1,
    buckets: buckets.map((b) => [...b]),
    description: `Initialize hash table with ${INITIAL_SIZE} buckets (chaining)`,
    codeLine: -1,
  });

  for (const key of keys) {
    const currentSize = buckets.length;
    const hashValue = simpleHash(key, currentSize);
    const bucketIndex = hashValue;

    steps.push({
      operation: 'insert',
      key,
      hashValue,
      bucketIndex,
      buckets: buckets.map((b) => [...b]),
      description: `Insert "${key}": hash = ${hashValue}, index = ${bucketIndex}`,
      codeLine: 1,
      variables: { key: `"${key}"`, hash: hashValue, index: bucketIndex },
    });

    if (buckets[bucketIndex].length > 0) {
      steps.push({
        operation: 'collision',
        key,
        hashValue,
        bucketIndex,
        buckets: buckets.map((b) => [...b]),
        description: `Collision at bucket ${bucketIndex}! Chain with: [${buckets[bucketIndex].join(', ')}]`,
        codeLine: 4,
        variables: { index: bucketIndex, existing: buckets[bucketIndex].length },
      });
    }

    buckets[bucketIndex].push(key);
    itemCount++;

    const loadFactor = itemCount / currentSize;
    steps.push({
      operation: 'placed',
      key,
      hashValue,
      bucketIndex,
      buckets: buckets.map((b) => [...b]),
      description: `Placed "${key}" in bucket ${bucketIndex}. Load factor: ${loadFactor.toFixed(2)}`,
      codeLine: 5,
      variables: { loadFactor: loadFactor.toFixed(2) },
    });

    if (loadFactor > LOAD_FACTOR_THRESHOLD && keys.indexOf(key) < keys.length - 1) {
      const newSize = currentSize * 2 + 1;
      const newBuckets: (string | null)[][] = Array(newSize).fill(null).map(() => []);

      steps.push({
        operation: 'rehash',
        key: '',
        hashValue: 0,
        bucketIndex: -1,
        buckets: buckets.map((b) => [...b]),
        description: `Load factor ${loadFactor.toFixed(2)} > ${LOAD_FACTOR_THRESHOLD}. Rehashing to ${newSize} buckets...`,
        codeLine: 7,
        variables: { threshold: LOAD_FACTOR_THRESHOLD, newSize },
      });

      for (const bucket of buckets) {
        for (const existingKey of bucket) {
          if (existingKey) {
            const newHash = simpleHash(existingKey, newSize);
            newBuckets[newHash].push(existingKey);
          }
        }
      }

      buckets = newBuckets;

      steps.push({
        operation: 'done',
        key: '',
        hashValue: 0,
        bucketIndex: -1,
        buckets: buckets.map((b) => [...b]),
        description: `Rehashing complete! New size: ${newSize}`,
        codeLine: -1,
      });
    }
  }

  steps.push({
    operation: 'done',
    key: '',
    hashValue: 0,
    bucketIndex: -1,
    buckets: buckets.map((b) => [...b]),
    description: `Done! ${keys.length} keys inserted. Final load factor: ${(itemCount / buckets.length).toFixed(2)}`,
    codeLine: -1,
  });

  return steps;
}

const HashTableInterviewVisualizerComponent: React.FC<HashTableInterviewVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
  shuffleQuestions = false,
  onComplete,
}) => {
  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');
  const [customKey, setCustomKey] = useState('');
  const [keys, setKeys] = useState<string[]>(SAMPLE_KEYS);

  const generateSteps = useMemo(
    () => () => generateHashSteps(keys),
    [keys]
  );

  const {
    steps,
    currentStep,
    currentStepData,
    isPlaying,
    speed,
    setSpeed,
    handlePlayPause,
    handleStep,
    handleStepBack,
    handleReset,
    reinitialize,
  } = useVisualizerPlayback<HashStep>({
    generateSteps,
  });

  const interview = useInterviewMode({
    questions: INTERVIEW_QUESTIONS,
    shuffleQuestions,
    onComplete,
  });

  const handleAddKey = useCallback(() => {
    if (customKey.trim() && !keys.includes(customKey.trim())) {
      setKeys([...keys, customKey.trim()]);
      setCustomKey('');
    }
  }, [customKey, keys]);

  const handleResetKeys = useCallback(() => {
    setKeys(SAMPLE_KEYS);
    reinitialize();
  }, [reinitialize]);

  const stepData = currentStepData || {
    operation: 'done' as const,
    buckets: [] as (string | null)[][],
    bucketIndex: -1,
    key: '',
    hashValue: 0,
    description: '',
  };

  const { operation, buckets, bucketIndex, key, description } = stepData;

  const getStatusVariant = () => {
    if (operation === 'collision') return 'error' as const;
    if (operation === 'placed') return 'success' as const;
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

  const extraControls = mode === 'visualize' ? (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={customKey}
        onChange={(e) => setCustomKey(e.target.value)}
        placeholder="Add key..."
        className="px-2 py-1 text-sm border border-gray-300 rounded w-24 font-medium text-gray-900"
        onKeyDown={(e) => e.key === 'Enter' && handleAddKey()}
      />
      <button
        onClick={handleAddKey}
        disabled={!customKey.trim()}
        className="p-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        onClick={handleResetKeys}
        className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
      >
        Reset
      </button>
    </div>
  ) : undefined;

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
      {/* Keys to insert */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Keys to insert:</div>
        <div className="flex flex-wrap gap-2">
          {keys.map((k, idx) => {
            const isInserted = steps
              .slice(0, currentStep + 1)
              .some((s) => s.key === k && s.operation === 'placed');
            return (
              <span
                key={idx}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg border-2 transition-colors ${
                  isInserted
                    ? 'bg-green-100 text-green-700 border-green-400'
                    : k === key
                      ? 'bg-yellow-100 text-yellow-700 border-yellow-400'
                      : 'bg-gray-50 text-gray-600 border-gray-300'
                }`}
              >
                {k}
              </span>
            );
          })}
        </div>
      </div>

      {/* Hash Calculation */}
      <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border-2 border-purple-200 min-h-[80px]">
        <div className="text-sm font-semibold text-purple-800 mb-2">Hash Calculation</div>
        {operation === 'insert' && key ? (
          <div className="flex flex-col items-center gap-2">
            <div className="font-mono text-lg text-gray-800">
              hash(<span className="text-purple-600 font-bold">&quot;{key}&quot;</span>) % {buckets.length} = <span className="text-purple-600 font-bold text-xl">{bucketIndex}</span>
            </div>
          </div>
        ) : operation === 'collision' ? (
          <div className="font-mono text-lg text-red-700 text-center">
            Collision at bucket [{bucketIndex}]!
          </div>
        ) : operation === 'placed' ? (
          <div className="font-mono text-lg text-green-700 text-center">
            &quot;{key}&quot; placed in bucket [{bucketIndex}]
          </div>
        ) : (
          <div className="text-gray-400 text-center">Click Play to start</div>
        )}
      </div>

      {/* Buckets */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-3">
          Hash Table ({buckets.length} buckets):
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
            {buckets.map((bucket, idx) => (
              <div key={idx} className="flex flex-col items-center" style={{ minWidth: '70px' }}>
                <div
                  className={`w-full text-center py-1 px-2 rounded-t-lg font-mono text-sm font-bold transition-colors ${
                    idx === bucketIndex
                      ? operation === 'collision'
                        ? 'bg-red-500 text-white'
                        : operation === 'placed'
                          ? 'bg-green-500 text-white'
                          : 'bg-yellow-400 text-yellow-900'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  [{idx}]
                </div>
                <div
                  className={`w-full border-2 rounded-b-lg min-h-[80px] p-1 transition-colors ${
                    idx === bucketIndex
                      ? operation === 'collision'
                        ? 'border-red-400 bg-red-50'
                        : operation === 'placed'
                          ? 'border-green-400 bg-green-50'
                          : 'border-yellow-400 bg-yellow-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    {bucket.length === 0 ? (
                      <span className="text-xs text-gray-400 italic text-center py-2">empty</span>
                    ) : (
                      bucket.map((bucketKey, keyIdx) => (
                        <div
                          key={keyIdx}
                          className={`px-2 py-1 text-xs font-medium rounded border text-center transition-colors ${
                            bucketKey === key && (operation === 'placed' || operation === 'insert')
                              ? 'bg-yellow-200 text-yellow-900 border-yellow-400'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}
                        >
                          {bucketKey}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
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
      id="hashtable-interview-visualizer"
      title="Hash Table (Chaining)"
      badges={dynamicBadges}
      gradient="purple"
      className={className}
      minHeight={400}
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
        extraControls,
      } : undefined}
      showControls={showControls && mode === 'visualize'}
      legendItems={mode === 'visualize' ? LEGEND_ITEMS : undefined}
      code={showCode && mode === 'visualize' ? HASH_TABLE_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode && mode === 'visualize'}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const HashTableInterviewVisualizer = React.memo(HashTableInterviewVisualizerComponent);
export default HashTableInterviewVisualizer;
