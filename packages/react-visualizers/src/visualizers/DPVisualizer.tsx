import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CodePanel,
  HelpPanel,
  ControlPanel,
  Legend,
  StatusPanel,
  VisualizationArea,
} from '../shared';

interface Item {
  weight: number;
  value: number;
}

interface DPStep {
  i: number; // current item index
  w: number; // current capacity
  table: number[][];
  decision: 'skip' | 'take' | null;
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
}

interface DPVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const DEFAULT_ITEMS: Item[] = [
  { weight: 2, value: 3 },
  { weight: 3, value: 4 },
  { weight: 4, value: 5 },
  { weight: 5, value: 6 },
];

const DEFAULT_CAPACITY = 8;

// Algorithm code snippets
const KNAPSACK_CODE = [
  'for i = 1 to n:',
  '  for w = 1 to capacity:',
  '    if item[i].weight > w:',
  '      dp[i][w] = dp[i-1][w]',
  '    else:',
  '      skip = dp[i-1][w]',
  '      take = dp[i-1][w-weight] + value',
  '      dp[i][w] = max(skip, take)',
];

const LEGEND_ITEMS = [
  { color: 'bg-gray-50', label: 'Not computed', border: '#d1d5db' },
  { color: 'bg-blue-100', label: 'Computed' },
  { color: 'bg-green-400', label: 'Take item' },
  { color: 'bg-yellow-300', label: 'Skip item' },
];

function generateKnapsackSteps(items: Item[], capacity: number): DPStep[] {
  const steps: DPStep[] = [];
  const n = items.length;
  const dp: number[][] = Array(n + 1)
    .fill(null)
    .map(() => Array(capacity + 1).fill(0));

  steps.push({
    i: -1,
    w: -1,
    table: dp.map((row) => [...row]),
    decision: null,
    description: `Initialize DP table: ${n + 1} rows (items) × ${capacity + 1} cols (capacity). Base case: dp[0][*] = 0`,
    codeLine: -1,
  });

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];

    for (let w = 1; w <= capacity; w++) {
      if (item.weight > w) {
        // Can't take this item
        dp[i][w] = dp[i - 1][w];
        steps.push({
          i,
          w,
          table: dp.map((row) => [...row]),
          decision: 'skip',
          description: `Item ${i} (w=${item.weight}, v=${item.value}): weight ${item.weight} > capacity ${w}, must skip → dp[${i}][${w}] = dp[${i - 1}][${w}] = ${dp[i][w]}`,
          codeLine: 3,
          variables: {
            i,
            w,
            'item.weight': item.weight,
            'dp[i-1][w]': dp[i - 1][w],
          },
        });
      } else {
        // Choose max of skip or take
        const skipValue = dp[i - 1][w];
        const takeValue = dp[i - 1][w - item.weight] + item.value;

        if (takeValue > skipValue) {
          dp[i][w] = takeValue;
          steps.push({
            i,
            w,
            table: dp.map((row) => [...row]),
            decision: 'take',
            description: `Item ${i}: take (${takeValue} = dp[${i - 1}][${w - item.weight}] + ${item.value}) > skip (${skipValue}) → Take it! dp[${i}][${w}] = ${takeValue}`,
            codeLine: 7,
            variables: {
              i,
              w,
              skip: skipValue,
              take: takeValue,
              max: takeValue,
            },
          });
        } else {
          dp[i][w] = skipValue;
          steps.push({
            i,
            w,
            table: dp.map((row) => [...row]),
            decision: 'skip',
            description: `Item ${i}: skip (${skipValue}) ≥ take (${takeValue} = dp[${i - 1}][${w - item.weight}] + ${item.value}) → Skip it! dp[${i}][${w}] = ${skipValue}`,
            codeLine: 7,
            variables: {
              i,
              w,
              skip: skipValue,
              take: takeValue,
              max: skipValue,
            },
          });
        }
      }
    }
  }

  steps.push({
    i: n,
    w: capacity,
    table: dp.map((row) => [...row]),
    decision: null,
    description: `✓ Done! Maximum value = ${dp[n][capacity]} (optimal solution in dp[${n}][${capacity}])`,
    codeLine: -1,
    variables: { 'max value': dp[n][capacity] },
  });

  return steps;
}

