import React, { useState, useMemo, useCallback } from 'react';
import {
  ControlPanel,
  Legend,
  StatusPanel,
  ShareButton,
  useUrlState,
  useVisualizerPlayback,
  VisualizationArea,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface GraphNode {
  id: string;
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
}

interface GraphStep {
  visited: string[];
  current: string | null;
  queue?: string[];
  stack?: string[];
  description: string;
  algorithm: 'bfs' | 'dfs';
}

interface GraphInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

// Graph structure
const NODES: GraphNode[] = [
  { id: 'A', x: 150, y: 30 },
  { id: 'B', x: 60, y: 100 },
  { id: 'C', x: 240, y: 100 },
  { id: 'D', x: 30, y: 180 },
  { id: 'E', x: 120, y: 180 },
  { id: 'F', x: 210, y: 180 },
  { id: 'G', x: 280, y: 180 },
];

const EDGES: GraphEdge[] = [
  { from: 'A', to: 'B' },
  { from: 'A', to: 'C' },
  { from: 'B', to: 'D' },
  { from: 'B', to: 'E' },
  { from: 'C', to: 'F' },
  { from: 'C', to: 'G' },
  { from: 'E', to: 'F' },
];

const LEGEND_ITEMS = [
  { color: 'bg-blue-500', label: 'Current' },
  { color: 'bg-green-400', label: 'Visited' },
  { color: 'bg-yellow-100', label: 'In Queue/Stack', border: '#facc15' },
];

// Interview questions about Graph traversal
const GRAPH_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'graph-1',
    question: 'What data structure does BFS use?',
    options: ['Stack', 'Queue', 'Heap', 'Array'],
    correctAnswer: 1,
    explanation: 'BFS uses a Queue (FIFO) to process nodes level by level. Nodes are added to the back and removed from the front, ensuring we visit all nodes at distance k before distance k+1.',
    hint: 'BFS explores nodes level by level - which structure gives FIFO ordering?',
    difficulty: 'easy',
    topic: 'BFS',
  },
  {
    id: 'graph-2',
    question: 'What data structure does DFS use (iterative version)?',
    options: ['Queue', 'Stack', 'Heap', 'Hash Map'],
    correctAnswer: 1,
    explanation: 'DFS uses a Stack (LIFO) or recursion (which uses the call stack). This ensures we go as deep as possible before backtracking.',
    hint: 'DFS goes deep first - which structure gives LIFO ordering?',
    difficulty: 'easy',
    topic: 'DFS',
  },
  {
    id: 'graph-3',
    question: 'What is the time complexity of BFS/DFS on a graph with V vertices and E edges?',
    options: ['O(V)', 'O(E)', 'O(V + E)', 'O(V × E)'],
    correctAnswer: 2,
    explanation: 'Both BFS and DFS visit each vertex once O(V) and examine each edge once O(E), giving O(V + E) total time complexity.',
    difficulty: 'easy',
    topic: 'Complexity',
  },
  {
    id: 'graph-4',
    question: 'Which algorithm is best for finding the shortest path in an unweighted graph?',
    options: ['DFS', 'BFS', 'Dijkstra', 'Bellman-Ford'],
    correctAnswer: 1,
    explanation: 'BFS finds the shortest path in unweighted graphs because it explores nodes level by level. The first time it reaches a node is via the shortest path (fewest edges).',
    hint: 'Think about which algorithm explores by distance from source.',
    difficulty: 'medium',
    topic: 'Shortest Path',
  },
  {
    id: 'graph-5',
    question: 'Which traversal is typically used for topological sorting?',
    options: ['BFS only', 'DFS only', 'Either BFS or DFS', 'Neither'],
    correctAnswer: 2,
    explanation: 'Both can be used! DFS-based: add to result in reverse post-order. BFS-based (Kahn\'s algorithm): repeatedly remove nodes with no incoming edges. Both achieve topological ordering.',
    difficulty: 'medium',
    topic: 'Topological Sort',
  },
  {
    id: 'graph-6',
    question: 'What is the space complexity of BFS?',
    options: ['O(1)', 'O(log V)', 'O(V)', 'O(V + E)'],
    correctAnswer: 2,
    explanation: 'BFS requires O(V) space in the worst case for the queue (e.g., complete binary tree where an entire level can be V/2 nodes) plus O(V) for the visited set.',
    hint: 'Consider a complete binary tree - how many nodes at the deepest level?',
    difficulty: 'medium',
    topic: 'Space Complexity',
  },
  {
    id: 'graph-7',
    question: 'How do you detect a cycle in an undirected graph?',
    options: [
      'Check if any node is visited twice during BFS/DFS',
      'If we visit an already-visited node that\'s not the parent',
      'Count edges - if edges >= vertices, there\'s a cycle',
      'Use Dijkstra\'s algorithm',
    ],
    correctAnswer: 1,
    explanation: 'During DFS/BFS, if we encounter a visited node that isn\'t the immediate parent, there\'s a cycle. Simply checking "visited twice" would incorrectly flag parent-child as a cycle.',
    difficulty: 'medium',
    topic: 'Cycle Detection',
  },
  {
    id: 'graph-8',
    question: 'Which traversal is better for finding connected components?',
    options: [
      'BFS is significantly better',
      'DFS is significantly better',
      'Both work equally well',
      'Neither can find connected components',
    ],
    correctAnswer: 2,
    explanation: 'Both BFS and DFS work equally well for finding connected components. Start from any unvisited node, run BFS/DFS to visit all reachable nodes (one component), repeat for remaining unvisited nodes.',
    difficulty: 'easy',
    topic: 'Connected Components',
  },
  {
    id: 'graph-9',
    question: 'What is the space complexity of recursive DFS?',
    options: ['O(1)', 'O(log V)', 'O(V)', 'O(E)'],
    correctAnswer: 2,
    explanation: 'Recursive DFS uses O(V) space for the call stack in the worst case (e.g., a linear chain graph). Plus O(V) for the visited set. This is why iterative DFS with explicit stack is sometimes preferred.',
    hint: 'Consider the recursion depth on a very deep graph.',
    difficulty: 'medium',
    topic: 'Space Complexity',
  },
  {
    id: 'graph-10',
    question: 'In which scenario would DFS outperform BFS?',
    options: [
      'Finding shortest path',
      'Finding any path to a deep node in a sparse graph',
      'Level-order traversal',
      'Finding minimum spanning tree',
    ],
    correctAnswer: 1,
    explanation: 'DFS can find a deep node faster in sparse graphs by going deep immediately, while BFS must explore all shallow nodes first. However, the path found by DFS isn\'t necessarily shortest.',
    difficulty: 'hard',
    topic: 'Use Cases',
  },
];

