import React, { useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';

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
  codeLine?: number;
  variables?: Record<string, string | number>;
}

interface SegmentTreeVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const INITIAL_ARRAY = [1, 3, 5, 7, 9, 11];

const OPERATIONS: Array<{ op: 'query' | 'update'; args: [number, number] }> = [
  { op: 'query', args: [1, 4] },
  { op: 'query', args: [0, 2] },
  { op: 'update', args: [2, 6] },
  { op: 'query', args: [1, 4] },
  { op: 'query', args: [0, 5] },
];

const BADGES = [
  { label: 'Query: O(log n)', variant: 'green' as const },
  { label: 'Update: O(log n)', variant: 'teal' as const },
];

const SEGMENT_CODE = [
  'class SegmentTree:',
  '  def build(arr, node, l, r):',
  '    if l == r:',
  '      tree[node] = arr[l]',
  '      return',
  '    mid = (l + r) // 2',
  '    build(arr, 2*node, l, mid)',
  '    build(arr, 2*node+1, mid+1, r)',
  '    tree[node] = tree[2*node] + tree[2*node+1]',
  '',
  '  def query(node, l, r, ql, qr):',
  '    if qr < l or ql > r:',
  '      return 0  # out of range',
  '    if ql <= l and r <= qr:',
  '      return tree[node]  # fully in range',
  '    mid = (l + r) // 2',
  '    return query(2*node, l, mid, ql, qr) +',
  '           query(2*node+1, mid+1, r, ql, qr)',
  '',
  '  def update(node, l, r, idx, val):',
  '    if l == r:',
  '      tree[node] = val',
  '      return',
  '    mid = (l + r) // 2',
  '    if idx <= mid:',
  '      update(2*node, l, mid, idx, val)',
  '    else:',
  '      update(2*node+1, mid+1, r, idx, val)',
  '    tree[node] = tree[2*node] + tree[2*node+1]',
];

const LEGEND_ITEMS = [
  { color: 'bg-gray-100', label: 'Tree node', border: '#d1d5db' },
  { color: 'bg-blue-200', label: 'Visited', border: '#60a5fa' },
  { color: 'bg-green-400', label: 'In query range' },
  { color: 'bg-amber-200', label: 'Partial overlap', border: '#fbbf24' },
  { color: 'bg-purple-400', label: 'Updated' },
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
    description: `Initialize array [${array.join(', ')}]. Building Segment Tree for range sum queries.`,
    codeLine: 0,
    variables: { n: array.length },
  });

  steps.push({
    operation: 'build',
    tree: cloneTree(tree),
    array: [...array],
    highlightNodes: [1],
    description: `Tree built! Root contains sum of all elements: ${tree[1].value}. Each node stores sum of its range.`,
    codeLine: 8,
    variables: { rootSum: tree[1].value },
  });

  for (const operation of OPERATIONS) {
    if (operation.op === 'query') {
      const [ql, qr] = operation.args;

      steps.push({
        operation: 'query',
        tree: cloneTree(tree),
        array: [...array],
        queryRange: [ql, qr],
        description: `query(${ql}, ${qr}): Find sum of elements in range [${ql}, ${qr}]`,
        codeLine: 10,
        variables: { ql, qr },
      });

      // Simulate query and collect visited nodes
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
        description: `✓ query(${ql}, ${qr}) = ${result}. Visited ${visitedNodes.length} nodes, ${inRangeNodes.length} fully in range.`,
        codeLine: 14,
        variables: { ql, qr, result, visited: visitedNodes.length },
      });
    } else if (operation.op === 'update') {
      const [idx, val] = operation.args;

      steps.push({
        operation: 'update',
        tree: cloneTree(tree),
        array: [...array],
        updateIndex: idx,
        updateValue: val,
        description: `update(${idx}, ${val}): Change array[${idx}] from ${array[idx]} to ${val}`,
        codeLine: 19,
        variables: { idx, oldVal: array[idx], newVal: val },
      });

      // Simulate update and collect visited nodes
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
        description: `✓ Updated! array[${idx}] = ${val}. Updated ${visitedNodes.length} nodes in tree. New root sum: ${tree[1].value}`,
        codeLine: 28,
        variables: { idx, val, newRootSum: tree[1].value },
      });
    }
  }

  steps.push({
    operation: 'done',
    tree: cloneTree(tree),
    array: [...array],
    description: `✓ Done! Final array: [${array.join(', ')}]. Tree supports O(log n) queries and updates.`,
    codeLine: -1,
  });

  return steps;
}

