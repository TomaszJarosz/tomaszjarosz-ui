import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BaseVisualizerLayout,
} from '../shared';

interface QueueItem {
  id: number;
  value: string;
}

interface BlockingStep {
  operation: 'put' | 'take' | 'blocked' | 'unblocked' | 'init' | 'done';
  thread: string;
  value?: string;
  queue: QueueItem[];
  capacity: number;
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  blockedProducers: string[];
  blockedConsumers: string[];
  activeThread?: string;
}

interface BlockingQueueVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const CAPACITY = 3;

const OPERATIONS: Array<{
  thread: string;
  role: 'producer' | 'consumer';
  value?: string;
}> = [
  { thread: 'P1', role: 'producer', value: 'Task-A' },
  { thread: 'P2', role: 'producer', value: 'Task-B' },
  { thread: 'C1', role: 'consumer' },
  { thread: 'P1', role: 'producer', value: 'Task-C' },
  { thread: 'P2', role: 'producer', value: 'Task-D' },
  { thread: 'P1', role: 'producer', value: 'Task-E' },
  { thread: 'P2', role: 'producer', value: 'Task-F' }, // Will block - queue full
  { thread: 'C1', role: 'consumer' },
  { thread: 'C2', role: 'consumer' },
  { thread: 'C1', role: 'consumer' },
  { thread: 'C2', role: 'consumer' }, // Will block - queue empty
  { thread: 'P1', role: 'producer', value: 'Task-G' },
];

const BQ_CODE = [
  'put(item):  // Producer',
  '  lock.lock()',
  '  while queue.isFull():',
  '    notFull.await()  // Block!',
  '  queue.add(item)',
  '  notEmpty.signal()',
  '  lock.unlock()',
  '',
  'take():  // Consumer',
  '  lock.lock()',
  '  while queue.isEmpty():',
  '    notEmpty.await()  // Block!',
  '  item = queue.remove()',
  '  notFull.signal()',
  '  lock.unlock()',
];

const LEGEND_ITEMS = [
  { color: 'bg-green-100', label: 'Producer' },
  { color: 'bg-blue-100', label: 'Consumer' },
  { color: 'bg-red-100', label: 'Blocked', border: '#fca5a5' },
];

const BADGES = [
  { label: 'Producer-Consumer', variant: 'cyan' as const },
  { label: 'Thread-safe', variant: 'blue' as const },
];

let itemIdCounter = 0;

function generateBlockingQueueSteps(): BlockingStep[] {
  const steps: BlockingStep[] = [];
  const queue: QueueItem[] = [];
  const blockedProducers: string[] = [];
  const blockedConsumers: string[] = [];
  itemIdCounter = 0;

  steps.push({
    operation: 'init',
    thread: '',
    queue: [],
    capacity: CAPACITY,
    description: `Initialize BlockingQueue with capacity ${CAPACITY}. Producers block when full, consumers block when empty.`,
    codeLine: -1,
    blockedProducers: [],
    blockedConsumers: [],
  });

  for (const { thread, role, value } of OPERATIONS) {
    if (role === 'producer') {
      if (queue.length >= CAPACITY) {
        // Producer blocks
        blockedProducers.push(thread);

        steps.push({
          operation: 'blocked',
          thread,
          value,
          queue: [...queue],
          capacity: CAPACITY,
          description: `${thread}: put("${value}") - Queue FULL! Producer blocked, waiting for space...`,
          codeLine: 3,
          variables: { thread, size: queue.length, capacity: CAPACITY },
          blockedProducers: [...blockedProducers],
          blockedConsumers: [...blockedConsumers],
          activeThread: thread,
        });
      } else {
        // Normal put
        const item: QueueItem = { id: itemIdCounter++, value: value ?? '' };
        queue.push(item);

        // Unblock a consumer if any waiting
        let unblockedConsumer: string | undefined;
        if (blockedConsumers.length > 0 && queue.length === 1) {
          unblockedConsumer = blockedConsumers.shift();
        }

        steps.push({
          operation: 'put',
          thread,
          value,
          queue: [...queue],
          capacity: CAPACITY,
          description: `${thread}: put("${value}") → Queue: ${queue.length}/${CAPACITY}${unblockedConsumer ? ` | Signaled ${unblockedConsumer}` : ''}`,
          codeLine: 4,
          variables: { thread, item: `"${value}"`, size: queue.length },
          blockedProducers: [...blockedProducers],
          blockedConsumers: [...blockedConsumers],
          activeThread: thread,
        });
      }
    } else {
      // Consumer
      if (queue.length === 0) {
        // Consumer blocks
        blockedConsumers.push(thread);

        steps.push({
          operation: 'blocked',
          thread,
          queue: [...queue],
          capacity: CAPACITY,
          description: `${thread}: take() - Queue EMPTY! Consumer blocked, waiting for items...`,
          codeLine: 11,
          variables: { thread, size: 0 },
          blockedProducers: [...blockedProducers],
          blockedConsumers: [...blockedConsumers],
          activeThread: thread,
        });
      } else {
        // Normal take
        const item = queue.shift();
        const wasFull = queue.length === CAPACITY - 1;

        // Unblock a producer if any waiting and we made space
        let unblockedProducer: string | undefined;
        if (blockedProducers.length > 0 && wasFull) {
          unblockedProducer = blockedProducers.shift();
        }

        steps.push({
          operation: 'take',
          thread,
          value: item?.value,
          queue: [...queue],
          capacity: CAPACITY,
          description: `${thread}: take() → "${item?.value}" | Queue: ${queue.length}/${CAPACITY}${unblockedProducer ? ` | Signaled ${unblockedProducer}` : ''}`,
          codeLine: 12,
          variables: { thread, item: `"${item?.value}"`, size: queue.length },
          blockedProducers: [...blockedProducers],
          blockedConsumers: [...blockedConsumers],
          activeThread: thread,
        });
      }
    }
  }

  steps.push({
    operation: 'done',
    thread: '',
    queue: [...queue],
    capacity: CAPACITY,
    description: `✓ Done! BlockingQueue orchestrates producer-consumer coordination. No busy waiting!`,
    codeLine: -1,
    variables: { finalSize: queue.length },
    blockedProducers: [...blockedProducers],
    blockedConsumers: [...blockedConsumers],
  });

  return steps;
}

