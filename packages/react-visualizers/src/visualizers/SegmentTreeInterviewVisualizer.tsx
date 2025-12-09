import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface TreeNode {
  value: number;
  left: number;
  right: number;
  leftChild: number | null;
  rightChild: number | null;
}

interface SegmentTreeStep {
  operation: 'init' | 'build' | 'query' | 'queryNode' | 'update' | 'updateNode' | 'done';
  tree: TreeNode[];
  array: number[];
  highlightNodes?: number[];
  queryRange?: [number, number];
  queryResult?: number;
  updateIndex?: number;
  updateValue?: number;
  description: string;
}

interface SegmentTreeInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'segment-tree-interview-visualizer';

const BADGES = [
  { label: 'Interview Mode', variant: 'green' as const },
  { label: 'Range Queries', variant: 'teal' as const },
];

const INITIAL_ARRAY = [1, 3, 5, 7, 9, 11];

const OPERATIONS: Array<{ op: 'query' | 'update'; args: [number, number] }> = [
  { op: 'query', args: [1, 4] },
  { op: 'query', args: [0, 2] },
  { op: 'update', args: [2, 6] },
  { op: 'query', args: [1, 4] },
];

const LEGEND_ITEMS = [
  { color: 'bg-gray-100', label: 'Tree node', border: '#d1d5db' },
  { color: 'bg-blue-200', label: 'Visited', border: '#60a5fa' },
  { color: 'bg-green-400', label: 'In query range' },
  { color: 'bg-purple-400', label: 'Updated' },
];

// Interview questions about Segment Tree
const SEGMENT_TREE_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'segtree-1',
    question: 'What is the time complexity of a range query in a Segment Tree?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 1,
    explanation: 'Range queries are O(log n) because the tree has O(log n) height, and at each level we visit at most 2 nodes. The query recursively splits the range and combines results from at most O(log n) nodes.',
    hint: 'Think about the height of a balanced binary tree.',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'segtree-2',
    question: 'What is the space complexity of a Segment Tree for an array of n elements?',
    options: ['O(n)', 'O(2n)', 'O(4n)', 'O(n log n)'],
    correctAnswer: 2,
    explanation: 'A Segment Tree requires O(4n) space in the worst case. While 2n-1 nodes are sufficient for a perfect binary tree, we allocate 4n to handle cases where n is not a power of 2 and ensure safe indexing.',
    hint: 'Arrays need extra space for safe 2*i indexing.',
    difficulty: 'medium',
    topic: 'Space Complexity',
  },
  {
    id: 'segtree-3',
    question: 'What is the time complexity of building a Segment Tree from an array?',
    options: ['O(n)', 'O(n log n)', 'O(log n)', 'O(n²)'],
    correctAnswer: 0,
    explanation: 'Building is O(n) because we visit each of the ~2n nodes exactly once. Each node computation is O(1) - combining two children values. Total: O(2n) = O(n).',
    difficulty: 'easy',
    topic: 'Build Complexity',
  },
  {
    id: 'segtree-4',
    question: 'Which operation does a Segment Tree NOT efficiently support?',
    options: [
      'Range sum query',
      'Range minimum query',
      'Point update',
      'Insert element at arbitrary position'
    ],
    correctAnswer: 3,
    explanation: 'Segment Trees are built for a fixed-size array. Inserting at arbitrary positions would require rebuilding the tree. For dynamic insertion/deletion, consider other structures like balanced BSTs or Treaps.',
    hint: 'Segment Trees work on fixed-size arrays.',
    difficulty: 'medium',
    topic: 'Limitations',
  },
  {
    id: 'segtree-5',
    question: 'What is Lazy Propagation used for in Segment Trees?',
    options: [
      'Reducing space complexity',
      'Efficient range updates',
      'Faster point queries',
      'Compressing the tree'
    ],
    correctAnswer: 1,
    explanation: 'Lazy Propagation enables O(log n) range updates by deferring updates to child nodes until they are accessed. Without it, range updates would be O(n). It stores pending updates at internal nodes.',
    difficulty: 'medium',
    topic: 'Lazy Propagation',
  },
  {
    id: 'segtree-6',
    question: 'For a node at index i (1-indexed), what is the index of its left child?',
    options: ['i + 1', '2i', '2i + 1', 'i / 2'],
    correctAnswer: 1,
    explanation: 'In 1-indexed Segment Tree: left child = 2i, right child = 2i + 1, parent = i/2. This allows efficient array-based storage without explicit pointers, similar to heap indexing.',
    difficulty: 'easy',
    topic: 'Index Formulas',
  },
  {
    id: 'segtree-7',
    question: 'Which of these can be computed using a Segment Tree?',
    options: [
      'Range sum',
      'Range minimum',
      'Range GCD',
      'All of the above'
    ],
    correctAnswer: 3,
    explanation: 'Segment Trees can compute any associative operation: sum, min, max, GCD, LCM, XOR, AND, OR, product, etc. The key requirement is that the operation must be associative: (a op b) op c = a op (b op c).',
    difficulty: 'easy',
    topic: 'Applications',
  },
  {
    id: 'segtree-8',
    question: 'How does a Segment Tree compare to a Fenwick Tree (BIT)?',
    options: [
      'Segment Tree uses less memory',
      'Fenwick Tree supports all operations Segment Tree does',
      'Segment Tree is more versatile but uses more memory',
      'They are equivalent in all aspects'
    ],
    correctAnswer: 2,
    explanation: 'Segment Trees are more versatile (support range min/max, lazy propagation) but use O(4n) space. Fenwick Trees use O(n) space and have simpler code, but mainly support prefix sums and point updates.',
    hint: 'Think about what operations each supports.',
    difficulty: 'hard',
    topic: 'Comparison',
  },
  {
    id: 'segtree-9',
    question: 'In a Segment Tree for range sum, what value does an internal node store?',
    options: [
      'The array index it represents',
      'The sum of all elements in its range',
      'The count of elements in its range',
      'A pointer to its children'
    ],
    correctAnswer: 1,
    explanation: 'Each internal node stores the sum (or other aggregate) of all elements in its range. Leaf nodes store individual array elements. Internal node value = left_child + right_child.',
    difficulty: 'easy',
    topic: 'Structure',
  },
  {
    id: 'segtree-10',
    question: 'What is a 2D Segment Tree used for?',
    options: [
      'Sorting 2D arrays',
      '2D range queries (e.g., sum of submatrix)',
      'Graph traversal',
      'Image compression'
    ],
    correctAnswer: 1,
    explanation: '2D Segment Trees (or Segment Tree of Segment Trees) answer queries over rectangular subregions of a matrix. Each node of the outer tree is itself a Segment Tree. Query/update: O(log²n).',
    difficulty: 'hard',
    topic: 'Advanced',
  },
];

