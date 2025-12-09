import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
} from '../shared';

interface TreeNode {
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
  x?: number;
  y?: number;
}

interface TreeSetStep {
  operation: 'add' | 'contains' | 'traverse' | 'init' | 'done';
  value?: number;
  tree: TreeNode | null;
  path: number[];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  found?: boolean;
  currentNode?: number;
  traversalOrder?: number[];
}

interface TreeSetVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
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
  { op: 'add', value: 35 },
];

const TREESET_CODE = [
  'function add(value):',
  '  if root == null:',
  '    root = new Node(value)',
  '    return',
  '  node = root',
  '  while true:',
  '    if value < node.value:',
  '      if node.left == null:',
  '        node.left = new Node(value)',
  '        return',
  '      node = node.left',
  '    else if value > node.value:',
  '      if node.right == null:',
  '        node.right = new Node(value)',
  '        return',
  '      node = node.right',
  '    else: return // duplicate',
];

const LEGEND_ITEMS = [
  { color: 'bg-yellow-100', label: 'Path', border: '#facc15' },
  { color: 'bg-blue-500', label: 'Current/Insert' },
  { color: 'bg-green-500', label: 'Found' },
  { color: 'bg-red-500', label: 'Not found' },
];

const BADGES = [
  { label: 'Avg: O(log n)', variant: 'green' as const },
  { label: 'Worst: O(n)', variant: 'amber' as const },
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
    description:
      'Initialize empty TreeSet (Binary Search Tree). Values are stored in sorted order.',
    codeLine: -1,
  });

  for (const { op, value } of OPERATIONS) {
    if (op === 'add') {
      const path = tree ? findPath(tree, value) : [];

      // Step: Show traversal path
      if (tree) {
        steps.push({
          operation: 'add',
          value,
          tree: cloneTree(tree),
          path: path,
          description: `add(${value}): Searching for insert position... ${path.length > 0 ? `Path: ${path.join(' → ')}` : ''}`,
          codeLine: 5,
          variables: { value, current: path[path.length - 1] || 'null' },
          currentNode: path[path.length - 1],
        });
      }

      // Insert the value
      tree = insertNode(tree, value);
      const newPath = findPath(tree, value);

      const isRoot = newPath.length === 1;
      const direction =
        newPath.length > 1
          ? value < newPath[newPath.length - 2]
            ? 'left'
            : 'right'
          : '';

      steps.push({
        operation: 'add',
        value,
        tree: cloneTree(tree),
        path: newPath,
        description: isRoot
          ? `add(${value}): Tree was empty, ${value} becomes root`
          : `add(${value}): Insert as ${direction} child of ${newPath[newPath.length - 2]}`,
        codeLine: isRoot ? 2 : direction === 'left' ? 8 : 13,
        variables: { value, parent: newPath[newPath.length - 2] || 'none' },
        currentNode: value,
      });
    } else {
      // contains operation
      const path = tree ? findPath(tree, value) : [];
      const found = path.length > 0 && path[path.length - 1] === value;

      steps.push({
        operation: 'contains',
        value,
        tree: cloneTree(tree),
        path: path,
        description: `contains(${value}): Searching... Path: ${path.join(' → ')}`,
        codeLine: 5,
        variables: { value, path: path.join('→') },
        currentNode: path[path.length - 1],
      });

      steps.push({
        operation: 'contains',
        value,
        tree: cloneTree(tree),
        path: path,
        description: found
          ? `contains(${value}): Found! Value exists in the tree`
          : `contains(${value}): Not found! Value does not exist`,
        codeLine: found ? 6 : 16,
        variables: { value, result: found ? 'true' : 'false' },
        found,
        currentNode: found ? value : undefined,
      });
    }
  }

  // Count nodes
  function countNodes(node: TreeNode | null): number {
    if (!node) return 0;
    return 1 + countNodes(node.left) + countNodes(node.right);
  }

  steps.push({
    operation: 'done',
    tree: cloneTree(tree),
    path: [],
    description: `✓ Done! TreeSet contains ${countNodes(tree)} elements in BST order.`,
    codeLine: -1,
    variables: { size: countNodes(tree) },
  });

  return steps;
}

// Calculate node positions for rendering
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