const DPVisualizerComponent: React.FC<DPVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const [items] = useState<Item[]>(DEFAULT_ITEMS);
  const [capacity] = useState(DEFAULT_CAPACITY);
  const [speed, setSpeed] = useState(25); // Slower default
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<DPStep[]>([]);

  const playingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initializeDP = useCallback(() => {
    const newSteps = generateKnapsackSteps(items, capacity);
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
    playingRef.current = false;
  }, [items, capacity]);

  useEffect(() => {
    initializeDP();
  }, [initializeDP]);

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      playingRef.current = true;
      // Slower: min 100ms, max 2000ms
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

  const handlePlayPause = () => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
    playingRef.current = !isPlaying;
  };

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

  // Keyboard shortcuts (P = play/pause, [ = back, ] = forward, R = reset)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlePlayPause excluded to prevent infinite loop
  }, [handleStep, handleStepBack, isPlaying]);

  const handleReset = () => {
    setIsPlaying(false);
    playingRef.current = false;
    setCurrentStep(0);
  };

  const currentStepData = steps[currentStep] || {
    i: -1,
    w: -1,
    table: [],
    decision: null,
  };
  const { i: currentI, w: currentW, table, decision } = currentStepData;

  const getCellStyle = (i: number, w: number): string => {
    if (i === currentI && w === currentW) {
      if (decision === 'take') return 'bg-green-400 text-green-900 font-bold';
      if (decision === 'skip') return 'bg-yellow-300 text-yellow-900 font-bold';
      return 'bg-purple-400 text-purple-900 font-bold';
    }
    if (i < currentI || (i === currentI && w < currentW)) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-50 text-gray-400';
  };

  const currentDescription = steps[currentStep]?.description || '';

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">
              0/1 Knapsack (Dynamic Programming)
            </h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-700 rounded">
                Time: O(nW)
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-cyan-100 text-cyan-700 rounded">
                Space: O(nW)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visualization Area */}
      <div className="p-4">
        <div className={`flex gap-4 ${showCode ? 'flex-col lg:flex-row' : ''}`}>
          {/* Main Visualization */}
          <VisualizationArea minHeight={450} className="flex-1 min-w-0">
            {/* DP Recurrence Formula - Prominent */}
            <div className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200">
              <div className="text-sm font-semibold text-teal-800 mb-3">
                DP Recurrence Formula
              </div>
              <div className="font-mono text-sm bg-white rounded-lg p-3 border border-teal-200">
                <div className="text-gray-600 mb-2">
                  dp[i][w] = max(
                  <span className="text-yellow-600 font-bold"> skip</span>,
                  <span className="text-green-600 font-bold"> take</span>
                  )
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs mt-3">
                  <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                    <span className="text-yellow-700 font-bold">skip</span>
                    <span className="text-gray-600"> = dp[i-1][w]</span>
                    <div className="text-gray-500 mt-1">Don&apos;t take item i</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded border border-green-200">
                    <span className="text-green-700 font-bold">take</span>
                    <span className="text-gray-600"> = dp[i-1][w-weight] + value</span>
                    <div className="text-gray-500 mt-1">Take item i</div>
                  </div>
                </div>
              </div>

              {/* Current Calculation */}
              {currentI > 0 && currentW > 0 && (
                <div className="mt-4 p-3 bg-white rounded-lg border-2 border-purple-300">
                  <div className="text-sm font-semibold text-purple-800 mb-2">
                    Current: dp[{currentI}][{currentW}]
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-gray-600">
                      Item {currentI}: <span className="font-mono">w={items[currentI-1]?.weight}, v={items[currentI-1]?.value}</span>
                    </div>
                    {decision && (
                      <div className={`px-3 py-1 rounded-full font-bold ${
                        decision === 'take'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {decision === 'take' ? '✓ TAKE' : '✗ SKIP'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-6">
              {/* Items List */}
              <div className="w-40">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Items (i = item index):
                </div>
                <div className="space-y-1">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`px-2 py-1.5 rounded text-xs transition-colors ${
                        idx + 1 === currentI
                          ? 'bg-purple-200 text-purple-900 font-bold ring-2 ring-purple-400'
                          : idx + 1 < currentI
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <span className="font-mono">i={idx + 1}</span>: w={item.weight}, v={item.value}
                      {idx + 1 === currentI && <span className="ml-1">← CURRENT</span>}
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-sm p-2 bg-gray-100 rounded">
                  <span className="font-medium text-gray-700">Max Capacity:</span>{' '}
                  <span className="text-gray-900 font-mono">{capacity}</span>
                </div>
              </div>

              {/* DP Table */}
              <div className="flex-1 overflow-x-auto">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  DP Table (w = current capacity):
                </div>
                <table className="text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="w-8 p-1 text-gray-500 font-normal">i\w</th>
                      {Array.from({ length: capacity + 1 }, (_, w) => (
                        <th
                          key={w}
                          className={`w-8 p-1 ${w === currentW ? 'text-purple-700 font-bold' : 'text-gray-500 font-normal'}`}
                        >
                          {w}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((row, i) => (
                      <tr key={i}>
                        <td
                          className={`p-1 text-center ${i === currentI ? 'text-purple-700 font-bold' : 'text-gray-500'}`}
                        >
                          {i}
                        </td>
                        {row.map((cell, w) => (
                          <td
                            key={w}
                            className={`p-1 text-center rounded ${getCellStyle(i, w)}`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status */}
            <div className="mt-4">
              <StatusPanel
                description={currentDescription}
                currentStep={currentStep}
                totalSteps={steps.length}
                variant={
                  decision === 'take'
                    ? 'success'
                    : decision === 'skip'
                      ? 'warning'
                      : 'default'
                }
              />
            </div>
          </VisualizationArea>

          {/* Code Panel */}
          {showCode && (
            <div className="w-full lg:w-56 flex-shrink-0 space-y-2">
              <CodePanel
                code={KNAPSACK_CODE}
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
            accentColor="teal"
          />
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
};

export const DPVisualizer = React.memo(DPVisualizerComponent);
export default DPVisualizer;
