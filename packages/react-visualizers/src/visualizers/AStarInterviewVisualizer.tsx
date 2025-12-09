import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface Cell {
  row: number;
  col: number;
  isWall: boolean;
  isStart: boolean;
  isEnd: boolean;
  g: number;
  h: number;
  f: number;
}

interface AStarStep {
  operation: 'init' | 'evaluate' | 'expandNeighbor' | 'pathFound' | 'done';
  grid: Cell[][];
  openSet: Array<{ row: number; col: number }>;
  closedSet: Array<{ row: number; col: number }>;
  currentCell?: { row: number; col: number };
  path?: Array<{ row: number; col: number }>;
  description: string;
}

interface AStarInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'astar-interview-visualizer';
const GRID_ROWS = 6;
const GRID_COLS = 8;
const START = { row: 1, col: 1 };
const END = { row: 4, col: 6 };
const WALLS = [
  { row: 0, col: 3 }, { row: 1, col: 3 }, { row: 2, col: 3 },
  { row: 3, col: 5 }, { row: 4, col: 5 },
];

const BADGES = [
  { label: 'Interview Mode', variant: 'purple' as const },
  { label: 'f = g + h', variant: 'amber' as const },
  { label: 'O(b^d)', variant: 'orange' as const },
];

const LEGEND_ITEMS = [
  { color: 'bg-green-500', label: 'Start' },
  { color: 'bg-red-500', label: 'End' },
  { color: 'bg-gray-700', label: 'Wall' },
  { color: 'bg-blue-200', label: 'Open set' },
  { color: 'bg-orange-200', label: 'Closed set' },
  { color: 'bg-purple-400', label: 'Path' },
];

