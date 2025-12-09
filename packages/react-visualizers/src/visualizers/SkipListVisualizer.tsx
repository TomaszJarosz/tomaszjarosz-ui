import React, { useMemo, useCallback, useState } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
  AccessibleSVG,
} from '../shared';

interface SkipListNode {
  value: number;
  forward: (number | null)[]; // indices of next nodes at each level
  levels: number;
}

type NodeState = 'default' | 'current' | 'found' | 'inserted' | 'path' | 'update';

interface SkipListStep {
  operation: 'init' | 'search' | 'insert' | 'levelUp' | 'found' | 'notFound' | 'done';
  nodes: SkipListNode[];
  currentNode?: number;
  currentLevel?: number;
  searchPath?: Array<{ nodeIdx: number; level: number }>;
  updateNodes?: number[];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
}

interface SkipListVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const MAX_LEVEL = 4;
const HEADER_VALUE = -Infinity;

const SKIPLIST_CODE = [
  'class SkipList:',
  '  def search(key):',
  '    current = header',
  '    for level in range(maxLevel, -1, -1):',
  '      while current.forward[level] &&',
  '            current.forward[level].key < key:',
  '        current = current.forward[level]',
  '    current = current.forward[0]',
  '    return current if current.key == key',
  '',
  '  def insert(key):',
  '    update = [None] * maxLevel',
  '    current = header',
  '    for level in range(maxLevel, -1, -1):',
  '      while current.forward[level] &&',
  '            current.forward[level].key < key:',
  '        current = current.forward[level]',
  '      update[level] = current',
  '    newLevel = randomLevel()',
  '    newNode = Node(key, newLevel)',
  '    for i in range(newLevel):',
  '      newNode.forward[i] = update[i].forward[i]',
  '      update[i].forward[i] = newNode',
];

const LEGEND_ITEMS = [
  { color: 'bg-blue-100', label: 'Default node', border: '#60a5fa' },
  { color: 'bg-amber-400', label: 'Current' },
  { color: 'bg-green-400', label: 'Found/Inserted' },
  { color: 'bg-purple-200', label: 'Search path' },
  { color: 'bg-orange-200', label: 'Update pointers' },
];

const BADGES = [
  { label: 'Search: O(log n)', variant: 'purple' as const },
  { label: 'Space: O(n)', variant: 'indigo' as const },
];

function randomLevel(): number {
  let level = 1;
  while (Math.random() < 0.5 && level < MAX_LEVEL) {
    level++;
  }
  return level;
}

function createInitialSkipList(): SkipListNode[] {
  // Create header + some initial nodes
  const nodes: SkipListNode[] = [
    { value: HEADER_VALUE, forward: [1, 1, 3, null], levels: MAX_LEVEL }, // header
    { value: 3, forward: [2, 2, 3, null], levels: 3 },
    { value: 6, forward: [3, 3, null, null], levels: 2 },
    { value: 7, forward: [4, null, null, null], levels: 1 },
    { value: 9, forward: [5, 5, null, null], levels: 2 },
    { value: 12, forward: [null, null, null, null], levels: 1 },
  ];
  return nodes;
}

function cloneNodes(nodes: SkipListNode[]): SkipListNode[] {
  return nodes.map((node) => ({
    ...node,
    forward: [...node.forward],
  }));
}

