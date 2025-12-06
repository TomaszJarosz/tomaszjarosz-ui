import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CodePanel,
  HelpPanel,
  ControlPanel,
  Legend,
  StatusPanel,
  VisualizationArea,
} from '../shared';

interface HeapStep {
  operation: 'offer' | 'poll' | 'siftUp' | 'siftDown' | 'init' | 'done';
  value?: number;
  heap: number[];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  highlightIndex?: number;
  swapIndices?: [number, number];
  compareIndices?: [number, number];
}

interface PriorityQueueVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const OPERATIONS: Array<{ op: 'offer' | 'poll'; value?: number }> = [
  { op: 'offer', value: 50 },
  { op: 'offer', value: 30 },
  { op: 'offer', value: 70 },
  { op: 'offer', value: 20 },
  { op: 'offer', value: 40 },
  { op: 'offer', value: 10 },
  { op: 'poll' },
  { op: 'poll' },
  { op: 'offer', value: 15 },
];

const HEAP_CODE = [
  'offer(value):',
  '  heap.add(value)',
  '  siftUp(size - 1)',
  '',
  'siftUp(index):',
  '  while index > 0:',
  '    parent = (index-1) / 2',
  '    if heap[index] < heap[parent]:',
  '      swap(index, parent)',
  '      index = parent',
  '',
  'poll():',
  '  result = heap[0]',
  '  heap[0] = heap[size-1]',
  '  siftDown(0)',
  '  return result',
];

const LEGEND_ITEMS = [
  { color: 'bg-purple-100', label: 'Root (min)', border: '#c4b5fd' },
  { color: 'bg-purple-500', label: 'Active' },
  { color: 'bg-yellow-300', label: 'Comparing' },
  { color: 'bg-green-400', label: 'Swapped' },
];

function generateHeapSteps(): HeapStep[] {
  const steps: HeapStep[] = [];
  const heap: number[] = [];

  steps.push({
    operation: 'init',
    heap: [],
    description:
      'Initialize min-heap PriorityQueue. Parent is always smaller than children. O(log n) insert/remove.',
    codeLine: -1,
  });

  for (const { op, value } of OPERATIONS) {
    if (op === 'offer' && value !== undefined) {
      heap.push(value);
      let idx = heap.length - 1;

      steps.push({
        operation: 'offer',
        value,
        heap: [...heap],
        description: `offer(${value}): Add to end of heap at index ${idx}`,
        codeLine: 1,
        variables: { value, index: idx },
        highlightIndex: idx,
      });

      // Sift up
      while (idx > 0) {
        const parentIdx = Math.floor((idx - 1) / 2);

        steps.push({
          operation: 'siftUp',
          heap: [...heap],
          description: `siftUp: Compare ${heap[idx]} with parent ${heap[parentIdx]}`,
          codeLine: 7,
          variables: {
            index: idx,
            parent: parentIdx,
            child: heap[idx],
            parentVal: heap[parentIdx],
          },
          compareIndices: [idx, parentIdx],
        });

        if (heap[idx] < heap[parentIdx]) {
          // Swap
          [heap[idx], heap[parentIdx]] = [heap[parentIdx], heap[idx]];

          steps.push({
            operation: 'siftUp',
            heap: [...heap],
            description: `siftUp: ${heap[parentIdx]} < ${heap[idx]}, swap! Move up to index ${parentIdx}`,
            codeLine: 8,
            variables: { swapped: heap[parentIdx], index: parentIdx },
            swapIndices: [idx, parentIdx],
            highlightIndex: parentIdx,
          });

          idx = parentIdx;
        } else {
          steps.push({
            operation: 'siftUp',
            heap: [...heap],
            description: `siftUp: ${heap[idx]} >= ${heap[parentIdx]}, heap property satisfied!`,
            codeLine: 7,
            variables: { index: idx },
            highlightIndex: idx,
          });
          break;
        }
      }
    } else if (op === 'poll') {
      if (heap.length === 0) continue;

      const removed = heap[0];
      const last = heap.pop();
      if (last === undefined) continue;

      if (heap.length === 0) {
        steps.push({
          operation: 'poll',
          value: removed,
          heap: [],
          description: `poll(): Remove min ${removed}, heap is now empty`,
          codeLine: 11,
          variables: { removed },
        });
        continue;
      }

      heap[0] = last;

      steps.push({
        operation: 'poll',
        value: removed,
        heap: [...heap],
        description: `poll(): Remove min ${removed}, move last element ${last} to root`,
        codeLine: 13,
        variables: { removed, moved: last },
        highlightIndex: 0,
      });

      // Sift down
      let idx = 0;
      while (true) {
        const leftIdx = 2 * idx + 1;
        const rightIdx = 2 * idx + 2;
        let smallestIdx = idx;

        if (leftIdx < heap.length && heap[leftIdx] < heap[smallestIdx]) {
          smallestIdx = leftIdx;
        }
        if (rightIdx < heap.length && heap[rightIdx] < heap[smallestIdx]) {
          smallestIdx = rightIdx;
        }

        if (smallestIdx === idx) {
          steps.push({
            operation: 'siftDown',
            heap: [...heap],
            description: `siftDown: ${heap[idx]} is smaller than children, heap property satisfied!`,
            codeLine: 14,
            variables: { index: idx, value: heap[idx] },
            highlightIndex: idx,
          });
          break;
        }

        steps.push({
          operation: 'siftDown',
          heap: [...heap],
          description: `siftDown: ${heap[idx]} > ${heap[smallestIdx]}, swap with smaller child`,
          codeLine: 14,
          variables: {
            parent: heap[idx],
            child: heap[smallestIdx],
            childIdx: smallestIdx,
          },
          compareIndices: [idx, smallestIdx],
        });

        [heap[idx], heap[smallestIdx]] = [heap[smallestIdx], heap[idx]];

        steps.push({
          operation: 'siftDown',
          heap: [...heap],
          description: `siftDown: Swapped! Continue from index ${smallestIdx}`,
          codeLine: 14,
          variables: { index: smallestIdx },
          swapIndices: [idx, smallestIdx],
          highlightIndex: smallestIdx,
        });

        idx = smallestIdx;
      }
    }
  }

  steps.push({
    operation: 'done',
    heap: [...heap],
    description: `✓ Done! Min-heap has ${heap.length} elements. Root (${heap[0]}) is always minimum.`,
    codeLine: -1,
    variables: { size: heap.length, min: heap[0] },
  });

  return steps;
}