// Interview questions about A*
const ASTAR_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'astar-1',
    question: 'What does f(n) = g(n) + h(n) represent in A*?',
    options: [
      'f = distance from start, g = distance to goal, h = total path',
      'f = estimated total cost, g = cost from start, h = heuristic to goal',
      'f = heuristic, g = goal distance, h = actual cost',
      'f = final cost, g = graph size, h = height',
    ],
    correctAnswer: 1,
    explanation: 'In A*, f(n) is the estimated total cost through node n: g(n) is the actual cost from start to n, and h(n) is the heuristic estimate from n to the goal.',
    difficulty: 'easy',
    topic: 'Core Concept',
  },
  {
    id: 'astar-2',
    question: 'What makes a heuristic "admissible"?',
    options: [
      'It always overestimates the true cost',
      'It never overestimates the true cost',
      'It equals the true cost exactly',
      'It runs in O(1) time',
    ],
    correctAnswer: 1,
    explanation: 'An admissible heuristic never overestimates the true cost to reach the goal. This guarantees A* finds the optimal path. Examples: Manhattan distance for grid with 4-directional movement.',
    hint: 'Think about what would happen if we overestimated.',
    difficulty: 'medium',
    topic: 'Heuristics',
  },
  {
    id: 'astar-3',
    question: 'What is the Manhattan distance heuristic?',
    options: [
      'Straight-line (Euclidean) distance',
      'Sum of absolute differences in x and y coordinates',
      'Maximum of x and y differences',
      'Minimum of x and y differences',
    ],
    correctAnswer: 1,
    explanation: 'Manhattan distance = |x1-x2| + |y1-y2|. It\'s the distance traveled in a grid when you can only move horizontally or vertically, like walking city blocks in Manhattan.',
    difficulty: 'easy',
    topic: 'Heuristics',
  },
  {
    id: 'astar-4',
    question: 'What happens if h(n) = 0 for all nodes?',
    options: [
      'A* becomes faster',
      'A* becomes Dijkstra\'s algorithm',
      'A* fails to find a path',
      'A* becomes DFS',
    ],
    correctAnswer: 1,
    explanation: 'With h(n) = 0, f(n) = g(n), and A* expands nodes purely by distance from start - exactly like Dijkstra\'s algorithm. The heuristic provides no guidance toward the goal.',
    difficulty: 'medium',
    topic: 'Algorithm Variants',
  },
  {
    id: 'astar-5',
    question: 'What is the time complexity of A* in the worst case?',
    options: [
      'O(V)',
      'O(V + E)',
      'O(E log V)',
      'O(b^d) where b = branching factor, d = depth',
    ],
    correctAnswer: 3,
    explanation: 'Worst case is O(b^d) exponential, where b is branching factor and d is solution depth. However, with a good heuristic, A* often performs much better in practice.',
    difficulty: 'hard',
    topic: 'Complexity',
  },
  {
    id: 'astar-6',
    question: 'What data structure is typically used for the open set?',
    options: [
      'Stack',
      'Queue',
      'Priority queue (min-heap)',
      'Hash set',
    ],
    correctAnswer: 2,
    explanation: 'A priority queue (min-heap) ordered by f-value ensures we always expand the most promising node first. This is key to A*\'s efficiency.',
    difficulty: 'easy',
    topic: 'Implementation',
  },
  {
    id: 'astar-7',
    question: 'What property makes A* complete and optimal?',
    options: [
      'Using BFS traversal',
      'Having an admissible and consistent heuristic',
      'Visiting all nodes exactly once',
      'Using depth-first search',
    ],
    correctAnswer: 1,
    explanation: 'A* is complete (finds a solution if one exists) and optimal (finds the shortest path) when the heuristic is both admissible (never overestimates) and consistent (triangle inequality holds).',
    difficulty: 'hard',
    topic: 'Properties',
  },
  {
    id: 'astar-8',
    question: 'How does A* differ from Greedy Best-First Search?',
    options: [
      'A* only uses the heuristic h(n)',
      'Greedy uses f(n) = g(n) + h(n)',
      'A* uses both g(n) and h(n), Greedy only uses h(n)',
      'They are identical algorithms',
    ],
    correctAnswer: 2,
    explanation: 'Greedy Best-First Search uses only h(n), ignoring the actual cost. This can lead to suboptimal paths. A* uses both g(n) (actual cost) and h(n) (estimate), guaranteeing optimality.',
    difficulty: 'medium',
    topic: 'Comparison',
  },
  {
    id: 'astar-9',
    question: 'When is Euclidean distance an admissible heuristic?',
    options: [
      'Only for 4-directional grid movement',
      'When diagonal movement is allowed with cost √2',
      'Never',
      'Only in 3D space',
    ],
    correctAnswer: 1,
    explanation: 'Euclidean distance is admissible when diagonal movement is allowed (8-directional). For 4-directional grids, Manhattan distance is used instead since you can\'t move diagonally.',
    difficulty: 'medium',
    topic: 'Heuristics',
  },
  {
    id: 'astar-10',
    question: 'What is the closed set used for in A*?',
    options: [
      'Storing the final path',
      'Preventing re-expansion of already evaluated nodes',
      'Sorting nodes by f-value',
      'Storing wall positions',
    ],
    correctAnswer: 1,
    explanation: 'The closed set tracks nodes that have been fully evaluated. This prevents A* from re-expanding the same node multiple times, which would waste computation.',
    difficulty: 'easy',
    topic: 'Implementation',
  },
];

function heuristic(a: { row: number; col: number }, b: { row: number; col: number }): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function createGrid(): Cell[][] {
  const grid: Cell[][] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    grid[row] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      const isWall = WALLS.some((w) => w.row === row && w.col === col);
      const isStart = START.row === row && START.col === col;
      const isEnd = END.row === row && END.col === col;
      grid[row][col] = {
        row, col, isWall, isStart, isEnd,
        g: Infinity, h: heuristic({ row, col }, END), f: Infinity,
      };
    }
  }
  return grid;
}

function cloneGrid(grid: Cell[][]): Cell[][] {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
}

