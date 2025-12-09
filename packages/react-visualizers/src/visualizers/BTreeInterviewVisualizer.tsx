import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface BTreeNode {
  keys: number[];
  children: BTreeNode[];
  isLeaf: boolean;
}

interface BTreeStep {
  operation: 'init' | 'insert' | 'search' | 'split' | 'done';
  value?: number;
  tree: BTreeNode | null;
  highlightNode?: number[];
  highlightKey?: number;
  description: string;
  found?: boolean;
}

interface BTreeInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'btree-interview-visualizer';
const ORDER = 3; // Max 2 keys per node (ORDER - 1)

const BADGES = [
  { label: 'Interview Mode', variant: 'purple' as const },
  { label: `Order ${ORDER}`, variant: 'green' as const },
  { label: 'O(log n)', variant: 'teal' as const },
];

const OPERATIONS: Array<{ op: 'insert' | 'search'; value: number }> = [
  { op: 'insert', value: 10 },
  { op: 'insert', value: 20 },
  { op: 'insert', value: 5 },
  { op: 'insert', value: 15 },
  { op: 'insert', value: 25 },
  { op: 'search', value: 15 },
  { op: 'search', value: 12 },
];

const LEGEND_ITEMS = [
  { color: 'bg-green-400', label: 'Current node' },
  { color: 'bg-amber-100', label: 'Search path', border: '#fbbf24' },
  { color: 'bg-blue-400', label: 'Found/Inserted' },
];

// Interview questions about B-Tree
const BTREE_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'bt-1',
    question: 'Why are B-Trees commonly used in database indexes?',
    options: [
      'They use less memory than hash tables',
      'They minimize disk I/O by having high branching factor',
      'They are easier to implement',
      'They support only point queries',
    ],
    correctAnswer: 1,
    explanation: 'B-Trees are optimized for disk I/O. With high branching factor (hundreds of children per node), tree height stays small (2-4 levels for millions of records), minimizing expensive disk reads.',
    hint: 'Think about what makes disk operations expensive.',
    difficulty: 'medium',
    topic: 'Use Cases',
  },
  {
    id: 'bt-2',
    question: 'What is the time complexity of search, insert, and delete in a B-Tree?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 1,
    explanation: 'All operations are O(log n) because tree height is O(log n) with base equal to the branching factor. Even with billions of records, a B-Tree with order 100 has only ~5 levels.',
    difficulty: 'easy',
    topic: 'Complexity',
  },
  {
    id: 'bt-3',
    question: 'What happens when a B-Tree node becomes full during insertion?',
    options: [
      'The insertion fails',
      'The node splits into two, and middle key moves up',
      'Elements are shifted to sibling nodes',
      'The tree is rebuilt',
    ],
    correctAnswer: 1,
    explanation: 'When a node overflows (has ORDER keys), it splits: the middle key moves to the parent, and the node divides into two nodes with the remaining keys. This may propagate up to the root.',
    hint: 'The tree grows from the root, not the leaves.',
    difficulty: 'medium',
    topic: 'Insertion',
  },
  {
    id: 'bt-4',
    question: 'What is the minimum fill factor for non-root nodes in a B-Tree?',
    options: ['Empty is allowed', '25%', '50%', '100%'],
    correctAnswer: 2,
    explanation: 'Non-root nodes must be at least half full (⌈m/2⌉ - 1 keys minimum, where m is order). This ensures efficient space utilization and bounds tree height. Only root can have fewer keys.',
    difficulty: 'medium',
    topic: 'Properties',
  },
  {
    id: 'bt-5',
    question: 'What is the difference between B-Tree and B+ Tree?',
    options: [
      'B+ Tree is faster',
      'B+ Tree stores data only in leaves and has linked leaves',
      'B-Tree has more levels',
      'They are identical',
    ],
    correctAnswer: 1,
    explanation: 'In B+ Tree: (1) all data is stored in leaves (internal nodes only have keys), (2) leaves are linked for efficient range queries. Most databases use B+ Trees for these advantages.',
    difficulty: 'hard',
    topic: 'Variants',
  },
  {
    id: 'bt-6',
    question: 'How does a B-Tree guarantee balance?',
    options: [
      'By using rotations like AVL',
      'By always splitting/merging to keep nodes within bounds',
      'By rebuilding periodically',
      'It doesn\'t guarantee balance',
    ],
    correctAnswer: 1,
    explanation: 'B-Trees stay balanced by: (1) growing upward from root on overflow (splits), (2) merging/redistributing on underflow. All leaves are always at the same depth.',
    difficulty: 'medium',
    topic: 'Balance',
  },
  {
    id: 'bt-7',
    question: 'What is the typical order (branching factor) for B-Trees in database systems?',
    options: ['2-3', '10-20', '100-1000', '10000+'],
    correctAnswer: 2,
    explanation: 'Database B-Trees typically have order 100-1000, chosen so each node fits in a disk block (4KB-16KB). This maximizes fanout while keeping node reads efficient.',
    hint: 'Think about disk block sizes.',
    difficulty: 'hard',
    topic: 'Implementation',
  },
  {
    id: 'bt-8',
    question: 'Why is B-Tree preferred over binary search tree for databases?',
    options: [
      'BST is not balanced',
      'B-Tree has fewer levels, reducing disk I/O',
      'BST cannot store strings',
      'B-Tree uses less memory',
    ],
    correctAnswer: 1,
    explanation: 'With order 100, a B-Tree storing 1M records has only 3 levels (log₁₀₀(1M) ≈ 3). A balanced BST would need 20 levels (log₂(1M) ≈ 20). Each level = one disk read.',
    difficulty: 'medium',
    topic: 'Comparison',
  },
  {
    id: 'bt-9',
    question: 'What is the height of a B-Tree with n keys and order m?',
    options: ['O(n)', 'O(log n)', 'O(logₘ n)', 'O(m)'],
    correctAnswer: 2,
    explanation: 'Height is O(logₘ n) where m is the order (branching factor). The logarithm base m makes B-Trees very shallow - crucial for minimizing disk I/O.',
    difficulty: 'medium',
    topic: 'Height',
  },
  {
    id: 'bt-10',
    question: 'Which property is NOT true for B-Trees?',
    options: [
      'All leaves are at the same depth',
      'Each node can have at most m children',
      'Data is always stored in sorted order',
      'Root must always be a leaf node',
    ],
    correctAnswer: 3,
    explanation: 'Root is a leaf only when the tree has one node. As elements are inserted and the root splits, it becomes an internal node with children. All other properties are always true.',
    difficulty: 'easy',
    topic: 'Properties',
  },
];

