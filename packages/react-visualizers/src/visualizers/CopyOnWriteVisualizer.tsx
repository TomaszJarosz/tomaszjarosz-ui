import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BaseVisualizerLayout,
} from '../shared';

interface COWStep {
  operation: 'read' | 'write' | 'copy' | 'init' | 'done';
  thread: string;
  value?: string;
  oldArray: string[];
  newArray: string[];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  highlightIndex?: number;
  showCopy?: boolean;
  activeReaders?: string[];
}

interface CopyOnWriteVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const OPERATIONS: Array<{
  thread: string;
  op: 'read' | 'write';
  value?: string;
}> = [
  { thread: 'R1', op: 'read' },
  { thread: 'R2', op: 'read' },
  { thread: 'W1', op: 'write', value: 'D' },
  { thread: 'R1', op: 'read' },
  { thread: 'R3', op: 'read' },
  { thread: 'W1', op: 'write', value: 'E' },
  { thread: 'R2', op: 'read' },
];

const COW_CODE = [
  '// CopyOnWriteArrayList',
  '',
  'get(index):  // Lock-free!',
  '  return array[index]',
  '',
  'add(element):',
  '  lock.lock()',
  '  newArray = Arrays.copyOf(array)',
  '  newArray[len] = element',
  '  array = newArray  // Atomic swap',
  '  lock.unlock()',
];

const LEGEND_ITEMS = [
  { color: 'bg-blue-500', label: 'Reader' },
  { color: 'bg-orange-500', label: 'Writer' },
  { color: 'bg-green-500', label: 'New element' },
];

const BADGES = [
  { label: 'Read: O(1)', variant: 'green' as const },
  { label: 'Write: O(n)', variant: 'green' as const },
];

function generateCOWSteps(): COWStep[] {
  const steps: COWStep[] = [];
  let array = ['A', 'B', 'C'];
  const activeReaders: string[] = [];

  steps.push({
    operation: 'init',
    thread: '',
    oldArray: [...array],
    newArray: [...array],
    description:
      'CopyOnWriteArrayList: Reads are lock-free, writes create a full copy. Ideal for read-heavy scenarios.',
    codeLine: -1,
    activeReaders: [],
  });

  for (const { thread, op, value } of OPERATIONS) {
    if (op === 'read') {
      if (!activeReaders.includes(thread)) {
        activeReaders.push(thread);
      }

      steps.push({
        operation: 'read',
        thread,
        oldArray: [...array],
        newArray: [...array],
        description: `${thread}: get() → Reading "${array[0]}, ${array[1]}, ..." - NO LOCK needed! Readers never block.`,
        codeLine: 3,
        variables: { thread, 'array.length': array.length },
        activeReaders: [...activeReaders],
      });
    } else {
      // Write operation - show the copy process
      const oldArray = [...array];

      // Step 1: Acquire lock
      steps.push({
        operation: 'write',
        thread,
        value,
        oldArray: [...oldArray],
        newArray: [...oldArray],
        description: `${thread}: add("${value}") - Acquiring exclusive write lock...`,
        codeLine: 6,
        variables: { thread, element: `"${value}"` },
        activeReaders: [...activeReaders],
      });

      // Step 2: Create copy
      const newArray = [...oldArray, value ?? ''];

      steps.push({
        operation: 'copy',
        thread,
        value,
        oldArray: [...oldArray],
        newArray: [...newArray],
        description: `${thread}: Creating NEW array copy (${oldArray.length} → ${newArray.length} elements). Old array still serves readers!`,
        codeLine: 7,
        variables: { oldLen: oldArray.length, newLen: newArray.length },
        showCopy: true,
        activeReaders: [...activeReaders],
      });

      // Step 3: Atomic swap
      array = newArray;

      steps.push({
        operation: 'write',
        thread,
        value,
        oldArray: [...oldArray],
        newArray: [...array],
        description: `${thread}: Atomic reference swap! New readers see updated array. Old readers finish safely.`,
        codeLine: 9,
        variables: { thread, 'new length': array.length },
        highlightIndex: array.length - 1,
        activeReaders: [...activeReaders],
      });
    }
  }

  steps.push({
    operation: 'done',
    thread: '',
    oldArray: [...array],
    newArray: [...array],
    description: `✓ Done! Copy-on-write: O(1) reads, O(n) writes. Best for read-heavy, rarely-modified collections.`,
    codeLine: -1,
    variables: { finalSize: array.length },
    activeReaders: [],
  });

  return steps;
}

