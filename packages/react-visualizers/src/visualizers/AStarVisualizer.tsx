import React, { useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';

interface Cell {
  row: number;
  col: number;
  isWall: boolean;
  isStart: boolean;
  isEnd: boolean;
  g: number; // cost from start
  h: number; // heuristic (estimated cost to end)
  f: number; // g + h
  parent: { row: number; col: number } | null;
}

type CellState = 'default' | 'start' | 'end' | 'wall' | 'open' | 'closed' | 'path' | 'current';

interface AStarStep {
  operation: 'init' | 'addToOpen' | 'evaluate' | 'expandNeighbor' | 'pathFound' | 'noPath' | 'done';
  grid: Cell[][];
  openSet: Array<{ row: number; col: number }>;
  closedSet: Array<{ row: number; col: number }>;
  currentCell?: { row: number; col: number };
  path?: Array<{ row: number; col: number }>;
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
}

interface AStarVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const GRID_ROWS = 8;
const GRID_COLS = 12;
const START = { row: 1, col: 1 };
const END = { row: 6, col: 10 };

// Predefined walls for interesting path
const WALLS = [
  { row: 0, col: 4 }, { row: 1, col: 4 }, { row: 2, col: 4 }, { row: 3, col: 4 },
  { row: 5, col: 4 }, { row: 6, col: 4 }, { row: 7, col: 4 },
  { row: 3, col: 6 }, { row: 4, col: 6 }, { row: 5, col: 6 }, { row: 6, col: 6 },
  { row: 2, col: 8 }, { row: 3, col: 8 }, { row: 4, col: 8 },
];

const ASTAR_CODE = [
  'function A*(start, goal):',
  '  openSet = {start}',
  '  closedSet = {}',
  '  g[start] = 0',
  '  f[start] = h(start, goal)',
  '',
  '  while openSet not empty:',
  '    current = lowest f in openSet',
  '    if current == goal:',
  '      return reconstructPath()',
  '',
  '    openSet.remove(current)',
  '    closedSet.add(current)',
  '',
  '    for each neighbor of current:',
  '      if neighbor in closedSet:',
  '        continue',
  '      tentative_g = g[current] + 1',
  '      if tentative_g < g[neighbor]:',
  '        g[neighbor] = tentative_g',
  '        f[neighbor] = g + h(neighbor)',
  '        openSet.add(neighbor)',
  '  return failure',
];

const LEGEND_ITEMS = [
  { color: 'bg-green-500', label: 'Start' },
  { color: 'bg-red-500', label: 'End' },
  { color: 'bg-gray-700', label: 'Wall' },
  { color: 'bg-blue-200', label: 'Open set', border: '#60a5fa' },
  { color: 'bg-orange-200', label: 'Closed set' },
  { color: 'bg-yellow-400', label: 'Current' },
  { color: 'bg-purple-400', label: 'Path' },
];

const BADGES = [
  { label: 'Time: O(E log V)', variant: 'orange' as const },
  { label: 'Optimal Path', variant: 'orange' as const },
];

function heuristic(a: { row: number; col: number }, b: { row: number; col: number }): number {
  // Manhattan distance
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
        row,
        col,
        isWall,
        isStart,
        isEnd,
        g: Infinity,
        h: heuristic({ row, col }, END),
        f: Infinity,
        parent: null,
      };
    }
  }
  return grid;
}

function cloneGrid(grid: Cell[][]): Cell[][] {
  return grid.map((row) =>
    row.map((cell) => ({
      ...cell,
      parent: cell.parent ? { ...cell.parent } : null,
    }))
  );
}

function getNeighbors(grid: Cell[][], cell: Cell): Cell[] {
  const neighbors: Cell[] = [];
  const dirs = [
    [-1, 0], [1, 0], [0, -1], [0, 1], // 4-directional
  ];

  for (const [dr, dc] of dirs) {
    const nr = cell.row + dr;
    const nc = cell.col + dc;
    if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS && !grid[nr][nc].isWall) {
      neighbors.push(grid[nr][nc]);
    }
  }
  return neighbors;
}

