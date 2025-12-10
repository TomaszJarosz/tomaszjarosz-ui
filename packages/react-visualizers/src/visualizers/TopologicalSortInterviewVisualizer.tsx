import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface GraphNode {
  id: string;
  x: number;
  y: number;
  inDegree: number;
}

interface TopoStep {
  operation: 'init' | 'countDegrees' | 'addToQueue' | 'process' | 'addNeighbors' | 'done';
  nodes: GraphNode[];
  edges: Array<[string, string]>;
  queue: string[];
  result: string[];
  currentNode?: string;
  processedEdge?: [string, string];
  description: string;
}

interface TopologicalSortInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'topo-sort-interview-visualizer';

const BADGES = [
  { label: 'Interview Mode', variant: 'cyan' as const },
  { label: 'O(V+E)', variant: 'blue' as const },
];

const INITIAL_NODES: GraphNode[] = [
  { id: 'A', x: 60, y: 40, inDegree: 0 },
  { id: 'B', x: 160, y: 40, inDegree: 0 },
  { id: 'C', x: 60, y: 120, inDegree: 0 },
  { id: 'D', x: 160, y: 120, inDegree: 0 },
  { id: 'E', x: 110, y: 200, inDegree: 0 },
];

const INITIAL_EDGES: Array<[string, string]> = [
  ['A', 'C'],
  ['A', 'D'],
  ['B', 'D'],
  ['C', 'E'],
  ['D', 'E'],
];

const LEGEND_ITEMS = [
  { color: 'bg-gray-100', label: 'Unprocessed', border: '#d1d5db' },
  { color: 'bg-blue-400', label: 'In queue' },
  { color: 'bg-amber-400', label: 'Processing' },
  { color: 'bg-green-400', label: 'Sorted' },
];

const TOPO_SORT_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'topo-1',
    question: 'What is the time complexity of topological sort using Kahn\'s algorithm?',
    options: ['O(V)', 'O(E)', 'O(V + E)', 'O(V × E)'],
    correctAnswer: 2,
    explanation: 'O(V + E): We process each vertex once and examine each edge once. Counting in-degrees is O(E), processing queue is O(V), and decrementing neighbors is O(E) total.',
    hint: 'Consider how many times each vertex and edge is touched.',
    difficulty: 'easy',
    topic: 'Time Complexity',
  },
  {
    id: 'topo-2',
    question: 'What type of graph can have a topological ordering?',
    options: [
      'Any graph',
      'Directed Acyclic Graph (DAG)',
      'Undirected graph',
      'Graph with exactly one cycle'
    ],
    correctAnswer: 1,
    explanation: 'Only DAGs can be topologically sorted. A cycle means A depends on B which depends on... which depends on A - no valid ordering exists. Undirected graphs are not applicable.',
    difficulty: 'easy',
    topic: 'Prerequisites',
  },
  {
    id: 'topo-3',
    question: 'How does Kahn\'s algorithm detect a cycle?',
    options: [
      'By running DFS first',
      'By checking if result has fewer nodes than the graph',
      'By checking if queue becomes empty early',
      'Both B and C'
    ],
    correctAnswer: 3,
    explanation: 'If there\'s a cycle, some nodes will never reach in-degree 0 because they\'re waiting on each other. Result will have fewer nodes than total, and queue empties before all nodes are processed.',
    difficulty: 'medium',
    topic: 'Cycle Detection',
  },
  {
    id: 'topo-4',
    question: 'What does "in-degree" of a vertex mean?',
    options: [
      'Number of outgoing edges',
      'Number of incoming edges',
      'Total number of edges',
      'Number of neighbors'
    ],
    correctAnswer: 1,
    explanation: 'In-degree is the count of incoming edges (edges pointing TO the vertex). Out-degree is outgoing edges. In Kahn\'s algorithm, we process vertices with in-degree 0 first.',
    difficulty: 'easy',
    topic: 'Graph Concepts',
  },
  {
    id: 'topo-5',
    question: 'Which data structure is primarily used in Kahn\'s algorithm?',
    options: ['Stack', 'Queue', 'Priority Queue', 'Set'],
    correctAnswer: 1,
    explanation: 'Kahn\'s algorithm uses a queue to process vertices with in-degree 0 in FIFO order. Stack could also work (gives different valid ordering). Priority queue gives lexicographically smallest ordering.',
    difficulty: 'easy',
    topic: 'Implementation',
  },
  {
    id: 'topo-6',
    question: 'What is a common application of topological sort?',
    options: [
      'Finding shortest path',
      'Build systems and task scheduling',
      'Sorting an array',
      'Finding connected components'
    ],
    correctAnswer: 1,
    explanation: 'Topological sort is used in: build systems (compile dependencies), task scheduling, course prerequisites, package managers (npm, maven), spreadsheet cell recalculation.',
    difficulty: 'easy',
    topic: 'Applications',
  },
  {
    id: 'topo-7',
    question: 'Can a DAG have multiple valid topological orderings?',
    options: [
      'No, there is always exactly one',
      'Yes, if the graph has parallel paths',
      'Yes, but only for graphs with > 10 nodes',
      'No, unless the graph is a tree'
    ],
    correctAnswer: 1,
    explanation: 'Multiple valid orderings exist when nodes have no dependency relationship (parallel paths). For example, if A→C and B→C with no edge between A and B, both "A,B,C" and "B,A,C" are valid.',
    hint: 'Think about nodes that don\'t depend on each other.',
    difficulty: 'medium',
    topic: 'Properties',
  },
  {
    id: 'topo-8',
    question: 'What is the DFS-based approach to topological sort?',
    options: [
      'Visit nodes in BFS order',
      'Add nodes to result when you finish (post-order), then reverse',
      'Add nodes when you first visit them',
      'Use Dijkstra\'s algorithm'
    ],
    correctAnswer: 1,
    explanation: 'DFS approach: do DFS, add node to stack/list when ALL its neighbors are processed (post-order). Reverse the result. This naturally handles dependencies - a node is added only after all its dependents.',
    difficulty: 'hard',
    topic: 'Algorithms',
  },
  {
    id: 'topo-9',
    question: 'What is the space complexity of topological sort?',
    options: ['O(1)', 'O(V)', 'O(E)', 'O(V + E)'],
    correctAnswer: 3,
    explanation: 'O(V + E): We need to store the in-degree array O(V), the adjacency list O(V + E), the queue O(V), and the result O(V). Dominated by adjacency list: O(V + E).',
    difficulty: 'medium',
    topic: 'Space Complexity',
  },
  {
    id: 'topo-10',
    question: 'In a topological ordering, if there\'s an edge A → B, which comes first?',
    options: ['B always comes before A', 'A always comes before B', 'Either can come first', 'They must be adjacent'],
    correctAnswer: 1,
    explanation: 'An edge A → B means "A must come before B" (A is a prerequisite for B). In any valid topological ordering, A appears before B in the sequence.',
    difficulty: 'easy',
    topic: 'Definition',
  },
];