function generateAStarSteps(): AStarStep[] {
  const steps: AStarStep[] = [];
  const grid = createGrid();

  grid[START.row][START.col].g = 0;
  grid[START.row][START.col].f = grid[START.row][START.col].h;

  const openSet = [{ row: START.row, col: START.col }];
  const closedSet: Array<{ row: number; col: number }> = [];

  steps.push({
    operation: 'init',
    grid: cloneGrid(grid),
    openSet: [...openSet],
    closedSet: [],
    description: `Initialize A*. Start at (${START.row},${START.col}), goal at (${END.row},${END.col}).`,
  });

  while (openSet.length > 0) {
    let lowestIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      const cell = grid[openSet[i].row][openSet[i].col];
      const lowest = grid[openSet[lowestIdx].row][openSet[lowestIdx].col];
      if (cell.f < lowest.f) lowestIdx = i;
    }

    const current = openSet[lowestIdx];
    const currentCell = grid[current.row][current.col];

    if (current.row === END.row && current.col === END.col) {
      steps.push({
        operation: 'pathFound',
        grid: cloneGrid(grid),
        openSet: [...openSet],
        closedSet: [...closedSet],
        path: [current],
        description: `✓ Path found! Cost: ${currentCell.g}`,
      });
      break;
    }

    openSet.splice(lowestIdx, 1);
    closedSet.push(current);

    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of dirs) {
      const nr = current.row + dr;
      const nc = current.col + dc;

      if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) continue;
      if (grid[nr][nc].isWall) continue;
      if (closedSet.some((c) => c.row === nr && c.col === nc)) continue;

      const tentativeG = currentCell.g + 1;
      const neighbor = grid[nr][nc];

      if (tentativeG < neighbor.g) {
        neighbor.g = tentativeG;
        neighbor.f = neighbor.g + neighbor.h;

        if (!openSet.some((c) => c.row === nr && c.col === nc)) {
          openSet.push({ row: nr, col: nc });
          steps.push({
            operation: 'expandNeighbor',
            grid: cloneGrid(grid),
            openSet: [...openSet],
            closedSet: [...closedSet],
            currentCell: { row: nr, col: nc },
            description: `Add (${nr},${nc}) to open: f=${neighbor.f}`,
          });
        }
      }
    }
  }

  steps.push({
    operation: 'done',
    grid: cloneGrid(grid),
    openSet: [],
    closedSet: [...closedSet],
    description: '✓ A* complete!',
  });

  return steps;
}

const AStarInterviewVisualizerComponent: React.FC<AStarInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'astar-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateAStarSteps, []);
  const {
    currentStep,
    currentStepData,
    steps,
    isPlaying,
    speed,
    handlePlayPause,
    handleStep,
    handleStepBack,
    handleReset,
    setSpeed,
  } = useVisualizerPlayback<AStarStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: ASTAR_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: AStarStep = currentStepData || {
    operation: 'init',
    grid: createGrid(),
    openSet: [],
    closedSet: [],
    description: '',
  };

  const getCellStyle = (row: number, col: number): string => {
    const cell = stepData.grid[row]?.[col];
    if (!cell) return 'bg-gray-100';

    if (cell.isStart) return 'bg-green-500 text-white';
    if (cell.isEnd) return 'bg-red-500 text-white';
    if (cell.isWall) return 'bg-gray-700';
    if (stepData.path?.some((p) => p.row === row && p.col === col)) return 'bg-purple-400';
    if (stepData.currentCell?.row === row && stepData.currentCell?.col === col) return 'bg-amber-400';
    if (stepData.closedSet.some((c) => c.row === row && c.col === col)) return 'bg-orange-200';
    if (stepData.openSet.some((c) => c.row === row && c.col === col)) return 'bg-blue-200';
    return 'bg-gray-100';
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const visualization = (
    <>
      {/* Grid */}
      <div className="flex justify-center mb-4">
        <div className="inline-block border border-gray-300 rounded overflow-hidden">
          {stepData.grid.map((row, rowIdx) => (
            <div key={rowIdx} className="flex">
              {row.map((cell, colIdx) => (
                <div
                  key={colIdx}
                  className={`w-9 h-9 border border-gray-200 flex items-center justify-center text-[10px] ${getCellStyle(rowIdx, colIdx)}`}
                >
                  {cell.isStart ? 'S' : cell.isEnd ? 'E' : cell.isWall ? '' : cell.g !== Infinity ? cell.f : ''}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 justify-center mb-3 text-xs">
        <div className="px-2 py-1 bg-blue-100 rounded">Open: {stepData.openSet.length}</div>
        <div className="px-2 py-1 bg-orange-100 rounded">Closed: {stepData.closedSet.length}</div>
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
      title="A* Pathfinding (Interview Mode)"
      badges={BADGES}
      gradient="orange"
      className={className}
      minHeight={500}
      onShare={handleShare}
      headerExtra={modeToggle}
      status={{
        description: stepData.description,
        currentStep,
        totalSteps: steps.length,
        variant: stepData.operation === 'pathFound' || stepData.operation === 'done' ? 'success' : 'default',
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
      sidePanel={sidePanel}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const AStarInterviewVisualizer = React.memo(AStarInterviewVisualizerComponent);
export default AStarInterviewVisualizer;
