import React, { useMemo, useState, useCallback } from 'react';
import {
  CodePanel,
  HelpPanel,
  ControlPanel,
  Legend,
  StatusPanel,
  ShareButton,
  useUrlState,
  useVisualizerPlayback,
  VisualizationArea,
} from '../shared';

interface Entry {
  key: string;
  value: number;
  hash: number;
  prev: string | null;
  next: string | null;
}

interface Bucket {
  entries: Entry[];
}

interface LinkedHashMapStep {
  operation: 'init' | 'put' | 'get' | 'hash' | 'link' | 'access' | 'done';
  key: string;
  value?: number;
  hash?: number;
  bucketIndex?: number;
  buckets: Bucket[];
  linkedOrder: string[]; // Keys in insertion/access order
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  highlightBucket?: number;
  highlightEntry?: { bucket: number; index: number };
  highlightLinkedKey?: string;
  found?: boolean;
  accessOrder?: boolean;
}

interface LinkedHashMapVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const BUCKET_COUNT = 6;

const OPERATIONS: Array<{
  op: 'put' | 'get';
  key: string;
  value?: number;
}> = [
  { op: 'put', key: 'A', value: 10 },
  { op: 'put', key: 'B', value: 20 },
  { op: 'put', key: 'C', value: 30 },
  { op: 'put', key: 'D', value: 40 },
  { op: 'get', key: 'A' }, // Access moves to end in access-order mode
  { op: 'put', key: 'E', value: 50 },
  { op: 'get', key: 'B' },
  { op: 'put', key: 'A', value: 15 }, // Update existing
];

const LINKEDHASHMAP_CODE = [
  'class LinkedHashMap<K,V> extends HashMap {',
  '  Entry<K,V> head, tail;',
  '  boolean accessOrder; // false=insertion',
  '',
  '  V put(K key, V value) {',
  '    Entry e = super.put(key, value);',
  '    if (e.isNew()) {',
  '      linkNodeLast(e); // Add to list end',
  '    } else if (accessOrder) {',
  '      moveToLast(e);',
  '    }',
  '    return e.value;',
  '  }',
  '',
  '  V get(K key) {',
  '    Entry e = super.get(key);',
  '    if (e != null && accessOrder) {',
  '      moveToLast(e); // LRU: move to end',
  '    }',
  '    return e != null ? e.value : null;',
  '  }',
  '}',
];

const LEGEND_ITEMS = [
  { color: 'bg-blue-50', label: 'Current bucket', border: '#60a5fa' },
  { color: 'bg-blue-500', label: 'Insert/Update' },
  { color: 'bg-green-400', label: 'Found' },
  { color: 'bg-orange-400', label: 'Linked list order' },
];

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

