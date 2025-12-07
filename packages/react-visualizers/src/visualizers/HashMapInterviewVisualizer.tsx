import React, { useState, useMemo, useCallback } from 'react';
import {
  ControlPanel,
  Legend,
  StatusPanel,
  ShareButton,
  useUrlState,
  useVisualizerPlayback,
  VisualizationArea,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

// Reuse types from HashMapVisualizer
interface Entry {
  key: string;
  value: number;
  hash: number;
}

interface Bucket {
  entries: Entry[];
}

interface HashMapStep {
  operation: 'put' | 'get' | 'hash' | 'init' | 'done';
  key: string;
  value?: number;
  hash?: number;
  bucketIndex?: number;
  buckets: Bucket[];
  description: string;
  highlightBucket?: number;
  highlightEntry?: { bucket: number; index: number };
  found?: boolean;
}

interface HashMapInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const BUCKET_COUNT = 8;

const OPERATIONS: Array<{ op: 'put' | 'get'; key: string; value?: number }> = [
  { op: 'put', key: 'Alice', value: 25 },
  { op: 'put', key: 'Bob', value: 30 },
  { op: 'put', key: 'Charlie', value: 35 },
  { op: 'put', key: 'Diana', value: 28 },
  { op: 'get', key: 'Bob' },
  { op: 'put', key: 'Alice', value: 26 },
  { op: 'get', key: 'Frank' },
];

const LEGEND_ITEMS = [
  { color: 'bg-blue-50', label: 'Current bucket', border: '#60a5fa' },
  { color: 'bg-blue-500', label: 'Insert/Update' },
  { color: 'bg-green-400', label: 'Found' },
  { color: 'bg-red-400', label: 'Not found' },
];

// Interview questions about HashMap
const HASHMAP_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'hm-1',
    question: 'What is the average time complexity for get() and put() operations in HashMap?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 0,
    explanation: 'HashMap provides O(1) average time complexity for both get() and put() operations due to direct array access via hash codes. However, worst case is O(n) when all keys hash to the same bucket.',
    hint: 'Think about how hash codes allow direct array indexing.',
    difficulty: 'easy',
    topic: 'Time Complexity',
    relatedStep: 1,
  },
  {
    id: 'hm-2',
    question: 'What happens when two different keys have the same hash code in HashMap?',
    options: [
      'One key overwrites the other',
      'An exception is thrown',
      'They are stored in the same bucket (collision)',
      'The second key is rejected',
    ],
    correctAnswer: 2,
    explanation: 'When two keys have the same hash code (collision), HashMap stores both entries in the same bucket using a linked list (or tree for Java 8+). This is called chaining.',
    hint: 'HashMap uses chaining to handle this situation.',
    difficulty: 'easy',
    topic: 'Collision Handling',
    relatedStep: 5,
  },
  {
    id: 'hm-3',
    question: 'In Java 8+, what happens when a bucket has more than 8 entries?',
    options: [
      'The HashMap is automatically resized',
      'The bucket converts from LinkedList to Red-Black Tree',
      'New entries are rejected',
      'The oldest entry is removed',
    ],
    correctAnswer: 1,
    explanation: 'Java 8 introduced treeification: when a bucket exceeds 8 entries (TREEIFY_THRESHOLD), the linked list is converted to a Red-Black Tree, improving worst-case from O(n) to O(log n).',
    difficulty: 'medium',
    topic: 'Java Implementation',
  },
  {
    id: 'hm-4',
    question: 'What is the default load factor in Java HashMap?',
    options: ['0.5', '0.75', '1.0', '0.25'],
    correctAnswer: 1,
    explanation: 'The default load factor is 0.75, which provides a good balance between space and time efficiency. When size > capacity * loadFactor, the HashMap resizes (doubles capacity).',
    hint: 'It\'s a balance between space and time efficiency.',
    difficulty: 'medium',
    topic: 'Load Factor',
  },
  {
    id: 'hm-5',
    question: 'Why should you override both equals() and hashCode() when using custom objects as HashMap keys?',
    options: [
      'To improve performance',
      'To ensure proper key matching and bucket location',
      'It\'s optional and just a best practice',
      'To prevent memory leaks',
    ],
    correctAnswer: 1,
    explanation: 'hashCode() determines the bucket, and equals() is used to find the exact key within that bucket. If only equals() is overridden, two equal objects might be placed in different buckets. If only hashCode() is overridden, equals() comparisons won\'t work correctly.',
    difficulty: 'medium',
    topic: 'Contract',
  },
  {
    id: 'hm-6',
    question: 'What is the worst-case time complexity for HashMap operations?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctAnswer: 2,
    explanation: 'In the worst case (all keys hash to the same bucket), operations degrade to O(n) as we must traverse the entire chain. With Java 8+ treeification, this improves to O(log n) for buckets with >8 entries.',
    hint: 'Consider what happens when all keys collide.',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'hm-7',
    question: 'How does HashMap calculate the bucket index from a hash code?',
    options: [
      'hash % capacity',
      'hash & (capacity - 1)',
      'hash / capacity',
      'hash ^ capacity',
    ],
    correctAnswer: 1,
    explanation: 'HashMap uses bitwise AND with (capacity - 1) instead of modulo because capacity is always a power of 2. This is faster than modulo: hash & (n-1) is equivalent to hash % n when n is a power of 2.',
    difficulty: 'hard',
    topic: 'Implementation',
  },
  {
    id: 'hm-8',
    question: 'Is HashMap thread-safe?',
    options: [
      'Yes, always',
      'No, use ConcurrentHashMap for thread safety',
      'Only for read operations',
      'Only when load factor < 0.5',
    ],
    correctAnswer: 1,
    explanation: 'HashMap is NOT thread-safe. For concurrent access, use ConcurrentHashMap (preferred) or Collections.synchronizedMap(). Using HashMap with multiple threads can cause infinite loops during resize!',
    difficulty: 'easy',
    topic: 'Thread Safety',
  },
];

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