function generateAStarSteps(): AStarStep[] {
  const steps: AStarStep[] = [];
  const grid = createGrid();

  // Initialize
  const startCell = grid[START.row][START.col];
  startCell.g = 0;
  startCell.f = startCell.h;

  const openSet: Array<{ row: number; col: number }> = [{ row: START.row, col: START.col }];
  const closedSet: Array<{ row: number; col: number }> = [];

  steps.push({
    operation: 'init',
    grid: cloneGrid(grid),
    openSet: [...openSet],
    closedSet: [...closedSet],
    description: `Initialize A*. Start at (${START.row},${START.col}), goal at (${END.row},${END.col}). h(start) = ${startCell.h}`,
    codeLine: 1,
    variables: { start: `(${START.row},${START.col})`, goal: `(${END.row},${END.col})`, h: startCell.h },
  });

  while (openSet.length > 0) {
    // Find cell with lowest f score
    let lowestIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      const cell = grid[openSet[i].row][openSet[i].col];
      const lowest = grid[openSet[lowestIdx].row][openSet[lowestIdx].col];
      if (cell.f < lowest.f || (cell.f === lowest.f && cell.h < lowest.h)) {
        lowestIdx = i;
      }
    }

    const current = openSet[lowestIdx];
    const currentCell = grid[current.row][current.col];

    steps.push({
      operation: 'evaluate',
      grid: cloneGrid(grid),
      openSet: [...openSet],
      closedSet: [...closedSet],
      currentCell: current,
      description: `Evaluate (${current.row},${current.col}): f=${currentCell.f}, g=${currentCell.g}, h=${currentCell.h}`,
      codeLine: 7,
      variables: { current: `(${current.row},${current.col})`, f: currentCell.f, g: currentCell.g, h: currentCell.h },
    });

    // Check if reached goal
    if (current.row === END.row && current.col === END.col) {
      // Reconstruct path
      const path: Array<{ row: number; col: number }> = [];
      let curr: { row: number; col: number } | null = current;
      while (curr) {
        path.unshift(curr);
        curr = grid[curr.row][curr.col].parent;
      }

      steps.push({
        operation: 'pathFound',
        grid: cloneGrid(grid),
        openSet: [...openSet],
        closedSet: [...closedSet],
        currentCell: current,
        path,
        description: `✓ Path found! Length: ${path.length} cells, Cost: ${currentCell.g}`,
        codeLine: 9,
        variables: { pathLength: path.length, cost: currentCell.g },
      });

      steps.push({
        operation: 'done',
        grid: cloneGrid(grid),
        openSet: [],
        closedSet: [...closedSet],
        path,
        description: `✓ A* complete! Optimal path from start to goal: ${path.length} steps.`,
        codeLine: -1,
      });

      return steps;
    }

    // Move current from open to closed
    openSet.splice(lowestIdx, 1);
    closedSet.push(current);

    // Explore neighbors
    const neighbors = getNeighbors(grid, currentCell);

    for (const neighbor of neighbors) {
      const neighborPos = { row: neighbor.row, col: neighbor.col };

      // Skip if in closed set
      if (closedSet.some((c) => c.row === neighbor.row && c.col === neighbor.col)) {
        continue;
      }

      const tentativeG = currentCell.g + 1;

      // Check if this path is better
      const inOpen = openSet.some((c) => c.row === neighbor.row && c.col === neighbor.col);

      if (tentativeG < neighbor.g) {
        // Update path
        neighbor.parent = current;
        neighbor.g = tentativeG;
        neighbor.f = neighbor.g + neighbor.h;

        if (!inOpen) {
          openSet.push(neighborPos);

          steps.push({
            operation: 'expandNeighbor',
            grid: cloneGrid(grid),
            openSet: [...openSet],
            closedSet: [...closedSet],
            currentCell: neighborPos,
            description: `Add (${neighbor.row},${neighbor.col}) to open set: g=${neighbor.g}, h=${neighbor.h}, f=${neighbor.f}`,
            codeLine: 21,
            variables: {
              neighbor: `(${neighbor.row},${neighbor.col})`,
              g: neighbor.g,
              h: neighbor.h,
              f: neighbor.f,
            },
          });
        }
      }
    }
  }

  // No path found
  steps.push({
    operation: 'noPath',
    grid: cloneGrid(grid),
    openSet: [],
    closedSet: [...closedSet],
    description: '✗ No path found! Goal is unreachable.',
    codeLine: 22,
  });

  return steps;
}