function generateLinkedHashMapSteps(accessOrder = true): LinkedHashMapStep[] {
  const steps: LinkedHashMapStep[] = [];
  const buckets: Bucket[] = Array.from({ length: BUCKET_COUNT }, () => ({
    entries: [],
  }));
  const linkedOrder: string[] = [];
  const entryMap: Map<string, Entry> = new Map();

  // Initial state
  steps.push({
    operation: 'init',
    key: '',
    buckets: buckets.map((b) => ({ entries: [...b.entries] })),
    linkedOrder: [...linkedOrder],
    description: `Initialize LinkedHashMap with ${BUCKET_COUNT} buckets. Mode: ${accessOrder ? 'Access-order (LRU)' : 'Insertion-order'}`,
    codeLine: 0,
    accessOrder,
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
        buckets: buckets.map((b) => ({
          entries: b.entries.map((e) => ({ ...e })),
        })),
        linkedOrder: [...linkedOrder],
        description: `put("${key}", ${value}): hash = ${hash}, bucket = ${index}`,
        codeLine: 5,
        variables: { key: `"${key}"`, hash, bucket: index },
        highlightBucket: index,
        accessOrder,
      });

      // Check for existing key
      const existingBucketIdx = buckets[index].entries.findIndex(
        (e) => e.key === key
      );

      if (existingBucketIdx >= 0) {
        // Update existing
        const oldValue = buckets[index].entries[existingBucketIdx].value;
        buckets[index].entries[existingBucketIdx].value = value ?? 0;

        if (accessOrder) {
          // Move to end of linked list
          const linkedIdx = linkedOrder.indexOf(key);
          if (linkedIdx !== -1) {
            linkedOrder.splice(linkedIdx, 1);
            linkedOrder.push(key);
          }

          steps.push({
            operation: 'access',
            key,
            value,
            buckets: buckets.map((b) => ({
              entries: b.entries.map((e) => ({ ...e })),
            })),
            linkedOrder: [...linkedOrder],
            description: `Update "${key}": ${oldValue} → ${value}. Access-order: move to end`,
            codeLine: 9,
            variables: { key: `"${key}"`, old: oldValue, new: value ?? 0 },
            highlightBucket: index,
            highlightEntry: { bucket: index, index: existingBucketIdx },
            highlightLinkedKey: key,
            accessOrder,
          });
        } else {
          steps.push({
            operation: 'put',
            key,
            value,
            buckets: buckets.map((b) => ({
              entries: b.entries.map((e) => ({ ...e })),
            })),
            linkedOrder: [...linkedOrder],
            description: `Update "${key}": ${oldValue} → ${value}. Insertion-order: position unchanged`,
            codeLine: 6,
            variables: { key: `"${key}"`, old: oldValue, new: value ?? 0 },
            highlightBucket: index,
            highlightEntry: { bucket: index, index: existingBucketIdx },
            accessOrder,
          });
        }
      } else {
        // Add new entry
        const newEntry: Entry = {
          key,
          value: value ?? 0,
          hash,
          prev: linkedOrder.length > 0 ? linkedOrder[linkedOrder.length - 1] : null,
          next: null,
        };

        // Update previous tail's next pointer
        if (linkedOrder.length > 0) {
          const prevKey = linkedOrder[linkedOrder.length - 1];
          const prevEntry = entryMap.get(prevKey);
          if (prevEntry) {
            prevEntry.next = key;
          }
        }

        buckets[index].entries.push(newEntry);
        linkedOrder.push(key);
        entryMap.set(key, newEntry);

        steps.push({
          operation: 'link',
          key,
          value,
          hash,
          bucketIndex: index,
          buckets: buckets.map((b) => ({
            entries: b.entries.map((e) => ({ ...e })),
          })),
          linkedOrder: [...linkedOrder],
          description: `Add "${key}" to bucket ${index} and link to end of list`,
          codeLine: 7,
          variables: {
            key: `"${key}"`,
            value: value ?? 0,
            prev: newEntry.prev || 'null',
          },
          highlightBucket: index,
          highlightEntry: { bucket: index, index: buckets[index].entries.length - 1 },
          highlightLinkedKey: key,
          accessOrder,
        });
      }
    } else {
      // GET operation
      steps.push({
        operation: 'hash',
        key,
        hash,
        bucketIndex: index,
        buckets: buckets.map((b) => ({
          entries: b.entries.map((e) => ({ ...e })),
        })),
        linkedOrder: [...linkedOrder],
        description: `get("${key}"): hash = ${hash}, bucket = ${index}`,
        codeLine: 15,
        variables: { key: `"${key}"`, hash, bucket: index },
        highlightBucket: index,
        accessOrder,
      });

      const foundIdx = buckets[index].entries.findIndex((e) => e.key === key);

      if (foundIdx >= 0) {
        const foundValue = buckets[index].entries[foundIdx].value;

        if (accessOrder) {
          // Move to end of linked list
          const linkedIdx = linkedOrder.indexOf(key);
          if (linkedIdx !== -1 && linkedIdx !== linkedOrder.length - 1) {
            linkedOrder.splice(linkedIdx, 1);
            linkedOrder.push(key);
          }

          steps.push({
            operation: 'access',
            key,
            value: foundValue,
            buckets: buckets.map((b) => ({
              entries: b.entries.map((e) => ({ ...e })),
            })),
            linkedOrder: [...linkedOrder],
            description: `Found "${key}" = ${foundValue}. Access-order: move to end (LRU)`,
            codeLine: 17,
            variables: { key: `"${key}"`, value: foundValue },
            highlightBucket: index,
            highlightEntry: { bucket: index, index: foundIdx },
            highlightLinkedKey: key,
            found: true,
            accessOrder,
          });
        } else {
          steps.push({
            operation: 'get',
            key,
            value: foundValue,
            buckets: buckets.map((b) => ({
              entries: b.entries.map((e) => ({ ...e })),
            })),
            linkedOrder: [...linkedOrder],
            description: `Found "${key}" = ${foundValue}`,
            codeLine: 19,
            variables: { key: `"${key}"`, value: foundValue },
            highlightBucket: index,
            highlightEntry: { bucket: index, index: foundIdx },
            found: true,
            accessOrder,
          });
        }
      } else {
        steps.push({
          operation: 'get',
          key,
          buckets: buckets.map((b) => ({
            entries: b.entries.map((e) => ({ ...e })),
          })),
          linkedOrder: [...linkedOrder],
          description: `Key "${key}" not found → null`,
          codeLine: 19,
          variables: { key: `"${key}"`, result: 'null' },
          highlightBucket: index,
          found: false,
          accessOrder,
        });
      }
    }
  }

  // Final state
  const totalEntries = buckets.reduce((sum, b) => sum + b.entries.length, 0);
  steps.push({
    operation: 'done',
    key: '',
    buckets: buckets.map((b) => ({
      entries: b.entries.map((e) => ({ ...e })),
    })),
    linkedOrder: [...linkedOrder],
    description: `✓ Done! ${totalEntries} entries. Iteration order: ${linkedOrder.join(' → ')}`,
    codeLine: -1,
    variables: { size: totalEntries },
    accessOrder,
  });

  return steps;
}

