import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface Item {
  weight: number;
  value: number;
}

interface DPStep {
  i: number;
  w: number;
  table: number[][];
  decision: 'skip' | 'take' | null;
  description: string;
}

interface DPInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const BADGES = [
  { label: 'O(n×W)', variant: 'cyan' as const },
];

const LEGEND_ITEMS = [
  { color: 'bg-gray-50', label: 'Not computed', border: '#d1d5db' },
  { color: 'bg-blue-100', label: 'Computed' },
  { color: 'bg-green-400', label: 'Take item' },
  { color: 'bg-amber-300', label: 'Skip item' },
];

// Interview questions about Dynamic Programming
const DP_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'dp-1',
    question: 'What are the two key properties required for a problem to be solvable using dynamic programming?',
    options: [
      'Linearity and recursion',
      'Optimal substructure and overlapping subproblems',
      'Divide and conquer structure',
      'Greedy choice property',
    ],
    correctAnswer: 1,
    explanation: 'DP requires: (1) Optimal substructure - optimal solution contains optimal solutions to subproblems, (2) Overlapping subproblems - same subproblems are solved multiple times, making memoization valuable.',
    difficulty: 'medium',
    topic: 'Core Concepts',
  },
  {
    id: 'dp-2',
    question: 'What is the time complexity of the 0/1 Knapsack problem using dynamic programming?',
    options: ['O(n)', 'O(n × W)', 'O(n²)', 'O(2ⁿ)'],
    correctAnswer: 1,
    explanation: 'The DP solution builds a table of n items × W capacity. Each cell is computed in O(1), giving O(n × W) total. This is pseudopolynomial - polynomial in the numeric value of W, not its size in bits.',
    hint: 'Think about the dimensions of the DP table.',
    difficulty: 'medium',
    topic: 'Time Complexity',
  },
  {
    id: 'dp-3',
    question: 'What is the difference between top-down and bottom-up dynamic programming?',
    options: [
      'Top-down is faster than bottom-up',
      'Top-down uses recursion with memoization, bottom-up uses iteration',
      'Bottom-up cannot handle all DP problems',
      'Top-down requires more space',
    ],
    correctAnswer: 1,
    explanation: 'Top-down (memoization): recursive approach that stores results of solved subproblems. Bottom-up (tabulation): iteratively fills a table from smaller subproblems to larger ones. Both have same time complexity.',
    difficulty: 'easy',
    topic: 'Approaches',
  },
  {
    id: 'dp-4',
    question: 'In the 0/1 Knapsack DP recurrence, what does dp[i][w] represent?',
    options: [
      'The weight of item i',
      'Maximum value using first i items with capacity w',
      'Number of items selected',
      'The total weight used',
    ],
    correctAnswer: 1,
    explanation: 'dp[i][w] = maximum value achievable using items 1 to i with knapsack capacity w. The recurrence is: dp[i][w] = max(dp[i-1][w], dp[i-1][w-weight[i]] + value[i]) if weight[i] <= w.',
    difficulty: 'easy',
    topic: 'DP State',
  },
  {
    id: 'dp-5',
    question: 'How can you reduce the space complexity of 0/1 Knapsack from O(n×W) to O(W)?',
    options: [
      'Use a hash map instead of array',
      'Use only one row, iterating backwards through capacity',
      'Store only non-zero values',
      'It cannot be reduced',
    ],
    correctAnswer: 1,
    explanation: 'Since dp[i][w] only depends on dp[i-1][...], we only need the previous row. By iterating capacity backwards (W to 0), we can use a single 1D array without overwriting needed values.',
    hint: 'Why iterate backwards? Think about which values each cell depends on.',
    difficulty: 'hard',
    topic: 'Space Optimization',
  },
  {
    id: 'dp-6',
    question: 'What distinguishes 0/1 Knapsack from Unbounded Knapsack?',
    options: [
      'Unbounded Knapsack has negative weights',
      'In 0/1, each item can be used at most once; in Unbounded, unlimited times',
      '0/1 Knapsack is NP-hard, Unbounded is not',
      'They have different time complexities',
    ],
    correctAnswer: 1,
    explanation: '0/1 Knapsack: each item can be taken 0 or 1 times. Unbounded Knapsack: items can be taken any number of times. The DP recurrence changes: unbounded uses dp[i][w-weight[i]] instead of dp[i-1][w-weight[i]].',
    difficulty: 'medium',
    topic: 'Problem Variants',
  },
  {
    id: 'dp-7',
    question: 'What is the time complexity of the Longest Common Subsequence (LCS) problem?',
    options: ['O(m + n)', 'O(m × n)', 'O(2^(m+n))', 'O(m × n × min(m,n))'],
    correctAnswer: 1,
    explanation: 'LCS builds a 2D table of size m × n (lengths of two strings). Each cell is computed in O(1), giving O(m × n) total. Space can be optimized to O(min(m,n)).',
    difficulty: 'medium',
    topic: 'Classic Problems',
  },
  {
    id: 'dp-8',
    question: 'Which of these is NOT typically solved with dynamic programming?',
    options: [
      'Fibonacci sequence',
      'Minimum path sum in a grid',
      'Binary search',
      'Edit distance between strings',
    ],
    correctAnswer: 2,
    explanation: 'Binary search is a divide-and-conquer algorithm - subproblems don\'t overlap. Fibonacci, grid paths, and edit distance all have overlapping subproblems and optimal substructure, making DP ideal.',
    difficulty: 'easy',
    topic: 'Problem Identification',
  },
  {
    id: 'dp-9',
    question: 'In DP, what is "state" and why is it important?',
    options: [
      'The current value being computed',
      'Variables that uniquely define a subproblem',
      'The final answer',
      'The base case',
    ],
    correctAnswer: 1,
    explanation: 'State = minimal set of variables that uniquely identify a subproblem. For Knapsack: (item index, remaining capacity). Choosing the right state is crucial - too few = incorrect, too many = inefficient.',
    hint: 'What information do you need to solve "the rest" of the problem?',
    difficulty: 'medium',
    topic: 'DP Design',
  },
  {
    id: 'dp-10',
    question: 'What makes the 0/1 Knapsack problem NP-complete despite having a polynomial-time DP solution?',
    options: [
      'The recursion is exponential',
      'W is measured in value, not bit size (pseudopolynomial)',
      'Not all instances can be solved',
      'The DP solution is not polynomial',
    ],
    correctAnswer: 1,
    explanation: 'O(nW) is pseudopolynomial - polynomial in W\'s value, not its size. If W = 2^k (k bits), the algorithm is O(n × 2^k), exponential in input size. True polynomial would be O(n × k).',
    difficulty: 'hard',
    topic: 'Complexity Theory',
  },
];

