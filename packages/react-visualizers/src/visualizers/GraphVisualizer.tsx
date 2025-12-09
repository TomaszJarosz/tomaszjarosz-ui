import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BaseVisualizerLayout,
  AccessibleSVG,
} from '../shared';

type TraversalAlgorithm = 'dfs' | 'bfs';

interface Node {
  id: number;
  x: number;
  y: number;
}

interface Edge {
  from: number;
  to: number;
}

interface TraversalStep {
  current: number;
  visited: number[];
  queue?: number[]; // For BFS
  stack?: number[]; // For DFS
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
}

interface GraphVisualizerProps {
  algorithm?: TraversalAlgorithm;
  showControls?: boolean;
  showAlgorithmSelector?: boolean;
  showCode?: boolean;
  className?: string;
}

const ALGORITHM_NAMES: Record<TraversalAlgorithm, string> = {
  dfs: 'Depth-First Search',
  bfs: 'Breadth-First Search',
};

const ALGORITHM_COMPLEXITIES: Record<
  TraversalAlgorithm,
  { time: string; space: string }
> = {
  dfs: { time: 'O(V + E)', space: 'O(V)' },
  bfs: { time: 'O(V + E)', space: 'O(V)' },
};

// Algorithm code snippets
const DFS_CODE = [
  'dfs(graph, start):',
  '  stack.push(start)',
  '  while stack not empty:',
  '    node = stack.pop()',
  '    if visited[node]: continue',
  '    visited[node] = true',
  '    process(node)',
  '    for neighbor in adj[node]:',
  '      if not visited[neighbor]:',
  '        stack.push(neighbor)',
];

const BFS_CODE = [
  'bfs(graph, start):',
  '  queue.enqueue(start)',
  '  visited[start] = true',
  '  while queue not empty:',
  '    node = queue.dequeue()',
  '    process(node)',
  '    for neighbor in adj[node]:',
  '      if not visited[neighbor]:',
  '        visited[neighbor] = true',
  '        queue.enqueue(neighbor)',
];

const LEGEND_ITEMS = [
  { color: 'bg-blue-100', label: 'Unvisited', border: '#60a5fa' },
  { color: 'bg-yellow-400', label: 'Current', border: '#ca8a04' },
  { color: 'bg-green-400', label: 'Visited', border: '#16a34a' },
];

const getBadgesForAlgorithm = (algorithm: TraversalAlgorithm) => {
  const complexity = ALGORITHM_COMPLEXITIES[algorithm];
  return [
    { label: `Time: ${complexity.time}`, variant: 'purple' as const },
    { label: `Space: ${complexity.space}`, variant: 'indigo' as const },
  ];
};

// Generate a sample graph with positions
function generateGraph(): {
  nodes: Node[];
  edges: Edge[];
  adjacencyList: number[][];
} {
  // Create a connected graph with 8 nodes
  const nodes: Node[] = [
    { id: 0, x: 200, y: 40 }, // Root
    { id: 1, x: 100, y: 100 },
    { id: 2, x: 300, y: 100 },
    { id: 3, x: 50, y: 180 },
    { id: 4, x: 150, y: 180 },
    { id: 5, x: 250, y: 180 },
    { id: 6, x: 350, y: 180 },
    { id: 7, x: 100, y: 260 },
  ];

  const edges: Edge[] = [
    { from: 0, to: 1 },
    { from: 0, to: 2 },
    { from: 1, to: 3 },
    { from: 1, to: 4 },
    { from: 2, to: 5 },
    { from: 2, to: 6 },
    { from: 3, to: 7 },
    { from: 4, to: 7 },
  ];

  // Build adjacency list
  const adjacencyList: number[][] = Array.from(
    { length: nodes.length },
    () => []
  );
  edges.forEach(({ from, to }) => {
    adjacencyList[from].push(to);
    adjacencyList[to].push(from); // Undirected graph
  });

  return { nodes, edges, adjacencyList };
}

