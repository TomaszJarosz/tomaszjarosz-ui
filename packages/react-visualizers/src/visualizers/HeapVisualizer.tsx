import React, { useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';

interface HeapStep {
  operation: 'init' | 'buildHeap' | 'heapify' | 'compare' | 'swap' | 'extract' | 'heapSort' | 'done';
  array: number[];
  heapSize: number;
  sortedPortion?: number[]; // indices that are sorted (for heapsort)
  highlightIndex?: number;
  compareIndices?: [number, number];
  swapIndices?: [number, number];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  phase?: 'build' | 'sort';
}

interface HeapVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'heap-visualizer';
const INITIAL_ARRAY = [4, 10, 3, 5, 1, 8, 7, 2, 9, 6];

const BADGES = [
  { label: 'Build: O(n)', variant: 'orange' as const },
  { label: 'Sort: O(n log n)', variant: 'amber' as const },
];

const HEAP_CODE = [
  'function buildMaxHeap(arr):',
  '  n = arr.length',
  '  # Start from last non-leaf node',
  '  for i = n/2 - 1 down to 0:',
  '    heapify(arr, n, i)',
  '',
  'function heapify(arr, n, i):',
  '  largest = i',
  '  left = 2*i + 1',
  '  right = 2*i + 2',
  '  if left < n and arr[left] > arr[largest]:',
  '    largest = left',
  '  if right < n and arr[right] > arr[largest]:',
  '    largest = right',
  '  if largest != i:',
  '    swap(arr[i], arr[largest])',
  '    heapify(arr, n, largest)',
  '',
  'function heapSort(arr):',
  '  buildMaxHeap(arr)',
  '  for i = n-1 down to 1:',
  '    swap(arr[0], arr[i])  # Move max to end',
  '    heapify(arr, i, 0)    # Restore heap',
];

const LEGEND_ITEMS = [
  { color: 'bg-orange-500', label: 'Root (max)' },
  { color: 'bg-amber-400', label: 'Comparing' },
  { color: 'bg-green-400', label: 'Swapped' },
  { color: 'bg-blue-200', label: 'Current node', border: '#60a5fa' },
  { color: 'bg-gray-300', label: 'Sorted portion' },
];

function generateHeapSteps(initialArray: number[]): HeapStep[] {
  const steps: HeapStep[] = [];
  const arr = [...initialArray];
  const n = arr.length;

  // Initial state
  steps.push({
    operation: 'init',
    array: [...arr],
    heapSize: n,
    description: `Initial array: [${arr.join(', ')}]. Will build max-heap then sort.`,
    codeLine: -1,
    phase: 'build',
  });

  // Build Max-Heap phase
  steps.push({
    operation: 'buildHeap',
    array: [...arr],
    heapSize: n,
    description: `Build Max-Heap: Start from last non-leaf node (index ${Math.floor(n / 2) - 1})`,
    codeLine: 3,
    variables: { n, 'start': Math.floor(n / 2) - 1 },
    phase: 'build',
  });

  // Heapify from bottom-up
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapifyWithSteps(arr, n, i, steps, 'build');
  }

  steps.push({
    operation: 'buildHeap',
    array: [...arr],
    heapSize: n,
    description: `✓ Max-Heap built! Root (${arr[0]}) is the maximum element.`,
    codeLine: 4,
    phase: 'build',
  });

  // HeapSort phase
  steps.push({
    operation: 'heapSort',
    array: [...arr],
    heapSize: n,
    description: 'HeapSort: Extract max elements one by one',
    codeLine: 18,
    phase: 'sort',
  });

  const sorted: number[] = [];

  for (let i = n - 1; i > 0; i--) {
    // Move current root to end
    steps.push({
      operation: 'extract',
      array: [...arr],
      heapSize: i + 1,
      sortedPortion: [...sorted],
      highlightIndex: 0,
      description: `Extract max: Move ${arr[0]} (root) to position ${i}`,
      codeLine: 21,
      variables: { max: arr[0], position: i },
      phase: 'sort',
    });

    [arr[0], arr[i]] = [arr[i], arr[0]];
    sorted.unshift(i);

    steps.push({
      operation: 'extract',
      array: [...arr],
      heapSize: i,
      sortedPortion: [...sorted],
      swapIndices: [0, i],
      description: `Swapped! ${arr[i]} is now in final sorted position. Heap size reduced to ${i}.`,
      codeLine: 21,
      variables: { 'sorted': arr[i] },
      phase: 'sort',
    });

    // Heapify root
    if (i > 1) {
      heapifyWithSteps(arr, i, 0, steps, 'sort', sorted);
    }
  }

  sorted.unshift(0);

  steps.push({
    operation: 'done',
    array: [...arr],
    heapSize: 0,
    sortedPortion: Array.from({ length: n }, (_, i) => i),
    description: `✓ HeapSort complete! Array sorted: [${arr.join(', ')}]`,
    codeLine: -1,
    phase: 'sort',
  });

  return steps;
}

