import React, { useMemo, useCallback } from 'react';
import {
  CodePanel,
  HelpPanel,
  ControlPanel,
  Legend,
  StatusPanel,
  ShareButton,
  useUrlState,
  useVisualizerPlayback,
  VisualizationArea,
} from '../shared';

interface BTreeNode {
  id: string;
  keys: number[];
  children: string[]; // child node IDs
  isLeaf: boolean;
}

interface BTreeStep {
  operation: 'init' | 'search' | 'compare' | 'descend' | 'found' | 'notFound' | 'insert' | 'split' | 'done';
  nodes: Map<string, BTreeNode>;
  rootId: string;
  targetKey?: number;
  currentNodeId?: string;
  highlightKeyIndex?: number;
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  splitInfo?: {
    nodeId: string;
    medianKey: number;
    leftKeys: number[];
    rightKeys: number[];
  };
}

interface BTreeVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const ORDER = 3; // B-Tree order (max 2 keys per node for simplicity)

const OPERATIONS: Array<{ op: 'insert' | 'search'; key: number }> = [
  { op: 'insert', key: 10 },
  { op: 'insert', key: 20 },
  { op: 'insert', key: 5 },
  { op: 'insert', key: 15 },
  { op: 'insert', key: 25 },
  { op: 'insert', key: 30 },
  { op: 'search', key: 15 },
  { op: 'search', key: 12 },
];

const BTREE_CODE = [
  'class BTreeNode:',
  '  keys[]       # sorted keys',
  '  children[]   # child pointers',
  '  isLeaf       # leaf flag',
  '',
  'function search(node, key):',
  '  i = 0',
  '  while i < len(keys) and key > keys[i]:',
  '    i += 1',
  '  if i < len(keys) and key == keys[i]:',
  '    return (node, i)  # found',
  '  if isLeaf:',
  '    return null  # not found',
  '  return search(children[i], key)',
  '',
  'function insert(key):',
  '  if root is full:',
  '    split root, create new root',
  '  insertNonFull(root, key)',
];

const LEGEND_ITEMS = [
  { color: 'bg-gray-100', label: 'Node', border: '#d1d5db' },
  { color: 'bg-yellow-200', label: 'Current node', border: '#fbbf24' },
  { color: 'bg-blue-500', label: 'Comparing key' },
  { color: 'bg-green-500', label: 'Found / Inserted' },
  { color: 'bg-red-400', label: 'Not found' },
  { color: 'bg-purple-400', label: 'Splitting' },
];

let nodeIdCounter = 0;
function generateNodeId(): string {
  return `node_${nodeIdCounter++}`;
}

function cloneNodes(nodes: Map<string, BTreeNode>): Map<string, BTreeNode> {
  const cloned = new Map<string, BTreeNode>();
  nodes.forEach((node, id) => {
    cloned.set(id, {
      ...node,
      keys: [...node.keys],
      children: [...node.children],
    });
  });
  return cloned;
}