function buildAdjacencyList(edges: GraphEdge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const node of NODES) {
    adj.set(node.id, []);
  }
  for (const edge of edges) {
    adj.get(edge.from)?.push(edge.to);
    adj.get(edge.to)?.push(edge.from);
  }
  return adj;
}

function generateBFSSteps(): GraphStep[] {
  const steps: GraphStep[] = [];
  const adj = buildAdjacencyList(EDGES);
  const visited = new Set<string>();
  const queue: string[] = ['A'];
  visited.add('A');

  steps.push({
    visited: [],
    current: null,
    queue: ['A'],
    description: 'BFS: Start at node A, add to queue',
    algorithm: 'bfs',
  });

  while (queue.length > 0) {
    const current = queue.shift()!;

    steps.push({
      visited: Array.from(visited),
      current,
      queue: [...queue],
      description: `BFS: Dequeue ${current}, visit it`,
      algorithm: 'bfs',
    });

    const neighbors = adj.get(current) || [];
    for (const neighbor of neighbors.sort()) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);

        steps.push({
          visited: Array.from(visited),
          current,
          queue: [...queue],
          description: `BFS: Add neighbor ${neighbor} to queue`,
          algorithm: 'bfs',
        });
      }
    }
  }

  steps.push({
    visited: Array.from(visited),
    current: null,
    queue: [],
    description: 'BFS complete! All reachable nodes visited.',
    algorithm: 'bfs',
  });

  return steps;
}

function generateDFSSteps(): GraphStep[] {
  const steps: GraphStep[] = [];
  const adj = buildAdjacencyList(EDGES);
  const visited = new Set<string>();
  const stack: string[] = ['A'];

  steps.push({
    visited: [],
    current: null,
    stack: ['A'],
    description: 'DFS: Start at node A, push to stack',
    algorithm: 'dfs',
  });

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (visited.has(current)) continue;
    visited.add(current);

    steps.push({
      visited: Array.from(visited),
      current,
      stack: [...stack],
      description: `DFS: Pop ${current}, visit it`,
      algorithm: 'dfs',
    });

    const neighbors = adj.get(current) || [];
    for (const neighbor of neighbors.sort().reverse()) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);

        steps.push({
          visited: Array.from(visited),
          current,
          stack: [...stack],
          description: `DFS: Push neighbor ${neighbor} to stack`,
          algorithm: 'dfs',
        });
      }
    }
  }

  steps.push({
    visited: Array.from(visited),
    current: null,
    stack: [],
    description: 'DFS complete! All reachable nodes visited.',
    algorithm: 'dfs',
  });

  return steps;
}