const TreeSetVisualizerComponent: React.FC<TreeSetVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'treeset-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'treeset', scrollToId: VISUALIZER_ID });

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

  // Keyboard shortcuts
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
    tree: null,
    path: [],
    description: '',
  };

  const { tree, path, description, currentNode, found } = currentStepData;

  // Calculate positions for tree nodes
  const positions = new Map<number, { x: number; y: number }>();
  if (tree) {
    calculatePositions(tree, 0, 0, 300, positions);
  }

  // Render tree recursively
  const renderTree = (node: TreeNode | null): React.ReactNode => {
    if (!node) return null;

    const pos = positions.get(node.value);
    if (!pos) return null;

    const isInPath = path.includes(node.value);
    const isCurrent = node.value === currentNode;

    let nodeStyle = 'bg-white border-2 border-gray-300 text-gray-700';
    if (isCurrent) {
      if (currentStepData.operation === 'contains') {
        nodeStyle = found
          ? 'bg-green-500 border-green-600 text-white'
          : 'bg-red-500 border-red-600 text-white';
      } else {
        nodeStyle = 'bg-blue-500 border-blue-600 text-white';
      }
    } else if (isInPath) {
      nodeStyle = 'bg-yellow-100 border-yellow-400 text-yellow-800';
    }

    const leftPos = node.left ? positions.get(node.left.value) : null;
    const rightPos = node.right ? positions.get(node.right.value) : null;

    return (
      <React.Fragment key={node.value}>
        {/* Edges */}
        {leftPos && (
          <line
            x1={pos.x}
            y1={pos.y}
            x2={leftPos.x}
            y2={leftPos.y}
            stroke={
              node.left && path.includes(node.left.value)
                ? '#facc15'
                : '#d1d5db'
            }
            strokeWidth="2"
          />
        )}
        {rightPos && (
          <line
            x1={pos.x}
            y1={pos.y}
            x2={rightPos.x}
            y2={rightPos.y}
            stroke={
              node.right && path.includes(node.right.value)
                ? '#facc15'
                : '#d1d5db'
            }
            strokeWidth="2"
          />
        )}
        {/* Node */}
        <g transform={`translate(${pos.x}, ${pos.y})`}>
          <circle
            r="18"
            className={`${nodeStyle} transition-colors`}
            fill={
              isCurrent
                ? found === false
                  ? '#ef4444'
                  : found
                    ? '#22c55e'
                    : '#3b82f6'
                : isInPath
                  ? '#fef3c7'
                  : 'white'
            }
            stroke={
              isCurrent
                ? found === false
                  ? '#dc2626'
                  : found
                    ? '#16a34a'
                    : '#2563eb'
                : isInPath
                  ? '#facc15'
                  : '#d1d5db'
            }
            strokeWidth="2"
          />
          <text
            textAnchor="middle"
            dy="5"
            className="text-xs font-medium"
            fill={isCurrent ? 'white' : isInPath ? '#92400e' : '#374151'}
          >
            {node.value}
          </text>
        </g>
        {/* Render children */}
        {renderTree(node.left)}
        {renderTree(node.right)}
      </React.Fragment>
    );
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const getStatusVariant = () => {
    if (currentStepData.operation === 'contains' && found === false) return 'error' as const;
    if (currentStepData.operation === 'contains' && found === true) return 'success' as const;
    if (currentStepData.operation === 'done') return 'success' as const;
    return 'default' as const;
  };

  const visualization = (
    <>
      {/* BST Property - Prominent */}
      <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200">
        <div className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
          <span className="text-lg">🌳</span> Binary Search Tree Property
        </div>
        <div className="font-mono text-sm bg-white rounded-lg p-3 border border-emerald-200">
          <div className="text-center text-emerald-700 font-bold text-base mb-2">
            left &lt; <span className="text-gray-800">node</span> &lt; right
          </div>
          <div className="text-xs text-gray-500 text-center">
            All values in left subtree are smaller • All values in right subtree are larger
          </div>
        </div>
        {/* Current comparison */}
        {currentStepData.operation === 'add' && currentStepData.value !== undefined && currentNode !== undefined && currentNode !== currentStepData.value && (
          <div className="mt-3 p-2 bg-white rounded-lg border border-emerald-200">
            <div className="text-xs text-center">
              <span className="font-semibold text-emerald-700">Comparing:</span>{' '}
              <span className="font-mono">
                {currentStepData.value} {currentStepData.value < currentNode ? '<' : '>'} {currentNode}
              </span>
              {' → '}
              <span className={`font-bold ${currentStepData.value < currentNode ? 'text-blue-600' : 'text-orange-600'}`}>
                Go {currentStepData.value < currentNode ? 'LEFT' : 'RIGHT'}
              </span>
            </div>
          </div>
        )}
        {currentStepData.operation === 'contains' && currentStepData.value !== undefined && currentNode !== undefined && !found && path.length > 0 && path[path.length - 1] !== currentStepData.value && (
          <div className="mt-3 p-2 bg-white rounded-lg border border-emerald-200">
            <div className="text-xs text-center">
              <span className="font-semibold text-emerald-700">Comparing:</span>{' '}
              <span className="font-mono">
                {currentStepData.value} {currentStepData.value < currentNode ? '<' : '>'} {currentNode}
              </span>
              {' → '}
              <span className={`font-bold ${currentStepData.value < currentNode ? 'text-blue-600' : 'text-orange-600'}`}>
                Go {currentStepData.value < currentNode ? 'LEFT' : 'RIGHT'}
              </span>
            </div>
          </div>
        )}
        {found === true && (
          <div className="mt-3 p-2 bg-green-100 rounded-lg border border-green-300">
            <div className="text-xs text-center text-green-800 font-bold">
              ✓ Found! {currentStepData.value} == {currentNode}
            </div>
          </div>
        )}
        {found === false && (
          <div className="mt-3 p-2 bg-red-100 rounded-lg border border-red-300">
            <div className="text-xs text-center text-red-800 font-bold">
              ✗ Not found! Reached null (no more children to check)
            </div>
          </div>
        )}
      </div>

      {/* Tree Visualization */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Binary Search Tree
        </div>
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
            <span className="font-medium">Traversal Path:</span>
            <div className="mt-1 flex items-center gap-1 flex-wrap">
              {path.map((v, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-gray-400">→</span>}
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono ${
                      v === currentNode
                        ? found === false
                          ? 'bg-red-100 text-red-700'
                          : found
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {v}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="TreeSet Operations (BST)"
      badges={BADGES}
      gradient="green"
      className={className}
      minHeight={400}
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
        accentColor: 'green',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? TREESET_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const TreeSetVisualizer = React.memo(TreeSetVisualizerComponent);
export default TreeSetVisualizer;