const BlockingQueueVisualizerComponent: React.FC<
  BlockingQueueVisualizerProps
> = ({ showControls = true, showCode = true, className = '' }) => {
  const [speed, setSpeed] = useState(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<BlockingStep[]>([]);

  const playingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initialize = useCallback(() => {
    const newSteps = generateBlockingQueueSteps();
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

  const handlePlayPause = useCallback(() => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
    playingRef.current = !isPlaying;
  }, [currentStep, steps.length, isPlaying]);

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
  }, [handleStep, handleStepBack, handlePlayPause, isPlaying]);

  const currentStepData = steps[currentStep] || {
    operation: 'init',
    thread: '',
    queue: [],
    capacity: CAPACITY,
    description: '',
    blockedProducers: [],
    blockedConsumers: [],
  };

  const {
    queue,
    capacity,
    description,
    blockedProducers,
    blockedConsumers,
    activeThread,
  } = currentStepData;

  const getStatusVariant = () => {
    if (currentStepData.operation === 'blocked') return 'error' as const;
    if (currentStepData.operation === 'done') return 'success' as const;
    return 'default' as const;
  };

  const visualization = (
    <>
      {/* Producer-Consumer Pattern - Prominent */}
      <div className="mb-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200">
        <div className="text-sm font-bold text-cyan-800 mb-3 flex items-center gap-2">
          <span className="text-lg">🔄</span> Producer-Consumer Pattern
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-green-100 p-2 rounded-lg border border-green-300 text-center">
            <div className="font-bold text-green-700">Producers</div>
            <div className="text-green-600">put() → queue</div>
            <div className="text-[10px] text-green-500">Block if FULL</div>
          </div>
          <div className="bg-gray-100 p-2 rounded-lg border border-gray-300 text-center">
            <div className="font-bold text-gray-700">BlockingQueue</div>
            <div className="text-gray-600">Thread-safe buffer</div>
            <div className="text-[10px] text-gray-500">Capacity: {capacity}</div>
          </div>
          <div className="bg-blue-100 p-2 rounded-lg border border-blue-300 text-center">
            <div className="font-bold text-blue-700">Consumers</div>
            <div className="text-blue-600">take() ← queue</div>
            <div className="text-[10px] text-blue-500">Block if EMPTY</div>
          </div>
        </div>
      </div>

      {/* Flow arrows - at top for stable layout */}
      <div className="flex justify-center gap-8 text-gray-400 text-lg mb-4">
        <span>→ put()</span>
        <span>take() →</span>
      </div>

      {/* Producer-Consumer Layout */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Producers */}
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-500 mb-2 text-center">
            Producers
          </div>
          <div className="flex flex-col gap-2">
            {['P1', 'P2'].map((p) => (
              <div
                key={p}
                className={`px-3 py-2 rounded-lg text-center text-sm font-medium transition-colors ${
                  activeThread === p
                    ? 'bg-green-500 text-white'
                    : blockedProducers.includes(p)
                      ? 'bg-red-100 text-red-700 border-2 border-red-300'
                      : 'bg-green-100 text-green-700'
                }`}
              >
                {p}
                {blockedProducers.includes(p) && (
                  <span className="block text-[10px]">BLOCKED</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Queue */}
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-500 mb-2 text-center">
            Queue ({queue.length}/{capacity})
          </div>
          <div className="bg-gray-100 rounded-lg p-2 min-h-[100px]">
            {/* Capacity indicator - at top for stable layout */}
            <div className="mb-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-colors ${
                  queue.length === capacity ? 'bg-red-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${(queue.length / capacity) * 100}%` }}
              />
            </div>
            <div className="flex flex-col gap-1">
              {queue.length > 0 ? (
                queue.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`px-2 py-1.5 bg-white rounded border text-xs font-medium text-center transition-colors ${
                      idx === 0
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    {item.value}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 text-xs py-4">
                  Empty
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Consumers */}
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-500 mb-2 text-center">
            Consumers
          </div>
          <div className="flex flex-col gap-2">
            {['C1', 'C2'].map((c) => (
              <div
                key={c}
                className={`px-3 py-2 rounded-lg text-center text-sm font-medium transition-colors ${
                  activeThread === c
                    ? 'bg-blue-500 text-white'
                    : blockedConsumers.includes(c)
                      ? 'bg-red-100 text-red-700 border-2 border-red-300'
                      : 'bg-blue-100 text-blue-700'
                }`}
              >
                {c}
                {blockedConsumers.includes(c) && (
                  <span className="block text-[10px]">BLOCKED</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

    </>
  );

  return (
    <BaseVisualizerLayout
      id="blockingqueue-visualizer"
      title="BlockingQueue"
      badges={BADGES}
      gradient="cyan"
      className={className}
      minHeight={420}
      fixedHeight={true}
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
        accentColor: 'cyan',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? BQ_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const BlockingQueueVisualizer = React.memo(
  BlockingQueueVisualizerComponent
);
export default BlockingQueueVisualizer;