// Calculate tree positions for visualization
function getTreePositions(size: number): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  const width = 280;

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

const PriorityQueueVisualizerComponent: React.FC<
  PriorityQueueVisualizerProps
> = ({ showControls = true, showCode = true, className = '' }) => {
  const [speed, setSpeed] = useState(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<HeapStep[]>([]);

  const playingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initialize = useCallback(() => {
    const newSteps = generateHeapSteps();
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
    heap: [],
    description: '',
  };

  const { heap, highlightIndex, swapIndices, compareIndices, description } =
    currentStepData;
  const positions = getTreePositions(heap.length);

  const getNodeStyle = (idx: number): string => {
    if (idx === highlightIndex) {
      return 'fill-purple-500 stroke-purple-600';
    }
    if (swapIndices?.includes(idx)) {
      return 'fill-green-400 stroke-green-500';
    }
    if (compareIndices?.includes(idx)) {
      return 'fill-yellow-300 stroke-yellow-400';
    }
    if (idx === 0) {
      return 'fill-purple-100 stroke-purple-300';
    }
    return 'fill-white stroke-gray-300';
  };

  const getTextColor = (idx: number): string => {
    if (idx === highlightIndex || swapIndices?.includes(idx)) {
      return 'white';
    }
    return '#374151';
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">
              PriorityQueue (Min-Heap)
            </h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                offer: O(log n)
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-pink-100 text-pink-700 rounded">
                poll: O(log n)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visualization Area */}
      <div className="p-4">
        <div className={`flex gap-4 ${showCode ? 'flex-col lg:flex-row' : ''}`}>
          {/* Main Visualization */}
          <VisualizationArea minHeight={400}>
            {/* Heap Tree Visualization */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Binary Heap Structure
              </div>
              <div className="bg-gray-50 rounded-lg p-2 overflow-x-auto">
                {heap.length > 0 ? (
                  <svg
                    width="280"
                    height={Math.floor(Math.log2(heap.length)) * 55 + 80}
                    className="mx-auto"
                  >
                    {/* Draw edges */}
                    {heap.map((_, idx) => {
                      if (idx === 0) return null;
                      const parentIdx = Math.floor((idx - 1) / 2);
                      const parentPos = positions[parentIdx];
                      const childPos = positions[idx];
                      if (!parentPos || !childPos) return null;

                      const isHighlighted =
                        (compareIndices?.includes(idx) &&
                          compareIndices?.includes(parentIdx)) ||
                        (swapIndices?.includes(idx) &&
                          swapIndices?.includes(parentIdx));

                      return (
                        <line
                          key={`edge-${idx}`}
                          x1={parentPos.x}
                          y1={parentPos.y}
                          x2={childPos.x}
                          y2={childPos.y}
                          stroke={isHighlighted ? '#a855f7' : '#d1d5db'}
                          strokeWidth={isHighlighted ? 2 : 1}
                        />
                      );
                    })}
                    {/* Draw nodes */}
                    {heap.map((val, idx) => {
                      const pos = positions[idx];
                      if (!pos) return null;

                      return (
                        <g
                          key={idx}
                          transform={`translate(${pos.x}, ${pos.y})`}
                        >
                          <circle
                            r="18"
                            className={`${getNodeStyle(idx)} stroke-2 transition-all`}
                          />
                          <text
                            textAnchor="middle"
                            dy="5"
                            className="text-xs font-medium"
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
                ) : (
                  <div className="h-20 flex items-center justify-center text-gray-400 text-sm">
                    Empty heap
                  </div>
                )}
              </div>
            </div>

            {/* Array representation */}
            {heap.length > 0 && (
              <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                <div className="text-xs text-gray-600 mb-1 font-medium">
                  Array representation:
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {heap.map((val, idx) => (
                    <div
                      key={idx}
                      className={`w-8 h-8 flex items-center justify-center rounded text-xs font-mono ${
                        idx === highlightIndex
                          ? 'bg-purple-500 text-white'
                          : idx === 0
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-white border border-gray-300 text-gray-700'
                      }`}
                    >
                      {val}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            <StatusPanel
              description={description}
              currentStep={currentStep}
              totalSteps={steps.length}
              variant={currentStepData.operation === 'done' ? 'success' : 'default'}
            />
          </VisualizationArea>

          {/* Code Panel */}
          {showCode && (
            <div className="w-full lg:w-56 flex-shrink-0 space-y-2">
              <CodePanel
                code={HEAP_CODE}
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
            accentColor="purple"
          />
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
};

export const PriorityQueueVisualizer = React.memo(
  PriorityQueueVisualizerComponent
);
export default PriorityQueueVisualizer;
