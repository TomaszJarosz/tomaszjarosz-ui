import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

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
  isHit?: boolean;
}

interface LRUCacheInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'lru-cache-interview-visualizer';

const BADGES = [
  { label: 'Interview Mode', variant: 'orange' as const },
  { label: 'O(1) Operations', variant: 'orange' as const },
];

const CAPACITY = 3;

const OPERATIONS: Array<{ op: 'get' | 'put'; key: number; value?: string }> = [
  { op: 'put', key: 1, value: 'A' },
  { op: 'put', key: 2, value: 'B' },
  { op: 'put', key: 3, value: 'C' },
  { op: 'get', key: 2 },
  { op: 'put', key: 4, value: 'D' },
  { op: 'get', key: 1 },
  { op: 'get', key: 3 },
];

const LEGEND_ITEMS = [
  { color: 'bg-green-400', label: 'Head (MRU)' },
  { color: 'bg-red-400', label: 'Tail (LRU)' },
  { color: 'bg-blue-200', label: 'Current', border: '#60a5fa' },
  { color: 'bg-yellow-200', label: 'Cache hit', border: '#fbbf24' },
];

// Interview questions about LRU Cache
const LRU_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'lru-1',
    question: 'What is the time complexity of get() and put() operations in an optimal LRU Cache implementation?',
    options: ['O(n) for both', 'O(log n) for both', 'O(1) for both', 'O(1) get, O(n) put'],
    correctAnswer: 2,
    explanation: 'Using a HashMap + Doubly Linked List, both get() and put() achieve O(1) time complexity. HashMap provides O(1) lookup, and DLL provides O(1) insertion/deletion at any position.',
    hint: 'Think about what data structures enable constant-time operations.',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'lru-2',
    question: 'Which data structures are used together to implement an optimal LRU Cache?',
    options: [
      'Array + Stack',
      'HashMap + Doubly Linked List',
      'Binary Search Tree + Queue',
      'HashMap + Singly Linked List'
    ],
    correctAnswer: 1,
    explanation: 'HashMap + Doubly Linked List is the optimal combination. HashMap gives O(1) key lookup, and DLL allows O(1) removal and insertion at both ends (for moving recently used items to head).',
    difficulty: 'easy',
    topic: 'Data Structures',
  },
  {
    id: 'lru-3',
    question: 'Why use a Doubly Linked List instead of a Singly Linked List?',
    options: [
      'It uses less memory',
      'It allows O(1) removal of a node given its reference',
      'It\'s easier to implement',
      'It\'s faster for iteration'
    ],
    correctAnswer: 1,
    explanation: 'With a DLL, we can remove a node in O(1) by updating prev.next and next.prev. With a SLL, we would need O(n) to find the previous node. This is crucial for moving accessed items to the head.',
    hint: 'Think about what happens when you need to remove a node from the middle.',
    difficulty: 'medium',
    topic: 'Design Choice',
  },
  {
    id: 'lru-4',
    question: 'In LRU Cache, which item gets evicted when the cache is full?',
    options: [
      'The most recently used item',
      'The least recently used item',
      'A random item',
      'The first item that was added'
    ],
    correctAnswer: 1,
    explanation: 'LRU (Least Recently Used) evicts the item that hasn\'t been accessed for the longest time. This is the item at the tail of the doubly linked list.',
    difficulty: 'easy',
    topic: 'Eviction Policy',
  },
  {
    id: 'lru-5',
    question: 'Which of these is NOT a real-world application of LRU Cache?',
    options: [
      'Browser cache',
      'CPU cache replacement',
      'Database connection pooling',
      'Sorting algorithms'
    ],
    correctAnswer: 3,
    explanation: 'LRU is used in browser caches, CPU cache replacement policies, database caches, and Redis/Memcached. Sorting algorithms don\'t use LRU caching - they\'re about ordering data, not caching.',
    difficulty: 'easy',
    topic: 'Applications',
  },
  {
    id: 'lru-6',
    question: 'How does LFU (Least Frequently Used) differ from LRU?',
    options: [
      'LFU is faster',
      'LFU evicts based on access count, LRU based on recency',
      'LFU uses less memory',
      'They are identical'
    ],
    correctAnswer: 1,
    explanation: 'LFU tracks how often each item is accessed and evicts the least frequently used. LRU only cares about when items were last accessed, not how many times. LFU is better when access patterns have varying frequencies.',
    difficulty: 'medium',
    topic: 'Cache Policies',
  },
  {
    id: 'lru-7',
    question: 'What is the space complexity of an LRU Cache with capacity n?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctAnswer: 2,
    explanation: 'Space is O(n) where n is the capacity. We store n nodes in the linked list and n entries in the HashMap. Each node has constant extra space for prev/next pointers.',
    difficulty: 'easy',
    topic: 'Space Complexity',
  },
  {
    id: 'lru-8',
    question: 'How would you make an LRU Cache thread-safe in Java?',
    options: [
      'Use ArrayList instead of LinkedList',
      'Use synchronized keyword or ConcurrentHashMap with locks',
      'Thread safety is automatic',
      'Use volatile keyword only'
    ],
    correctAnswer: 1,
    explanation: 'For thread safety, use synchronized blocks/methods, ReentrantLock, or ConcurrentHashMap with additional synchronization. LinkedHashMap with Collections.synchronizedMap() or custom locking is common.',
    hint: 'Multiple operations need to be atomic.',
    difficulty: 'hard',
    topic: 'Concurrency',
  },
  {
    id: 'lru-9',
    question: 'What happens during a cache "hit" in LRU?',
    options: [
      'The item is removed from cache',
      'The item is moved to head (most recently used position)',
      'The item stays in place',
      'The item is copied to a backup'
    ],
    correctAnswer: 1,
    explanation: 'On a cache hit, the accessed item is moved to the head of the list, marking it as most recently used. This ensures frequently accessed items stay in cache while unused items drift to the tail.',
    difficulty: 'easy',
    topic: 'Operations',
  },
  {
    id: 'lru-10',
    question: 'Which Java class provides built-in LRU functionality?',
    options: [
      'HashMap',
      'TreeMap',
      'LinkedHashMap with accessOrder=true',
      'ConcurrentHashMap'
    ],
    correctAnswer: 2,
    explanation: 'LinkedHashMap with accessOrder=true maintains access order (LRU order). Override removeEldestEntry() to limit size. It\'s simpler but less efficient than custom HashMap+DLL for high-performance needs.',
    difficulty: 'medium',
    topic: 'Java Implementation',
  },
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
    description: `LRU Cache (capacity=${CAPACITY}). HashMap + Doubly Linked List.`,
  });

  const moveToHead = (key: number) => {
    const node = nodes.get(key)!;
    if (head === key) return;

    if (node.prev !== null) nodes.get(node.prev)!.next = node.next;
    if (node.next !== null) nodes.get(node.next)!.prev = node.prev;
    if (tail === key) tail = node.prev;

    node.prev = null;
    node.next = head;
    if (head !== null) nodes.get(head)!.prev = key;
    head = key;
    if (tail === null) tail = key;
  };

  const addToHead = (key: number, value: string) => {
    const node: CacheNode = { key, value, prev: null, next: head };
    nodes.set(key, node);
    if (head !== null) nodes.get(head)!.prev = key;
    head = key;
    if (tail === null) tail = key;
  };

  const evictTail = (): number | null => {
    if (tail === null) return null;
    const evictedKey = tail;
    const tailNode = nodes.get(tail)!;
    if (tailNode.prev !== null) nodes.get(tailNode.prev)!.next = null;
    tail = tailNode.prev;
    if (head === evictedKey) head = null;
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
        description: `get(${key}): Looking up key ${key}...`,
      });

      if (nodes.has(key)) {
        const node = nodes.get(key)!;
        moveToHead(key);
        steps.push({
          operation: 'hit',
          nodes: cloneNodes(nodes),
          head,
          tail,
          capacity: CAPACITY,
          currentKey: key,
          description: `HIT! get(${key}) = "${node.value}". Moved to head.`,
          isHit: true,
        });
      } else {
        steps.push({
          operation: 'miss',
          nodes: cloneNodes(nodes),
          head,
          tail,
          capacity: CAPACITY,
          currentKey: key,
          description: `MISS! Key ${key} not found.`,
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
        description: `put(${key}, "${value}")`,
      });

      if (nodes.has(key)) {
        nodes.get(key)!.value = value;
        moveToHead(key);
        steps.push({
          operation: 'moveToHead',
          nodes: cloneNodes(nodes),
          head,
          tail,
          capacity: CAPACITY,
          currentKey: key,
          description: `Updated key ${key}, moved to head.`,
        });
      } else {
        if (nodes.size >= CAPACITY) {
          const evictedKey = evictTail();
          steps.push({
            operation: 'evict',
            nodes: cloneNodes(nodes),
            head,
            tail,
            capacity: CAPACITY,
            currentKey: evictedKey ?? undefined,
            description: `Cache full! Evicted LRU key ${evictedKey}.`,
          });
        }

        addToHead(key, value);
        steps.push({
          operation: 'put',
          nodes: cloneNodes(nodes),
          head,
          tail,
          capacity: CAPACITY,
          currentKey: key,
          description: `Added (${key}, "${value}"). Size: ${nodes.size}/${CAPACITY}`,
        });
      }
    }
  }

  steps.push({
    operation: 'done',
    nodes: cloneNodes(nodes),
    head,
    tail,
    capacity: CAPACITY,
    description: `Done! O(1) get/put with HashMap + DLL.`,
  });

  return steps;
}

