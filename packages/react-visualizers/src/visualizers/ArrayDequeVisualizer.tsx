import React, { useMemo, useState, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';

interface ArrayDequeStep {
  operation:
    | 'init'
    | 'addFirst'
    | 'addLast'
    | 'removeFirst'
    | 'removeLast'
    | 'resize'
    | 'done';
  value?: number;
  array: (number | null)[];
  head: number;
  tail: number;
  capacity: number;
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  highlightIndex?: number;
  highlightType?: 'add' | 'remove' | 'head' | 'tail';
  resizing?: boolean;
}

interface ArrayDequeVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const INITIAL_CAPACITY = 8;

const OPERATIONS: Array<{
  op: 'addFirst' | 'addLast' | 'removeFirst' | 'removeLast';
  value?: number;
}> = [
  { op: 'addLast', value: 10 },
  { op: 'addLast', value: 20 },
  { op: 'addFirst', value: 5 },
  { op: 'addLast', value: 30 },
  { op: 'addFirst', value: 1 },
  { op: 'removeFirst' },
  { op: 'removeLast' },
  { op: 'addLast', value: 40 },
  { op: 'addLast', value: 50 },
  { op: 'addFirst', value: 0 },
  { op: 'addLast', value: 60 }, // May trigger resize
];

const ARRAYDEQUE_CODE = [
  'class ArrayDeque<E> {',
  '  E[] elements;',
  '  int head = 0, tail = 0;',
  '',
  '  void addFirst(E e) {',
  '    head = (head - 1) & (capacity - 1);',
  '    elements[head] = e;',
  '    if (head == tail) grow();',
  '  }',
  '',
  '  void addLast(E e) {',
  '    elements[tail] = e;',
  '    tail = (tail + 1) & (capacity - 1);',
  '    if (head == tail) grow();',
  '  }',
  '',
  '  E removeFirst() {',
  '    E e = elements[head];',
  '    elements[head] = null;',
  '    head = (head + 1) & (capacity - 1);',
  '    return e;',
  '  }',
  '',
  '  E removeLast() {',
  '    tail = (tail - 1) & (capacity - 1);',
  '    E e = elements[tail];',
  '    elements[tail] = null;',
  '    return e;',
  '  }',
  '}',
];

const LEGEND_ITEMS = [
  { color: 'bg-teal-500', label: 'Head pointer' },
  { color: 'bg-violet-500', label: 'Tail pointer' },
  { color: 'bg-green-400', label: 'Added element' },
  { color: 'bg-red-400', label: 'Removed element' },
  { color: 'bg-yellow-200', label: 'Resize' },
];

const BADGES = [
  { label: 'O(1) all ops', variant: 'teal' as const },
  { label: 'Circular buffer', variant: 'purple' as const },
];

function generateArrayDequeSteps(): ArrayDequeStep[] {
  const steps: ArrayDequeStep[] = [];
  let array: (number | null)[] = new Array(INITIAL_CAPACITY).fill(null);
  let head = 0;
  let tail = 0;
  let capacity = INITIAL_CAPACITY;

  const getSize = () => (tail - head + capacity) % capacity;

  // Initial state
  steps.push({
    operation: 'init',
    array: [...array],
    head,
    tail,
    capacity,
    description: `Initialize ArrayDeque with capacity ${capacity}. Circular buffer: head and tail wrap around.`,
    codeLine: 0,
    variables: { head, tail, capacity, size: 0 },
  });

  for (const { op, value } of OPERATIONS) {
    if (op === 'addFirst' && value !== undefined) {
      // Check if resize needed
      if (getSize() === capacity - 1) {
        const oldCapacity = capacity;
        const newCapacity = capacity * 2;
        const newArray: (number | null)[] = new Array(newCapacity).fill(null);

        // Copy elements in order
        let idx = 0;
        let i = head;
        while (i !== tail) {
          newArray[idx++] = array[i];
          i = (i + 1) % capacity;
        }

        array = newArray;
        head = 0;
        tail = idx;
        capacity = newCapacity;

        steps.push({
          operation: 'resize',
          array: [...array],
          head,
          tail,
          capacity,
          description: `Resize: ${oldCapacity} → ${newCapacity}. Elements copied in order, head reset to 0.`,
          codeLine: 7,
          variables: { oldCapacity, newCapacity, size: getSize() },
          resizing: true,
        });
      }

      // Decrement head (wrap around)
      head = (head - 1 + capacity) % capacity;
      array[head] = value;

      steps.push({
        operation: 'addFirst',
        value,
        array: [...array],
        head,
        tail,
        capacity,
        description: `addFirst(${value}): head = (${(head + 1) % capacity} - 1) % ${capacity} = ${head}`,
        codeLine: 5,
        variables: { value, head, tail, size: getSize() },
        highlightIndex: head,
        highlightType: 'add',
      });
    } else if (op === 'addLast' && value !== undefined) {
      // Check if resize needed
      if (getSize() === capacity - 1) {
        const oldCapacity = capacity;
        const newCapacity = capacity * 2;
        const newArray: (number | null)[] = new Array(newCapacity).fill(null);

        // Copy elements in order
        let idx = 0;
        let i = head;
        while (i !== tail) {
          newArray[idx++] = array[i];
          i = (i + 1) % capacity;
        }

        array = newArray;
        head = 0;
        tail = idx;
        capacity = newCapacity;

        steps.push({
          operation: 'resize',
          array: [...array],
          head,
          tail,
          capacity,
          description: `Resize: ${oldCapacity} → ${newCapacity}. Elements copied in order, head reset to 0.`,
          codeLine: 13,
          variables: { oldCapacity, newCapacity, size: getSize() },
          resizing: true,
        });
      }

      array[tail] = value;
      const oldTail = tail;
      tail = (tail + 1) % capacity;

      steps.push({
        operation: 'addLast',
        value,
        array: [...array],
        head,
        tail,
        capacity,
        description: `addLast(${value}): elements[${oldTail}] = ${value}, tail = (${oldTail} + 1) % ${capacity} = ${tail}`,
        codeLine: 11,
        variables: { value, head, tail, size: getSize() },
        highlightIndex: oldTail,
        highlightType: 'add',
      });
    } else if (op === 'removeFirst') {
      if (head === tail) {
        steps.push({
          operation: 'removeFirst',
          array: [...array],
          head,
          tail,
          capacity,
          description: `removeFirst(): Deque is empty!`,
          codeLine: 16,
          variables: { head, tail, size: 0 },
        });
        continue;
      }

      const removed = array[head];
      array[head] = null;
      const oldHead = head;
      head = (head + 1) % capacity;

      steps.push({
        operation: 'removeFirst',
        value: removed ?? undefined,
        array: [...array],
        head,
        tail,
        capacity,
        description: `removeFirst(): removed ${removed} from index ${oldHead}, head = ${head}`,
        codeLine: 17,
        variables: { removed: removed ?? 'null', head, tail, size: getSize() },
        highlightIndex: oldHead,
        highlightType: 'remove',
      });
    } else if (op === 'removeLast') {
      if (head === tail) {
        steps.push({
          operation: 'removeLast',
          array: [...array],
          head,
          tail,
          capacity,
          description: `removeLast(): Deque is empty!`,
          codeLine: 23,
          variables: { head, tail, size: 0 },
        });
        continue;
      }

      tail = (tail - 1 + capacity) % capacity;
      const removed = array[tail];
      array[tail] = null;

      steps.push({
        operation: 'removeLast',
        value: removed ?? undefined,
        array: [...array],
        head,
        tail,
        capacity,
        description: `removeLast(): tail = ${tail}, removed ${removed}`,
        codeLine: 24,
        variables: { removed: removed ?? 'null', head, tail, size: getSize() },
        highlightIndex: tail,
        highlightType: 'remove',
      });
    }
  }

  // Final state
  steps.push({
    operation: 'done',
    array: [...array],
    head,
    tail,
    capacity,
    description: `✓ Done! Size: ${getSize()}, Capacity: ${capacity}. O(1) for all operations!`,
    codeLine: -1,
    variables: { size: getSize(), capacity, head, tail },
  });

  return steps;
}

const ArrayDequeVisualizerComponent: React.FC<ArrayDequeVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'arraydeque-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'arraydeque', scrollToId: VISUALIZER_ID });

  const [showCircular, setShowCircular] = useState(true);
  const generateSteps = useMemo(() => generateArrayDequeSteps, []);

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
  } = useVisualizerPlayback<ArrayDequeStep>({
    generateSteps,
  });

  const stepData = currentStepData || {
    operation: 'init' as const,
    array: [],
    head: 0,
    tail: 0,
    capacity: INITIAL_CAPACITY,
    description: '',
  };

  const { array, head, tail, capacity, highlightIndex, highlightType, description, resizing } =
    stepData;

  const toggleCircular = useCallback(() => {
    setShowCircular((prev) => !prev);
  }, []);

  const getCellStyle = (index: number): string => {
    const isHead = index === head;
    const isTail = index === tail;
    const isHighlighted = index === highlightIndex;
    const hasValue = array[index] !== null;

    let baseStyle = 'border-2 transition-colors duration-200 ';

    if (resizing) {
      baseStyle += 'bg-yellow-100 border-yellow-400 ';
    } else if (isHighlighted) {
      if (highlightType === 'add') {
        baseStyle += 'bg-green-400 border-green-500 text-white ';
      } else if (highlightType === 'remove') {
        baseStyle += 'bg-red-400 border-red-500 text-white ';
      }
    } else if (hasValue) {
      baseStyle += 'bg-blue-100 border-blue-300 ';
    } else {
      baseStyle += 'bg-gray-100 border-gray-200 ';
    }

    // Add head/tail indicator
    if (isHead && isTail && head !== tail) {
      baseStyle += 'ring-2 ring-purple-500 ';
    } else if (isHead) {
      baseStyle += 'ring-2 ring-teal-500 ';
    } else if (isTail) {
      baseStyle += 'ring-2 ring-violet-500 ';
    }

    return baseStyle;
  };

  // Calculate logical order for display
  const getLogicalElements = (): (number | null)[] => {
    const result: (number | null)[] = [];
    let i = head;
    while (i !== tail) {
      result.push(array[i]);
      i = (i + 1) % capacity;
    }
    return result;
  };

  const getStatusVariant = () => {
    if (stepData.operation === 'resize') return 'warning' as const;
    if (stepData.operation === 'done') return 'success' as const;
    if (highlightType === 'remove') return 'error' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const headerExtra = (
    <button
      onClick={toggleCircular}
      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
        showCircular
          ? 'bg-teal-500 text-white'
          : 'bg-gray-200 text-gray-700'
      }`}
    >
      {showCircular ? 'Circular View' : 'Linear View'}
    </button>
  );

  const visualization = (
    <>
      {/* Array visualization */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Internal Array (capacity: {capacity})
        </div>

        {showCircular ? (
          /* Circular view */
          <div className="flex justify-center mb-4">
            <div className="relative w-64 h-64">
              {array.map((val, idx) => {
                const angle = (idx / capacity) * 2 * Math.PI - Math.PI / 2;
                const radius = 100;
                const x = 128 + radius * Math.cos(angle);
                const y = 128 + radius * Math.sin(angle);

                return (
                  <div
                    key={idx}
                    className={`absolute w-10 h-10 -ml-5 -mt-5 rounded flex flex-col items-center justify-center text-xs font-medium ${getCellStyle(idx)}`}
                    style={{ left: x, top: y }}
                  >
                    <span className="text-[8px] text-gray-400">{idx}</span>
                    <span>{val ?? '∅'}</span>
                  </div>
                );
              })}
              {/* Center info */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-xs">
                <div className="text-teal-600">H: {head}</div>
                <div className="text-violet-600">T: {tail}</div>
              </div>
            </div>
          </div>
        ) : (
          /* Linear view */
          <div className="flex flex-wrap gap-1 mb-4">
            {array.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded flex flex-col items-center justify-center text-xs font-medium ${getCellStyle(idx)}`}
                >
                  <span className="text-[8px] text-gray-400">{idx}</span>
                  <span>{val ?? '∅'}</span>
                </div>
                <div className="text-[9px] text-gray-500 mt-0.5">
                  {idx === head && idx === tail
                    ? 'H/T'
                    : idx === head
                      ? 'H'
                      : idx === tail
                        ? 'T'
                        : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logical order */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg min-h-[60px]">
        <div className="text-xs text-gray-600 mb-2">
          <span className="font-medium">Logical Order (front → back):</span>
        </div>
        <div className="flex flex-wrap items-center gap-1 min-h-[24px]">
          {getLogicalElements().length > 0 ? (
            <>
              <span className="text-[10px] text-teal-600">FRONT →</span>
              {getLogicalElements().map((val, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-gray-400">→</span>}
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                    {val}
                  </span>
                </React.Fragment>
              ))}
              <span className="text-[10px] text-violet-600">→ BACK</span>
            </>
          ) : (
            <span className="text-xs text-gray-400 italic">Empty deque</span>
          )}
        </div>
      </div>

      {/* Pointer arithmetic explanation */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-xs text-blue-700">
          <strong>Circular indexing:</strong>
          <div className="mt-1 font-mono text-[11px] space-y-1">
            <div>next = (index + 1) & (capacity - 1)</div>
            <div>prev = (index - 1) & (capacity - 1)</div>
          </div>
          <div className="mt-1 text-[10px] text-blue-600">
            Bitwise AND for power-of-2 capacity (faster than modulo)
          </div>
        </div>
      </div>
    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="ArrayDeque"
      badges={BADGES}
      gradient="teal"
      onShare={handleShare}
      className={className}
      minHeight={450}
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
        accentColor: 'teal',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? ARRAYDEQUE_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const ArrayDequeVisualizer = React.memo(ArrayDequeVisualizerComponent);
export default ArrayDequeVisualizer;
