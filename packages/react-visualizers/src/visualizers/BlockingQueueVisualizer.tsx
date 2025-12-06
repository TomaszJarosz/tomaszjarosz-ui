import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CodePanel,
  HelpPanel,
  ControlPanel,
  Legend,
  StatusPanel,
  VisualizationArea,
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

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">BlockingQueue</h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-cyan-100 text-cyan-700 rounded">
                Producer-Consumer
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                Thread-safe
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visualization Area */}
      <div className="p-4">
        <div className={`flex gap-4 ${showCode ? 'flex-col lg:flex-row' : ''}`}>
          {/* Main Visualization */}
          <VisualizationArea minHeight={350}>
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
                      className={`px-3 py-2 rounded-lg text-center text-sm font-medium transition-all ${
                        activeThread === p
                          ? 'bg-green-500 text-white scale-105'
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
                  <div className="flex flex-col gap-1">
                    {queue.length > 0 ? (
                      queue.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`px-2 py-1.5 bg-white rounded border text-xs font-medium text-center transition-all ${
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
                  {/* Capacity indicator */}
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        queue.length === capacity ? 'bg-red-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${(queue.length / capacity) * 100}%` }}
                    />
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
                      className={`px-3 py-2 rounded-lg text-center text-sm font-medium transition-all ${
                        activeThread === c
                          ? 'bg-blue-500 text-white scale-105'
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

            {/* Flow arrows */}
            <div className="flex justify-center gap-8 text-gray-400 text-lg mb-4">
              <span>→ put()</span>
              <span>take() →</span>
            </div>

            {/* Status */}
            <StatusPanel
              description={description}
              currentStep={currentStep}
              totalSteps={steps.length}
              variant={
                currentStepData.operation === 'blocked'
                  ? 'error'
                  : currentStepData.operation === 'done'
                    ? 'success'
                    : 'default'
              }
            />
          </VisualizationArea>

          {/* Code Panel */}
          {showCode && (
            <div className="w-full lg:w-56 flex-shrink-0 space-y-2">
              <CodePanel
                code={BQ_CODE}
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
            accentColor="cyan"
          />
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
};

export const BlockingQueueVisualizer = React.memo(
  BlockingQueueVisualizerComponent
);
export default BlockingQueueVisualizer;