const AStarVisualizerComponent: React.FC<AStarVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'astar-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'astar', scrollToId: VISUALIZER_ID });

  const generateSteps = useMemo(() => generateAStarSteps, []);

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
  } = useVisualizerPlayback<AStarStep>({
    generateSteps,
  });

  const stepData: AStarStep = currentStepData || {
    operation: 'init',
    grid: createGrid(),
    openSet: [],
    closedSet: [],
    description: '',
  };

  const getCellState = (row: number, col: number): CellState => {
    const cell = stepData.grid[row]?.[col];
    if (!cell) return 'default';

    if (cell.isStart) return 'start';
    if (cell.isEnd) return 'end';
    if (cell.isWall) return 'wall';

    if (stepData.path?.some((p) => p.row === row && p.col === col)) return 'path';
    if (stepData.currentCell?.row === row && stepData.currentCell?.col === col) return 'current';
    if (stepData.closedSet.some((c) => c.row === row && c.col === col)) return 'closed';
    if (stepData.openSet.some((c) => c.row === row && c.col === col)) return 'open';

    return 'default';
  };

  const getCellStyle = (state: CellState): string => {
    switch (state) {
      case 'start':
        return 'bg-green-500 text-white';
      case 'end':
        return 'bg-red-500 text-white';
      case 'wall':
        return 'bg-gray-700';
      case 'path':
        return 'bg-purple-400 text-white ring-2 ring-purple-600';
      case 'current':
        return 'bg-yellow-400 ring-2 ring-yellow-600';
      case 'closed':
        return 'bg-orange-200';
      case 'open':
        return 'bg-blue-200 ring-1 ring-blue-400';
      default:
        return 'bg-gray-100';
    }
  };

  const getStatusVariant = () => {
    if (stepData.operation === 'noPath') return 'error' as const;
    if (stepData.operation === 'pathFound' || stepData.operation === 'done') return 'success' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const visualization = (
    <>
      {/* Info Box */}
      <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
        <div className="text-sm font-semibold text-amber-800 mb-2">
          🎯 A* Algorithm
        </div>
        <div className="text-xs text-amber-700 space-y-1">
          <div>• <strong>f(n) = g(n) + h(n)</strong></div>
          <div>• g(n): actual cost from start</div>
          <div>• h(n): heuristic estimate to goal (Manhattan)</div>
          <div>• Guarantees optimal path with admissible heuristic</div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex justify-center mb-4">
        <div className="inline-block border border-gray-300 rounded-lg overflow-hidden">
          {stepData.grid.map((row, rowIdx) => (
            <div key={rowIdx} className="flex">
              {row.map((cell, colIdx) => {
                const state = getCellState(rowIdx, colIdx);
                const showValues = !cell.isWall && !cell.isStart && cell.g !== Infinity;

                return (
                  <div
                    key={colIdx}
                    className={`
                      w-10 h-10 border border-gray-200 flex flex-col items-center justify-center
                      text-[9px] transition-all duration-200
                      ${getCellStyle(state)}
                    `}
                  >
                    {cell.isStart && <span className="text-xs font-bold">S</span>}
                    {cell.isEnd && <span className="text-xs font-bold">E</span>}
                    {showValues && (
                      <>
                        <span className="font-bold">{cell.f}</span>
                        <span className="text-[7px] opacity-75">
                          {cell.g}+{cell.h}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 justify-center mb-4 text-sm min-h-[32px]">
        <div className="px-3 py-1 bg-blue-100 rounded">
          Open: <span className="font-bold">{stepData.openSet.length}</span>
        </div>
        <div className="px-3 py-1 bg-orange-100 rounded">
          Closed: <span className="font-bold">{stepData.closedSet.length}</span>
        </div>
        <div className={`px-3 py-1 bg-purple-100 rounded ${!stepData.path ? 'invisible' : ''}`}>
          Path: <span className="font-bold">{stepData.path?.length || 0}</span> cells
        </div>
      </div>
    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="A* Pathfinding"
      badges={BADGES}
      gradient="orange"
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
        accentColor: 'orange',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? ASTAR_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const AStarVisualizer = React.memo(AStarVisualizerComponent);
export default AStarVisualizer;