const LRUCacheInterviewVisualizerComponent: React.FC<LRUCacheInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'lru-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateLRUSteps, []);

  const playback = useVisualizerPlayback<LRUStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: LRU_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: LRUStep = playback.currentStepData || {
    operation: 'init',
    nodes: new Map(),
    head: null,
    tail: null,
    capacity: CAPACITY,
    description: '',
  };

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

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const visualization = (
    <>
      {/* Info Box */}
      <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
        <div className="text-sm text-orange-800 text-center">
          <span className="font-medium">LRU Cache:</span> HashMap + Doubly Linked List = O(1) operations
        </div>
      </div>

      {/* Doubly Linked List */}
      <div className="mb-4">
        <div className="text-xs font-medium text-gray-600 mb-1">
          Doubly Linked List ({stepData.nodes.size}/{stepData.capacity})
        </div>
        <div className="flex items-center justify-center gap-2 min-h-[80px] p-3 bg-gray-50 rounded-lg">
          {orderedEntries.length === 0 ? (
            <div className="text-gray-400 text-sm">Empty cache</div>
          ) : (
            <>
              <div className="text-[10px] text-green-600 font-medium">HEAD</div>
              <div className="text-gray-400 text-xs">→</div>
              {orderedEntries.map((entry, idx) => (
                <React.Fragment key={entry.key}>
                  <div
                    className={`
                      flex flex-col items-center p-2 rounded-lg border-2 min-w-[50px]
                      transition-all duration-300
                      ${getEntryStyle(entry.key, entry.isHead, entry.isTail)}
                    `}
                  >
                    <div className="text-[10px] text-gray-500">k:{entry.key}</div>
                    <div className="text-sm font-bold text-gray-800">"{entry.value}"</div>
                    {entry.isHead && !entry.isTail && (
                      <div className="text-[8px] text-green-600">MRU</div>
                    )}
                    {entry.isTail && !entry.isHead && (
                      <div className="text-[8px] text-red-600">LRU</div>
                    )}
                  </div>
                  {idx < orderedEntries.length - 1 && (
                    <div className="text-gray-400 text-xs">⇄</div>
                  )}
                </React.Fragment>
              ))}
              <div className="text-gray-400 text-xs">→</div>
              <div className="text-[10px] text-red-600 font-medium">TAIL</div>
            </>
          )}
        </div>
      </div>

      {/* HashMap */}
      <div className="mb-2">
        <div className="text-xs font-medium text-gray-600 mb-1">HashMap</div>
        <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded-lg min-h-[36px]">
          {stepData.nodes.size === 0 ? (
            <div className="text-gray-400 text-xs italic">Empty</div>
          ) : (
            Array.from(stepData.nodes.entries()).map(([key, node]) => (
              <div
                key={key}
                className={`
                  px-2 py-0.5 rounded border text-xs
                  ${stepData.currentKey === key ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300'}
                `}
              >
                {key}→"{node.value}"
              </div>
            ))
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
          mode === 'visualize'
            ? 'bg-white text-orange-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'interview'
            ? 'bg-white text-orange-600 shadow-sm'
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
      accentColor="orange"
    />
  ) : undefined;

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="LRU Cache (Interview Mode)"
      badges={BADGES}
      gradient="orange"
      className={className}
      minHeight={380}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description: stepData.description,
        currentStep: playback.currentStep,
        totalSteps: playback.steps.length,
        variant: stepData.operation === 'miss' ? 'error' :
                 stepData.operation === 'hit' || stepData.operation === 'done' ? 'success' :
                 stepData.operation === 'evict' ? 'warning' : 'default',
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

export const LRUCacheInterviewVisualizer = React.memo(LRUCacheInterviewVisualizerComponent);
export default LRUCacheInterviewVisualizer;