function cloneBTree(node: BTreeNode | null): BTreeNode | null {
  if (!node) return null;
  return {
    keys: [...node.keys],
    children: node.children.map((c) => cloneBTree(c)!),
    isLeaf: node.isLeaf,
  };
}

function generateBTreeSteps(): BTreeStep[] {
  const steps: BTreeStep[] = [];
  let root: BTreeNode | null = null;

  steps.push({
    operation: 'init',
    tree: null,
    description: `Initialize B-Tree of order ${ORDER} (max ${ORDER - 1} keys per node)`,
  });

  function insert(node: BTreeNode | null, key: number): { node: BTreeNode; promoted?: number; newChild?: BTreeNode } {
    if (!node) {
      return { node: { keys: [key], children: [], isLeaf: true } };
    }

    if (node.isLeaf) {
      // Insert into leaf
      const insertIdx = node.keys.findIndex((k) => key < k);
      if (insertIdx === -1) {
        node.keys.push(key);
      } else {
        node.keys.splice(insertIdx, 0, key);
      }

      // Check for split
      if (node.keys.length >= ORDER) {
        const midIdx = Math.floor(node.keys.length / 2);
        const promoted = node.keys[midIdx];
        const rightNode: BTreeNode = {
          keys: node.keys.slice(midIdx + 1),
          children: [],
          isLeaf: true,
        };
        node.keys = node.keys.slice(0, midIdx);
        return { node, promoted, newChild: rightNode };
      }

      return { node };
    }

    // Find child to recurse into
    let childIdx = node.keys.findIndex((k) => key < k);
    if (childIdx === -1) childIdx = node.keys.length;

    const result = insert(node.children[childIdx], key);
    node.children[childIdx] = result.node;

    if (result.promoted !== undefined && result.newChild) {
      // Handle promotion from child split
      node.keys.splice(childIdx, 0, result.promoted);
      node.children.splice(childIdx + 1, 0, result.newChild);

      // Check if this node needs to split
      if (node.keys.length >= ORDER) {
        const midIdx = Math.floor(node.keys.length / 2);
        const promoted = node.keys[midIdx];
        const rightNode: BTreeNode = {
          keys: node.keys.slice(midIdx + 1),
          children: node.children.slice(midIdx + 1),
          isLeaf: false,
        };
        node.keys = node.keys.slice(0, midIdx);
        node.children = node.children.slice(0, midIdx + 1);
        return { node, promoted, newChild: rightNode };
      }
    }

    return { node };
  }

  for (const { op, value } of OPERATIONS) {
    if (op === 'insert') {
      steps.push({
        operation: 'insert',
        value,
        tree: cloneBTree(root),
        highlightKey: value,
        description: `insert(${value}): Finding position...`,
      });

      const result = insert(root, value);

      if (result.promoted !== undefined && result.newChild) {
        // Root split
        root = {
          keys: [result.promoted],
          children: [result.node, result.newChild],
          isLeaf: false,
        };
        steps.push({
          operation: 'split',
          value,
          tree: cloneBTree(root),
          highlightKey: result.promoted,
          description: `insert(${value}): Root split! ${result.promoted} promoted to new root`,
        });
      } else {
        root = result.node;
        steps.push({
          operation: 'insert',
          value,
          tree: cloneBTree(root),
          highlightKey: value,
          description: `insert(${value}): Inserted successfully`,
        });
      }
    } else {
      // Search
      let current = root;
      const path: number[] = [];
      let found = false;

      while (current) {
        const idx = current.keys.findIndex((k) => value <= k);
        if (idx !== -1 && current.keys[idx] === value) {
          found = true;
          break;
        }
        if (current.isLeaf) break;

        const childIdx = idx === -1 ? current.keys.length : idx;
        path.push(childIdx);
        current = current.children[childIdx];
      }

      steps.push({
        operation: 'search',
        value,
        tree: cloneBTree(root),
        highlightKey: value,
        highlightNode: path,
        description: found
          ? `search(${value}): Found!`
          : `search(${value}): Not found`,
        found,
      });
    }
  }

  function countKeys(node: BTreeNode | null): number {
    if (!node) return 0;
    return node.keys.length + node.children.reduce((sum, c) => sum + countKeys(c), 0);
  }

  steps.push({
    operation: 'done',
    tree: cloneBTree(root),
    description: `Done! B-Tree contains ${countKeys(root)} keys`,
  });

  return steps;
}