const LinkedHashMapVisualizerComponent: React.FC<LinkedHashMapVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'linkedhashmap-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'linkedhashmap', scrollToId: VISUALIZER_ID });

  const [accessOrder, setAccessOrder] = useState(true);

  const generateSteps = useMemo(
    () => () => generateLinkedHashMapSteps(accessOrder),
    [accessOrder]
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
  } = useVisualizerPlayback<LinkedHashMapStep>({
    generateSteps,
  });

  const stepData = currentStepData || {
    operation: 'init' as const,
    key: '',
    buckets: [],
    linkedOrder: [],
    description: '',
  };

  const {
    buckets,
    linkedOrder,
    highlightBucket,
    highlightEntry,
    highlightLinkedKey,
    description,
    found,
  } = stepData;

  const toggleAccessOrder = useCallback(() => {
    setAccessOrder((prev) => !prev);
  }, []);

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
      if (stepData.operation === 'get' && found) {
        return 'bg-green-400 text-white';
      }
      if (stepData.operation === 'access') {
        return 'bg-orange-400 text-white';
      }
      return 'bg-blue-500 text-white';
    }
    return 'bg-white border border-gray-300 text-gray-700';
  };

  const getLinkedNodeStyle = (key: string): string => {
    if (key === highlightLinkedKey) {
      return 'bg-orange-400 text-white ring-2 ring-orange-300';
    }
    return 'bg-orange-100 text-orange-700';
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

  return (
    <div
      id={VISUALIZER_ID}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">LinkedHashMap</h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                O(1) ops
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                Ordered
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton onShare={handleShare} />
            <button
              onClick={toggleAccessOrder}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                accessOrder
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {accessOrder ? 'Access-Order (LRU)' : 'Insertion-Order'}
            </button>
          </div>
        </div>
      </div>

      {/* Visualization Area */}
      <div className="p-4">
        <div className={`flex gap-4 ${showCode ? 'flex-col lg:flex-row' : ''}`}>
          {/* Main Visualization */}
          <VisualizationArea minHeight={400} className={showCode ? 'flex-1' : 'w-full'}>
            {/* Dual Structure Info */}
            <div className="mb-3 p-2 bg-amber-50 rounded text-xs text-amber-700">
              <strong>Dual structure:</strong> Hash table (O(1) lookup) + Doubly-linked list (ordered iteration)
            </div>

            {/* Bucket Array */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Hash Table ({BUCKET_COUNT} buckets)
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
                            {eIdx > 0 && (
                              <div className="w-0.5 h-1 bg-gray-300" />
                            )}
                            <div
                              className={`px-2 py-0.5 text-[10px] rounded transition-colors whitespace-nowrap ${getEntryStyle(idx, eIdx)}`}
                            >
                              {entry.key}:{entry.value}
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

            {/* Linked List Order */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                {accessOrder ? 'Access Order (LRU: oldest → newest)' : 'Insertion Order'}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {linkedOrder.length > 0 ? (
                  <>
                    <span className="text-[10px] text-gray-500">HEAD →</span>
                    {linkedOrder.map((key, idx) => (
                      <React.Fragment key={key}>
                        {idx > 0 && (
                          <span className="text-orange-400">→</span>
                        )}
                        <div
                          className={`px-2 py-0.5 text-xs font-medium rounded transition-all ${getLinkedNodeStyle(key)}`}
                        >
                          {key}
                        </div>
                      </React.Fragment>
                    ))}
                    <span className="text-[10px] text-gray-500">→ TAIL</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400 italic">Empty list</span>
                )}
              </div>
            </div>

            {/* LRU Cache Example */}
            {accessOrder && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-700">
                  <strong>LRU Cache Usage:</strong>
                  <div className="mt-1 text-[11px]">
                    {linkedOrder.length > 0 ? (
                      <>
                        Least Recently Used: <strong>{linkedOrder[0]}</strong> |
                        Most Recently Used: <strong>{linkedOrder[linkedOrder.length - 1]}</strong>
                      </>
                    ) : (
                      'Cache empty'
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status */}
            <StatusPanel
              description={description}
              currentStep={currentStep}
              totalSteps={steps.length}
              variant={getStatusVariant()}
            />
          </VisualizationArea>

          {/* Code Panel */}
          {showCode && (
            <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
              <CodePanel
                code={LINKEDHASHMAP_CODE}
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
            accentColor="orange"
          />
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
};

export const LinkedHashMapVisualizer = React.memo(LinkedHashMapVisualizerComponent);
export default LinkedHashMapVisualizer;
