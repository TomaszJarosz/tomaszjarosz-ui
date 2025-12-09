import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

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
}

interface DijkstraInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const BADGES = [
  { label: 'O((V+E) log V)', variant: 'orange' as const },
];

const LEGEND_ITEMS = [
  { color: 'bg-blue-100', label: 'Unvisited', border: '#60a5fa' },
  { color: 'bg-amber-400', label: 'Current' },
  { color: 'bg-green-400', label: 'Visited' },
];

// Interview questions about Dijkstra's algorithm
const DIJKSTRA_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'dij-1',
    question: 'What is the time complexity of Dijkstra\'s algorithm with a binary heap?',
    options: ['O(V²)', 'O(V + E)', 'O((V + E) log V)', 'O(V × E)'],
    correctAnswer: 2,
    explanation: 'With a binary heap, each vertex is extracted once O(V log V) and each edge may cause a decrease-key O(E log V), giving O((V + E) log V) total.',
    hint: 'Consider the heap operations: extract-min and decrease-key.',
    difficulty: 'medium',
    topic: 'Time Complexity',
  },
  {
    id: 'dij-2',
    question: 'What data structure is typically used in Dijkstra\'s algorithm to get the minimum distance vertex?',
    options: ['Stack', 'Queue', 'Priority Queue (Min-Heap)', 'Hash Table'],
    correctAnswer: 2,
    explanation: 'A priority queue (min-heap) efficiently finds the unvisited vertex with minimum distance. Without it, finding the minimum takes O(V) per iteration, giving O(V²) total.',
    difficulty: 'easy',
    topic: 'Data Structures',
  },
  {
    id: 'dij-3',
    question: 'Can Dijkstra\'s algorithm handle negative edge weights?',
    options: [
      'Yes, always',
      'No, it can give incorrect results',
      'Yes, but only for directed graphs',
      'Yes, but requires modification',
    ],
    correctAnswer: 1,
    explanation: 'Dijkstra assumes once a vertex is visited, its distance is final. Negative edges can provide shorter paths through already-visited vertices, breaking this assumption. Use Bellman-Ford for negative weights.',
    hint: 'Think about what happens when a visited node could be reached via a shorter negative-weight path.',
    difficulty: 'medium',
    topic: 'Limitations',
  },
  {
    id: 'dij-4',
    question: 'What is the "relaxation" step in Dijkstra\'s algorithm?',
    options: [
      'Removing a vertex from the priority queue',
      'Updating distance if a shorter path is found',
      'Marking a vertex as visited',
      'Adding edges to the graph',
    ],
    correctAnswer: 1,
    explanation: 'Relaxation checks if going through the current vertex provides a shorter path to a neighbor: if dist[u] + weight(u,v) < dist[v], update dist[v]. This is the core operation.',
    difficulty: 'easy',
    topic: 'Core Concept',
  },
  {
    id: 'dij-5',
    question: 'What is the space complexity of Dijkstra\'s algorithm?',
    options: ['O(1)', 'O(V)', 'O(E)', 'O(V + E)'],
    correctAnswer: 1,
    explanation: 'Dijkstra requires O(V) space for the distance array, visited array, and priority queue (which holds at most V vertices). The graph representation itself is separate (O(V + E) for adjacency list).',
    difficulty: 'easy',
    topic: 'Space Complexity',
  },
  {
    id: 'dij-6',
    question: 'Which algorithm should you use instead of Dijkstra for graphs with negative edges?',
    options: ['BFS', 'DFS', 'Bellman-Ford', 'Prim\'s'],
    correctAnswer: 2,
    explanation: 'Bellman-Ford handles negative edge weights and can detect negative cycles. It runs in O(V × E) which is slower than Dijkstra but works correctly with negative weights.',
    difficulty: 'medium',
    topic: 'Alternatives',
  },
  {
    id: 'dij-7',
    question: 'In Dijkstra\'s algorithm, when is a vertex\'s shortest distance finalized?',
    options: [
      'When it\'s added to the priority queue',
      'When it\'s extracted from the priority queue',
      'When all its neighbors are processed',
      'At the end of the algorithm',
    ],
    correctAnswer: 1,
    explanation: 'When a vertex is extracted from the min-heap, we\'ve found the shortest path to it. Any remaining paths would have to go through vertices with equal or greater distance, so they can\'t be shorter.',
    hint: 'The min-heap property guarantees something important here.',
    difficulty: 'medium',
    topic: 'Algorithm Invariant',
  },
  {
    id: 'dij-8',
    question: 'How can you reconstruct the actual shortest path (not just distance)?',
    options: [
      'It\'s not possible with Dijkstra',
      'Store the previous vertex for each vertex',
      'Run the algorithm backwards',
      'Store all visited edges',
    ],
    correctAnswer: 1,
    explanation: 'Maintain a "previous" array: when relaxing dist[v], set prev[v] = u. To get the path to any vertex, backtrack from destination to source using prev pointers.',
    difficulty: 'easy',
    topic: 'Path Reconstruction',
  },
  {
    id: 'dij-9',
    question: 'What is the time complexity of Dijkstra with a simple array instead of a heap?',
    options: ['O(V log V)', 'O(V²)', 'O(V + E)', 'O(E log V)'],
    correctAnswer: 1,
    explanation: 'Without a heap, finding the minimum distance vertex requires scanning all V vertices, done V times = O(V²). This is actually better than heap-based O((V+E)log V) for dense graphs where E ≈ V².',
    difficulty: 'medium',
    topic: 'Implementation Variants',
  },
  {
    id: 'dij-10',
    question: 'Which of these is a valid application of Dijkstra\'s algorithm?',
    options: [
      'Finding minimum spanning tree',
      'Finding shortest path in unweighted graph',
      'GPS navigation systems',
      'Detecting cycles in a graph',
    ],
    correctAnswer: 2,
    explanation: 'GPS/map navigation uses Dijkstra (or A*) to find shortest/fastest routes. For unweighted graphs, BFS is simpler and equally effective. MST uses Prim\'s or Kruskal\'s. Cycle detection uses DFS.',
    difficulty: 'easy',
    topic: 'Applications',
  },
];

