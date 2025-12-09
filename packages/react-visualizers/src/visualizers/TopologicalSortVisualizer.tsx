import React, { useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';

interface GraphNode {
  id: string;
  x: number;
  y: number;
  inDegree: number;
}

interface TopoStep {
  operation: 'init' | 'countDegrees' | 'addToQueue' | 'process' | 'addNeighbors' | 'cycle' | 'done';
  nodes: GraphNode[];
  edges: Array<[string, string]>;
  queue: string[];
  result: string[];
  currentNode?: string;
  processedEdge?: [string, string];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
}

interface TopologicalSortVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

// DAG for task dependencies
const INITIAL_NODES: GraphNode[] = [
  { id: 'A', x: 80, y: 50, inDegree: 0 },
  { id: 'B', x: 200, y: 50, inDegree: 0 },
  { id: 'C', x: 80, y: 150, inDegree: 0 },
  { id: 'D', x: 200, y: 150, inDegree: 0 },
  { id: 'E', x: 140, y: 250, inDegree: 0 },
  { id: 'F', x: 260, y: 250, inDegree: 0 },
];

const INITIAL_EDGES: Array<[string, string]> = [
  ['A', 'C'],
  ['A', 'D'],
  ['B', 'D'],
  ['C', 'E'],
  ['D', 'E'],
  ['D', 'F'],
];

const TOPO_CODE = [
  'function topologicalSort(graph):',
  '  inDegree = count incoming edges',
  '  queue = nodes with inDegree == 0',
  '  result = []',
  '',
  '  while queue not empty:',
  '    node = queue.dequeue()',
  '    result.append(node)',
  '',
  '    for neighbor in node.neighbors:',
  '      inDegree[neighbor] -= 1',
  '      if inDegree[neighbor] == 0:',
  '        queue.enqueue(neighbor)',
  '',
  '  if len(result) != len(graph):',
  '    return "Cycle detected!"',
  '  return result',
];

const LEGEND_ITEMS = [
  { color: 'bg-gray-100', label: 'Unprocessed', border: '#d1d5db' },
  { color: 'bg-blue-400', label: 'In queue' },
  { color: 'bg-amber-400', label: 'Processing' },
  { color: 'bg-green-400', label: 'Sorted' },
  { color: 'bg-purple-200', label: 'Edge being processed' },
];

const BADGES = [
  { label: 'Time: O(V+E)', variant: 'blue' as const },
  { label: 'Kahn Algorithm', variant: 'cyan' as const },
];

function cloneNodes(nodes: GraphNode[]): GraphNode[] {
  return nodes.map((n) => ({ ...n }));
}

function generateTopoSteps(): TopoStep[] {
  const steps: TopoStep[] = [];
  const nodes = cloneNodes(INITIAL_NODES);
  const edges = [...INITIAL_EDGES];

  // Build adjacency list
  const adj = new Map<string, string[]>();
  for (const node of nodes) {
    adj.set(node.id, []);
  }
  for (const [from, to] of edges) {
    adj.get(from)!.push(to);
  }

  steps.push({
    operation: 'init',
    nodes: cloneNodes(nodes),
    edges: [...edges],
    queue: [],
    result: [],
    description: 'Directed Acyclic Graph (DAG) representing task dependencies. Edges show "must complete before" relationships.',
    codeLine: 0,
  });

  // Count in-degrees
  for (const [, to] of edges) {
    const node = nodes.find((n) => n.id === to)!;
    node.inDegree++;
  }

  steps.push({
    operation: 'countDegrees',
    nodes: cloneNodes(nodes),
    edges: [...edges],
    queue: [],
    result: [],
    description: `Counted in-degrees: ${nodes.map((n) => `${n.id}=${n.inDegree}`).join(', ')}`,
    codeLine: 1,
    variables: Object.fromEntries(nodes.map((n) => [`in[${n.id}]`, n.inDegree])),
  });

  // Initialize queue with in-degree 0 nodes
  const queue: string[] = nodes.filter((n) => n.inDegree === 0).map((n) => n.id);
  const result: string[] = [];

  steps.push({
    operation: 'addToQueue',
    nodes: cloneNodes(nodes),
    edges: [...edges],
    queue: [...queue],
    result: [...result],
    description: `Added nodes with in-degree 0 to queue: [${queue.join(', ')}]`,
    codeLine: 2,
    variables: { queueSize: queue.length },
  });

  // Process queue
  while (queue.length > 0) {
    const current = queue.shift()!;

    steps.push({
      operation: 'process',
      nodes: cloneNodes(nodes),
      edges: [...edges],
      queue: [...queue],
      result: [...result],
      currentNode: current,
      description: `Dequeue node ${current}. Add to result.`,
      codeLine: 6,
      variables: { node: current },
    });

    result.push(current);

    steps.push({
      operation: 'process',
      nodes: cloneNodes(nodes),
      edges: [...edges],
      queue: [...queue],
      result: [...result],
      currentNode: current,
      description: `Result so far: [${result.join(' → ')}]`,
      codeLine: 7,
      variables: { result: result.join(', ') },
    });

    // Process neighbors
    const neighbors = adj.get(current) || [];
    for (const neighbor of neighbors) {
      const neighborNode = nodes.find((n) => n.id === neighbor)!;
      neighborNode.inDegree--;

      steps.push({
        operation: 'addNeighbors',
        nodes: cloneNodes(nodes),
        edges: [...edges],
        queue: [...queue],
        result: [...result],
        currentNode: current,
        processedEdge: [current, neighbor],
        description: `Process edge ${current} → ${neighbor}. Decrease in-degree of ${neighbor} to ${neighborNode.inDegree}`,
        codeLine: 10,
        variables: { neighbor, newInDegree: neighborNode.inDegree },
      });

      if (neighborNode.inDegree === 0) {
        queue.push(neighbor);

        steps.push({
          operation: 'addToQueue',
          nodes: cloneNodes(nodes),
          edges: [...edges],
          queue: [...queue],
          result: [...result],
          currentNode: neighbor,
          description: `Node ${neighbor} now has in-degree 0. Add to queue.`,
          codeLine: 12,
          variables: { neighbor, queueSize: queue.length },
        });
      }
    }
  }

  // Check for cycle
  if (result.length !== nodes.length) {
    steps.push({
      operation: 'cycle',
      nodes: cloneNodes(nodes),
      edges: [...edges],
      queue: [],
      result: [...result],
      description: `⚠️ Cycle detected! Only ${result.length} of ${nodes.length} nodes processed.`,
      codeLine: 15,
    });
  } else {
    steps.push({
      operation: 'done',
      nodes: cloneNodes(nodes),
      edges: [...edges],
      queue: [],
      result: [...result],
      description: `✓ Topological order: ${result.join(' → ')}. All dependencies satisfied!`,
      codeLine: 16,
      variables: { order: result.join(' → ') },
    });
  }

  return steps;
}

const TopologicalSortVisualizerComponent: React.FC<TopologicalSortVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'topo-sort-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'topo', scrollToId: VISUALIZER_ID });

  const generateSteps = useMemo(() => generateTopoSteps, []);

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
  } = useVisualizerPlayback<TopoStep>({
    generateSteps,
  });

  const stepData: TopoStep = currentStepData || {
    operation: 'init',
    nodes: INITIAL_NODES,
    edges: INITIAL_EDGES,
    queue: [],
    result: [],
    description: '',
  };

  const getNodeStyle = (nodeId: string): string => {
    const inResult = stepData.result.includes(nodeId);
    const inQueue = stepData.queue.includes(nodeId);
    const isCurrent = stepData.currentNode === nodeId;

    if (isCurrent) return 'fill-yellow-400 stroke-yellow-600';
    if (inResult) return 'fill-green-400 stroke-green-600';
    if (inQueue) return 'fill-blue-400 stroke-blue-600';
    return 'fill-gray-100 stroke-gray-400';
  };

  const getEdgeStyle = (edge: [string, string]): { stroke: string; strokeWidth: number } => {
    const isProcessed = stepData.processedEdge &&
      stepData.processedEdge[0] === edge[0] &&
      stepData.processedEdge[1] === edge[1];

    if (isProcessed) return { stroke: '#a855f7', strokeWidth: 3 };
    return { stroke: '#9ca3af', strokeWidth: 2 };
  };

  const getStatusVariant = () => {
    if (stepData.operation === 'cycle') return 'error' as const;
    if (stepData.operation === 'done') return 'success' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const visualization = (
    <>
      {/* Info Box */}
      <div className="mb-4 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
        <div className="text-sm font-semibold text-cyan-800 mb-2">
          Topological Sort (Kahn's Algorithm)
        </div>
        <div className="text-xs text-cyan-700 space-y-1">
          <div>• Orders vertices so all edges point forward</div>
          <div>• Uses in-degree counting and BFS</div>
          <div>• Detects cycles (if not all nodes processed)</div>
          <div>• Use cases: task scheduling, build systems, course prerequisites</div>
        </div>
      </div>

            {/* Graph Visualization */}
            <div className="mb-4">
              <svg width="340" height="300" className="mx-auto bg-gray-50 rounded-lg">
                {/* Draw edges */}
                {stepData.edges.map(([from, to], idx) => {
                  const fromNode = stepData.nodes.find((n) => n.id === from)!;
                  const toNode = stepData.nodes.find((n) => n.id === to)!;
                  const style = getEdgeStyle([from, to]);

                  // Calculate arrow position
                  const dx = toNode.x - fromNode.x;
                  const dy = toNode.y - fromNode.y;
                  const len = Math.sqrt(dx * dx + dy * dy);
                  const endX = toNode.x - (dx / len) * 22;
                  const endY = toNode.y - (dy / len) * 22;

                  return (
                    <g key={idx}>
                      <defs>
                        <marker
                          id={`arrow-${idx}`}
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon
                            points="0 0, 10 3.5, 0 7"
                            fill={style.stroke}
                          />
                        </marker>
                      </defs>
                      <line
                        x1={fromNode.x}
                        y1={fromNode.y}
                        x2={endX}
                        y2={endY}
                        stroke={style.stroke}
                        strokeWidth={style.strokeWidth}
                        markerEnd={`url(#arrow-${idx})`}
                      />
                    </g>
                  );
                })}

                {/* Draw nodes */}
                {stepData.nodes.map((node) => (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={22}
                      className={getNodeStyle(node.id)}
                      strokeWidth={2}
                    />
                    <text
                      x={node.x}
                      y={node.y + 5}
                      textAnchor="middle"
                      className="text-sm font-bold fill-gray-800"
                    >
                      {node.id}
                    </text>
                    {/* In-degree badge */}
                    <circle
                      cx={node.x + 16}
                      cy={node.y - 16}
                      r={10}
                      fill="#f3f4f6"
                      stroke="#9ca3af"
                    />
                    <text
                      x={node.x + 16}
                      y={node.y - 12}
                      textAnchor="middle"
                      className="text-[10px] fill-gray-600"
                    >
                      {node.inDegree}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Queue and Result */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 p-3 bg-blue-50 rounded-lg border border-blue-200 min-h-[72px]">
                <div className="text-xs font-medium text-blue-800 mb-2">Queue (in-degree = 0)</div>
                <div className="flex gap-1 min-h-[32px]">
                  {stepData.queue.length === 0 ? (
                    <span className="text-blue-400 text-sm">Empty</span>
                  ) : (
                    stepData.queue.map((id) => (
                      <span
                        key={id}
                        className="w-8 h-8 flex items-center justify-center bg-blue-400 text-white rounded font-bold"
                      >
                        {id}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="flex-1 p-3 bg-green-50 rounded-lg border border-green-200 min-h-[72px]">
                <div className="text-xs font-medium text-green-800 mb-2">Result (sorted order)</div>
                <div className="flex gap-1 min-h-[32px]">
                  {stepData.result.length === 0 ? (
                    <span className="text-green-400 text-sm">Empty</span>
                  ) : (
                    stepData.result.map((id, idx) => (
                      <React.Fragment key={id}>
                        <span className="w-8 h-8 flex items-center justify-center bg-green-400 text-white rounded font-bold">
                          {id}
                        </span>
                        {idx < stepData.result.length - 1 && (
                          <span className="text-green-600">→</span>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </div>
              </div>
            </div>

    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="Topological Sort"
      badges={BADGES}
      gradient="cyan"
      className={className}
      minHeight={400}
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
        accentColor: 'cyan',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? TOPO_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const TopologicalSortVisualizer = React.memo(TopologicalSortVisualizerComponent);
export default TopologicalSortVisualizer;
