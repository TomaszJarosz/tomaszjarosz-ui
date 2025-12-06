import React, { useMemo, useCallback } from 'react';
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

interface ArrayListStep {
  operation: 'add' | 'addAt' | 'get' | 'remove' | 'resize' | 'init' | 'done';
  value?: number;
  index?: number;
  array: (number | null)[];
  size: number;
  capacity: number;
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  highlightIndex?: number;
  shiftIndices?: number[];
}

interface ArrayListVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const INITIAL_CAPACITY = 4;

const OPERATIONS: Array<{
  op: 'add' | 'addAt' | 'get' | 'remove';
  value?: number;
  index?: number;
}> = [
  { op: 'add', value: 10 },
  { op: 'add', value: 20 },
  { op: 'add', value: 30 },
  { op: 'add', value: 40 },
  { op: 'add', value: 50 }, // Triggers resize
  { op: 'get', index: 2 },
  { op: 'addAt', value: 25, index: 2 },
  { op: 'remove', index: 1 },
  { op: 'get', index: 0 },
];

const ARRAYLIST_CODE = [
  'add(value):',
  '  if size == capacity:',
  '    resize(capacity * 2)',
  '  array[size] = value',
  '  size++',
  '',
  'add(index, value):',
  '  shift elements right',
  '  array[index] = value',
  '  size++',
  '',
  'get(index):',
  '  return array[index]  // O(1)',
  '',
  'remove(index):',
  '  shift elements left',
  '  size--',
];

const LEGEND_ITEMS = [
  { color: 'bg-white border-gray-300', label: 'Used', border: '#d1d5db' },
  { color: 'bg-gray-100', label: 'Empty' },
  { color: 'bg-orange-500', label: 'Active' },
  { color: 'bg-yellow-200', label: 'Shifted', border: '#fbbf24' },
];

function generateArrayListSteps(): ArrayListStep[] {
  const steps: ArrayListStep[] = [];
  let array: (number | null)[] = new Array(INITIAL_CAPACITY).fill(null);
  let size = 0;
  let capacity = INITIAL_CAPACITY;

  steps.push({
    operation: 'init',
    array: [...array],
    size: 0,
    capacity,
    description: `Initialize ArrayList with capacity ${capacity}. Auto-grows when full (amortized O(1) add).`,
    codeLine: -1,
  });

  for (const { op, value, index } of OPERATIONS) {
    if (op === 'add' && value !== undefined) {
      if (size === capacity) {
        const oldCapacity = capacity;
        capacity *= 2;
        const newArray: (number | null)[] = new Array(capacity).fill(null);
        for (let i = 0; i < size; i++) {
          newArray[i] = array[i];
        }
        array = newArray;

        steps.push({
          operation: 'resize',
          array: [...array],
          size,
          capacity,
          description: `Resize! Array full (${oldCapacity}/${oldCapacity}). Create new array with capacity ${capacity}, copy elements → O(n)`,
          codeLine: 2,
          variables: { oldCapacity, newCapacity: capacity, copied: size },
        });
      }

      array[size] = value;
      size++;

      steps.push({
        operation: 'add',
        value,
        array: [...array],
        size,
        capacity,
        description: `add(${value}): Place at index ${size - 1} → O(1) amortized`,
        codeLine: 3,
        variables: { value, index: size - 1, size },
        highlightIndex: size - 1,
      });
    } else if (op === 'addAt' && value !== undefined && index !== undefined) {
      const shiftIndices: number[] = [];
      for (let i = size; i > index; i--) {
        array[i] = array[i - 1];
        shiftIndices.push(i);
      }

      steps.push({
        operation: 'addAt',
        value,
        index,
        array: [...array],
        size,
        capacity,
        description: `add(${index}, ${value}): Shift ${size - index} elements right to make room → O(n)`,
        codeLine: 7,
        variables: { index, shifted: size - index },
        shiftIndices,
      });

      array[index] = value;
      size++;

      steps.push({
        operation: 'addAt',
        value,
        index,
        array: [...array],
        size,
        capacity,
        description: `add(${index}, ${value}): Insert value at index ${index}`,
        codeLine: 8,
        variables: { value, index, size },
        highlightIndex: index,
      });
    } else if (op === 'get' && index !== undefined) {
      steps.push({
        operation: 'get',
        index,
        value: array[index] ?? undefined,
        array: [...array],
        size,
        capacity,
        description: `get(${index}): Direct access → ${array[index]} in O(1)`,
        codeLine: 11,
        variables: { index, value: array[index] ?? 'null' },
        highlightIndex: index,
      });
    } else if (op === 'remove' && index !== undefined) {
      const removed = array[index];
      const shiftIndices: number[] = [];
      for (let i = index; i < size - 1; i++) {
        array[i] = array[i + 1];
        shiftIndices.push(i);
      }
      array[size - 1] = null;
      size--;

      steps.push({
        operation: 'remove',
        index,
        value: removed ?? undefined,
        array: [...array],
        size,
        capacity,
        description: `remove(${index}): Removed ${removed}, shifted ${shiftIndices.length} elements left → O(n)`,
        codeLine: 14,
        variables: {
          index,
          removed: removed ?? 'null',
          shifted: shiftIndices.length,
        },
        shiftIndices,
      });
    }
  }

  steps.push({
    operation: 'done',
    array: [...array],
    size,
    capacity,
    description: `✓ Done! ArrayList: size=${size}, capacity=${capacity}. O(1) get, O(1) amortized add, O(n) insert/remove.`,
    codeLine: -1,
    variables: { size, capacity },
  });

  return steps;
}