function cloneNodes(nodes: GraphNode[]): GraphNode[] {
  return nodes.map((n) => ({ ...n }));
}

function generateTopoSteps(): TopoStep[] {
  const steps: TopoStep[] = [];
  const nodes = cloneNodes(INITIAL_NODES);
  const edges = [...INITIAL_EDGES];

  const adj = new Map<string, string[]>();
  for (const node of nodes) adj.set(node.id, []);
  for (const [from, to] of edges) adj.get(from)!.push(to);

  steps.push({
    operation: 'init',
    nodes: cloneNodes(nodes),
    edges: [...edges],
    queue: [],
    result: [],
    description: 'DAG with task dependencies. A → B means "A before B".',
  });

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
    description: `In-degrees: ${nodes.map((n) => `${n.id}=${n.inDegree}`).join(', ')}`,
  });

  const queue: string[] = nodes.filter((n) => n.inDegree === 0).map((n) => n.id);
  const result: string[] = [];

  steps.push({
    operation: 'addToQueue',
    nodes: cloneNodes(nodes),
    edges: [...edges],
    queue: [...queue],
    result: [...result],
    description: `Queue nodes with in-degree 0: [${queue.join(', ')}]`,
  });

  while (queue.length > 0) {
    const current = queue.shift()!;

    steps.push({
      operation: 'process',
      nodes: cloneNodes(nodes),
      edges: [...edges],
      queue: [...queue],
      result: [...result],
      currentNode: current,
      description: `Process ${current}, add to result`,
    });

    result.push(current);

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
        description: `${current}→${neighbor}: in-degree of ${neighbor} = ${neighborNode.inDegree}`,
      });

      if (neighborNode.inDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  steps.push({
    operation: 'done',
    nodes: cloneNodes(nodes),
    edges: [...edges],
    queue: [],
    result: [...result],
    description: `Order: ${result.join(' → ')}`,
  });

  return steps;
}