function heapifyWithSteps(
  arr: number[],
  heapSize: number,
  i: number,
  steps: HeapStep[],
  phase: 'build' | 'sort',
  sortedPortion: number[] = []
): void {
  const left = 2 * i + 1;
  const right = 2 * i + 2;
  let largest = i;

  steps.push({
    operation: 'heapify',
    array: [...arr],
    heapSize,
    sortedPortion: [...sortedPortion],
    highlightIndex: i,
    description: `heapify(${i}): Check node ${arr[i]} against children`,
    codeLine: 6,
    variables: { i, 'arr[i]': arr[i], left, right },
    phase,
  });

  // Compare with left child
  if (left < heapSize) {
    steps.push({
      operation: 'compare',
      array: [...arr],
      heapSize,
      sortedPortion: [...sortedPortion],
      compareIndices: [i, left],
      description: `Compare: ${arr[left]} (left) ${arr[left] > arr[largest] ? '>' : '≤'} ${arr[largest]} (current largest)`,
      codeLine: 10,
      variables: { left, 'arr[left]': arr[left], largest, 'arr[largest]': arr[largest] },
      phase,
    });

    if (arr[left] > arr[largest]) {
      largest = left;
    }
  }

  // Compare with right child
  if (right < heapSize) {
    steps.push({
      operation: 'compare',
      array: [...arr],
      heapSize,
      sortedPortion: [...sortedPortion],
      compareIndices: [largest, right],
      description: `Compare: ${arr[right]} (right) ${arr[right] > arr[largest] ? '>' : '≤'} ${arr[largest]} (current largest)`,
      codeLine: 12,
      variables: { right, 'arr[right]': arr[right], largest, 'arr[largest]': arr[largest] },
      phase,
    });

    if (arr[right] > arr[largest]) {
      largest = right;
    }
  }

  // Swap if needed
  if (largest !== i) {
    steps.push({
      operation: 'swap',
      array: [...arr],
      heapSize,
      sortedPortion: [...sortedPortion],
      swapIndices: [i, largest],
      description: `Swap: ${arr[i]} ↔ ${arr[largest]} (largest child)`,
      codeLine: 15,
      variables: { i, largest, 'arr[i]': arr[i], 'arr[largest]': arr[largest] },
      phase,
    });

    [arr[i], arr[largest]] = [arr[largest], arr[i]];

    steps.push({
      operation: 'swap',
      array: [...arr],
      heapSize,
      sortedPortion: [...sortedPortion],
      highlightIndex: largest,
      description: `Swapped! Continue heapify from index ${largest}`,
      codeLine: 16,
      variables: { 'next': largest },
      phase,
    });

    // Recursively heapify
    heapifyWithSteps(arr, heapSize, largest, steps, phase, sortedPortion);
  } else {
    steps.push({
      operation: 'heapify',
      array: [...arr],
      heapSize,
      sortedPortion: [...sortedPortion],
      highlightIndex: i,
      description: `Node ${arr[i]} satisfies heap property (≥ both children)`,
      codeLine: 14,
      phase,
    });
  }
}

// Calculate tree positions for visualization
function getTreePositions(size: number): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const width = 320;

  for (let i = 0; i < size; i++) {
    const level = Math.floor(Math.log2(i + 1));
    const levelStart = Math.pow(2, level) - 1;
    const posInLevel = i - levelStart;
    const nodesInLevel = Math.pow(2, level);
    const spacing = width / (nodesInLevel + 1);

    positions.push({
      x: spacing * (posInLevel + 1),
      y: level * 55 + 30,
    });
  }

  return positions;
}