function generateSkipListSteps(): SkipListStep[] {
  const steps: SkipListStep[] = [];
  let nodes = createInitialSkipList();

  // Step 1: Init
  steps.push({
    operation: 'init',
    nodes: cloneNodes(nodes),
    description: 'Skip List with 6 nodes. Header points to first node at each level. Higher levels skip more nodes.',
    codeLine: 0,
  });

  // Step 2-N: Search for 9
  const searchKey = 9;
  let currentIdx = 0;
  const searchPath: Array<{ nodeIdx: number; level: number }> = [];

  steps.push({
    operation: 'search',
    nodes: cloneNodes(nodes),
    currentNode: 0,
    currentLevel: MAX_LEVEL - 1,
    searchPath: [],
    description: `Search for ${searchKey}. Start at header, highest level (${MAX_LEVEL - 1}).`,
    codeLine: 3,
    variables: { key: searchKey, level: MAX_LEVEL - 1 },
  });

  for (let level = MAX_LEVEL - 1; level >= 0; level--) {
    // Move forward at this level
    while (true) {
      const forwardIdx = nodes[currentIdx].forward[level];
      if (forwardIdx === null || nodes[forwardIdx].value >= searchKey) {
        break;
      }

      searchPath.push({ nodeIdx: currentIdx, level });
      currentIdx = forwardIdx;

      steps.push({
        operation: 'search',
        nodes: cloneNodes(nodes),
        currentNode: currentIdx,
        currentLevel: level,
        searchPath: [...searchPath],
        description: `Level ${level}: Move to node ${nodes[currentIdx].value} (< ${searchKey})`,
        codeLine: 6,
        variables: { current: nodes[currentIdx].value, level },
      });
    }

    searchPath.push({ nodeIdx: currentIdx, level });

    if (level > 0) {
      steps.push({
        operation: 'levelUp',
        nodes: cloneNodes(nodes),
        currentNode: currentIdx,
        currentLevel: level - 1,
        searchPath: [...searchPath],
        description: `Level ${level}: Can't go further. Drop to level ${level - 1}.`,
        codeLine: 4,
        variables: { level: level - 1 },
      });
    }
  }

  // Check if found
  const nextIdx = nodes[currentIdx].forward[0];
  if (nextIdx !== null && nodes[nextIdx].value === searchKey) {
    steps.push({
      operation: 'found',
      nodes: cloneNodes(nodes),
      currentNode: nextIdx,
      searchPath: [...searchPath],
      description: `✓ Found ${searchKey}! Search complete.`,
      codeLine: 8,
      variables: { key: searchKey, found: 'true' },
    });
  }

  // Step N+1 to M: Insert 8
  const insertKey = 8;
  currentIdx = 0;
  const updateNodes: number[] = [];
  const insertPath: Array<{ nodeIdx: number; level: number }> = [];

  steps.push({
    operation: 'insert',
    nodes: cloneNodes(nodes),
    currentNode: 0,
    currentLevel: MAX_LEVEL - 1,
    description: `Insert ${insertKey}. Find position and track update pointers.`,
    codeLine: 10,
    variables: { key: insertKey },
  });

  // Build update array
  for (let level = MAX_LEVEL - 1; level >= 0; level--) {
    while (true) {
      const forwardIdx = nodes[currentIdx].forward[level];
      if (forwardIdx === null || nodes[forwardIdx].value >= insertKey) {
        break;
      }
      currentIdx = forwardIdx;
      insertPath.push({ nodeIdx: currentIdx, level });

      steps.push({
        operation: 'insert',
        nodes: cloneNodes(nodes),
        currentNode: currentIdx,
        currentLevel: level,
        searchPath: [...insertPath],
        updateNodes: [...updateNodes],
        description: `Level ${level}: Move to node ${nodes[currentIdx].value}`,
        codeLine: 16,
        variables: { current: nodes[currentIdx].value, level },
      });
    }

    updateNodes.push(currentIdx);
    steps.push({
      operation: 'insert',
      nodes: cloneNodes(nodes),
      currentNode: currentIdx,
      currentLevel: level,
      searchPath: [...insertPath],
      updateNodes: [...updateNodes],
      description: `Level ${level}: update[${level}] = node ${nodes[currentIdx].value === HEADER_VALUE ? 'header' : nodes[currentIdx].value}`,
      codeLine: 17,
      variables: { updateLevel: level, updateNode: nodes[currentIdx].value === HEADER_VALUE ? 'header' : nodes[currentIdx].value },
    });
  }

  // Insert new node with random level (fix to level 2 for visualization)
  const newNodeLevel = 2;
  const newNodeIdx = nodes.length;

  // Find insert position
  const insertAfterIdx = updateNodes[updateNodes.length - 1];
  const insertBeforeIdx = nodes[insertAfterIdx].forward[0];

  // Create new node
  const newNode: SkipListNode = {
    value: insertKey,
    forward: new Array(MAX_LEVEL).fill(null),
    levels: newNodeLevel,
  };

  // Update forward pointers
  for (let i = 0; i < newNodeLevel; i++) {
    const updateIdx = updateNodes[updateNodes.length - 1 - i];
    newNode.forward[i] = nodes[updateIdx].forward[i];
    nodes[updateIdx].forward[i] = newNodeIdx;
  }

  nodes.push(newNode);

  steps.push({
    operation: 'insert',
    nodes: cloneNodes(nodes),
    currentNode: newNodeIdx,
    updateNodes: [...updateNodes],
    description: `Create new node with value ${insertKey}, level ${newNodeLevel}. Update pointers.`,
    codeLine: 19,
    variables: { newLevel: newNodeLevel, key: insertKey },
  });

  steps.push({
    operation: 'done',
    nodes: cloneNodes(nodes),
    currentNode: newNodeIdx,
    description: `✓ Inserted ${insertKey} into Skip List. New node has ${newNodeLevel} levels.`,
    codeLine: 22,
  });

  return steps;
}