function generateBTreeSteps(): BTreeStep[] {
  nodeIdCounter = 0;
  const steps: BTreeStep[] = [];
  let nodes = new Map<string, BTreeNode>();
  let rootId = '';

  // Initialize empty tree
  const initialRoot = generateNodeId();
  rootId = initialRoot;
  nodes.set(initialRoot, {
    id: initialRoot,
    keys: [],
    children: [],
    isLeaf: true,
  });

  steps.push({
    operation: 'init',
    nodes: cloneNodes(nodes),
    rootId,
    description: `Initialize empty B-Tree of order ${ORDER} (max ${ORDER - 1} keys per node)`,
    codeLine: 0,
    variables: { order: ORDER, maxKeys: ORDER - 1 },
  });

  for (const { op, key } of OPERATIONS) {
    if (op === 'insert') {
      // Simple insert for visualization (not full B-Tree implementation)
      const root = nodes.get(rootId)!;

      steps.push({
        operation: 'insert',
        nodes: cloneNodes(nodes),
        rootId,
        targetKey: key,
        currentNodeId: rootId,
        description: `insert(${key}): Start at root`,
        codeLine: 15,
        variables: { key },
      });

      // Find insert position
      let insertNode = root;
      let i = 0;
      while (i < insertNode.keys.length && key > insertNode.keys[i]) {
        i++;
      }

      // Insert key
      insertNode.keys.splice(i, 0, key);
      insertNode.keys.sort((a, b) => a - b);

      steps.push({
        operation: 'insert',
        nodes: cloneNodes(nodes),
        rootId,
        targetKey: key,
        currentNodeId: rootId,
        highlightKeyIndex: insertNode.keys.indexOf(key),
        description: `Inserted ${key} at position ${i}. Keys: [${insertNode.keys.join(', ')}]`,
        codeLine: 18,
        variables: { key, position: i },
      });

      // Check if split needed
      if (insertNode.keys.length >= ORDER) {
        const medianIndex = Math.floor(insertNode.keys.length / 2);
        const medianKey = insertNode.keys[medianIndex];
        const leftKeys = insertNode.keys.slice(0, medianIndex);
        const rightKeys = insertNode.keys.slice(medianIndex + 1);

        steps.push({
          operation: 'split',
          nodes: cloneNodes(nodes),
          rootId,
          currentNodeId: rootId,
          description: `Node full (${insertNode.keys.length} keys)! Split: median=${medianKey}, left=[${leftKeys.join(',')}], right=[${rightKeys.join(',')}]`,
          codeLine: 17,
          variables: { median: medianKey },
          splitInfo: {
            nodeId: rootId,
            medianKey,
            leftKeys,
            rightKeys,
          },
        });

        // Create new structure after split
        const leftId = generateNodeId();
        const rightId = generateNodeId();
        const newRootId = generateNodeId();

        nodes.set(leftId, {
          id: leftId,
          keys: leftKeys,
          children: [],
          isLeaf: true,
        });

        nodes.set(rightId, {
          id: rightId,
          keys: rightKeys,
          children: [],
          isLeaf: true,
        });

        nodes.set(newRootId, {
          id: newRootId,
          keys: [medianKey],
          children: [leftId, rightId],
          isLeaf: false,
        });

        nodes.delete(rootId);
        rootId = newRootId;

        steps.push({
          operation: 'split',
          nodes: cloneNodes(nodes),
          rootId,
          description: `Split complete! New root with median ${medianKey}`,
          codeLine: 17,
          variables: { newRoot: medianKey },
        });
      }
    } else {
      // Search operation
      steps.push({
        operation: 'search',
        nodes: cloneNodes(nodes),
        rootId,
        targetKey: key,
        currentNodeId: rootId,
        description: `search(${key}): Start at root`,
        codeLine: 5,
        variables: { key },
      });

      const searchInNode = (nodeId: string): boolean => {
        const node = nodes.get(nodeId)!;

        for (let i = 0; i < node.keys.length; i++) {
          steps.push({
            operation: 'compare',
            nodes: cloneNodes(nodes),
            rootId,
            targetKey: key,
            currentNodeId: nodeId,
            highlightKeyIndex: i,
            description: `Compare ${key} with keys[${i}]=${node.keys[i]}`,
            codeLine: 7,
            variables: { key, comparing: node.keys[i], i },
          });

          if (key === node.keys[i]) {
            steps.push({
              operation: 'found',
              nodes: cloneNodes(nodes),
              rootId,
              targetKey: key,
              currentNodeId: nodeId,
              highlightKeyIndex: i,
              description: `Found ${key} at index ${i}!`,
              codeLine: 10,
              variables: { key, index: i },
            });
            return true;
          }

          if (key < node.keys[i]) {
            if (node.isLeaf) {
              steps.push({
                operation: 'notFound',
                nodes: cloneNodes(nodes),
                rootId,
                targetKey: key,
                currentNodeId: nodeId,
                description: `${key} < ${node.keys[i]} but node is leaf. Not found!`,
                codeLine: 12,
                variables: { key },
              });
              return false;
            }
            // Would descend to child[i]
            break;
          }
        }

        if (node.isLeaf) {
          steps.push({
            operation: 'notFound',
            nodes: cloneNodes(nodes),
            rootId,
            targetKey: key,
            currentNodeId: nodeId,
            description: `${key} > all keys in leaf node. Not found!`,
            codeLine: 12,
            variables: { key },
          });
          return false;
        }

        return false; // Simplified - real B-Tree would descend
      };

      searchInNode(rootId);
    }
  }

  // Final state
  const allKeys: number[] = [];
  nodes.forEach(node => allKeys.push(...node.keys));

  steps.push({
    operation: 'done',
    nodes: cloneNodes(nodes),
    rootId,
    description: `✓ Done! B-Tree contains ${allKeys.length} keys across ${nodes.size} nodes.`,
    codeLine: -1,
    variables: { totalKeys: allKeys.length, totalNodes: nodes.size },
  });

  return steps;
}

