import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ControlPanel,
  Legend,
  StatusPanel,
  ShareButton,
  useUrlState,
  VisualizationArea,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface TreeNode {
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

interface TreeSetStep {
  operation: 'add' | 'contains' | 'init' | 'done';
  value?: number;
  tree: TreeNode | null;
  path: number[];
  description: string;
  found?: boolean;
  currentNode?: number;
}

interface TreeSetInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const OPERATIONS: Array<{ op: 'add' | 'contains'; value: number }> = [
  { op: 'add', value: 50 },
  { op: 'add', value: 30 },
  { op: 'add', value: 70 },
  { op: 'add', value: 20 },
  { op: 'add', value: 40 },
  { op: 'add', value: 60 },
  { op: 'add', value: 80 },
  { op: 'contains', value: 40 },
  { op: 'contains', value: 55 },
];

const LEGEND_ITEMS = [
  { color: 'bg-yellow-100', label: 'Path', border: '#facc15' },
  { color: 'bg-green-500', label: 'Current/Found' },
  { color: 'bg-red-500', label: 'Not found' },
];

// Interview questions about TreeSet/BST
const TREESET_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'ts-1',
    question: 'What is the average time complexity for search, insert, and delete in a balanced BST?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 1,
    explanation: 'In a balanced BST, each comparison eliminates half the remaining nodes, giving O(log n) for search, insert, and delete operations. This assumes the tree remains balanced.',
    hint: 'Think about how many levels you need to traverse in a balanced tree.',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'ts-2',
    question: 'What is the worst-case time complexity for BST operations?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctAnswer: 2,
    explanation: 'In the worst case (degenerate tree - essentially a linked list), all operations degrade to O(n). This happens when elements are inserted in sorted order into an unbalanced BST.',
    hint: 'Consider what happens if you insert [1, 2, 3, 4, 5] in order.',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'ts-3',
    question: 'What is the BST property that must always be maintained?',
    options: [
      'Left child < Parent < Right child',
      'Parent < Left child < Right child',
      'All nodes must have two children',
      'Tree height must be log(n)',
    ],
    correctAnswer: 0,
    explanation: 'The BST property states that for every node: all values in the left subtree are smaller, and all values in the right subtree are larger. This enables efficient binary search.',
    difficulty: 'easy',
    topic: 'BST Property',
  },
  {
    id: 'ts-4',
    question: 'What tree traversal visits nodes in sorted order in a BST?',
    options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'],
    correctAnswer: 1,
    explanation: 'In-order traversal (Left → Root → Right) visits BST nodes in ascending sorted order. This is because all left subtree values are smaller and all right subtree values are larger.',
    hint: 'Think about the BST property: left < node < right.',
    difficulty: 'easy',
    topic: 'Traversal',
  },
  {
    id: 'ts-5',
    question: 'What is a Red-Black Tree used for in Java\'s TreeSet?',
    options: [
      'To store color metadata',
      'To guarantee O(log n) operations by self-balancing',
      'To enable faster iteration',
      'To reduce memory usage',
    ],
    correctAnswer: 1,
    explanation: 'Red-Black Trees are self-balancing BSTs that guarantee O(log n) height. Java\'s TreeSet and TreeMap use Red-Black Trees to ensure operations never degrade to O(n).',
    difficulty: 'medium',
    topic: 'Implementation',
  },
  {
    id: 'ts-6',
    question: 'How do you delete a node with two children from a BST?',
    options: [
      'Simply remove the node',
      'Replace with in-order successor or predecessor, then delete that node',
      'Remove both children first',
      'It\'s not possible without rebuilding the tree',
    ],
    correctAnswer: 1,
    explanation: 'To delete a node with two children: find its in-order successor (smallest in right subtree) or predecessor (largest in left subtree), copy that value to the node, then delete the successor/predecessor (which has at most one child).',
    hint: 'You need to maintain the BST property after deletion.',
    difficulty: 'medium',
    topic: 'Deletion',
  },
  {
    id: 'ts-7',
    question: 'What is the space complexity of a BST with n nodes?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 2,
    explanation: 'A BST with n nodes requires O(n) space to store all nodes. Additionally, recursive operations use O(h) stack space where h is the height (O(log n) balanced, O(n) worst case).',
    difficulty: 'easy',
    topic: 'Space Complexity',
  },
  {
    id: 'ts-8',
    question: 'Why would you choose TreeSet over HashSet in Java?',
    options: [
      'TreeSet has O(1) operations',
      'TreeSet maintains elements in sorted order',
      'TreeSet uses less memory',
      'TreeSet is thread-safe',
    ],
    correctAnswer: 1,
    explanation: 'TreeSet maintains elements in sorted order (natural ordering or custom Comparator). Use it when you need sorted iteration, range queries (subSet, headSet, tailSet), or to find first/last elements. HashSet is faster O(1) but unordered.',
    difficulty: 'medium',
    topic: 'Use Cases',
  },
  {
    id: 'ts-9',
    question: 'What is the height of a perfectly balanced BST with n nodes?',
    options: ['n', 'n/2', 'log₂(n)', '2^n'],
    correctAnswer: 2,
    explanation: 'A perfectly balanced BST has height log₂(n) because each level doubles the number of nodes. With n nodes, you need log₂(n) levels to store them all while maintaining balance.',
    hint: 'How many nodes can each level hold?',
    difficulty: 'medium',
    topic: 'Tree Height',
  },
  {
    id: 'ts-10',
    question: 'Which self-balancing BST is typically used in database indexes?',
    options: ['AVL Tree', 'Red-Black Tree', 'B-Tree', 'Splay Tree'],
    correctAnswer: 2,
    explanation: 'B-Trees (and B+ Trees) are used in database indexes because they\'re optimized for disk I/O. They have high branching factor, minimizing tree height and disk reads. AVL and Red-Black are binary (2 children max).',
    difficulty: 'hard',
    topic: 'Applications',
  },
];