const SkipListVisualizerComponent: React.FC<SkipListVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'skiplist-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'skiplist', scrollToId: VISUALIZER_ID });

  const generateSteps = useMemo(() => generateSkipListSteps, []);

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
  } = useVisualizerPlayback<SkipListStep>({
    generateSteps,
  });

  const stepData: SkipListStep = currentStepData || {
    operation: 'init',
    nodes: createInitialSkipList(),
    description: '',
  };

  const getNodeState = (nodeIdx: number, level?: number): NodeState => {
    if (stepData.currentNode === nodeIdx) return 'current';
    if (stepData.operation === 'found' && stepData.currentNode === nodeIdx) return 'found';
    if (stepData.operation === 'done' && stepData.currentNode === nodeIdx) return 'inserted';
    if (stepData.updateNodes?.includes(nodeIdx)) return 'update';
    if (stepData.searchPath?.some((p) => p.nodeIdx === nodeIdx)) return 'path';
    return 'default';
  };

  const getNodeStyle = (state: NodeState): string => {
    switch (state) {
      case 'current':
        return 'bg-amber-400 ring-2 ring-amber-600';
      case 'found':
      case 'inserted':
        return 'bg-green-400 ring-2 ring-green-600';
      case 'path':
        return 'bg-purple-200';
      case 'update':
        return 'bg-orange-200';
      default:
        return 'bg-blue-100 border-blue-400';
    }
  };

  const getStatusVariant = () => {
    if (stepData.operation === 'notFound') return 'error' as const;
    if (stepData.operation === 'found' || stepData.operation === 'done') return 'success' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  // Calculate positions for nodes
  const nodePositions: Array<{ x: number; y: number }> = [];
  const NODE_WIDTH = 60;
  const NODE_HEIGHT = 30;
  const LEVEL_HEIGHT = 40;
  const START_X = 40;
  const START_Y = 20;

  stepData.nodes.forEach((node, idx) => {
    nodePositions.push({
      x: START_X + idx * (NODE_WIDTH + 40),
      y: START_Y,
    });
  });

  const visualization = (
    <>
      {/* Info Box */}
      <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-purple-50 rounded-lg border border-purple-200">
        <div className="text-sm font-semibold text-purple-800 mb-2">
          Skip List
        </div>
        <div className="text-xs text-purple-700 space-y-1">
          <div>• Probabilistic data structure for sorted data</div>
          <div>• Multiple layers of linked lists</div>
          <div>• Higher levels skip more nodes (express lanes)</div>
          <div>• Expected O(log n) search, insert, delete</div>
        </div>
      </div>

            {/* Skip List Visualization */}
            <div className="relative overflow-x-auto pb-4">
              <AccessibleSVG
                width={Math.max(600, stepData.nodes.length * 100 + 100)}
                height={MAX_LEVEL * LEVEL_HEIGHT + 100}
                className="mx-auto"
                title="Skip List data structure visualization"
                description={`Skip List with ${stepData.nodes.length} nodes across ${MAX_LEVEL} levels. ${stepData.operation === 'search' ? 'Searching' : stepData.operation === 'insert' ? 'Inserting' : ''} ${stepData.currentNode !== undefined ? `at node index ${stepData.currentNode}` : ''}`}
              >
                {/* Level labels */}
                {Array.from({ length: MAX_LEVEL }, (_, level) => (
                  <text
                    key={`level-${level}`}
                    x={10}
                    y={START_Y + (MAX_LEVEL - 1 - level) * LEVEL_HEIGHT + NODE_HEIGHT / 2 + 5}
                    className="text-xs fill-gray-500"
                  >
                    L{level}
                  </text>
                ))}

                {/* Draw connections first (behind nodes) */}
                {stepData.nodes.map((node, nodeIdx) => (
                  <React.Fragment key={`connections-${nodeIdx}`}>
                    {node.forward.map((nextIdx, level) => {
                      if (nextIdx === null || level >= node.levels) return null;
                      const startX = nodePositions[nodeIdx].x + NODE_WIDTH;
                      const startY = nodePositions[nodeIdx].y + (MAX_LEVEL - 1 - level) * LEVEL_HEIGHT + NODE_HEIGHT / 2;
                      const endX = nodePositions[nextIdx].x;
                      const endY = nodePositions[nextIdx].y + (MAX_LEVEL - 1 - level) * LEVEL_HEIGHT + NODE_HEIGHT / 2;

                      const isOnPath = stepData.searchPath?.some(
                        (p) => p.nodeIdx === nodeIdx && p.level === level
                      );

                      return (
                        <line
                          key={`line-${nodeIdx}-${level}`}
                          x1={startX}
                          y1={startY}
                          x2={endX}
                          y2={endY}
                          stroke={isOnPath ? '#8b5cf6' : '#94a3b8'}
                          strokeWidth={isOnPath ? 2 : 1}
                          markerEnd="url(#arrowhead)"
                        />
                      );
                    })}
                  </React.Fragment>
                ))}

                {/* Arrow marker */}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                  </marker>
                </defs>

                {/* Draw nodes */}
                {stepData.nodes.map((node, nodeIdx) => (
                  <g key={`node-${nodeIdx}`}>
                    {/* Node boxes at each level */}
                    {Array.from({ length: node.levels }, (_, level) => {
                      const x = nodePositions[nodeIdx].x;
                      const y = nodePositions[nodeIdx].y + (MAX_LEVEL - 1 - level) * LEVEL_HEIGHT;
                      const state = getNodeState(nodeIdx, level);

                      return (
                        <g key={`node-${nodeIdx}-level-${level}`}>
                          <rect
                            x={x}
                            y={y}
                            width={NODE_WIDTH}
                            height={NODE_HEIGHT}
                            rx={4}
                            className={`${state === 'current' ? 'fill-amber-400 stroke-amber-600' :
                              state === 'found' || state === 'inserted' ? 'fill-green-400 stroke-green-600' :
                                state === 'path' ? 'fill-purple-200 stroke-purple-400' :
                                  state === 'update' ? 'fill-orange-200 stroke-orange-400' :
                                    'fill-blue-100 stroke-blue-400'
                              }`}
                            strokeWidth={state === 'current' || state === 'found' || state === 'inserted' ? 2 : 1}
                          />
                          <text
                            x={x + NODE_WIDTH / 2}
                            y={y + NODE_HEIGHT / 2 + 4}
                            textAnchor="middle"
                            className="text-sm font-medium fill-gray-900"
                          >
                            {node.value === HEADER_VALUE ? 'H' : node.value}
                          </text>
                        </g>
                      );
                    })}

                    {/* Vertical connectors between levels */}
                    {Array.from({ length: node.levels - 1 }, (_, i) => {
                      const x = nodePositions[nodeIdx].x + NODE_WIDTH / 2;
                      const y1 = nodePositions[nodeIdx].y + (MAX_LEVEL - 1 - i) * LEVEL_HEIGHT + NODE_HEIGHT;
                      const y2 = nodePositions[nodeIdx].y + (MAX_LEVEL - 2 - i) * LEVEL_HEIGHT;
                      return (
                        <line
                          key={`vline-${nodeIdx}-${i}`}
                          x1={x}
                          y1={y1}
                          x2={x}
                          y2={y2}
                          stroke="#94a3b8"
                          strokeWidth={1}
                          strokeDasharray="3,3"
                        />
                      );
                    })}
                  </g>
                ))}

                {/* Current level indicator */}
                {stepData.currentLevel !== undefined && stepData.currentNode !== undefined && (
                  <rect
                    x={nodePositions[stepData.currentNode].x - 3}
                    y={nodePositions[stepData.currentNode].y + (MAX_LEVEL - 1 - stepData.currentLevel) * LEVEL_HEIGHT - 3}
                    width={NODE_WIDTH + 6}
                    height={NODE_HEIGHT + 6}
                    rx={6}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5,3"
                    aria-hidden="true"
                  />
                )}
              </AccessibleSVG>
            </div>

    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="Skip List"
      badges={BADGES}
      gradient="purple"
      className={className}
      minHeight={360}
      onShare={handleShare}
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
        accentColor: 'purple',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? SKIPLIST_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const SkipListVisualizer = React.memo(SkipListVisualizerComponent);
export default SkipListVisualizer;
