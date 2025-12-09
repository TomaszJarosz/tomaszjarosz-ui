import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
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

const BADGES = [
  { label: 'Time: O(nW)', variant: 'teal' as const },
  { label: 'Space: O(nW)', variant: 'cyan' as const },
];

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
  const VISUALIZER_ID = 'dp-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'dp', scrollToId: VISUALIZER_ID });
  const [items] = useState<Item[]>(DEFAULT_ITEMS);
  const [capacity] = useState(DEFAULT_CAPACITY);

  const generateSteps = useMemo(
    () => () => generateKnapsackSteps(items, capacity),
    [items, capacity]
  );

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
  } = useVisualizerPlayback<DPStep>({
    generateSteps,
  });

  const stepData = currentStepData || {
    i: -1,
    w: -1,
    table: [] as number[][],
    decision: null as 'skip' | 'take' | null,
    description: '',
    codeLine: -1,
    variables: undefined,
  };
  const { i: currentI, w: currentW, table, decision, description } = stepData;

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

  const getStatusVariant = () => {
    if (decision === 'take') return 'success' as const;
    if (decision === 'skip') return 'warning' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const visualization = (
    <>
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

        {/* Current Calculation - always visible container */}
        <div className="mt-4 p-3 bg-white rounded-lg border-2 border-purple-300 min-h-[76px]">
          {currentI > 0 && currentW > 0 ? (
            <>
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
            </>
          ) : (
            <div className="text-sm text-purple-400 italic text-center py-2">
              Current cell calculation will appear here...
            </div>
          )}
        </div>
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
    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="0/1 Knapsack (Dynamic Programming)"
      badges={BADGES}
      gradient="teal"
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
        accentColor: 'teal',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? KNAPSACK_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const DPVisualizer = React.memo(DPVisualizerComponent);
export default DPVisualizer;