const HeapVisualizerComponent: React.FC<HeapVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'heap', scrollToId: VISUALIZER_ID });

  const generateSteps = useMemo(() => () => generateHeapSteps(INITIAL_ARRAY), []);

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
  } = useVisualizerPlayback<HeapStep>({
    generateSteps,
  });

  const stepData: HeapStep = currentStepData || {
    operation: 'init',
    array: INITIAL_ARRAY,
    heapSize: INITIAL_ARRAY.length,
    description: '',
  };

  const { array, heapSize, sortedPortion, highlightIndex, compareIndices, swapIndices, description, phase } = stepData;

  const positions = getTreePositions(array.length);

  const getNodeStyle = (idx: number): string => {
    if (sortedPortion?.includes(idx)) {
      return 'fill-gray-300 stroke-gray-400';
    }
    if (swapIndices?.includes(idx)) {
      return 'fill-green-400 stroke-green-500';
    }
    if (compareIndices?.includes(idx)) {
      return 'fill-amber-400 stroke-amber-500';
    }
    if (idx === highlightIndex) {
      return 'fill-blue-200 stroke-blue-400';
    }
    if (idx === 0 && idx < heapSize) {
      return 'fill-orange-500 stroke-orange-600';
    }
    if (idx < heapSize) {
      return 'fill-white stroke-gray-300';
    }
    return 'fill-gray-200 stroke-gray-300';
  };

  const getTextColor = (idx: number): string => {
    if (sortedPortion?.includes(idx)) return '#374151';
    if (swapIndices?.includes(idx) || idx === 0 && idx < heapSize) return 'white';
    return '#374151';
  };

  const getStatusVariant = () => {
    if (stepData.operation === 'done') return 'success' as const;
    if (stepData.operation === 'swap') return 'warning' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const visualization = (
    <>
      {/* Max-Heap Property */}
      <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
        <div className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-2">
          <span className="text-lg">🔺</span> Max-Heap Property
        </div>
        <div className="font-mono text-sm bg-white rounded-lg p-3 border border-orange-200">
          <div className="text-center text-orange-700 font-bold mb-2">
            heap[parent] ≥ heap[children]
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
            <div className="bg-orange-50 p-2 rounded text-center">
              <span className="font-semibold">parent(i)</span> = ⌊(i-1)/2⌋
            </div>
            <div className="bg-orange-50 p-2 rounded text-center">
              <span className="font-semibold">left(i)</span> = 2i + 1
            </div>
            <div className="bg-orange-50 p-2 rounded text-center">
              <span className="font-semibold">right(i)</span> = 2i + 2
            </div>
          </div>
        </div>
        {/* Phase indicator - always visible */}
        <div className="mt-3 p-2 bg-white rounded-lg border border-orange-200 min-h-[36px] flex items-center justify-center">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            phase === 'build'
              ? 'bg-orange-100 text-orange-700'
              : phase === 'sort'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-500'
          }`}>
            {phase === 'build' ? '🔨 Building Max-Heap' : phase === 'sort' ? '📊 HeapSort in progress' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Heap Tree Visualization */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
          <span>Binary Max-Heap (size: {heapSize})</span>
          {sortedPortion && sortedPortion.length > 0 && (
            <span className="text-xs text-gray-500">
              Sorted: {sortedPortion.length} elements
            </span>
          )}
        </div>
        <div className="bg-gray-50 rounded-lg p-2 overflow-x-auto">
          <svg
            width="320"
            height={Math.max(Math.floor(Math.log2(array.length)) * 55 + 80, 120)}
            className="mx-auto"
          >
            {/* Draw edges */}
            {array.map((_, idx) => {
              if (idx === 0) return null;
              const parentIdx = Math.floor((idx - 1) / 2);
              const parentPos = positions[parentIdx];
              const childPos = positions[idx];
              if (!parentPos || !childPos) return null;

              const isSorted = sortedPortion?.includes(idx) || sortedPortion?.includes(parentIdx);
              const isActive = (compareIndices?.includes(idx) && compareIndices?.includes(parentIdx)) ||
                             (swapIndices?.includes(idx) && swapIndices?.includes(parentIdx));

              return (
                <line
                  key={`edge-${idx}`}
                  x1={parentPos.x}
                  y1={parentPos.y}
                  x2={childPos.x}
                  y2={childPos.y}
                  stroke={isSorted ? '#d1d5db' : isActive ? '#f59e0b' : '#d1d5db'}
                  strokeWidth={isActive ? 3 : 1}
                  strokeDasharray={idx >= heapSize ? '4,2' : undefined}
                />
              );
            })}

            {/* Draw nodes */}
            {array.map((val, idx) => {
              const pos = positions[idx];
              if (!pos) return null;

              return (
                <g key={idx} transform={`translate(${pos.x}, ${pos.y})`}>
                  <circle
                    r="18"
                    className={`${getNodeStyle(idx)} stroke-2 transition-colors`}
                  />
                  <text
                    textAnchor="middle"
                    dy="5"
                    className="text-xs font-bold"
                    fill={getTextColor(idx)}
                  >
                    {val}
                  </text>
                  <text
                    textAnchor="middle"
                    dy="32"
                    className="text-[9px]"
                    fill="#9ca3af"
                  >
                    [{idx}]
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Array representation */}
      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <div className="text-xs text-gray-600 mb-2 font-medium">
          Array representation (heap size: {heapSize})
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {array.map((val, idx) => (
            <div
              key={idx}
              className={`w-8 h-8 flex items-center justify-center rounded text-xs font-mono transition-colors ${
                sortedPortion?.includes(idx)
                  ? 'bg-gray-300 text-gray-600'
                  : swapIndices?.includes(idx)
                    ? 'bg-green-400 text-white'
                    : compareIndices?.includes(idx)
                      ? 'bg-amber-400 text-white'
                      : idx === highlightIndex
                        ? 'bg-blue-200 text-blue-700 ring-2 ring-blue-400'
                        : idx === 0 && idx < heapSize
                          ? 'bg-orange-500 text-white'
                          : idx < heapSize
                            ? 'bg-white border border-gray-300 text-gray-700'
                            : 'bg-gray-200 text-gray-400'
              }`}
            >
              {val}
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-1">
          {array.map((_, idx) => (
            <div key={idx} className="w-8 text-center text-[9px] text-gray-400">
              {idx}
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="Heap (Max-Heap & HeapSort)"
      badges={BADGES}
      gradient="orange"
      className={className}
      minHeight={450}
      onShare={handleShare}
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
        accentColor: 'orange',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? HEAP_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const HeapVisualizer = React.memo(HeapVisualizerComponent);
export default HeapVisualizer;