function generateDFSSteps(
  adjacencyList: number[][],
  startNode: number
): TraversalStep[] {
  const steps: TraversalStep[] = [];
  const visited = new Set<number>();
  const stack: number[] = [startNode];

  steps.push({
    current: -1,
    visited: [],
    stack: [...stack],
    description: `Initialize: push start node ${startNode} onto stack`,
    codeLine: 1,
    variables: { start: startNode },
  });

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) break;

    if (visited.has(current)) {
      steps.push({
        current,
        visited: [...visited],
        stack: [...stack],
        description: `Node ${current} already visited, skip it`,
        codeLine: 4,
        variables: { node: current },
      });
      continue;
    }

    visited.add(current);

    steps.push({
      current,
      visited: [...visited],
      stack: [...stack],
      description: `Pop ${current} from stack, mark as visited. Process node ${current}`,
      codeLine: 6,
      variables: { node: current, 'visited count': visited.size },
    });

    // Add neighbors in reverse order so we visit them in order
    const neighbors = adjacencyList[current]
      .filter((n) => !visited.has(n))
      .reverse();

    if (neighbors.length > 0) {
      stack.push(...neighbors);
      steps.push({
        current,
        visited: [...visited],
        stack: [...stack],
        description: `Push unvisited neighbors [${neighbors.reverse().join(', ')}] onto stack`,
        codeLine: 9,
        variables: { node: current, neighbors: neighbors.length },
      });
    }
  }

  steps.push({
    current: -1,
    visited: [...visited],
    stack: [],
    description: `✓ DFS complete! Visit order: [${[...visited].join(' → ')}]`,
    codeLine: -1,
  });

  return steps;
}

function generateBFSSteps(
  adjacencyList: number[][],
  startNode: number
): TraversalStep[] {
  const steps: TraversalStep[] = [];
  const visited = new Set<number>();
  const queue: number[] = [startNode];
  visited.add(startNode);

  steps.push({
    current: -1,
    visited: [],
    queue: [...queue],
    description: `Initialize: enqueue start node ${startNode}, mark as visited`,
    codeLine: 1,
    variables: { start: startNode },
  });

  const visitOrder: number[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    visitOrder.push(current);

    steps.push({
      current,
      visited: [...visitOrder],
      queue: [...queue],
      description: `Dequeue ${current}, process it`,
      codeLine: 5,
      variables: { node: current },
    });

    const neighbors = adjacencyList[current].filter((n) => !visited.has(n));

    if (neighbors.length > 0) {
      neighbors.forEach((n) => {
        visited.add(n);
        queue.push(n);
      });

      steps.push({
        current,
        visited: [...visitOrder],
        queue: [...queue],
        description: `Enqueue unvisited neighbors [${neighbors.join(', ')}], mark as visited`,
        codeLine: 9,
        variables: { node: current, neighbors: neighbors.length },
      });
    }
  }

  steps.push({
    current: -1,
    visited: [...visitOrder],
    queue: [],
    description: `✓ BFS complete! Visit order: [${visitOrder.join(' → ')}]`,
    codeLine: -1,
  });

  return steps;
}