function buildTree(arr: number[]): TreeNode[] {
  const n = arr.length;
  const tree: TreeNode[] = new Array(4 * n).fill(null).map(() => ({
    value: 0,
    left: 0,
    right: 0,
    leftChild: null,
    rightChild: null,
  }));

  function build(node: number, l: number, r: number) {
    tree[node].left = l;
    tree[node].right = r;

    if (l === r) {
      tree[node].value = arr[l];
      return;
    }

    const mid = Math.floor((l + r) / 2);
    tree[node].leftChild = 2 * node;
    tree[node].rightChild = 2 * node + 1;

    build(2 * node, l, mid);
    build(2 * node + 1, mid + 1, r);

    tree[node].value = tree[2 * node].value + tree[2 * node + 1].value;
  }

  build(1, 0, n - 1);
  return tree;
}

function cloneTree(tree: TreeNode[]): TreeNode[] {
  return tree.map((node) => ({ ...node }));
}

function generateSegmentTreeSteps(): SegmentTreeStep[] {
  const steps: SegmentTreeStep[] = [];
  const array = [...INITIAL_ARRAY];
  let tree = buildTree(array);

  steps.push({
    operation: 'init',
    tree: cloneTree(tree),
    array: [...array],
    description: `Array [${array.join(', ')}]. Building Segment Tree for range sum.`,
  });

  steps.push({
    operation: 'build',
    tree: cloneTree(tree),
    array: [...array],
    highlightNodes: [1],
    description: `Tree built! Root = ${tree[1].value} (sum of all elements).`,
  });

  for (const operation of OPERATIONS) {
    if (operation.op === 'query') {
      const [ql, qr] = operation.args;

      steps.push({
        operation: 'query',
        tree: cloneTree(tree),
        array: [...array],
        queryRange: [ql, qr],
        description: `query(${ql}, ${qr}): Find sum of range [${ql}, ${qr}]`,
      });

      const visitedNodes: number[] = [];
      const inRangeNodes: number[] = [];

      function querySimulate(node: number, l: number, r: number, ql: number, qr: number): number {
        visitedNodes.push(node);

        if (qr < l || ql > r) {
          return 0;
        }

        if (ql <= l && r <= qr) {
          inRangeNodes.push(node);
          return tree[node].value;
        }

        const mid = Math.floor((l + r) / 2);
        return querySimulate(2 * node, l, mid, ql, qr) +
               querySimulate(2 * node + 1, mid + 1, r, ql, qr);
      }

      const result = querySimulate(1, 0, array.length - 1, ql, qr);

      steps.push({
        operation: 'queryNode',
        tree: cloneTree(tree),
        array: [...array],
        highlightNodes: visitedNodes,
        queryRange: [ql, qr],
        queryResult: result,
        description: `✓ query(${ql}, ${qr}) = ${result}. Visited ${visitedNodes.length} nodes.`,
      });
    } else if (operation.op === 'update') {
      const [idx, val] = operation.args;

      steps.push({
        operation: 'update',
        tree: cloneTree(tree),
        array: [...array],
        updateIndex: idx,
        updateValue: val,
        description: `update(${idx}, ${val}): Change array[${idx}] to ${val}`,
      });

      const visitedNodes: number[] = [];

      function updateSimulate(node: number, l: number, r: number, idx: number, val: number) {
        visitedNodes.push(node);

        if (l === r) {
          tree[node].value = val;
          return;
        }

        const mid = Math.floor((l + r) / 2);
        if (idx <= mid) {
          updateSimulate(2 * node, l, mid, idx, val);
        } else {
          updateSimulate(2 * node + 1, mid + 1, r, idx, val);
        }
        tree[node].value = tree[2 * node].value + tree[2 * node + 1].value;
      }

      updateSimulate(1, 0, array.length - 1, idx, val);
      array[idx] = val;

      steps.push({
        operation: 'updateNode',
        tree: cloneTree(tree),
        array: [...array],
        highlightNodes: visitedNodes,
        updateIndex: idx,
        description: `✓ Updated! New root sum: ${tree[1].value}`,
      });
    }
  }

  steps.push({
    operation: 'done',
    tree: cloneTree(tree),
    array: [...array],
    description: `✓ Done! O(log n) query and update operations.`,
  });

  return steps;
}

