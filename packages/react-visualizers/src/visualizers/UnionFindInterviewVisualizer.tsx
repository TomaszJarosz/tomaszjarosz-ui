import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface UFElement {
  id: number;
  parent: number;
  rank: number;
}

interface UnionFindStep {
  operation: 'init' | 'find' | 'pathCompress' | 'union' | 'unionByRank' | 'sameSet' | 'done';
  elements: UFElement[];
  highlightElements?: number[];
  pathToRoot?: number[];
  description: string;
  queryResult?: boolean;
}

interface UnionFindInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'unionfind-interview-visualizer';
const INITIAL_SIZE = 8;

const BADGES = [
  { label: 'O(α(n))', variant: 'purple' as const },
];

const OPERATIONS: Array<{ op: 'union' | 'find' | 'connected'; a: number; b?: number }> = [
  { op: 'union', a: 0, b: 1 },
  { op: 'union', a: 2, b: 3 },
  { op: 'union', a: 4, b: 5 },
  { op: 'union', a: 0, b: 2 },
  { op: 'union', a: 4, b: 6 },
  { op: 'find', a: 3 },
  { op: 'connected', a: 1, b: 3 },
  { op: 'union', a: 0, b: 4 },
];

const LEGEND_ITEMS = [
  { color: 'bg-gray-100', label: 'Element', border: '#d1d5db' },
  { color: 'bg-blue-200', label: 'Current', border: '#60a5fa' },
  { color: 'bg-green-400', label: 'Root / Same set' },
];

// Interview questions about Union-Find
const UNIONFIND_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'uf-1',
    question: 'What is the time complexity of find() and union() with path compression and union by rank?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(α(n)) - inverse Ackermann'],
    correctAnswer: 3,
    explanation: 'With both optimizations, the amortized time is O(α(n)), where α is the inverse Ackermann function. For all practical purposes, α(n) ≤ 4, making operations nearly constant time.',
    hint: 'The inverse Ackermann function grows extremely slowly.',
    difficulty: 'medium',
    topic: 'Complexity',
  },
  {
    id: 'uf-2',
    question: 'What does path compression do in Union-Find?',
    options: [
      'Reduces the rank of all nodes',
      'Makes all nodes on find() path point directly to root',
      'Compresses the memory used by the data structure',
      'Removes duplicate elements',
    ],
    correctAnswer: 1,
    explanation: 'Path compression flattens the tree by making every node on the path from x to root point directly to the root. This speeds up future find() operations on these nodes.',
    difficulty: 'easy',
    topic: 'Optimization',
  },
  {
    id: 'uf-3',
    question: 'What is the purpose of union by rank (or union by size)?',
    options: [
      'To ensure trees are always binary',
      'To minimize the depth of the resulting tree',
      'To sort elements by their value',
      'To remove cycles from the graph',
    ],
    correctAnswer: 1,
    explanation: 'Union by rank attaches the shorter tree under the root of the taller tree, keeping trees balanced. This prevents worst-case O(n) depth that would occur if we always attached one way.',
    difficulty: 'medium',
    topic: 'Optimization',
  },
  {
    id: 'uf-4',
    question: 'Which algorithm commonly uses Union-Find for cycle detection?',
    options: ['Dijkstra\'s shortest path', 'Kruskal\'s minimum spanning tree', 'Bellman-Ford', 'Floyd-Warshall'],
    correctAnswer: 1,
    explanation: 'Kruskal\'s MST algorithm uses Union-Find to detect if adding an edge would create a cycle. If both endpoints are in the same set (same root), adding the edge creates a cycle.',
    difficulty: 'easy',
    topic: 'Applications',
  },
  {
    id: 'uf-5',
    question: 'What is the space complexity of Union-Find for n elements?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctAnswer: 2,
    explanation: 'Union-Find uses O(n) space: an array of n parents and (optionally) an array of n ranks. No additional space grows with the number of operations.',
    difficulty: 'easy',
    topic: 'Space',
  },
  {
    id: 'uf-6',
    question: 'Without any optimizations, what is the worst-case time complexity of find()?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 2,
    explanation: 'Without optimizations, union operations can create a linear chain (like a linked list). In this case, find() must traverse n-1 edges to reach the root, giving O(n) time.',
    hint: 'Think about what happens if we always attach the new element to the same side.',
    difficulty: 'medium',
    topic: 'Complexity',
  },
  {
    id: 'uf-7',
    question: 'Which problem can Union-Find solve efficiently?',
    options: [
      'Finding shortest path between two nodes',
      'Finding number of connected components in a graph',
      'Topological sorting',
      'Finding strongly connected components',
    ],
    correctAnswer: 1,
    explanation: 'Union-Find excels at tracking connected components: union(u,v) for each edge, then count unique roots. Its nearly O(1) per operation makes it efficient for dynamic connectivity.',
    difficulty: 'easy',
    topic: 'Applications',
  },
  {
    id: 'uf-8',
    question: 'What happens when you call union(x, y) if x and y are already in the same set?',
    options: [
      'An error is thrown',
      'Nothing happens (no-op)',
      'The tree is restructured',
      'Both elements are removed',
    ],
    correctAnswer: 1,
    explanation: 'If find(x) == find(y), the elements share a root and are already connected. Standard implementations detect this and skip the union, making it a no-op.',
    difficulty: 'easy',
    topic: 'Operations',
  },
  {
    id: 'uf-9',
    question: 'How does Union-Find compare to DFS for checking connectivity?',
    options: [
      'Union-Find is always slower',
      'DFS is always faster',
      'Union-Find is better for dynamic graphs with many queries',
      'They have identical performance',
    ],
    correctAnswer: 2,
    explanation: 'For static graphs, DFS/BFS is O(V+E). But for dynamic graphs with many connectivity queries, Union-Find\'s O(α(n)) per operation makes it far superior to repeated DFS.',
    difficulty: 'hard',
    topic: 'Comparison',
  },
  {
    id: 'uf-10',
    question: 'What is the inverse Ackermann function α(n) approximately equal to for practical values of n?',
    options: ['log n', 'sqrt(n)', 'At most 4-5', 'n / 2'],
    correctAnswer: 2,
    explanation: 'The inverse Ackermann function grows so slowly that α(n) ≤ 4 for n up to 10^600 (far exceeding atoms in universe). For all practical purposes, it\'s effectively constant.',
    difficulty: 'hard',
    topic: 'Theory',
  },
];

