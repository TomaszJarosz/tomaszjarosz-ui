import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';

interface Node {
  id: number;
  x: number;
  y: number;
}

interface Edge {
  from: number;
  to: number;
  weight: number;
}

interface DijkstraStep {
  current: number;
  distances: number[];
  visited: number[];
  previous: (number | null)[];
  priorityQueue: { node: number; dist: number }[];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
}

interface DijkstraVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const BADGES = [
  { label: 'Time: O((V+E) log V)', variant: 'orange' as const },
  { label: 'Space: O(V)', variant: 'amber' as const },
];

// Algorithm code snippets
const DIJKSTRA_CODE = [
  'dijkstra(graph, start):',
  '  dist[start]=0, dist[*]=∞',
  '  pq.add((0, start))',
  '  while pq not empty:',
  '    (d,u) = pq.extractMin()',
  '    if visited[u]: continue',
  '    visited[u] = true',
  '    for neighbor v of u:',
  '      if dist[u]+w < dist[v]:',
  '        dist[v] = dist[u]+w',
  '        pq.add((dist[v], v))',
];

const LEGEND_ITEMS = [
  { color: 'bg-blue-100', label: 'Unvisited', border: '#60a5fa' },
  { color: 'bg-yellow-400', label: 'Current', border: '#ca8a04' },
  { color: 'bg-green-400', label: 'Visited', border: '#16a34a' },
];

// Generate a weighted graph
function generateGraph(): {
  nodes: Node[];
  edges: Edge[];
  adjacencyList: Map<number, { to: number; weight: number }[]>;
} {
  const nodes: Node[] = [
    { id: 0, x: 60, y: 150 }, // Start
    { id: 1, x: 150, y: 60 },
    { id: 2, x: 150, y: 240 },
    { id: 3, x: 260, y: 100 },
    { id: 4, x: 260, y: 200 },
    { id: 5, x: 360, y: 150 }, // End
  ];

  const edges: Edge[] = [
    { from: 0, to: 1, weight: 4 },
    { from: 0, to: 2, weight: 2 },
    { from: 1, to: 3, weight: 5 },
    { from: 2, to: 1, weight: 1 },
    { from: 2, to: 4, weight: 4 },
    { from: 3, to: 5, weight: 2 },
    { from: 4, to: 3, weight: 1 },
    { from: 4, to: 5, weight: 3 },
  ];

  const adjacencyList = new Map<number, { to: number; weight: number }[]>();
  nodes.forEach((node) => adjacencyList.set(node.id, []));
  edges.forEach(({ from, to, weight }) => {
    adjacencyList.get(from)?.push({ to, weight });
  });

  return { nodes, edges, adjacencyList };
}