const TopologicalSortInterviewVisualizerComponent: React.FC<TopologicalSortInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'topo-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateTopoSteps, []);

  const playback = useVisualizerPlayback<TopoStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: TOPO_SORT_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: TopoStep = playback.currentStepData || {
    operation: 'init',
    nodes: INITIAL_NODES,
    edges: INITIAL_EDGES,
    queue: [],
    result: [],
    description: '',
  };

  const getNodeStyle = (nodeId: string): string => {
    if (stepData.currentNode === nodeId) return 'fill-yellow-400 stroke-yellow-600';
    if (stepData.result.includes(nodeId)) return 'fill-green-400 stroke-green-600';
    if (stepData.queue.includes(nodeId)) return 'fill-blue-400 stroke-blue-600';
    return 'fill-gray-100 stroke-gray-400';
  };

  const getEdgeStyle = (edge: [string, string]): { stroke: string; strokeWidth: number } => {
    const isProcessed = stepData.processedEdge &&
      stepData.processedEdge[0] === edge[0] &&
      stepData.processedEdge[1] === edge[1];
    return isProcessed ? { stroke: '#a855f7', strokeWidth: 3 } : { stroke: '#9ca3af', strokeWidth: 2 };
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const visualization = (
    <>
      <div className="mb-4 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
        <div className="text-sm text-cyan-800 text-center">
          <span className="font-medium">Topological Sort:</span> Order vertices so all edges point forward
        </div>
      </div>

      <div className="mb-4">
        <svg width="220" height="240" className="mx-auto bg-gray-50 rounded-lg">
          {stepData.edges.map(([from, to], idx) => {
            const fromNode = stepData.nodes.find((n) => n.id === from)!;
            const toNode = stepData.nodes.find((n) => n.id === to)!;
            const style = getEdgeStyle([from, to]);
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const endX = toNode.x - (dx / len) * 18;
            const endY = toNode.y - (dy / len) * 18;

            return (
              <g key={idx}>
                <defs>
                  <marker id={`arrow-${idx}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill={style.stroke} />
                  </marker>
                </defs>
                <line x1={fromNode.x} y1={fromNode.y} x2={endX} y2={endY}
                  stroke={style.stroke} strokeWidth={style.strokeWidth} markerEnd={`url(#arrow-${idx})`} />
              </g>
            );
          })}

          {stepData.nodes.map((node) => (
            <g key={node.id}>
              <circle cx={node.x} cy={node.y} r={18} className={getNodeStyle(node.id)} strokeWidth={2} />
              <text x={node.x} y={node.y + 4} textAnchor="middle" className="text-xs font-bold fill-gray-800">{node.id}</text>
              <circle cx={node.x + 14} cy={node.y - 14} r={8} fill="#f3f4f6" stroke="#9ca3af" />
              <text x={node.x + 14} y={node.y - 11} textAnchor="middle" className="text-[8px] fill-gray-600">{node.inDegree}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex gap-3 mb-2">
        <div className="flex-1 p-2 bg-blue-50 rounded-lg border border-blue-200 min-h-[50px]">
          <div className="text-[10px] font-medium text-blue-800 mb-1">Queue</div>
          <div className="flex gap-1 min-h-[24px]">
            {stepData.queue.length === 0 ? (
              <span className="text-blue-400 text-xs">Empty</span>
            ) : (
              stepData.queue.map((id) => (
                <span key={id} className="w-6 h-6 flex items-center justify-center bg-blue-400 text-white rounded text-xs font-bold">{id}</span>
              ))
            )}
          </div>
        </div>
        <div className="flex-1 p-2 bg-green-50 rounded-lg border border-green-200 min-h-[50px]">
          <div className="text-[10px] font-medium text-green-800 mb-1">Result</div>
          <div className="flex gap-1 min-h-[24px]">
            {stepData.result.length === 0 ? (
              <span className="text-green-400 text-xs">Empty</span>
            ) : (
              stepData.result.map((id, idx) => (
                <React.Fragment key={id}>
                  <span className="w-6 h-6 flex items-center justify-center bg-green-400 text-white rounded text-xs font-bold">{id}</span>
                  {idx < stepData.result.length - 1 && <span className="text-green-600 text-xs">→</span>}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );

  const modeToggle = (
    <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
      <button
        onClick={() => setMode('visualize')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'visualize' ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'interview' ? 'bg-white text-cyan-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
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
      accentColor="cyan"
    />
  ) : undefined;

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="Topological Sort (Interview Mode)"
      badges={BADGES}
      gradient="cyan"
      className={className}
      minHeight={380}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description: stepData.description,
        currentStep: playback.currentStep,
        totalSteps: playback.steps.length,
        variant: stepData.operation === 'done' ? 'success' : 'default',
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
        accentColor: 'cyan',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      sidePanel={sidePanel}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const TopologicalSortInterviewVisualizer = React.memo(TopologicalSortInterviewVisualizerComponent);
export default TopologicalSortInterviewVisualizer;
