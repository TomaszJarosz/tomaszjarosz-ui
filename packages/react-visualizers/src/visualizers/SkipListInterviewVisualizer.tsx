import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface SkipListNode {
  value: number;
  levels: number;
}

interface SkipListStep {
  operation: 'init' | 'search' | 'insert' | 'done';
  nodes: SkipListNode[];
  currentLevel?: number;
  description: string;
}

interface SkipListInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const BADGES = [
  { label: 'O(log n) avg', variant: 'indigo' as const },
];

const INITIAL_NODES: SkipListNode[] = [
  { value: -Infinity, levels: 4 },
  { value: 3, levels: 3 },
  { value: 6, levels: 2 },
  { value: 7, levels: 1 },
  { value: 9, levels: 2 },
  { value: 12, levels: 1 },
];

const LEGEND_ITEMS = [
  { color: 'bg-blue-100', label: 'Node', border: '#60a5fa' },
  { color: 'bg-amber-400', label: 'Current' },
  { color: 'bg-green-400', label: 'Found' },
];

// Interview questions about Skip List
const SKIPLIST_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'sl-1',
    question: 'What is the expected time complexity of search in a Skip List?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 1,
    explanation: 'Skip Lists have expected O(log n) search time. By using multiple levels of linked lists, we can skip over many elements, similar to binary search.',
    difficulty: 'easy',
    topic: 'Complexity',
  },
  {
    id: 'sl-2',
    question: 'How is the level of a new node determined in a Skip List?',
    options: [
      'Based on the value being inserted',
      'Randomly using coin flips',
      'Based on the current number of elements',
      'Always the maximum level',
    ],
    correctAnswer: 1,
    explanation: 'Node levels are determined probabilistically - typically by flipping coins until tails. Each flip gives 50% chance of going to the next level. This creates a balanced structure on average.',
    hint: 'Think about what makes Skip Lists "probabilistic".',
    difficulty: 'medium',
    topic: 'Structure',
  },
  {
    id: 'sl-3',
    question: 'What is the expected space complexity of a Skip List?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 2,
    explanation: 'Expected space is O(n). On average, half the nodes have level 1, quarter have level 2, etc. The sum 1 + 1/2 + 1/4 + ... = 2, so total pointers ≈ 2n = O(n).',
    difficulty: 'medium',
    topic: 'Space',
  },
  {
    id: 'sl-4',
    question: 'How does Skip List compare to a balanced BST (like Red-Black Tree)?',
    options: [
      'Skip List is always faster',
      'BST is always faster',
      'Skip List is simpler to implement and has similar performance',
      'They have completely different use cases',
    ],
    correctAnswer: 2,
    explanation: 'Skip Lists achieve O(log n) expected time like balanced BSTs, but are much simpler to implement - no rotations needed. Trade-off: BSTs have guaranteed worst-case, Skip Lists are probabilistic.',
    difficulty: 'medium',
    topic: 'Comparison',
  },
  {
    id: 'sl-5',
    question: 'What is the probability that a node reaches level k in a Skip List with p=0.5?',
    options: ['1/k', '1/2^k', 'k/n', '1/2'],
    correctAnswer: 1,
    explanation: 'With probability p=0.5 for each level-up, reaching level k requires k consecutive successes: (1/2)^k = 1/2^k. For level 4: only 1/16 of nodes.',
    difficulty: 'hard',
    topic: 'Probability',
  },
  {
    id: 'sl-6',
    question: 'What is the worst-case time complexity of Skip List operations?',
    options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'],
    correctAnswer: 1,
    explanation: 'Worst case is O(n) - if all nodes randomly get level 1, it degrades to a linked list. However, this is extremely unlikely with proper randomization.',
    difficulty: 'medium',
    topic: 'Complexity',
  },
  {
    id: 'sl-7',
    question: 'Which data structure do higher levels of a Skip List resemble?',
    options: [
      'Binary Search Tree',
      'Express lanes in a linked list',
      'Hash Table',
      'Stack',
    ],
    correctAnswer: 1,
    explanation: 'Higher levels act as "express lanes" - they skip over many elements, allowing faster traversal. Level 0 visits all nodes, level 1 skips ~half, level 2 skips ~3/4, etc.',
    difficulty: 'easy',
    topic: 'Intuition',
  },
  {
    id: 'sl-8',
    question: 'What makes Skip Lists good for concurrent access?',
    options: [
      'They use locks internally',
      'Operations only modify local portions of the structure',
      'They are read-only',
      'They use atomic operations on single values',
    ],
    correctAnswer: 1,
    explanation: 'Skip List modifications are localized - inserting/deleting only changes pointers near the affected node. This makes lock-free implementations easier than for BSTs where rotations affect distant nodes.',
    difficulty: 'hard',
    topic: 'Concurrency',
  },
  {
    id: 'sl-9',
    question: 'What is the typical maximum level for a Skip List with n elements?',
    options: ['n', 'log₂(n)', 'sqrt(n)', '2'],
    correctAnswer: 1,
    explanation: 'Maximum level is typically capped at log₂(n). With probability 1/2^k for level k, we expect very few nodes at levels above log(n), so higher levels waste space.',
    difficulty: 'medium',
    topic: 'Implementation',
  },
  {
    id: 'sl-10',
    question: 'In which real-world systems are Skip Lists commonly used?',
    options: [
      'Only in academic research',
      'Redis sorted sets and LevelDB',
      'Operating system kernels only',
      'Web browsers for DOM manipulation',
    ],
    correctAnswer: 1,
    explanation: 'Skip Lists are used in Redis (sorted sets), LevelDB/RocksDB (memtable), and other databases. Their simplicity, good cache behavior, and easy concurrent implementation make them practical.',
    difficulty: 'medium',
    topic: 'Applications',
  },
];