function generateDijkstraSteps(
  nodes: Node[],
  adjacencyList: Map<number, { to: number; weight: number }[]>,
  startNode: number
): DijkstraStep[] {
  const steps: DijkstraStep[] = [];
  const n = nodes.length;
  const distances = Array(n).fill(Infinity);
  const visited: number[] = [];
  const previous: (number | null)[] = Array(n).fill(null);
  const pq: { node: number; dist: number }[] = [];

  distances[startNode] = 0;
  pq.push({ node: startNode, dist: 0 });

  steps.push({
    current: -1,
    distances: [...distances],
    visited: [],
    previous: [...previous],
    priorityQueue: [...pq],
    description: `Initialize: dist[${startNode}] = 0, all others = ∞. Add source to priority queue.`,
    codeLine: 1,
    variables: { start: startNode, 'dist[start]': 0 },
  });

  while (pq.length > 0) {
    // Sort by distance and get minimum
    pq.sort((a, b) => a.dist - b.dist);
    const shifted = pq.shift();
    if (!shifted) break;
    const { node: current, dist: currentDist } = shifted;

    if (visited.includes(current)) {
      steps.push({
        current,
        distances: [...distances],
        visited: [...visited],
        previous: [...previous],
        priorityQueue: [...pq],
        description: `Node ${current} already visited, skip it`,
        codeLine: 5,
        variables: { u: current },
      });
      continue;
    }

    visited.push(current);

    steps.push({
      current,
      distances: [...distances],
      visited: [...visited],
      previous: [...previous],
      priorityQueue: [...pq],
      description: `Extract min from PQ: node ${current} with dist = ${currentDist}. Mark as visited.`,
      codeLine: 6,
      variables: { u: current, d: currentDist },
    });

    const neighbors = adjacencyList.get(current) || [];
    for (const { to, weight } of neighbors) {
      if (visited.includes(to)) continue;

      const newDist = distances[current] + weight;

      steps.push({
        current,
        distances: [...distances],
        visited: [...visited],
        previous: [...previous],
        priorityQueue: [...pq],
        description: `Check edge ${current}→${to} (weight=${weight}): dist[${current}] + ${weight} = ${newDist}, current dist[${to}] = ${distances[to] === Infinity ? '∞' : distances[to]}`,
        codeLine: 8,
        variables: {
          u: current,
          v: to,
          w: weight,
          'new dist': newDist,
          'old dist': distances[to] === Infinity ? '∞' : distances[to],
        },
      });

      if (newDist < distances[to]) {
        const oldDist = distances[to];
        distances[to] = newDist;
        previous[to] = current;
        pq.push({ node: to, dist: newDist });

        steps.push({
          current,
          distances: [...distances],
          visited: [...visited],
          previous: [...previous],
          priorityQueue: [...pq],
          description: `Relax! ${newDist} < ${oldDist === Infinity ? '∞' : oldDist} → Update dist[${to}] = ${newDist}, add to PQ`,
          codeLine: 10,
          variables: { v: to, 'dist[v]': newDist, via: current },
        });
      }
    }
  }

  steps.push({
    current: -1,
    distances: [...distances],
    visited: [...visited],
    previous: [...previous],
    priorityQueue: [],
    description: `✓ Done! Shortest paths from node ${startNode}: [${distances.map((d, i) => `${i}:${d}`).join(', ')}]`,
    codeLine: -1,
  });

  return steps;
}