const BTreeInterviewVisualizerComponent: React.FC<BTreeInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'bt-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateBTreeSteps, []);

  const {
    currentStep,
    currentStepData,
    steps,
    isPlaying,
    speed,
    handlePlayPause,
    handleStep,
    handleStepBack,
    handleReset,
    setSpeed,
  } = useVisualizerPlayback<BTreeStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: BTREE_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: BTreeStep = currentStepData || {
    operation: 'init',
    tree: null,
    description: '',
  };

  const { tree, highlightKey, description, found } = stepData;

  // Simple tree rendering
  const renderNode = (node: BTreeNode, x: number, y: number, width: number): React.ReactNode => {
    const nodeWidth = Math.max(60, node.keys.length * 30);
    const isHighlighted = node.keys.includes(highlightKey || -1);

    return (
      <g key={`${x}-${y}-${node.keys.join(',')}`}>
        {/* Node box */}
        <rect
          x={x - nodeWidth / 2}
          y={y}
          width={nodeWidth}
          height={30}
          rx={4}
          className={`transition-colors ${
            isHighlighted
              ? found === false
                ? 'fill-red-100 stroke-red-400'
                : 'fill-green-100 stroke-green-400'
              : 'fill-white stroke-gray-300'
          }`}
          strokeWidth={2}
        />

        {/* Keys */}
        {node.keys.map((key, idx) => (
          <text
            key={idx}
            x={x - nodeWidth / 2 + 15 + idx * 30}
            y={y + 20}
            className={`text-xs font-mono ${
              key === highlightKey ? 'fill-green-700 font-bold' : 'fill-gray-700'
            }`}
          >
            {key}
          </text>
        ))}

        {/* Children */}
        {!node.isLeaf &&
          node.children.map((child, idx) => {
            const childX = x - width / 2 + (width / (node.children.length + 1)) * (idx + 1);
            const childY = y + 60;
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={y + 30}
                  x2={childX}
                  y2={childY}
                  stroke="#d1d5db"
                  strokeWidth={2}
                />
                {renderNode(child, childX, childY, width / node.children.length)}
              </g>
            );
          })}
      </g>
    );
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const getStatusVariant = () => {
    if (stepData.operation === 'search' && found === false) return 'error';
    if (stepData.operation === 'done' || found === true) return 'success';
    if (stepData.operation === 'split') return 'warning';
    return 'default';
  };

  const visualization = (
    <>
      {/* B-Tree Property */}
      <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="text-sm text-green-800 text-center">
          <span className="font-medium">B-Tree Order {ORDER}:</span> Max {ORDER - 1} keys, min{' '}
          {Math.ceil(ORDER / 2) - 1} keys per node
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="mb-4">
        <div className="bg-gray-50 rounded-lg p-2 overflow-x-auto">
          {tree ? (
            <svg width="400" height="200" className="mx-auto">
              {renderNode(tree, 200, 20, 350)}
            </svg>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
              Empty tree
            </div>
          )}
        </div>
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
      title="B-Tree (Interview Mode)"
      badges={BADGES}
      gradient="green"
      className={className}
      minHeight={500}
      onShare={handleShare}
      headerExtra={modeToggle}
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
      sidePanel={sidePanel}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const BTreeInterviewVisualizer = React.memo(BTreeInterviewVisualizerComponent);
export default BTreeInterviewVisualizer;