const SegmentTreeInterviewVisualizerComponent: React.FC<SegmentTreeInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'segtree-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateSegmentTreeSteps, []);

  const playback = useVisualizerPlayback<SegmentTreeStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: SEGMENT_TREE_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: SegmentTreeStep = playback.currentStepData || {
    operation: 'init',
    tree: [],
    array: INITIAL_ARRAY,
    description: '',
  };

  // Get all valid nodes for rendering
  const validNodes = useMemo(() => {
    const nodes: Array<{ idx: number; node: TreeNode; depth: number; position: number }> = [];

    function traverse(idx: number, depth: number, position: number) {
      if (idx >= stepData.tree.length || !stepData.tree[idx] || stepData.tree[idx].value === 0 && stepData.tree[idx].left === 0 && stepData.tree[idx].right === 0) {
        if (idx < stepData.tree.length && stepData.tree[idx] && (stepData.tree[idx].left === stepData.tree[idx].right)) {
          nodes.push({ idx, node: stepData.tree[idx], depth, position });
        }
        return;
      }

      nodes.push({ idx, node: stepData.tree[idx], depth, position });

      if (stepData.tree[idx].leftChild) {
        traverse(stepData.tree[idx].leftChild, depth + 1, position * 2);
      }
      if (stepData.tree[idx].rightChild) {
        traverse(stepData.tree[idx].rightChild, depth + 1, position * 2 + 1);
      }
    }

    if (stepData.tree.length > 1) {
      traverse(1, 0, 0);
    }

    return nodes;
  }, [stepData.tree]);

  const getNodeStyle = (idx: number): string => {
    const isHighlighted = stepData.highlightNodes?.includes(idx);
    const node = stepData.tree[idx];

    if (!node) return 'fill-gray-50 stroke-gray-300';

    const inQueryRange = stepData.queryRange &&
      stepData.queryRange[0] <= node.left &&
      node.right <= stepData.queryRange[1];

    const isUpdated = stepData.updateIndex !== undefined &&
      node.left <= stepData.updateIndex &&
      stepData.updateIndex <= node.right;

    if (isHighlighted && inQueryRange) return 'fill-green-100 stroke-green-400';
    if (isHighlighted && isUpdated) return 'fill-purple-100 stroke-purple-400';
    if (isHighlighted) return 'fill-blue-100 stroke-blue-400';
    if (inQueryRange) return 'fill-green-50 stroke-green-300';
    return 'fill-gray-50 stroke-gray-300';
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const maxDepth = Math.max(...validNodes.map((n) => n.depth), 0);
  const nodeWidth = 60;
  const levelHeight = 55;

  const visualization = (
    <>
      {/* Info Box */}
      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="text-sm text-green-800 text-center">
          <span className="font-medium">Segment Tree:</span> Range queries & point updates in O(log n)
        </div>
      </div>

      {/* Array */}
      <div className="mb-3">
        <div className="text-xs font-medium text-gray-600 mb-1">Array</div>
        <div className="flex justify-center gap-1">
          {stepData.array.map((val, idx) => {
            const inRange = stepData.queryRange &&
              idx >= stepData.queryRange[0] &&
              idx <= stepData.queryRange[1];
            const isUpdate = stepData.updateIndex === idx;

            return (
              <div
                key={idx}
                className={`
                  w-10 h-10 flex flex-col items-center justify-center rounded border-2
                  ${isUpdate ? 'bg-purple-100 border-purple-400' :
                    inRange ? 'bg-green-100 border-green-400' :
                    'bg-gray-50 border-gray-300'}
                `}
              >
                <div className="text-[9px] text-gray-500">[{idx}]</div>
                <div className="text-sm font-bold">{val}</div>
              </div>
            );
          })}
        </div>
        <div className="text-center text-xs text-gray-600 mt-1 min-h-[16px]">
          {stepData.queryRange ? (
            <>
              Range [{stepData.queryRange[0]}, {stepData.queryRange[1]}]
              {stepData.queryResult !== undefined && (
                <span className="ml-1 text-green-600 font-medium">= {stepData.queryResult}</span>
              )}
            </>
          ) : (
            <span className="text-gray-400">Ready...</span>
          )}
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="mb-2 overflow-x-auto bg-gray-50 rounded-lg p-2 min-h-[180px]">
        {validNodes.length > 0 ? (
          <svg
            width={Math.max(300, Math.pow(2, maxDepth) * nodeWidth + 40)}
            height={(maxDepth + 1) * levelHeight + 30}
            className="mx-auto"
          >
            {/* Edges */}
            {validNodes.map(({ idx, node, depth, position }) => {
              const x = 20 + (position + 0.5) * (Math.pow(2, maxDepth - depth) * nodeWidth);
              const y = 15 + depth * levelHeight;

              return (
                <React.Fragment key={`edges-${idx}`}>
                  {node.leftChild && stepData.tree[node.leftChild] && (
                    <line
                      x1={x}
                      y1={y + 18}
                      x2={20 + (position * 2 + 0.5) * (Math.pow(2, maxDepth - depth - 1) * nodeWidth)}
                      y2={y + levelHeight}
                      stroke="#d1d5db"
                      strokeWidth={1.5}
                    />
                  )}
                  {node.rightChild && stepData.tree[node.rightChild] && (
                    <line
                      x1={x}
                      y1={y + 18}
                      x2={20 + (position * 2 + 1 + 0.5) * (Math.pow(2, maxDepth - depth - 1) * nodeWidth)}
                      y2={y + levelHeight}
                      stroke="#d1d5db"
                      strokeWidth={1.5}
                    />
                  )}
                </React.Fragment>
              );
            })}

            {/* Nodes */}
            {validNodes.map(({ idx, node, depth, position }) => {
              const x = 20 + (position + 0.5) * (Math.pow(2, maxDepth - depth) * nodeWidth);
              const y = 15 + depth * levelHeight;
              const style = getNodeStyle(idx);
              const isHighlighted = stepData.highlightNodes?.includes(idx);

              return (
                <g key={idx}>
                  <rect
                    x={x - 24}
                    y={y}
                    width={48}
                    height={32}
                    rx={5}
                    className={style}
                    strokeWidth={isHighlighted ? 2 : 1}
                  />
                  <text
                    x={x}
                    y={y + 14}
                    textAnchor="middle"
                    className="text-xs font-bold fill-gray-800"
                  >
                    {node.value}
                  </text>
                  <text
                    x={x}
                    y={y + 26}
                    textAnchor="middle"
                    className="text-[8px] fill-gray-500"
                  >
                    [{node.left},{node.right}]
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Building tree...
          </div>
        )}
      </div>
    </>
  );

  const modeToggle = (
    <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
      <button
        onClick={() => setMode('visualize')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'visualize'
            ? 'bg-white text-green-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'interview'
            ? 'bg-white text-green-600 shadow-sm'
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
      accentColor="green"
    />
  ) : undefined;

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="Segment Tree (Interview Mode)"
      badges={BADGES}
      gradient="green"
      className={className}
      minHeight={420}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description: stepData.description,
        currentStep: playback.currentStep,
        totalSteps: playback.steps.length,
        variant: stepData.operation === 'done' || stepData.operation === 'queryNode' || stepData.operation === 'updateNode' ? 'success' : 'default',
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
        accentColor: 'green',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      sidePanel={sidePanel}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const SegmentTreeInterviewVisualizer = React.memo(SegmentTreeInterviewVisualizerComponent);
export default SegmentTreeInterviewVisualizer;