const DijkstraVisualizerComponent: React.FC<DijkstraVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'dijkstra-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'dijkstra', scrollToId: VISUALIZER_ID });
  const [graph] = useState(() => generateGraph());

  const generateSteps = useMemo(
    () => () => generateDijkstraSteps(graph.nodes, graph.adjacencyList, 0),
    [graph]
  );

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
  } = useVisualizerPlayback<DijkstraStep>({
    generateSteps,
  });

  const stepData = currentStepData || {
    current: -1,
    visited: [] as number[],
    distances: [] as number[],
    priorityQueue: [] as { node: number; dist: number }[],
    previous: [] as (number | null)[],
    description: '',
    codeLine: -1,
    variables: undefined,
  };
  const { current, visited, distances, priorityQueue, description } = stepData;

  const getNodeColor = (nodeId: number): string => {
    if (nodeId === current) return 'fill-yellow-400 stroke-yellow-600';
    if (visited.includes(nodeId)) return 'fill-green-400 stroke-green-600';
    return 'fill-blue-100 stroke-blue-400';
  };

  const getNodeTextColor = (nodeId: number): string => {
    if (nodeId === current) return 'fill-yellow-900';
    if (visited.includes(nodeId)) return 'fill-green-900';
    return 'fill-blue-700';
  };

  const getStatusVariant = () => {
    if (currentStep === steps.length - 1) return 'success' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const visualization = (
    <>
      {/* Distance Array - PROMINENT */}
      <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
        <div className="text-sm font-semibold text-orange-800 mb-3">
          Distance Array (shortest paths from node 0)
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {distances.map((dist, idx) => {
            const isSource = idx === 0;
            const isCurrent = idx === current;
            const isVisited = visited.includes(idx);

            return (
              <div
                key={idx}
                className={`flex flex-col items-center p-2 rounded-lg border-2 min-w-[60px] transition-colors ${
                  isCurrent
                    ? 'bg-yellow-100 border-yellow-400 ring-2 ring-yellow-300'
                    : isVisited
                      ? 'bg-green-100 border-green-400'
                      : 'bg-white border-gray-300'
                }`}
              >
                <div className={`text-xs font-medium ${
                  isCurrent ? 'text-yellow-800' : isVisited ? 'text-green-800' : 'text-gray-500'
                }`}>
                  Node {idx}
                  {isSource && <span className="ml-1">(src)</span>}
                </div>
                <div className={`text-xl font-bold font-mono ${
                  isCurrent ? 'text-yellow-900' : isVisited ? 'text-green-900' : 'text-gray-700'
                }`}>
                  {dist === Infinity ? '∞' : dist}
                </div>
                {isCurrent && <div className="text-xs text-yellow-700 font-bold">← PROCESSING</div>}
                {isVisited && !isCurrent && <div className="text-xs text-green-600">✓ Final</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Relaxation Explanation */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm font-semibold text-blue-800 mb-2">
          Relaxation Formula
        </div>
        <div className="font-mono text-sm text-center">
          if dist[u] + weight(u,v) &lt; dist[v] → <span className="text-green-600 font-bold">update dist[v]</span>
        </div>
      </div>

      {/* Priority Queue - More visible */}
      <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-orange-800">Priority Queue (min-heap)</span>
          <span className="text-xs text-orange-600">(node:distance)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {priorityQueue.length > 0 ? (
            priorityQueue
              .sort((a, b) => a.dist - b.dist)
              .map((item, index) => (
                <span
                  key={index}
                  className={`px-3 py-1.5 rounded-lg font-mono text-sm font-medium ${
                    index === 0
                      ? 'bg-orange-200 text-orange-900 ring-2 ring-orange-400'
                      : 'bg-white text-orange-800 border border-orange-300'
                  }`}
                >
                  {item.node}:{item.dist}
                  {index === 0 && <span className="ml-1 text-xs">← MIN</span>}
                </span>
              ))
          ) : (
            <span className="text-sm text-gray-400 italic">empty</span>
          )}
        </div>
      </div>

      {/* Graph SVG */}
      <div className="bg-gray-50 rounded-lg">
        <svg viewBox="0 0 420 300" className="w-full h-64 md:h-72">
          {/* Edges with weights */}
          {graph.edges.map((edge, index) => {
            const fromNode = graph.nodes[edge.from];
            const toNode = graph.nodes[edge.to];
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;

            // Offset for weight label
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const offsetX = (-dy / len) * 12;
            const offsetY = (dx / len) * 12;

            return (
              <g key={index}>
                {/* Arrow line */}
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  className="stroke-gray-400 stroke-2"
                  markerEnd="url(#arrowhead)"
                />
                {/* Weight label */}
                <circle
                  cx={midX + offsetX}
                  cy={midY + offsetY}
                  r={10}
                  className="fill-white stroke-gray-300"
                />
                <text
                  x={midX + offsetX}
                  y={midY + offsetY + 4}
                  textAnchor="middle"
                  className="text-xs font-bold fill-gray-600"
                >
                  {edge.weight}
                </text>
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="28"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                className="fill-gray-400"
              />
            </marker>
          </defs>

          {/* Nodes */}
          {graph.nodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={22}
                className={`${getNodeColor(node.id)} stroke-2 transition-colors duration-300`}
              />
              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                className={`text-sm font-bold ${getNodeTextColor(node.id)}`}
              >
                {node.id}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="Dijkstra's Algorithm"
      badges={BADGES}
      gradient="orange"
      className={className}
      minHeight={500}
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
        accentColor: 'orange',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? DIJKSTRA_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const DijkstraVisualizer = React.memo(DijkstraVisualizerComponent);
export default DijkstraVisualizer;