const DEFAULT_ITEMS: Item[] = [
  { weight: 2, value: 3 },
  { weight: 3, value: 4 },
  { weight: 4, value: 5 },
  { weight: 5, value: 6 },
];

const DEFAULT_CAPACITY = 8;

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
    description: `Initialize DP table: ${n + 1} rows × ${capacity + 1} cols`,
  });

  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];

    for (let w = 1; w <= capacity; w++) {
      if (item.weight > w) {
        dp[i][w] = dp[i - 1][w];
        steps.push({
          i,
          w,
          table: dp.map((row) => [...row]),
          decision: 'skip',
          description: `Item ${i} (w=${item.weight}) > capacity ${w}, skip → ${dp[i][w]}`,
        });
      } else {
        const skipValue = dp[i - 1][w];
        const takeValue = dp[i - 1][w - item.weight] + item.value;

        if (takeValue > skipValue) {
          dp[i][w] = takeValue;
          steps.push({
            i,
            w,
            table: dp.map((row) => [...row]),
            decision: 'take',
            description: `Take item ${i}: ${takeValue} > skip ${skipValue} → ${takeValue}`,
          });
        } else {
          dp[i][w] = skipValue;
          steps.push({
            i,
            w,
            table: dp.map((row) => [...row]),
            decision: 'skip',
            description: `Skip item ${i}: ${skipValue} ≥ take ${takeValue} → ${skipValue}`,
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
    description: `✓ Done! Maximum value = ${dp[n][capacity]}`,
  });

  return steps;
}

const DPInterviewVisualizerComponent: React.FC<DPInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'dp-interview-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'dp-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');
  const [items] = useState<Item[]>(DEFAULT_ITEMS);
  const [capacity] = useState(DEFAULT_CAPACITY);

  const generateSteps = useMemo(
    () => () => generateKnapsackSteps(items, capacity),
    [items, capacity]
  );

  const playback = useVisualizerPlayback<DPStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: DP_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: DPStep = playback.currentStepData || {
    i: -1,
    w: -1,
    table: Array(items.length + 1).fill(null).map(() => Array(capacity + 1).fill(0)),
    decision: null,
    description: '',
  };

  const { i: currentI, w: currentW, table, decision, description } = stepData;

  const getCellStyle = (i: number, w: number): string => {
    if (i === currentI && w === currentW) {
      if (decision === 'take') return 'bg-green-400 text-green-900 font-bold';
      if (decision === 'skip') return 'bg-amber-300 text-amber-900 font-bold';
      return 'bg-purple-400 text-purple-900 font-bold';
    }
    if (i < currentI || (i === currentI && w < currentW)) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-50 text-gray-400';
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const getStatusVariant = () => {
    if (decision === 'take') return 'success';
    if (decision === 'skip') return 'warning';
    return 'default';
  };

  const visualization = (
    <>
            {/* DP Recurrence */}
            <div className="mb-4 p-3 bg-teal-50 rounded-lg border border-teal-200">
              <div className="text-sm font-medium text-teal-800 mb-2">DP Recurrence</div>
              <div className="font-mono text-xs text-gray-700">
                dp[i][w] = max(<span className="text-yellow-600">skip</span>, <span className="text-green-600">take</span>)
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-amber-50 p-1.5 rounded">
                  <span className="text-amber-700 font-bold">skip</span> = dp[i-1][w]
                </div>
                <div className="bg-green-50 p-1.5 rounded">
                  <span className="text-green-700 font-bold">take</span> = dp[i-1][w-wt] + val
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Items:</div>
              <div className="flex flex-wrap gap-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`px-2 py-1 rounded text-xs ${
                      idx + 1 === currentI
                        ? 'bg-purple-200 text-purple-900 font-bold ring-2 ring-purple-400'
                        : idx + 1 < currentI
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    i={idx + 1}: w={item.weight}, v={item.value}
                  </div>
                ))}
                <div className="px-2 py-1 bg-gray-200 rounded text-xs font-medium">
                  Capacity: {capacity}
                </div>
              </div>
            </div>

            {/* DP Table */}
            <div className="mb-4 overflow-x-auto">
              <table className="text-xs border-collapse mx-auto">
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
                      <td className={`p-1 text-center ${i === currentI ? 'text-purple-700 font-bold' : 'text-gray-500'}`}>
                        {i}
                      </td>
                      {row.map((cell, w) => (
                        <td key={w} className={`p-1 text-center rounded ${getCellStyle(i, w)}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Current Decision */}
            {currentI > 0 && currentW > 0 && decision && (
              <div className="mb-4 text-center">
                <span className={`px-3 py-1 rounded-full font-bold text-sm ${
                  decision === 'take'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {decision === 'take' ? '✓ TAKE' : '✗ SKIP'}
                </span>
              </div>
            )}
    </>
  );

  const modeToggle = (
    <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
      <button
        onClick={() => setMode('visualize')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'visualize'
            ? 'bg-white text-cyan-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'interview'
            ? 'bg-white text-cyan-600 shadow-sm'
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
      accentColor="cyan"
    />
  ) : undefined;

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="0/1 Knapsack (DP)"
      badges={BADGES}
      gradient="cyan"
      className={className}
      minHeight={400}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description,
        currentStep: playback.currentStep,
        totalSteps: playback.steps.length,
        variant: getStatusVariant(),
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
        accentColor: 'cyan',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      sidePanel={sidePanel}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const DPInterviewVisualizer = React.memo(DPInterviewVisualizerComponent);
export default DPInterviewVisualizer;