const BTreeVisualizerComponent: React.FC<BTreeVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'btree-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'btree', scrollToId: VISUALIZER_ID });

  const generateSteps = useMemo(() => generateBTreeSteps, []);

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
  } = useVisualizerPlayback<BTreeStep>({
    generateSteps,
  });

  const stepData: BTreeStep = currentStepData || {
    operation: 'init',
    nodes: new Map(),
    rootId: '',
    description: '',
  };

  const { nodes, rootId, currentNodeId, highlightKeyIndex, description, targetKey, splitInfo } = stepData;

  const getNodeStyle = (nodeId: string): string => {
    if (nodeId === currentNodeId) {
      if (stepData.operation === 'found') {
        return 'border-green-500 bg-green-50';
      }
      if (stepData.operation === 'notFound') {
        return 'border-red-400 bg-red-50';
      }
      if (stepData.operation === 'split') {
        return 'border-purple-500 bg-purple-50';
      }
      return 'border-yellow-400 bg-yellow-50';
    }
    return 'border-gray-300 bg-white';
  };

  const getKeyStyle = (nodeId: string, keyIndex: number): string => {
    if (nodeId === currentNodeId && keyIndex === highlightKeyIndex) {
      if (stepData.operation === 'found') {
        return 'bg-green-500 text-white';
      }
      if (stepData.operation === 'insert') {
        return 'bg-green-500 text-white';
      }
      return 'bg-blue-500 text-white';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusVariant = () => {
    if (stepData.operation === 'notFound') return 'error' as const;
    if (stepData.operation === 'found') return 'success' as const;
    if (stepData.operation === 'split') return 'warning' as const;
    if (stepData.operation === 'done') return 'success' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  // Render tree recursively
  const renderNode = (nodeId: string, level: number = 0): React.ReactNode => {
    const node = nodes.get(nodeId);
    if (!node) return null;

    return (
      <div key={nodeId} className="flex flex-col items-center">
        {/* Node box */}
        <div
          className={`
            flex items-center gap-0.5 px-2 py-1 rounded-lg border-2 transition-all
            ${getNodeStyle(nodeId)}
          `}
        >
          {node.keys.length === 0 ? (
            <span className="text-gray-400 text-xs px-2">empty</span>
          ) : (
            node.keys.map((key, idx) => (
              <div
                key={idx}
                className={`
                  px-2 py-1 rounded text-sm font-mono font-bold transition-all
                  ${getKeyStyle(nodeId, idx)}
                `}
              >
                {key}
              </div>
            ))
          )}
        </div>

        {/* Children */}
        {node.children.length > 0 && (
          <div className="mt-2 flex flex-col items-center">
            {/* Connection lines */}
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex gap-4">
              {node.children.map((childId) => renderNode(childId, level + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id={VISUALIZER_ID}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">B-Tree (Order {ORDER})</h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded">
                Search: O(log n)
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-700 rounded">
                Insert: O(log n)
              </span>
            </div>
          </div>
          <ShareButton onShare={handleShare} accentColor="green" />
        </div>
      </div>

      {/* Visualization Area */}
      <div className="p-4">
        <div className={`flex gap-4 ${showCode ? 'flex-col lg:flex-row' : ''}`}>
          {/* Main Visualization */}
          <VisualizationArea minHeight={350} className={showCode ? 'flex-1' : 'w-full'}>
            {/* Key Concept */}
            <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200">
              <div className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                <span className="text-lg">🌳</span> B-Tree Properties
              </div>
              <div className="text-xs text-gray-700 space-y-1">
                <p><strong>Self-balancing:</strong> All leaves at same depth</p>
                <p><strong>Order {ORDER}:</strong> Max {ORDER - 1} keys, {ORDER} children per node</p>
                <p><strong>Sorted:</strong> Keys within node are sorted</p>
                <p><strong>Use case:</strong> Database indexes, file systems</p>
              </div>
            </div>

            {/* Tree Visualization */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[150px] flex items-center justify-center">
              {nodes.size > 0 ? (
                renderNode(rootId)
              ) : (
                <span className="text-gray-400">Empty tree</span>
              )}
            </div>

            {/* Current Operation */}
            {targetKey !== undefined && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm">
                  <span className="text-gray-500">Target key: </span>
                  <span className="font-mono font-bold text-emerald-600">{targetKey}</span>
                </div>
              </div>
            )}

            {/* Split Info */}
            {splitInfo && (
              <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-sm font-medium text-purple-800 mb-1">Node Split</div>
                <div className="text-xs text-purple-700 font-mono">
                  <div>Median: <strong>{splitInfo.medianKey}</strong> (promoted)</div>
                  <div>Left: [{splitInfo.leftKeys.join(', ')}]</div>
                  <div>Right: [{splitInfo.rightKeys.join(', ')}]</div>
                </div>
              </div>
            )}

            {/* Operations Queue */}
            <div className="mb-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs font-medium text-blue-800 mb-1">Operations</div>
              <div className="text-xs text-blue-700 font-mono">
                {OPERATIONS.map((op, i) => (
                  <span key={i} className="mr-2">
                    {op.op}({op.key})
                  </span>
                ))}
              </div>
            </div>

            {/* Status */}
            <StatusPanel
              description={description}
              currentStep={currentStep}
              totalSteps={steps.length}
              variant={getStatusVariant()}
            />
          </VisualizationArea>

          {/* Code Panel */}
          {showCode && (
            <div className="w-full lg:w-56 flex-shrink-0 space-y-2">
              <CodePanel
                code={BTREE_CODE}
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
            accentColor="green"
          />
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
};

export const BTreeVisualizer = React.memo(BTreeVisualizerComponent);
export default BTreeVisualizer;