// Graph structure
const NODES: Node[] = [
  { id: 0, x: 60, y: 150 },
  { id: 1, x: 150, y: 60 },
  { id: 2, x: 150, y: 240 },
  { id: 3, x: 260, y: 100 },
  { id: 4, x: 260, y: 200 },
  { id: 5, x: 360, y: 150 },
];

const EDGES: Edge[] = [
  { from: 0, to: 1, weight: 4 },
  { from: 0, to: 2, weight: 2 },
  { from: 1, to: 3, weight: 5 },
  { from: 2, to: 1, weight: 1 },
  { from: 2, to: 4, weight: 4 },
  { from: 3, to: 5, weight: 2 },
  { from: 4, to: 3, weight: 1 },
  { from: 4, to: 5, weight: 3 },
];

function buildAdjacencyList(): Map<number, { to: number; weight: number }[]> {
  const adj = new Map<number, { to: number; weight: number }[]>();
  NODES.forEach((node) => adj.set(node.id, []));
  EDGES.forEach(({ from, to, weight }) => {
    adj.get(from)?.push({ to, weight });
  });
  return adj;
}

function generateDijkstraSteps(): DijkstraStep[] {
  const steps: DijkstraStep[] = [];
  const adj = buildAdjacencyList();
  const n = NODES.length;
  const distances = Array(n).fill(Infinity);
  const visited: number[] = [];
  const previous: (number | null)[] = Array(n).fill(null);
  const pq: { node: number; dist: number }[] = [];

  distances[0] = 0;
  pq.push({ node: 0, dist: 0 });

  steps.push({
    current: -1,
    distances: [...distances],
    visited: [],
    previous: [...previous],
    priorityQueue: [...pq],
    description: 'Initialize: dist[0] = 0, all others = ∞',
  });

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { node: current, dist: currentDist } = pq.shift()!;

    if (visited.includes(current)) continue;

    visited.push(current);

    steps.push({
      current,
      distances: [...distances],
      visited: [...visited],
      previous: [...previous],
      priorityQueue: [...pq],
      description: `Extract node ${current} (dist=${currentDist}) from PQ`,
    });

    const neighbors = adj.get(current) || [];
    for (const { to, weight } of neighbors) {
      if (visited.includes(to)) continue;

      const newDist = distances[current] + weight;
      if (newDist < distances[to]) {
        distances[to] = newDist;
        previous[to] = current;
        pq.push({ node: to, dist: newDist });

        steps.push({
          current,
          distances: [...distances],
          visited: [...visited],
          previous: [...previous],
          priorityQueue: [...pq],
          description: `Relax ${current}→${to}: dist[${to}] = ${newDist}`,
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
    description: `Done! Shortest distances: [${distances.join(', ')}]`,
  });

  return steps;
}

const DijkstraInterviewVisualizerComponent: React.FC<DijkstraInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'dijkstra-interview-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'dij-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateDijkstraSteps, []);

  const playback = useVisualizerPlayback<DijkstraStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: DIJKSTRA_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: DijkstraStep = playback.currentStepData || {
    current: -1,
    distances: Array(NODES.length).fill(Infinity),
    visited: [],
    previous: [],
    priorityQueue: [],
    description: '',
  };

  const { current, distances, visited, priorityQueue, description } = stepData;

  const getNodeColor = (nodeId: number): string => {
    if (nodeId === current) return 'fill-amber-400';
    if (visited.includes(nodeId)) return 'fill-green-400';
    return 'fill-blue-100';
  };

  const getNodeStroke = (nodeId: number): string => {
    if (nodeId === current) return 'stroke-amber-600';
    if (visited.includes(nodeId)) return 'stroke-green-600';
    return 'stroke-blue-400';
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const visualization = (
    <>
      {/* Distance Array */}
      <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
        <div className="text-sm font-medium text-orange-800 mb-2">
          Distance Array (from node 0)
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {distances.map((dist, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center p-2 rounded-lg border-2 min-w-[50px] ${
                idx === current
                  ? 'bg-amber-100 border-amber-400'
                  : visited.includes(idx)
                    ? 'bg-green-100 border-green-400'
                    : 'bg-white border-gray-200'
              }`}
            >
              <div className="text-xs text-gray-500">Node {idx}</div>
              <div className="text-lg font-bold font-mono">
                {dist === Infinity ? '∞' : dist}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Queue */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Priority Queue: [{priorityQueue.sort((a, b) => a.dist - b.dist).map(p => `${p.node}:${p.dist}`).join(', ') || 'empty'}]
        </div>
      </div>

      {/* Graph */}
      <div className="mb-4">
        <svg viewBox="0 0 420 300" className="w-full h-52">
          {/* Edges */}
          {EDGES.map((edge, idx) => {
            const from = NODES[edge.from];
            const to = NODES[edge.to];
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            return (
              <g key={idx}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#9ca3af"
                  strokeWidth="2"
                  markerEnd="url(#arrow)"
                />
                <circle cx={midX} cy={midY} r="10" fill="white" stroke="#d1d5db" />
                <text x={midX} y={midY + 4} textAnchor="middle" className="text-xs font-bold fill-gray-600">
                  {edge.weight}
                </text>
              </g>
            );
          })}

          {/* Arrow marker */}
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
            </marker>
          </defs>

          {/* Nodes */}
          {NODES.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r="20"
                className={`${getNodeColor(node.id)} ${getNodeStroke(node.id)} stroke-2`}
              />
              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                className="text-sm font-bold fill-gray-700"
              >
                {node.id}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </>
  );

  const modeToggle = (
    <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
      <button
        onClick={() => setMode('visualize')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'visualize'
            ? 'bg-white text-orange-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'interview'
            ? 'bg-white text-orange-600 shadow-sm'
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
      accentColor="orange"
    />
  ) : undefined;

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="Dijkstra's Algorithm (Interview Mode)"
      badges={BADGES}
      gradient="orange"
      className={className}
      minHeight={500}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description,
        currentStep: playback.currentStep,
        totalSteps: playback.steps.length,
        variant: visited.length === NODES.length ? 'success' : 'default',
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
        accentColor: 'orange',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      sidePanel={sidePanel}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const DijkstraInterviewVisualizer = React.memo(DijkstraInterviewVisualizerComponent);
export default DijkstraInterviewVisualizer;