const GraphInterviewVisualizerComponent: React.FC<GraphInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'graph-interview-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'graph-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');
  const [algorithm, setAlgorithm] = useState<'bfs' | 'dfs'>('bfs');

  const generateSteps = useMemo(
    () => () => (algorithm === 'bfs' ? generateBFSSteps() : generateDFSSteps()),
    [algorithm]
  );

  const playback = useVisualizerPlayback<GraphStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: GRAPH_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: GraphStep = playback.currentStepData || {
    visited: [],
    current: null,
    description: '',
    algorithm: 'bfs',
  };

  const { visited, current, queue, stack, description } = stepData;

  const getNodeColor = (nodeId: string): string => {
    if (nodeId === current) return 'fill-blue-500';
    if (visited.includes(nodeId)) return 'fill-green-400';
    if (queue?.includes(nodeId) || stack?.includes(nodeId)) return 'fill-yellow-200';
    return 'fill-gray-200';
  };

  const getNodeStroke = (nodeId: string): string => {
    if (nodeId === current) return 'stroke-blue-600';
    if (visited.includes(nodeId)) return 'stroke-green-500';
    if (queue?.includes(nodeId) || stack?.includes(nodeId)) return 'stroke-yellow-500';
    return 'stroke-gray-400';
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const handleAlgorithmChange = useCallback((newAlgo: 'bfs' | 'dfs') => {
    setAlgorithm(newAlgo);
    playback.handleReset();
  }, [playback]);

  return (
    <div
      id={VISUALIZER_ID}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header with mode toggle */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">Graph Traversal</h3>
            <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setMode('visualize')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === 'visualize'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Visualize
              </button>
              <button
                onClick={() => setMode('interview')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === 'interview'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Interview
              </button>
            </div>
          </div>
          <ShareButton onShare={handleShare} accentColor="blue" />
        </div>
      </div>

      <div className="p-4">
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* Visualization Panel */}
          <VisualizationArea minHeight={350} className="flex-1">
            {/* Algorithm Toggle */}
            <div className="mb-4 flex justify-center gap-2">
              <button
                onClick={() => handleAlgorithmChange('bfs')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  algorithm === 'bfs'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                BFS (Queue)
              </button>
              <button
                onClick={() => handleAlgorithmChange('dfs')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  algorithm === 'dfs'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                DFS (Stack)
              </button>
            </div>

            {/* Graph Visualization */}
            <div className="mb-4">
              <svg width="310" height="220" className="mx-auto">
                {/* Edges */}
                {EDGES.map((edge, idx) => {
                  const from = NODES.find((n) => n.id === edge.from)!;
                  const to = NODES.find((n) => n.id === edge.to)!;
                  return (
                    <line
                      key={idx}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="#d1d5db"
                      strokeWidth="2"
                    />
                  );
                })}

                {/* Nodes */}
                {NODES.map((node) => (
                  <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                    <circle
                      r="20"
                      className={`${getNodeColor(node.id)} ${getNodeStroke(node.id)} transition-colors`}
                      strokeWidth="3"
                    />
                    <text
                      textAnchor="middle"
                      dy="5"
                      className="text-sm font-bold"
                      fill={node.id === current || visited.includes(node.id) ? 'white' : '#374151'}
                    >
                      {node.id}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Data Structure Display */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <span className="font-medium text-gray-700">
                  {algorithm === 'bfs' ? 'Queue' : 'Stack'}:
                </span>{' '}
                <span className="font-mono text-blue-600">
                  [{(algorithm === 'bfs' ? queue : stack)?.join(', ') || ''}]
                </span>
              </div>
              <div className="text-sm mt-1">
                <span className="font-medium text-gray-700">Visited:</span>{' '}
                <span className="font-mono text-green-600">
                  [{visited.join(', ')}]
                </span>
              </div>
            </div>

            {/* Status */}
            <StatusPanel
              description={description}
              currentStep={playback.currentStep}
              totalSteps={playback.steps.length}
              variant={
                visited.length === NODES.length
                  ? 'success'
                  : current
                    ? 'default'
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
                accentColor="blue"
              />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <ControlPanel
            isPlaying={playback.isPlaying}
            currentStep={playback.currentStep}
            totalSteps={playback.steps.length}
            speed={playback.speed}
            onPlayPause={playback.handlePlayPause}
            onStep={playback.handleStep}
            onStepBack={playback.handleStepBack}
            onReset={playback.handleReset}
            onSpeedChange={playback.setSpeed}
            accentColor="blue"
          />
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
};

export const GraphInterviewVisualizer = React.memo(GraphInterviewVisualizerComponent);
export default GraphInterviewVisualizer;