function cloneElements(elements: UFElement[]): UFElement[] {
  return elements.map((el) => ({ ...el }));
}

function generateUnionFindSteps(): UnionFindStep[] {
  const steps: UnionFindStep[] = [];

  const elements: UFElement[] = Array.from({ length: INITIAL_SIZE }, (_, i) => ({
    id: i,
    parent: i,
    rank: 0,
  }));

  steps.push({
    operation: 'init',
    elements: cloneElements(elements),
    description: `Initialize ${INITIAL_SIZE} elements. Each is its own parent.`,
  });

  const find = (x: number, trackPath: boolean = false): { root: number; path: number[] } => {
    const path: number[] = [x];
    let current = x;

    while (elements[current].parent !== current) {
      current = elements[current].parent;
      path.push(current);
    }

    if (trackPath && path.length > 2) {
      for (let i = 0; i < path.length - 1; i++) {
        elements[path[i]].parent = current;
      }
    }

    return { root: current, path };
  };

  for (const operation of OPERATIONS) {
    if (operation.op === 'find') {
      const x = operation.a;
      const { root, path } = find(x, true);

      steps.push({
        operation: 'find',
        elements: cloneElements(elements),
        highlightElements: [root],
        pathToRoot: path,
        description: `find(${x}): Path ${path.join(' → ')}, root = ${root}`,
      });
    } else if (operation.op === 'union') {
      const x = operation.a;
      const y = operation.b!;

      const { root: rootX } = find(x);
      const { root: rootY } = find(y);

      if (rootX === rootY) {
        steps.push({
          operation: 'sameSet',
          elements: cloneElements(elements),
          highlightElements: [rootX],
          description: `union(${x}, ${y}): Already in same set!`,
        });
      } else {
        const rankX = elements[rootX].rank;
        const rankY = elements[rootY].rank;

        let newRoot: number;
        if (rankX < rankY) {
          elements[rootX].parent = rootY;
          newRoot = rootY;
        } else if (rankX > rankY) {
          elements[rootY].parent = rootX;
          newRoot = rootX;
        } else {
          elements[rootY].parent = rootX;
          elements[rootX].rank++;
          newRoot = rootX;
        }

        steps.push({
          operation: 'unionByRank',
          elements: cloneElements(elements),
          highlightElements: [newRoot],
          description: `union(${x}, ${y}): Merged sets, new root = ${newRoot}`,
        });
      }
    } else if (operation.op === 'connected') {
      const x = operation.a;
      const y = operation.b!;

      const { root: rootX, path: pathX } = find(x);
      const { root: rootY, path: pathY } = find(y);

      const connected = rootX === rootY;

      steps.push({
        operation: 'sameSet',
        elements: cloneElements(elements),
        highlightElements: connected ? [rootX] : [rootX, rootY],
        pathToRoot: [...pathX, ...pathY],
        description: connected
          ? `connected(${x}, ${y}): Yes, both in set with root ${rootX}`
          : `connected(${x}, ${y}): No, different sets`,
        queryResult: connected,
      });
    }
  }

  const roots = new Set<number>();
  for (let i = 0; i < INITIAL_SIZE; i++) {
    roots.add(find(i).root);
  }

  steps.push({
    operation: 'done',
    elements: cloneElements(elements),
    description: `Done! ${roots.size} distinct set(s) remain.`,
  });

  return steps;
}