function generateSkipListSteps(): SkipListStep[] {
  const steps: SkipListStep[] = [];

  steps.push({
    operation: 'init',
    nodes: [...INITIAL_NODES],
    description: 'Skip List with 6 nodes. Higher levels skip more nodes for faster search.',
  });

  steps.push({
    operation: 'search',
    nodes: [...INITIAL_NODES],
    currentLevel: 3,
    description: 'Search starts at highest level, drops down when blocked.',
  });

  steps.push({
    operation: 'done',
    nodes: [...INITIAL_NODES],
    description: 'Skip List provides O(log n) expected time for search, insert, delete.',
  });

  return steps;
}

const SkipListInterviewVisualizerComponent: React.FC<SkipListInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'skiplist-interview-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'sl-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateSkipListSteps, []);
  const playback = useVisualizerPlayback<SkipListStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: SKIPLIST_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: SkipListStep = playback.currentStepData || {
    operation: 'init',
    nodes: INITIAL_NODES,
    description: '',
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const MAX_LEVEL = 4;
  const NODE_WIDTH = 50;
  const LEVEL_HEIGHT = 35;

  const getStatusVariant = () => {
    if (stepData.operation === 'done') return 'success';
    return 'default';
  };

  const visualization = (
    <>
            {/* Info */}
            <div className="mb-3 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="text-xs text-indigo-800 text-center">
                <span className="font-medium">Skip List:</span> Probabilistic sorted list with express lanes
              </div>
            </div>

            {/* Skip List Visualization */}
            <div className="overflow-x-auto pb-2">
              <svg width={stepData.nodes.length * (NODE_WIDTH + 30) + 50} height={MAX_LEVEL * LEVEL_HEIGHT + 40} className="mx-auto">
                {/* Level labels */}
                {Array.from({ length: MAX_LEVEL }, (_, level) => (
                  <text
                    key={`level-${level}`}
                    x={10}
                    y={15 + (MAX_LEVEL - 1 - level) * LEVEL_HEIGHT + 15}
                    className="text-[10px] fill-gray-500"
                  >
                    L{level}
                  </text>
                ))}

                {/* Nodes */}
                {stepData.nodes.map((node, idx) => (
                  <g key={idx}>
                    {Array.from({ length: node.levels }, (_, level) => {
                      const x = 40 + idx * (NODE_WIDTH + 30);
                      const y = 10 + (MAX_LEVEL - 1 - level) * LEVEL_HEIGHT;

                      return (
                        <g key={`${idx}-${level}`}>
                          <rect
                            x={x}
                            y={y}
                            width={NODE_WIDTH}
                            height={25}
                            rx={4}
                            className="fill-blue-100 stroke-blue-400"
                            strokeWidth={1}
                          />
                          <text
                            x={x + NODE_WIDTH / 2}
                            y={y + 16}
                            textAnchor="middle"
                            className="text-xs font-medium fill-gray-800"
                          >
                            {node.value === -Infinity ? 'H' : node.value}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                ))}

                {/* Arrows between nodes */}
                {stepData.nodes.slice(0, -1).map((node, idx) => {
                  const nextNode = stepData.nodes[idx + 1];
                  const maxLevel = Math.min(node.levels, nextNode.levels);

                  return Array.from({ length: maxLevel }, (_, level) => {
                    const x1 = 40 + idx * (NODE_WIDTH + 30) + NODE_WIDTH;
                    const x2 = 40 + (idx + 1) * (NODE_WIDTH + 30);
                    const y = 10 + (MAX_LEVEL - 1 - level) * LEVEL_HEIGHT + 12;

                    return (
                      <line
                        key={`arrow-${idx}-${level}`}
                        x1={x1}
                        y1={y}
                        x2={x2}
                        y2={y}
                        stroke="#94a3b8"
                        strokeWidth={1}
                        markerEnd="url(#arrow)"
                      />
                    );
                  });
                })}

                <defs>
                  <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                  </marker>
                </defs>
              </svg>
            </div>
    </>
  );

  const modeToggle = (
    <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
      <button
        onClick={() => setMode('visualize')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'visualize' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'interview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
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
      accentColor="indigo"
    />
  ) : undefined;

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="Skip List"
      badges={BADGES}
      gradient="indigo"
      className={className}
      minHeight={260}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description: stepData.description,
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
        accentColor: 'indigo',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      sidePanel={sidePanel}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const SkipListInterviewVisualizer = React.memo(SkipListInterviewVisualizerComponent);
export default SkipListInterviewVisualizer;