const GraphVisualizerComponent: React.FC<GraphVisualizerProps> = ({
  algorithm: initialAlgorithm = 'dfs',
  showControls = true,
  showAlgorithmSelector = true,
  showCode = true,
  className = '',
}) => {
  const [algorithm, setAlgorithm] =
    useState<TraversalAlgorithm>(initialAlgorithm);
  const [speed, setSpeed] = useState(25); // Slower default
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TraversalStep[]>([]);
  const [graph, setGraph] = useState<ReturnType<typeof generateGraph> | null>(
    null
  );

  const playingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize graph and generate steps
  const initializeGraph = useCallback(() => {
    const newGraph = generateGraph();
    setGraph(newGraph);
    const newSteps =
      algorithm === 'dfs'
        ? generateDFSSteps(newGraph.adjacencyList, 0)
        : generateBFSSteps(newGraph.adjacencyList, 0);
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
    playingRef.current = false;
  }, [algorithm]);

  useEffect(() => {
    initializeGraph();
  }, [initializeGraph]);

  // Animation loop
  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      playingRef.current = true;
      // Slower: min 100ms, max 2000ms
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

  const handlePlayPause = () => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
    playingRef.current = !isPlaying;
  };

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

  // Keyboard shortcuts (P = play/pause, [ = back, ] = forward, R = reset)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlePlayPause excluded to prevent infinite loop
  }, [handleStep, handleStepBack, isPlaying]);

  const handleReset = () => {
    setIsPlaying(false);
    playingRef.current = false;
    setCurrentStep(0);
  };

  const handleShuffle = () => {
    initializeGraph();
  };

  if (!graph) return null;

  const currentStepData = steps[currentStep] || { current: -1, visited: [] };
  const { current, visited } = currentStepData;
  const dataStructure =
    algorithm === 'dfs' ? currentStepData.stack : currentStepData.queue;
  const dataStructureName = algorithm === 'dfs' ? 'Stack' : 'Queue';
  const algorithmCode = algorithm === 'dfs' ? DFS_CODE : BFS_CODE;

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

  const currentDescription = steps[currentStep]?.description || '';

  const headerExtra = showAlgorithmSelector ? (
    <select
      value={algorithm}
      onChange={(e) =>
        setAlgorithm(e.target.value as TraversalAlgorithm)
      }
      className="px-3 py-1.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
      disabled={isPlaying}
    >
      {Object.entries(ALGORITHM_NAMES).map(([key, name]) => (
        <option key={key} value={key}>
          {name}
        </option>
      ))}
    </select>
  ) : undefined;

  const visualization = (
    <>
      {/* DFS vs BFS - Prominent */}
      <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
        <div className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
          <span className="text-lg">🔍</span> DFS vs BFS
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className={`p-2 rounded-lg border ${algorithm === 'dfs' ? 'bg-purple-100 border-purple-300' : 'bg-gray-100 border-gray-300'}`}>
            <div className="font-bold text-purple-700">Depth-First (DFS)</div>
            <div className="text-purple-600">Uses: Stack</div>
            <div className="text-[10px] text-purple-500">Go deep before wide</div>
          </div>
          <div className={`p-2 rounded-lg border ${algorithm === 'bfs' ? 'bg-indigo-100 border-indigo-300' : 'bg-gray-100 border-gray-300'}`}>
            <div className="font-bold text-indigo-700">Breadth-First (BFS)</div>
            <div className="text-indigo-600">Uses: Queue</div>
            <div className="text-[10px] text-indigo-500">Level by level</div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-gray-600 text-center">
          Both O(V+E) time • DFS for paths/cycles • BFS for shortest path (unweighted)
        </div>
      </div>

      <div className="flex gap-4">
        {/* Graph SVG */}
        <div className="flex-1 bg-gray-50 rounded-lg">
          <AccessibleSVG
            viewBox="0 0 400 300"
            className="w-full h-64"
            title={`${ALGORITHM_NAMES[algorithm]} graph traversal visualization`}
            description={`Graph with ${graph.nodes.length} nodes. ${visited.length} nodes visited. ${current >= 0 ? `Currently at node ${current}.` : ''}`}
          >
            {/* Edges */}
            {graph.edges.map((edge, index) => {
              const fromNode = graph.nodes[edge.from];
              const toNode = graph.nodes[edge.to];
              return (
                <line
                  key={index}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  className="stroke-gray-300 stroke-2"
                  aria-hidden="true"
                />
              );
            })}

            {/* Nodes */}
            {graph.nodes.map((node) => (
              <g key={node.id} role="img" aria-label={`Node ${node.id}${node.id === current ? ' (current)' : visited.includes(node.id) ? ' (visited)' : ' (unvisited)'}`}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={20}
                  className={`${getNodeColor(node.id)} stroke-2 transition-colors duration-300`}
                />
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  className={`text-sm font-bold ${getNodeTextColor(node.id)}`}
                  aria-hidden="true"
                >
                  {node.id}
                </text>
              </g>
            ))}
          </AccessibleSVG>
        </div>

        {/* Data Structure Display */}
        <div className="w-32 flex flex-col">
          <div className="text-sm font-medium text-gray-700 mb-2">
            {dataStructureName}:
          </div>
          <div className="flex-1 bg-gray-100 rounded-lg p-2 min-h-[100px]">
            {dataStructure && dataStructure.length > 0 ? (
              <div
                className={`flex ${algorithm === 'dfs' ? 'flex-col-reverse' : 'flex-col'} gap-1`}
              >
                {dataStructure.map((nodeId, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-center rounded text-sm font-medium"
                  >
                    {nodeId}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-xs text-center">
                Empty
              </div>
            )}
          </div>

          {/* Visit Order */}
          <div className="mt-3">
            <div className="text-sm font-medium text-gray-700 mb-1">
              Visited:
            </div>
            <div className="text-sm text-green-700 font-mono">
              [{visited.join(', ')}]
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <BaseVisualizerLayout
      id="graph-visualizer"
      title={ALGORITHM_NAMES[algorithm]}
      badges={getBadgesForAlgorithm(algorithm)}
      gradient="purple"
      className={className}
      minHeight={400}
      headerExtra={headerExtra}
      status={{
        description: currentDescription,
        currentStep,
        totalSteps: steps.length,
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
        onShuffle: handleShuffle,
        showShuffle: true,
        accentColor: 'purple',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? algorithmCode : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const GraphVisualizer = React.memo(GraphVisualizerComponent);
export default GraphVisualizer;