function cloneTree(node: TreeNode | null): TreeNode | null {
  if (!node) return null;
  return {
    value: node.value,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  };
}

function insertNode(root: TreeNode | null, value: number): TreeNode {
  if (!root) {
    return { value, left: null, right: null };
  }
  if (value < root.value) {
    root.left = insertNode(root.left, value);
  } else if (value > root.value) {
    root.right = insertNode(root.right, value);
  }
  return root;
}

function findPath(root: TreeNode | null, value: number): number[] {
  const path: number[] = [];
  let current = root;
  while (current) {
    path.push(current.value);
    if (value === current.value) break;
    if (value < current.value) {
      current = current.left;
    } else {
      current = current.right;
    }
  }
  return path;
}

function generateTreeSetSteps(): TreeSetStep[] {
  const steps: TreeSetStep[] = [];
  let tree: TreeNode | null = null;

  steps.push({
    operation: 'init',
    tree: null,
    path: [],
    description: 'Initialize empty TreeSet (Binary Search Tree)',
  });

  for (const { op, value } of OPERATIONS) {
    if (op === 'add') {
      const path = tree ? findPath(tree, value) : [];

      if (tree) {
        steps.push({
          operation: 'add',
          value,
          tree: cloneTree(tree),
          path: path,
          description: `add(${value}): Searching... Path: ${path.join(' → ')}`,
          currentNode: path[path.length - 1],
        });
      }

      tree = insertNode(tree, value);
      const newPath = findPath(tree, value);

      steps.push({
        operation: 'add',
        value,
        tree: cloneTree(tree),
        path: newPath,
        description: `add(${value}): Inserted!`,
        currentNode: value,
      });
    } else {
      const path = tree ? findPath(tree, value) : [];
      const found = path.length > 0 && path[path.length - 1] === value;

      steps.push({
        operation: 'contains',
        value,
        tree: cloneTree(tree),
        path: path,
        description: found
          ? `contains(${value}): Found!`
          : `contains(${value}): Not found!`,
        found,
        currentNode: found ? value : path[path.length - 1],
      });
    }
  }

  function countNodes(node: TreeNode | null): number {
    if (!node) return 0;
    return 1 + countNodes(node.left) + countNodes(node.right);
  }

  steps.push({
    operation: 'done',
    tree: cloneTree(tree),
    path: [],
    description: `Done! TreeSet contains ${countNodes(tree)} elements`,
  });

  return steps;
}

function calculatePositions(
  node: TreeNode | null,
  depth: number,
  left: number,
  right: number,
  positions: Map<number, { x: number; y: number }>
): void {
  if (!node) return;
  const x = (left + right) / 2;
  const y = depth * 60 + 30;
  positions.set(node.value, { x, y });
  calculatePositions(node.left, depth + 1, left, x, positions);
  calculatePositions(node.right, depth + 1, x, right, positions);
}