function generateHashMapSteps(): HashMapStep[] {
  const steps: HashMapStep[] = [];
  const buckets: Bucket[] = Array.from({ length: BUCKET_COUNT }, () => ({
    entries: [],
  }));

  steps.push({
    operation: 'init',
    key: '',
    buckets: buckets.map((b) => ({ entries: [...b.entries] })),
    description: `Initialize HashMap with ${BUCKET_COUNT} buckets`,
  });

  for (const { op, key, value } of OPERATIONS) {
    const hash = simpleHash(key);
    const index = hash % BUCKET_COUNT;

    if (op === 'put') {
      steps.push({
        operation: 'hash',
        key,
        value,
        hash,
        bucketIndex: index,
        buckets: buckets.map((b) => ({ entries: [...b.entries] })),
        description: `put("${key}", ${value}): hash=${hash}, bucket=${index}`,
        highlightBucket: index,
      });

      const existingIndex = buckets[index].entries.findIndex((e) => e.key === key);

      if (existingIndex >= 0) {
        buckets[index].entries[existingIndex].value = value ?? 0;
        steps.push({
          operation: 'put',
          key,
          value,
          hash,
          bucketIndex: index,
          buckets: buckets.map((b) => ({ entries: [...b.entries] })),
          description: `Update "${key}" to ${value}`,
          highlightBucket: index,
          highlightEntry: { bucket: index, index: existingIndex },
        });
      } else {
        buckets[index].entries.push({ key, value: value ?? 0, hash });
        steps.push({
          operation: 'put',
          key,
          value,
          hash,
          bucketIndex: index,
          buckets: buckets.map((b) => ({ entries: [...b.entries] })),
          description: `Add "${key}"=${value} to bucket ${index}`,
          highlightBucket: index,
          highlightEntry: { bucket: index, index: buckets[index].entries.length - 1 },
        });
      }
    } else {
      steps.push({
        operation: 'hash',
        key,
        hash,
        bucketIndex: index,
        buckets: buckets.map((b) => ({ entries: [...b.entries] })),
        description: `get("${key}"): hash=${hash}, bucket=${index}`,
        highlightBucket: index,
      });

      const foundIndex = buckets[index].entries.findIndex((e) => e.key === key);

      if (foundIndex >= 0) {
        const foundValue = buckets[index].entries[foundIndex].value;
        steps.push({
          operation: 'get',
          key,
          value: foundValue,
          hash,
          bucketIndex: index,
          buckets: buckets.map((b) => ({ entries: [...b.entries] })),
          description: `Found "${key}" = ${foundValue}`,
          highlightBucket: index,
          highlightEntry: { bucket: index, index: foundIndex },
          found: true,
        });
      } else {
        steps.push({
          operation: 'get',
          key,
          hash,
          bucketIndex: index,
          buckets: buckets.map((b) => ({ entries: [...b.entries] })),
          description: `"${key}" not found`,
          highlightBucket: index,
          found: false,
        });
      }
    }
  }

  steps.push({
    operation: 'done',
    key: '',
    buckets: buckets.map((b) => ({ entries: [...b.entries] })),
    description: `Done! HashMap contains ${buckets.reduce((sum, b) => sum + b.entries.length, 0)} entries`,
  });

  return steps;
}