const UnionFindInterviewVisualizerComponent: React.FC<UnionFindInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'uf-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateUnionFindSteps, []);

  const playback = useVisualizerPlayback<UnionFindStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: UNIONFIND_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: UnionFindStep = playback.currentStepData || {
    operation: 'init',
    elements: [],
    description: '',
  };

  // Group elements by their root
  const groups = useMemo(() => {
    const groupMap = new Map<number, number[]>();
    for (const el of stepData.elements) {
      let current = el.id;
      while (stepData.elements[current]?.parent !== current) {
        current = stepData.elements[current]?.parent ?? current;
      }
      const root = current;

      if (!groupMap.has(root)) {
        groupMap.set(root, []);
      }
      groupMap.get(root)!.push(el.id);
    }
    return groupMap;
  }, [stepData.elements]);

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  const groupColors = ['bg-blue-50', 'bg-green-50', 'bg-amber-50', 'bg-purple-50', 'bg-pink-50', 'bg-cyan-50'];

  const visualization = (
    <>
      {/* Info */}
      <div className="mb-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
        <div className="text-xs text-purple-800 text-center">
          <span className="font-medium">Union-Find:</span> Path compression + Union by rank = nearly O(1)
        </div>
      </div>

      {/* Elements */}
      <div className="mb-3">
        <div className="text-xs font-medium text-gray-600 mb-2">Elements:</div>
        <div className="flex flex-wrap gap-2 justify-center">
          {stepData.elements.map((el) => {
            const isHighlighted = stepData.highlightElements?.includes(el.id);
            const isInPath = stepData.pathToRoot?.includes(el.id);
            const isRoot = el.parent === el.id;

            let style = 'border-gray-300 bg-gray-50';
            if (isHighlighted && isRoot) style = 'border-green-500 bg-green-100 ring-2 ring-green-300';
            else if (isHighlighted) style = 'border-blue-400 bg-blue-100 ring-2 ring-blue-300';
            else if (isInPath) style = 'border-amber-400 bg-amber-100';
            else if (isRoot) style = 'border-green-300 bg-green-50';

            return (
              <div key={el.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-lg border-2 flex flex-col items-center justify-center text-sm font-bold transition-all duration-300 ${style}`}>
                  <span>{el.id}</span>
                  <span className="text-[8px] text-gray-500">r:{el.rank}</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {el.parent === el.id ? 'root' : `↑${el.parent}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Groups */}
      <div className="mb-3">
        <div className="text-xs font-medium text-gray-600 mb-2">
          Sets ({groups.size}):
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {Array.from(groups.entries()).map(([root, members], idx) => (
            <div
              key={root}
              className={`px-2 py-1 rounded border ${groupColors[idx % groupColors.length]} border-gray-300`}
            >
              <span className="text-xs text-gray-600">
                [{members.sort((a, b) => a - b).join(', ')}]
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const modeToggle = (
    <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
      <button
        onClick={() => setMode('visualize')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'visualize'
            ? 'bg-white text-purple-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          mode === 'interview'
            ? 'bg-white text-purple-600 shadow-sm'
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
      accentColor="purple"
    />
  ) : undefined;

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="Union-Find (DSU) - Interview Mode"
      badges={BADGES}
      gradient="purple"
      className={className}
      minHeight={500}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description: stepData.description,
        currentStep: playback.currentStep,
        totalSteps: playback.steps.length,
        variant:
          stepData.queryResult === false
            ? 'error'
            : stepData.queryResult === true || stepData.operation === 'done'
              ? 'success'
              : 'default',
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
        accentColor: 'purple',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      sidePanel={sidePanel}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const UnionFindInterviewVisualizer = React.memo(UnionFindInterviewVisualizerComponent);
export default UnionFindInterviewVisualizer;