const CopyOnWriteVisualizerComponent: React.FC<CopyOnWriteVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const [speed, setSpeed] = useState(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<COWStep[]>([]);

  const playingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initialize = useCallback(() => {
    const newSteps = generateCOWSteps();
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
    oldArray: [],
    newArray: [],
    description: '',
    activeReaders: [],
  };

  const {
    oldArray,
    newArray,
    description,
    showCopy,
    highlightIndex,
    activeReaders,
  } = currentStepData;

  const renderArray = (
    arr: string[],
    label: string,
    isNew: boolean = false
  ) => (
    <div className="flex-1">
      <div className="text-xs font-medium text-gray-500 mb-2 text-center">
        {label}
      </div>
      <div className="flex justify-center gap-1">
        {arr.map((item, idx) => (
          <div
            key={idx}
            className={`w-10 h-10 flex items-center justify-center rounded border-2 font-medium transition-colors ${
              isNew && idx === highlightIndex
                ? 'bg-green-500 border-green-600 text-white'
                : isNew
                  ? 'bg-green-100 border-green-300 text-green-700'
                  : 'bg-gray-100 border-gray-300 text-gray-700'
            }`}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );

  const getStatusVariant = () => {
    if (currentStepData.operation === 'copy') return 'warning' as const;
    if (currentStepData.operation === 'done') return 'success' as const;
    return 'default' as const;
  };

  const headerExtra = (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Readers:</span>
      {['R1', 'R2', 'R3'].map((r) => (
        <div
          key={r}
          className={`px-2 py-0.5 text-xs font-medium rounded transition-opacity ${
            activeReaders?.includes(r)
              ? 'bg-blue-500 text-white opacity-100'
              : 'bg-blue-100 text-blue-700 opacity-40'
          }`}
        >
          {r}
        </div>
      ))}
      <span className="text-xs text-gray-500 ml-2">Writer:</span>
      <div
        className={`px-2 py-0.5 text-xs font-medium rounded ${
          currentStepData.thread === 'W1'
            ? 'bg-orange-500 text-white'
            : 'bg-orange-100 text-orange-700 opacity-40'
        }`}
      >
        W1
      </div>
    </div>
  );

  const visualization = (
    <>
      {/* Copy-on-Write Pattern - Prominent */}
      <div className="mb-4 p-4 bg-gradient-to-r from-lime-50 to-green-50 rounded-xl border-2 border-lime-200">
        <div className="text-sm font-bold text-lime-800 mb-3 flex items-center gap-2">
          <span className="text-lg">📋</span> Copy-on-Write Pattern
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-blue-100 p-2 rounded-lg border border-blue-300 text-center">
            <div className="font-bold text-blue-700">Read (get)</div>
            <div className="text-2xl text-blue-600">O(1)</div>
            <div className="text-[10px] text-blue-500">No lock, no copy</div>
          </div>
          <div className="bg-orange-100 p-2 rounded-lg border border-orange-300 text-center">
            <div className="font-bold text-orange-700">Write (add/set)</div>
            <div className="text-2xl text-orange-600">O(n)</div>
            <div className="text-[10px] text-orange-500">Full array copy</div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-gray-600 text-center">
          Best for: Read-heavy, rarely-modified collections • Iterators never throw ConcurrentModificationException
        </div>
      </div>

      {/* Arrays Visualization */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        {showCopy ? (
          <div className="flex items-center gap-4">
            {renderArray(oldArray, 'Old Array (readers use this)')}
            <div className="text-2xl text-gray-400">→</div>
            {renderArray(newArray, 'New Array (being created)', true)}
          </div>
        ) : (
          <div className="flex justify-center">
            {renderArray(
              newArray,
              'Current Array',
              highlightIndex !== undefined
            )}
          </div>
        )}
      </div>

      {/* Key Insight */}
      <div className="mb-4 p-3 bg-lime-50 rounded-lg border border-lime-200">
        <div className="text-xs text-lime-800">
          <span className="font-medium">Key insight:</span> During writes,
          old array continues serving readers. No reader ever sees partial
          state!
        </div>
      </div>
    </>
  );

  return (
    <BaseVisualizerLayout
      id="copyonwrite-visualizer"
      title="CopyOnWriteArrayList"
      badges={BADGES}
      gradient="green"
      className={className}
      minHeight={350}
      headerExtra={headerExtra}
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
        accentColor: 'green',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? COW_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const CopyOnWriteVisualizer = React.memo(CopyOnWriteVisualizerComponent);
export default CopyOnWriteVisualizer;