const ArrayListVisualizerComponent: React.FC<ArrayListVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'arraylist-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'arraylist', scrollToId: VISUALIZER_ID });

  const generateSteps = useMemo(() => generateArrayListSteps, []);

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
  } = useVisualizerPlayback<ArrayListStep>({
    generateSteps,
  });

  const stepData = currentStepData || {
    operation: 'init' as const,
    array: [],
    size: 0,
    capacity: INITIAL_CAPACITY,
    description: '',
  };

  const { array, size, capacity, highlightIndex, shiftIndices, description } =
    stepData;

  const getCellStyle = (idx: number): string => {
    if (idx === highlightIndex) {
      return 'bg-orange-500 border-orange-600 text-white';
    }
    if (shiftIndices?.includes(idx)) {
      return 'bg-yellow-200 border-yellow-400 text-yellow-800';
    }
    if (idx < size) {
      return 'bg-white border-gray-300 text-gray-700';
    }
    return 'bg-gray-100 border-gray-200 text-gray-300';
  };

  const getStatusVariant = () => {
    if (stepData.operation === 'resize') return 'error' as const;
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
            <h3 className="font-semibold text-gray-900">
              ArrayList Operations
            </h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                Get: O(1)
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                Add: O(1)*
              </span>
            </div>
          </div>
          <ShareButton onShare={handleShare} />
        </div>
      </div>

      {/* Visualization Area */}
      <div className="p-4">
        <div className={`flex gap-4 ${showCode ? 'flex-col lg:flex-row' : ''}`}>
          {/* Main Visualization */}
          <VisualizationArea minHeight={350} className={showCode ? 'flex-1' : 'w-full'}>
            {/* Array Visualization */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Internal Array (capacity: {capacity})
              </div>
              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                  {array.map((val, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 flex items-center justify-center rounded border-2 font-medium transition-all ${getCellStyle(idx)}`}
                      >
                        {val !== null ? val : ''}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        [{idx}]
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Size/Capacity Info */}
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <div className="flex gap-6 text-xs">
                <div>
                  <span className="font-medium text-gray-700">size:</span>{' '}
                  <span className="text-orange-600 font-mono">{size}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">capacity:</span>{' '}
                  <span className="text-amber-600 font-mono">{capacity}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">load:</span>{' '}
                  <span className="font-mono">
                    {Math.round((size / capacity) * 100)}%
                  </span>
                </div>
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all"
                  style={{ width: `${(size / capacity) * 100}%` }}
                />
              </div>
            </div>

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
            <div className="w-full lg:w-56 flex-shrink-0 space-y-2">
              <CodePanel
                code={ARRAYLIST_CODE}
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

export const ArrayListVisualizer = React.memo(ArrayListVisualizerComponent);
export default ArrayListVisualizer;
