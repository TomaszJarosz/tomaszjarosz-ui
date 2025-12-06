import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus } from 'lucide-react';
import {
  CodePanel,
  HelpPanel,
  ControlPanel,
  Legend,
  StatusPanel,
  VisualizationArea,
} from '../shared';

interface HashStep {
  operation: 'insert' | 'collision' | 'placed' | 'rehash' | 'done';
  key: string;
  hashValue: number;
  bucketIndex: number;
  buckets: (string | null)[][];
  probeIndex?: number;
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
}

interface HashTableVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const INITIAL_SIZE = 7;
const LOAD_FACTOR_THRESHOLD = 0.7;

const SAMPLE_KEYS = [
  'apple',
  'banana',
  'cherry',
  'date',
  'elderberry',
  'fig',
  'grape',
];

// Algorithm code snippets
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

function simpleHash(key: string, size: number): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) % size;
  }
  return hash;
}

function generateHashSteps(keys: string[]): HashStep[] {
  const steps: HashStep[] = [];
  let buckets: (string | null)[][] = Array(INITIAL_SIZE)
    .fill(null)
    .map(() => []);
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

    // Show hash calculation
    steps.push({
      operation: 'insert',
      key,
      hashValue,
      bucketIndex,
      buckets: buckets.map((b) => [...b]),
      description: `Insert "${key}": hash("${key}") = ${hashValue}, index = ${hashValue} % ${currentSize} = ${bucketIndex}`,
      codeLine: 1,
      variables: {
        key: `"${key}"`,
        hash: hashValue,
        tableSize: currentSize,
        index: bucketIndex,
      },
    });

    // Check for collision
    if (buckets[bucketIndex].length > 0) {
      steps.push({
        operation: 'collision',
        key,
        hashValue,
        bucketIndex,
        buckets: buckets.map((b) => [...b]),
        description: `Collision at bucket ${bucketIndex}! Chain with existing: [${buckets[bucketIndex].join(', ')}]`,
        codeLine: 4,
        variables: {
          index: bucketIndex,
          existing: buckets[bucketIndex].length,
        },
      });
    }

    // Place the key
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
      variables: {
        key: `"${key}"`,
        index: bucketIndex,
        loadFactor: loadFactor.toFixed(2),
      },
    });

    // Check if rehashing needed
    if (
      loadFactor > LOAD_FACTOR_THRESHOLD &&
      keys.indexOf(key) < keys.length - 1
    ) {
      const newSize = currentSize * 2 + 1; // Next odd number roughly double
      const newBuckets: (string | null)[][] = Array(newSize)
        .fill(null)
        .map(() => []);

      steps.push({
        operation: 'rehash',
        key: '',
        hashValue: 0,
        bucketIndex: -1,
        buckets: buckets.map((b) => [...b]),
        description: `Load factor ${loadFactor.toFixed(2)} > ${LOAD_FACTOR_THRESHOLD}. Rehashing to ${newSize} buckets...`,
        codeLine: 7,
        variables: {
          loadFactor: loadFactor.toFixed(2),
          threshold: LOAD_FACTOR_THRESHOLD,
          newSize,
        },
      });

      // Rehash all existing keys
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
        description: `Rehashing complete! New size: ${newSize}, new load factor: ${(itemCount / newSize).toFixed(2)}`,
        codeLine: -1,
        variables: { newSize, newLoadFactor: (itemCount / newSize).toFixed(2) },
      });
    }
  }

  steps.push({
    operation: 'done',
    key: '',
    hashValue: 0,
    bucketIndex: -1,
    buckets: buckets.map((b) => [...b]),
    description: `Done! Inserted ${keys.length} keys. Final load factor: ${(itemCount / buckets.length).toFixed(2)}`,
    codeLine: -1,
  });

  return steps;
}