const TreeSetInterviewVisualizerComponent: React.FC<TreeSetInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'treeset-interview-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'ts-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');
  const [speed, setSpeed] = useState(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TreeSetStep[]>([]);

  const playingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initialize = useCallback(() => {
    const newSteps = generateTreeSetSteps();
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

  const interview = useInterviewMode({
    questions: TREESET_QUESTIONS,
    shuffleQuestions: true,
  });

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

  const currentStepData = steps[currentStep] || {
    operation: 'init',
    tree: null,
    path: [],
    description: '',
  };

  const { tree, path, description, currentNode, found } = currentStepData;

  const positions = new Map<number, { x: number; y: number }>();
  if (tree) {
    calculatePositions(tree, 0, 0, 300, positions);
  }

  const renderTree = (node: TreeNode | null): React.ReactNode => {
    if (!node) return null;

    const pos = positions.get(node.value);
    if (!pos) return null;

    const isInPath = path.includes(node.value);
    const isCurrent = node.value === currentNode;

    let fillColor = 'white';
    let strokeColor = '#d1d5db';

    if (isCurrent) {
      if (currentStepData.operation === 'contains' && found === false) {
        fillColor = '#ef4444';
        strokeColor = '#dc2626';
      } else {
        fillColor = '#22c55e';
        strokeColor = '#16a34a';
      }
    } else if (isInPath) {
      fillColor = '#fef3c7';
      strokeColor = '#facc15';
    }

    const leftPos = node.left ? positions.get(node.left.value) : null;
    const rightPos = node.right ? positions.get(node.right.value) : null;

    return (
      <React.Fragment key={node.value}>
        {leftPos && (
          <line
            x1={pos.x}
            y1={pos.y}
            x2={leftPos.x}
            y2={leftPos.y}
            stroke={node.left && path.includes(node.left.value) ? '#facc15' : '#d1d5db'}
            strokeWidth="2"
          />
        )}
        {rightPos && (
          <line
            x1={pos.x}
            y1={pos.y}
            x2={rightPos.x}
            y2={rightPos.y}
            stroke={node.right && path.includes(node.right.value) ? '#facc15' : '#d1d5db'}
            strokeWidth="2"
          />
        )}
        <g transform={`translate(${pos.x}, ${pos.y})`}>
          <circle r="18" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <text
            textAnchor="middle"
            dy="5"
            className="text-xs font-medium"
            fill={isCurrent ? 'white' : isInPath ? '#92400e' : '#374151'}
          >
            {node.value}
          </text>
        </g>
        {renderTree(node.left)}
        {renderTree(node.right)}
      </React.Fragment>
    );
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  return (
    <div
      id={VISUALIZER_ID}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header with mode toggle */}
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">TreeSet / BST</h3>
            <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setMode('visualize')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === 'visualize'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Visualize
              </button>
              <button
                onClick={() => setMode('interview')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === 'interview'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Interview
              </button>
            </div>
          </div>
          <ShareButton onShare={handleShare} accentColor="green" />
        </div>
      </div>

      <div className="p-4">
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* Visualization Panel */}
          <VisualizationArea minHeight={350} className="flex-1">
            {/* BST Property */}
            <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="text-sm font-medium text-emerald-800 text-center">
                BST Property: <code className="bg-white px-2 py-0.5 rounded">left &lt; node &lt; right</code>
              </div>
            </div>

            {/* Tree Visualization */}
            <div className="mb-4">
              <div className="bg-gray-50 rounded-lg p-2 overflow-x-auto">
                {tree ? (
                  <svg width="300" height="250" className="mx-auto">
                    {renderTree(tree)}
                  </svg>
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
                    Empty tree
                  </div>
                )}
              </div>
            </div>

            {/* Path Display */}
            {path.length > 0 && (
              <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Path:</span>{' '}
                  {path.map((v, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && ' → '}
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono ${
                          v === currentNode
                            ? found === false
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {v}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            <StatusPanel
              description={description}
              currentStep={currentStep}
              totalSteps={steps.length}
              variant={
                currentStepData.operation === 'contains' && found === false
                  ? 'error'
                  : currentStepData.operation === 'done' || found === true
                    ? 'success'
                    : 'default'
              }
            />
          </VisualizationArea>

          {/* Interview Panel */}
          {mode === 'interview' && (
            <div className="w-full lg:w-96 flex-shrink-0">
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
            accentColor="green"
          />
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
};

export const TreeSetInterviewVisualizer = React.memo(TreeSetInterviewVisualizerComponent);
export default TreeSetInterviewVisualizer;
