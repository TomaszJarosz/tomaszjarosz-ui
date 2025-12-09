import React, { useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';

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
  codeLine?: number;
  variables?: Record<string, string | number>;
  highlightBucket?: number;
  highlightEntry?: { bucket: number; index: number };
  found?: boolean;
}

interface HashMapVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const BUCKET_COUNT = 8;

const OPERATIONS: Array<{ op: 'put' | 'get'; key: string; value?: number }> = [
  { op: 'put', key: 'Alice', value: 25 },
  { op: 'put', key: 'Bob', value: 30 },
  { op: 'put', key: 'Charlie', value: 35 },
  { op: 'put', key: 'Diana', value: 28 },
  { op: 'put', key: 'Eve', value: 22 },
  { op: 'get', key: 'Bob' },
  { op: 'put', key: 'Alice', value: 26 }, // Update existing
  { op: 'get', key: 'Frank' }, // Not found
];

const HASHMAP_CODE = [
  'function put(key, value):',
  '  hash = hashCode(key)',
  '  index = hash % capacity',
  '  bucket = buckets[index]',
  '  for entry in bucket:',
  '    if entry.key == key:',
  '      entry.value = value',
  '      return',
  '  bucket.add(Entry(key, value))',
  '',
  'function get(key):',
  '  hash = hashCode(key)',
  '  index = hash % capacity',
  '  bucket = buckets[index]',
  '  for entry in bucket:',
  '    if entry.key == key:',
  '      return entry.value',
  '  return null',
];

const LEGEND_ITEMS = [
  { color: 'bg-blue-50', label: 'Current bucket', border: '#60a5fa' },
  { color: 'bg-blue-500', label: 'Insert/Update' },
  { color: 'bg-green-400', label: 'Found' },
  { color: 'bg-red-400', label: 'Not found' },
];

const BADGES = [
  { label: 'Avg: O(1)', variant: 'indigo' as const },
  { label: 'Worst: O(n)', variant: 'purple' as const },
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

  // Initial state
  steps.push({
    operation: 'init',
    key: '',
    buckets: buckets.map((b) => ({ entries: [...b.entries] })),
    description: `Initialize HashMap with ${BUCKET_COUNT} buckets. Each bucket is a linked list for collision handling.`,
    codeLine: -1,
  });

  for (const { op, key, value } of OPERATIONS) {
    const hash = simpleHash(key);
    const index = hash % BUCKET_COUNT;

    if (op === 'put') {
      // Step 1: Calculate hash
      steps.push({
        operation: 'hash',
        key,
        value,
        hash,
        bucketIndex: index,
        buckets: buckets.map((b) => ({ entries: [...b.entries] })),
        description: `put("${key}", ${value}): Calculate hash = ${hash}, index = ${hash} % ${BUCKET_COUNT} = ${index}`,
        codeLine: 1,
        variables: { key: `"${key}"`, value: value ?? 0, hash, index },
        highlightBucket: index,
      });

      // Check for existing key
      const existingIndex = buckets[index].entries.findIndex(
        (e) => e.key === key
      );

      if (existingIndex >= 0) {
        // Update existing
        const oldValue = buckets[index].entries[existingIndex].value;
        buckets[index].entries[existingIndex].value = value ?? 0;

        steps.push({
          operation: 'put',
          key,
          value,
          hash,
          bucketIndex: index,
          buckets: buckets.map((b) => ({ entries: [...b.entries] })),
          description: `Found "${key}" in bucket ${index}. Update value: ${oldValue} → ${value}`,
          codeLine: 6,
          variables: { key: `"${key}"`, old: oldValue, new: value ?? 0 },
          highlightBucket: index,
          highlightEntry: { bucket: index, index: existingIndex },
        });
      } else {
        // Add new entry
        buckets[index].entries.push({ key, value: value ?? 0, hash });

        const collisionMsg =
          buckets[index].entries.length > 1
            ? ` (Collision! Chaining with ${buckets[index].entries.length - 1} existing entry)`
            : '';

        steps.push({
          operation: 'put',
          key,
          value,
          hash,
          bucketIndex: index,
          buckets: buckets.map((b) => ({ entries: [...b.entries] })),
          description: `Add Entry("${key}", ${value}) to bucket ${index}${collisionMsg}`,
          codeLine: 8,
          variables: { key: `"${key}"`, value: value ?? 0, bucket: index },
          highlightBucket: index,
          highlightEntry: {
            bucket: index,
            index: buckets[index].entries.length - 1,
          },
        });
      }
    } else {
      // GET operation
      // Step 1: Calculate hash
      steps.push({
        operation: 'hash',
        key,
        hash,
        bucketIndex: index,
        buckets: buckets.map((b) => ({ entries: [...b.entries] })),
        description: `get("${key}"): Calculate hash = ${hash}, index = ${hash} % ${BUCKET_COUNT} = ${index}`,
        codeLine: 11,
        variables: { key: `"${key}"`, hash, index },
        highlightBucket: index,
      });

      // Search in bucket
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
          description: `Found "${key}" in bucket ${index} → return ${foundValue}`,
          codeLine: 16,
          variables: { key: `"${key}"`, result: foundValue },
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
          description: `Key "${key}" not found in bucket ${index} → return null`,
          codeLine: 17,
          variables: { key: `"${key}"`, result: 'null' },
          highlightBucket: index,
          found: false,
        });
      }
    }
  }

  // Final state
  const totalEntries = buckets.reduce((sum, b) => sum + b.entries.length, 0);
  steps.push({
    operation: 'done',
    key: '',
    buckets: buckets.map((b) => ({ entries: [...b.entries] })),
    description: `✓ Done! HashMap contains ${totalEntries} entries across ${BUCKET_COUNT} buckets.`,
    codeLine: -1,
    variables: { size: totalEntries, capacity: BUCKET_COUNT },
  });

  return steps;
}

