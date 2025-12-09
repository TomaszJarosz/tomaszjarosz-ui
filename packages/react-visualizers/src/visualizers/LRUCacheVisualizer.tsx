import React, { useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';

interface CacheNode {
  key: number;
  value: string;
  prev: number | null;
  next: number | null;
}

interface LRUStep {
  operation: 'init' | 'get' | 'put' | 'hit' | 'miss' | 'evict' | 'moveToHead' | 'done';
  nodes: Map<number, CacheNode>;
  head: number | null;
  tail: number | null;
  capacity: number;
  currentKey?: number;
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  isHit?: boolean;
}

interface LRUCacheVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const CAPACITY = 3;

const OPERATIONS: Array<{ op: 'get' | 'put'; key: number; value?: string }> = [
  { op: 'put', key: 1, value: 'A' },
  { op: 'put', key: 2, value: 'B' },
  { op: 'put', key: 3, value: 'C' },
  { op: 'get', key: 2 },
  { op: 'put', key: 4, value: 'D' }, // evicts 1
  { op: 'get', key: 1 }, // miss
  { op: 'get', key: 3 },
  { op: 'put', key: 5, value: 'E' }, // evicts 4
];

const LRU_CODE = [
  'class LRUCache:',
  '  def __init__(capacity):',
  '    self.capacity = capacity',
  '    self.cache = {}  # key -> node',
  '    self.head = self.tail = None',
  '',
  '  def get(key):',
  '    if key not in cache:',
  '      return -1  # miss',
  '    node = cache[key]',
  '    moveToHead(node)',
  '    return node.value  # hit',
  '',
  '  def put(key, value):',
  '    if key in cache:',
  '      cache[key].value = value',
  '      moveToHead(cache[key])',
  '      return',
  '    if len(cache) >= capacity:',
  '      evict(tail)  # remove LRU',
  '    node = Node(key, value)',
  '    addToHead(node)',
  '    cache[key] = node',
];

const LEGEND_ITEMS = [
  { color: 'bg-gray-100', label: 'Cache entry', border: '#d1d5db' },
  { color: 'bg-green-400', label: 'Head (MRU)' },
  { color: 'bg-red-400', label: 'Tail (LRU)' },
  { color: 'bg-blue-200', label: 'Current', border: '#60a5fa' },
  { color: 'bg-yellow-200', label: 'Cache hit', border: '#fbbf24' },
  { color: 'bg-purple-400', label: 'Evicted' },
];

const BADGES = [
  { label: 'O(1) get/put', variant: 'orange' as const },
  { label: 'HashMap + DLL', variant: 'orange' as const },
];

function cloneNodes(nodes: Map<number, CacheNode>): Map<number, CacheNode> {
  const cloned = new Map<number, CacheNode>();
  nodes.forEach((node, key) => {
    cloned.set(key, { ...node });
  });
  return cloned;
}

function generateLRUSteps(): LRUStep[] {
  const steps: LRUStep[] = [];
  const nodes = new Map<number, CacheNode>();
  let head: number | null = null;
  let tail: number | null = null;

  steps.push({
    operation: 'init',
    nodes: cloneNodes(nodes),
    head,
    tail,
    capacity: CAPACITY,
    description: `Initialize LRU Cache with capacity ${CAPACITY}. Uses HashMap + Doubly Linked List.`,
    codeLine: 1,
    variables: { capacity: CAPACITY },
  });

  const moveToHead = (key: number) => {
    const node = nodes.get(key)!;

    // Already at head
    if (head === key) return;

    // Remove from current position
    if (node.prev !== null) {
      nodes.get(node.prev)!.next = node.next;
    }
    if (node.next !== null) {
      nodes.get(node.next)!.prev = node.prev;
    }
    if (tail === key) {
      tail = node.prev;
    }

    // Move to head
    node.prev = null;
    node.next = head;
    if (head !== null) {
      nodes.get(head)!.prev = key;
    }
    head = key;
    if (tail === null) {
      tail = key;
    }
  };

  const addToHead = (key: number, value: string) => {
    const node: CacheNode = {
      key,
      value,
      prev: null,
      next: head,
    };
    nodes.set(key, node);

    if (head !== null) {
      nodes.get(head)!.prev = key;
    }
    head = key;
    if (tail === null) {
      tail = key;
    }
  };

  const evictTail = (): number | null => {
    if (tail === null) return null;

    const evictedKey = tail;
    const tailNode = nodes.get(tail)!;

    if (tailNode.prev !== null) {
      nodes.get(tailNode.prev)!.next = null;
    }
    tail = tailNode.prev;

    if (head === evictedKey) {
      head = null;
    }

    nodes.delete(evictedKey);
    return evictedKey;
  };

  for (const operation of OPERATIONS) {
    if (operation.op === 'get') {
      const key = operation.key;

      steps.push({
        operation: 'get',
        nodes: cloneNodes(nodes),
        head,
        tail,
        capacity: CAPACITY,
        currentKey: key,
        description: `get(${key}): Looking up key ${key} in cache...`,
        codeLine: 6,
        variables: { key },
      });

      if (nodes.has(key)) {
        // Cache hit
        const node = nodes.get(key)!;
        moveToHead(key);

        steps.push({
          operation: 'hit',
          nodes: cloneNodes(nodes),
          head,
          tail,
          capacity: CAPACITY,
          currentKey: key,
          description: `✓ Cache HIT! get(${key}) = "${node.value}". Moved to head (MRU).`,
          codeLine: 11,
          variables: { key, value: `"${node.value}"`, result: 'hit' },
          isHit: true,
        });
      } else {
        // Cache miss
        steps.push({
          operation: 'miss',
          nodes: cloneNodes(nodes),
          head,
          tail,
          capacity: CAPACITY,
          currentKey: key,
          description: `✗ Cache MISS! Key ${key} not found. Returns -1.`,
          codeLine: 8,
          variables: { key, result: 'miss' },
          isHit: false,
        });
      }
    } else if (operation.op === 'put') {
      const key = operation.key;
      const value = operation.value!;

      steps.push({
        operation: 'put',
        nodes: cloneNodes(nodes),
        head,
        tail,
        capacity: CAPACITY,
        currentKey: key,
        description: `put(${key}, "${value}"): Adding/updating key ${key}...`,
        codeLine: 13,
        variables: { key, value: `"${value}"` },
      });

      if (nodes.has(key)) {
        // Update existing
        nodes.get(key)!.value = value;
        moveToHead(key);

        steps.push({
          operation: 'moveToHead',
          nodes: cloneNodes(nodes),
          head,
          tail,
          capacity: CAPACITY,
          currentKey: key,
          description: `Key ${key} exists. Updated value to "${value}" and moved to head.`,
          codeLine: 16,
          variables: { key, value: `"${value}"` },
        });
      } else {
        // Check if need to evict
        if (nodes.size >= CAPACITY) {
          const evictedKey = evictTail();

          steps.push({
            operation: 'evict',
            nodes: cloneNodes(nodes),
            head,
            tail,
            capacity: CAPACITY,
            currentKey: evictedKey ?? undefined,
            description: `Cache full! Evicted LRU entry with key ${evictedKey}.`,
            codeLine: 19,
            variables: { evictedKey: evictedKey ?? 'none', size: nodes.size, capacity: CAPACITY },
          });
        }

        // Add new entry
        addToHead(key, value);

        steps.push({
          operation: 'put',
          nodes: cloneNodes(nodes),
          head,
          tail,
          capacity: CAPACITY,
          currentKey: key,
          description: `Added new entry (${key}, "${value}") at head. Size: ${nodes.size}/${CAPACITY}`,
          codeLine: 22,
          variables: { key, value: `"${value}"`, size: nodes.size },
        });
      }
    }
  }

  // Final state
  const entries: string[] = [];
  let finalCurrent: number | null = head;
  while (finalCurrent !== null) {
    const finalNode: CacheNode = nodes.get(finalCurrent)!;
    entries.push(`${finalNode.key}:"${finalNode.value}"`);
    finalCurrent = finalNode.next;
  }

  steps.push({
    operation: 'done',
    nodes: cloneNodes(nodes),
    head,
    tail,
    capacity: CAPACITY,
    description: `✓ Done! Cache order (MRU→LRU): ${entries.join(' → ')}`,
    codeLine: -1,
    variables: { size: nodes.size, capacity: CAPACITY },
  });

  return steps;
}

const LRUCacheVisualizerComponent: React.FC<LRUCacheVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'lru-cache-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'lru', scrollToId: VISUALIZER_ID });

  const generateSteps = useMemo(() => generateLRUSteps, []);

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
  } = useVisualizerPlayback<LRUStep>({
    generateSteps,
  });

  const stepData: LRUStep = currentStepData || {
    operation: 'init',
    nodes: new Map(),
    head: null,
    tail: null,
    capacity: CAPACITY,
    description: '',
  };

  // Build ordered list from head to tail
  const orderedEntries = useMemo(() => {
    const entries: Array<{ key: number; value: string; isHead: boolean; isTail: boolean }> = [];
    let current = stepData.head;
    while (current !== null) {
      const node = stepData.nodes.get(current);
      if (node) {
        entries.push({
          key: node.key,
          value: node.value,
          isHead: current === stepData.head,
          isTail: current === stepData.tail,
        });
        current = node.next;
      } else {
        break;
      }
    }
    return entries;
  }, [stepData.nodes, stepData.head, stepData.tail]);

  const getEntryStyle = (key: number, isHead: boolean, isTail: boolean): string => {
    const isCurrent = stepData.currentKey === key;
    const isHit = stepData.isHit && isCurrent;

    if (isHit) return 'border-yellow-400 bg-yellow-100 ring-2 ring-yellow-300';
    if (isCurrent) return 'border-blue-400 bg-blue-100 ring-2 ring-blue-300';
    if (isHead) return 'border-green-400 bg-green-100';
    if (isTail) return 'border-red-400 bg-red-100';
    return 'border-gray-300 bg-gray-50';
  };

  const getStatusVariant = () => {
    if (stepData.operation === 'miss') return 'error' as const;
    if (stepData.operation === 'hit' || stepData.operation === 'done') return 'success' as const;
    if (stepData.operation === 'evict') return 'warning' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const visualization = (
    <>
      {/* Info Box */}
      <div className="mb-4 p-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg border border-rose-200">
        <div className="text-sm font-semibold text-rose-800 mb-2">
          LRU Cache (Least Recently Used)
        </div>
        <div className="text-xs text-rose-700 space-y-1">
          <div>• <strong>HashMap</strong>: O(1) key lookup</div>
          <div>• <strong>Doubly Linked List</strong>: O(1) reordering</div>
          <div>• Head = Most Recently Used (MRU)</div>
          <div>• Tail = Least Recently Used (LRU) - evicted first</div>
        </div>
      </div>

      {/* Cache Visualization */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-700">Cache</span>
          <span className="text-xs text-gray-500">
            ({stepData.nodes.size}/{stepData.capacity})
          </span>
        </div>

        {/* Doubly Linked List representation */}
        <div className="flex items-center justify-center gap-2 min-h-[100px] p-4 bg-gray-50 rounded-lg">
          {orderedEntries.length === 0 ? (
            <div className="text-gray-400 text-sm">Empty cache</div>
          ) : (
            <>
              <div className="text-xs text-green-600 font-medium">HEAD</div>
              <div className="text-gray-400">→</div>
              {orderedEntries.map((entry, idx) => (
                <React.Fragment key={entry.key}>
                  <div
                    className={`
                      flex flex-col items-center p-3 rounded-lg border-2 min-w-[70px]
                      transition-all duration-300
                      ${getEntryStyle(entry.key, entry.isHead, entry.isTail)}
                    `}
                  >
                    <div className="text-xs text-gray-500 mb-1">key: {entry.key}</div>
                    <div className="text-lg font-bold text-gray-800">"{entry.value}"</div>
                    {entry.isHead && !entry.isTail && (
                      <div className="text-[10px] text-green-600 mt-1">MRU</div>
                    )}
                    {entry.isTail && !entry.isHead && (
                      <div className="text-[10px] text-red-600 mt-1">LRU</div>
                    )}
                    {entry.isHead && entry.isTail && (
                      <div className="text-[10px] text-purple-600 mt-1">only</div>
                    )}
                  </div>
                  {idx < orderedEntries.length - 1 && (
                    <div className="text-gray-400 text-lg">⇄</div>
                  )}
                </React.Fragment>
              ))}
              <div className="text-gray-400">→</div>
              <div className="text-xs text-red-600 font-medium">TAIL</div>
            </>
          )}
        </div>
      </div>

      {/* HashMap visualization */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">HashMap (key → node)</div>
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg min-h-[50px]">
          {stepData.nodes.size === 0 ? (
            <div className="text-gray-400 text-sm">Empty</div>
          ) : (
            Array.from(stepData.nodes.entries()).map(([key, node]) => (
              <div
                key={key}
                className={`
                  px-3 py-1 rounded border text-sm
                  ${stepData.currentKey === key ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300'}
                `}
              >
                {key} → "{node.value}"
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="LRU Cache"
      badges={BADGES}
      gradient="orange"
      className={className}
      minHeight={380}
      onShare={handleShare}
      status={{
        description: stepData.description,
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
        accentColor: 'orange',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? LRU_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const LRUCacheVisualizer = React.memo(LRUCacheVisualizerComponent);
export default LRUCacheVisualizer;