const SegmentTreeVisualizerComponent: React.FC<SegmentTreeVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'segment-tree-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'segtree', scrollToId: VISUALIZER_ID });

  const generateSteps = useMemo(() => generateSegmentTreeSteps, []);

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
  } = useVisualizerPlayback<SegmentTreeStep>({
    generateSteps,
  });

  const stepData: SegmentTreeStep = currentStepData || {
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
        // Check if it's a valid leaf
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

    if (!node) return 'border-gray-300 bg-gray-50';

    const inQueryRange = stepData.queryRange &&
      stepData.queryRange[0] <= node.left &&
      node.right <= stepData.queryRange[1];

    const isUpdated = stepData.updateIndex !== undefined &&
      node.left <= stepData.updateIndex &&
      stepData.updateIndex <= node.right;

    if (isHighlighted && inQueryRange) return 'border-green-400 bg-green-100 ring-2 ring-green-300';
    if (isHighlighted && isUpdated) return 'border-purple-400 bg-purple-100 ring-2 ring-purple-300';
    if (isHighlighted) return 'border-blue-400 bg-blue-100 ring-2 ring-blue-300';
    if (inQueryRange) return 'border-green-300 bg-green-50';
    return 'border-gray-300 bg-gray-50';
  };

  const getStatusVariant = () => {
    if (stepData.operation === 'queryNode' || stepData.operation === 'updateNode' || stepData.operation === 'done') {
      return 'success' as const;
    }
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  // Calculate tree layout
  const maxDepth = Math.max(...validNodes.map((n) => n.depth), 0);
  const nodeWidth = 65;
  const levelHeight = 70;

  const infoBox = (
    <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
      <div className="text-sm font-semibold text-green-800 mb-2">
        Segment Tree (Range Sum)
      </div>
      <div className="text-xs text-green-700 space-y-1">
        <div>• Each node stores aggregate (sum) of its range</div>
        <div>• Leaf nodes = array elements</div>
        <div>• Parent = sum of children</div>
        <div>• O(log n) for both query and update</div>
      </div>
    </div>
  );

  const visualization = (
    <>
      {/* Array */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Array</div>
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
                        w-12 h-12 flex flex-col items-center justify-center rounded border-2
                        ${isUpdate ? 'bg-purple-100 border-purple-400' :
                          inRange ? 'bg-green-100 border-green-400' :
                          'bg-gray-50 border-gray-300'}
                      `}
                    >
                      <div className="text-[10px] text-gray-500">[{idx}]</div>
                      <div className="text-sm font-bold">{val}</div>
                    </div>
                  );
                })}
              </div>
              {stepData.queryRange && (
                <div className="text-center text-xs text-gray-600 mt-2">
                  Query range: [{stepData.queryRange[0]}, {stepData.queryRange[1]}]
                  {stepData.queryResult !== undefined && (
                    <span className="ml-2 text-green-600 font-medium">
                      = {stepData.queryResult}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tree Visualization */}
            <div className="mb-4 overflow-x-auto">
              <svg
                width={Math.max(400, Math.pow(2, maxDepth) * nodeWidth + 50)}
                height={(maxDepth + 1) * levelHeight + 50}
                className="mx-auto"
              >
                {/* Draw edges first */}
                {validNodes.map(({ idx, node, depth, position }) => {
                  const x = 25 + (position + 0.5) * (Math.pow(2, maxDepth - depth) * nodeWidth);
                  const y = 25 + depth * levelHeight;

                  return (
                    <React.Fragment key={`edges-${idx}`}>
                      {node.leftChild && stepData.tree[node.leftChild] && (
                        <line
                          x1={x}
                          y1={y + 20}
                          x2={25 + (position * 2 + 0.5) * (Math.pow(2, maxDepth - depth - 1) * nodeWidth)}
                          y2={y + levelHeight}
                          stroke="#d1d5db"
                          strokeWidth={2}
                        />
                      )}
                      {node.rightChild && stepData.tree[node.rightChild] && (
                        <line
                          x1={x}
                          y1={y + 20}
                          x2={25 + (position * 2 + 1 + 0.5) * (Math.pow(2, maxDepth - depth - 1) * nodeWidth)}
                          y2={y + levelHeight}
                          stroke="#d1d5db"
                          strokeWidth={2}
                        />
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Draw nodes */}
                {validNodes.map(({ idx, node, depth, position }) => {
                  const x = 25 + (position + 0.5) * (Math.pow(2, maxDepth - depth) * nodeWidth);
                  const y = 25 + depth * levelHeight;
                  const style = getNodeStyle(idx);
                  const isHighlighted = stepData.highlightNodes?.includes(idx);

                  return (
                    <g key={idx}>
                      <rect
                        x={x - 28}
                        y={y}
                        width={56}
                        height={40}
                        rx={6}
                        className={`
                          ${style.includes('green') ? 'fill-green-100 stroke-green-400' :
                            style.includes('purple') ? 'fill-purple-100 stroke-purple-400' :
                            style.includes('blue') ? 'fill-blue-100 stroke-blue-400' :
                            'fill-gray-50 stroke-gray-300'}
                        `}
                        strokeWidth={isHighlighted ? 2 : 1}
                      />
                      <text
                        x={x}
                        y={y + 18}
                        textAnchor="middle"
                        className="text-sm font-bold fill-gray-800"
                      >
                        {node.value}
                      </text>
                      <text
                        x={x}
                        y={y + 32}
                        textAnchor="middle"
                        className="text-[9px] fill-gray-500"
                      >
                        [{node.left},{node.right}]
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="Segment Tree"
      badges={BADGES}
      gradient="green"
      className={className}
      minHeight={420}
      onShare={handleShare}
      infoBox={infoBox}
      status={{
        description: stepData.description,
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
      code={showCode ? SEGMENT_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const SegmentTreeVisualizer = React.memo(SegmentTreeVisualizerComponent);
export default SegmentTreeVisualizer;