const HashMapInterviewVisualizerComponent: React.FC<HashMapInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'hashmap-interview-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'hm-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateHashMapSteps, []);

  const playback = useVisualizerPlayback<HashMapStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: HASHMAP_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: HashMapStep = playback.currentStepData || {
    operation: 'init',
    key: '',
    buckets: [],
    description: '',
  };

  const { buckets, highlightBucket, highlightEntry, description, found } = stepData;

  const getBucketStyle = (index: number): string => {
    if (index === highlightBucket) {
      if (stepData.operation === 'get') {
        return found ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50';
      }
      return 'border-blue-400 bg-blue-50';
    }
    return 'border-gray-200 bg-gray-50';
  };

  const getEntryStyle = (bucketIdx: number, entryIdx: number): string => {
    if (highlightEntry?.bucket === bucketIdx && highlightEntry?.index === entryIdx) {
      if (stepData.operation === 'get') {
        return found ? 'bg-green-400 text-white' : 'bg-red-400 text-white';
      }
      return 'bg-blue-500 text-white';
    }
    return 'bg-white border border-gray-300 text-gray-700';
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  // Jump to related step when question changes
  const handleQuestionStep = useCallback((relatedStep?: number) => {
    if (relatedStep !== undefined && relatedStep < playback.steps.length) {
      // Would need to add setCurrentStep to playback hook
    }
  }, [playback.steps.length]);

  return (
    <div
      id={VISUALIZER_ID}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header with mode toggle */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">HashMap</h3>
            <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setMode('visualize')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === 'visualize'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📊 Visualize
              </button>
              <button
                onClick={() => setMode('interview')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === 'interview'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🎤 Interview
              </button>
            </div>
          </div>
          <ShareButton onShare={handleShare} accentColor="indigo" />
        </div>
      </div>

      <div className="p-4">
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* Visualization Panel */}
          <VisualizationArea minHeight={350} className="flex-1">
            {/* Bucket Array */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Bucket Array (capacity: {BUCKET_COUNT})
              </div>
              <div className="flex flex-wrap gap-2">
                {buckets.map((bucket, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded border-2 transition-colors ${getBucketStyle(idx)}`}
                    >
                      {idx}
                    </div>
                    <div className="flex flex-col items-center mt-1">
                      {bucket.entries.length > 0 ? (
                        bucket.entries.map((entry, eIdx) => (
                          <React.Fragment key={eIdx}>
                            {eIdx > 0 && <div className="w-0.5 h-2 bg-gray-300" />}
                            <div
                              className={`px-2 py-1 text-[10px] rounded transition-colors whitespace-nowrap ${getEntryStyle(idx, eIdx)}`}
                            >
                              {entry.key}: {entry.value}
                            </div>
                          </React.Fragment>
                        ))
                      ) : (
                        <div className="text-[10px] text-gray-400 mt-1">∅</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <StatusPanel
              description={description}
              currentStep={playback.currentStep}
              totalSteps={playback.steps.length}
              variant={
                stepData.operation === 'get' && found === false
                  ? 'error'
                  : stepData.operation === 'get' && found === true
                    ? 'success'
                    : 'default'
              }
            />
          </VisualizationArea>

          {/* Interview Panel (conditionally shown) */}
          {mode === 'interview' && (
            <div className="w-full lg:w-96 flex-shrink-0">
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
                accentColor="indigo"
              />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <ControlPanel
            isPlaying={playback.isPlaying}
            currentStep={playback.currentStep}
            totalSteps={playback.steps.length}
            speed={playback.speed}
            onPlayPause={playback.handlePlayPause}
            onStep={playback.handleStep}
            onStepBack={playback.handleStepBack}
            onReset={playback.handleReset}
            onSpeedChange={playback.setSpeed}
            accentColor="indigo"
          />
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
};

export const HashMapInterviewVisualizer = React.memo(HashMapInterviewVisualizerComponent);
export default HashMapInterviewVisualizer;