const HashTableVisualizerComponent: React.FC<HashTableVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const [speed, setSpeed] = useState(25); // Slower default
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<HashStep[]>([]);
  const [customKey, setCustomKey] = useState('');
  const [keys, setKeys] = useState<string[]>(SAMPLE_KEYS.slice(0, 5));

  const playingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initializeHash = useCallback(() => {
    const newSteps = generateHashSteps(keys);
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
    playingRef.current = false;
  }, [keys]);

  useEffect(() => {
    initializeHash();
  }, [initializeHash]);

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      playingRef.current = true;
      // Slower: min 100ms, max 2000ms
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

  // Keyboard shortcuts (P = play/pause, [ = back, ] = forward, R = reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      // Don't intercept browser shortcuts (Ctrl/Cmd + key)
      if (e.ctrlKey || e.metaKey) {
        return;
      }
      switch (e.key) {
        case 'p':
        case 'P':
          e.preventDefault();
          handlePlayPause();
          break;
        case '[':
          e.preventDefault();
          if (!isPlaying) handleStepBack();
          break;
        case ']':
          e.preventDefault();
          if (!isPlaying) handleStep();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          handleReset();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlePlayPause excluded to prevent infinite loop
  }, [handleStep, handleStepBack, isPlaying]);

  const handleReset = () => {
    setIsPlaying(false);
    playingRef.current = false;
    setCurrentStep(0);
  };

  const handleAddKey = () => {
    if (customKey.trim() && !keys.includes(customKey.trim())) {
      setKeys([...keys, customKey.trim()]);
      setCustomKey('');
    }
  };

  const handleResetKeys = () => {
    setKeys(SAMPLE_KEYS.slice(0, 5));
    setCurrentStep(0);
  };

  const currentStepData = steps[currentStep] || {
    operation: 'done',
    buckets: [],
    bucketIndex: -1,
    key: '',
  };
  const { operation, buckets, bucketIndex, key } = currentStepData;
  const currentDescription = steps[currentStep]?.description || '';

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">
              Hash Table (Chaining)
            </h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-700 rounded">
                Avg: O(1)
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                Worst: O(n)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visualization Area */}
      <div className="p-4">
        <div className={`flex gap-4 ${showCode ? 'flex-col lg:flex-row' : ''}`}>
          {/* Main Visualization */}
          <VisualizationArea minHeight={400} className="flex-1 min-w-0">
            {/* Keys to insert */}
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Keys to insert:
              </div>
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
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-400 ring-2 ring-yellow-300'
                            : 'bg-gray-50 text-gray-600 border-gray-300'
                      }`}
                    >
                      {k}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Hash Calculation - Prominent */}
            <div className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border-2 border-violet-200 min-h-[80px]">
              <div className="text-sm font-semibold text-violet-800 mb-2">
                Hash Calculation
              </div>
              {operation === 'insert' && key ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="font-mono text-lg text-gray-800">
                    hash(<span className="text-violet-600 font-bold">&quot;{key}&quot;</span>) % {buckets.length} = <span className="text-violet-600 font-bold text-xl">{bucketIndex}</span>
                  </div>
                  <div className="text-violet-600 text-2xl animate-bounce">↓</div>
                </div>
              ) : operation === 'collision' ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="font-mono text-lg text-red-700">
                    Collision at bucket <span className="font-bold">[{bucketIndex}]</span>! Adding to chain...
                  </div>
                  <div className="text-red-500 text-2xl">⚠️</div>
                </div>
              ) : operation === 'placed' ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="font-mono text-lg text-green-700">
                    <span className="font-bold">&quot;{key}&quot;</span> placed in bucket <span className="font-bold">[{bucketIndex}]</span>
                  </div>
                  <div className="text-green-500 text-2xl">✓</div>
                </div>
              ) : operation === 'rehash' ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="font-mono text-lg text-orange-700">
                    Rehashing: expanding table...
                  </div>
                  <div className="text-orange-500 text-2xl">🔄</div>
                </div>
              ) : (
                <div className="text-gray-400 text-center">
                  Click Play to start visualization
                </div>
              )}
            </div>

            {/* Hash Table Buckets - Horizontal Row */}
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-700 mb-3">
                Hash Table ({buckets.length} buckets):
              </div>
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-1" style={{ minWidth: 'max-content' }}>
                  {buckets.map((bucket, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center"
                      style={{ minWidth: '70px' }}
                    >
                      {/* Bucket Index */}
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
                      {/* Bucket Content - Vertical Chain */}
                      <div
                        className={`w-full border-2 rounded-b-lg min-h-[100px] p-1 transition-colors ${
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
                            <span className="text-xs text-gray-400 italic text-center py-2">
                              empty
                            </span>
                          ) : (
                            bucket.map((bucketKey, keyIdx) => (
                              <div
                                key={keyIdx}
                                className={`px-2 py-1 text-xs font-medium rounded border text-center transition-colors ${
                                  bucketKey === key &&
                                  (operation === 'placed' || operation === 'insert')
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

            {/* Status */}
            <StatusPanel
              description={currentDescription}
              currentStep={currentStep}
              totalSteps={steps.length}
              variant={
                operation === 'collision'
                  ? 'error'
                  : operation === 'placed'
                    ? 'success'
                    : 'default'
              }
            />
          </VisualizationArea>

          {/* Code Panel */}
          {showCode && (
            <div className="w-full lg:w-56 flex-shrink-0 space-y-2">
              <CodePanel
                code={HASH_TABLE_CODE}
                activeLine={currentStepData?.codeLine ?? -1}
                variables={currentStepData?.variables}
              />
              <HelpPanel />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <ControlPanel
            isPlaying={isPlaying}
            currentStep={currentStep}
            totalSteps={steps.length}
            speed={speed}
            onPlayPause={handlePlayPause}
            onStep={handleStep}
            onStepBack={handleStepBack}
            onReset={handleReset}
            onSpeedChange={setSpeed}
            accentColor="purple"
            extraControls={
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
                  className="p-1.5 bg-violet-100 text-violet-700 rounded hover:bg-violet-200 disabled:opacity-50"
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
            }
          />
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
};

export const HashTableVisualizer = React.memo(HashTableVisualizerComponent);
export default HashTableVisualizer;