const HashMapVisualizerComponent: React.FC<HashMapVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'hashmap-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'hashmap', scrollToId: VISUALIZER_ID });

  const generateSteps = useMemo(() => generateHashMapSteps, []);

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
  } = useVisualizerPlayback<HashMapStep>({
    generateSteps,
  });

  const stepData = currentStepData || {
    operation: 'init' as const,
    key: '',
    buckets: [],
    description: '',
  };

  const { buckets, highlightBucket, highlightEntry, description, found } =
    stepData;

  const getBucketStyle = (index: number): string => {
    if (index === highlightBucket) {
      if (stepData.operation === 'get') {
        return found
          ? 'border-green-400 bg-green-50'
          : 'border-red-400 bg-red-50';
      }
      return 'border-blue-400 bg-blue-50';
    }
    return 'border-gray-200 bg-gray-50';
  };

  const getEntryStyle = (bucketIdx: number, entryIdx: number): string => {
    if (
      highlightEntry &&
      highlightEntry.bucket === bucketIdx &&
      highlightEntry.index === entryIdx
    ) {
      if (stepData.operation === 'get') {
        return found ? 'bg-green-400 text-white' : 'bg-red-400 text-white';
      }
      return 'bg-blue-500 text-white';
    }
    return 'bg-white border border-gray-300 text-gray-700';
  };

  const getStatusVariant = () => {
    if (stepData.operation === 'get' && found === false) return 'error' as const;
    if (stepData.operation === 'get' && found === true) return 'success' as const;
    if (stepData.operation === 'done') return 'warning' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const visualization = (
    <>
      {/* Hash Function - Prominent */}
      <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
        <div className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
          <span className="text-lg">#️⃣</span> Hash Function
        </div>
        <div className="font-mono text-sm bg-white rounded-lg p-3 border border-indigo-200">
          <div className="text-center text-indigo-700 font-bold mb-2">
            index = hashCode(key) % capacity
          </div>
          <div className="text-xs text-gray-500 text-center">
            Same key → same index (deterministic) • Different keys may collide → chaining
          </div>
        </div>
        {/* Current hash calculation - always visible with min-height */}
        <div className="mt-3 p-3 bg-white rounded-lg border border-indigo-200 min-h-[80px]">
          {stepData.hash !== undefined && stepData.key ? (
            <div className="text-xs text-center">
              <div className="font-mono mb-1">
                hashCode(<span className="text-indigo-600 font-bold">&quot;{stepData.key}&quot;</span>) = <span className="text-purple-600 font-bold">{stepData.hash}</span>
              </div>
              <div className="font-mono">
                <span className="text-purple-600">{stepData.hash}</span> % <span className="text-gray-600">{BUCKET_COUNT}</span> = <span className="text-indigo-600 font-bold text-lg">{stepData.bucketIndex}</span>
              </div>
              <div className="mt-2 text-indigo-600 text-lg">↓ bucket[{stepData.bucketIndex}]</div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 text-center py-4">Ready to hash...</div>
          )}
        </div>
      </div>

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
              {/* Entries chain */}
              <div className="flex flex-col items-center mt-1">
                {bucket.entries.length > 0 ? (
                  bucket.entries.map((entry, eIdx) => (
                    <React.Fragment key={eIdx}>
                      {eIdx > 0 && (
                        <div className="w-0.5 h-2 bg-gray-300" />
                      )}
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
    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="HashMap Operations"
      badges={BADGES}
      gradient="indigo"
      onShare={handleShare}
      className={className}
      minHeight={350}
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
        accentColor: 'indigo',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? HASHMAP_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const HashMapVisualizer = React.memo(HashMapVisualizerComponent);
export default HashMapVisualizer;
