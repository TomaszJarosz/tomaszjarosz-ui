import React, { useMemo, useCallback } from 'react';
import {
  CodePanel,
  HelpPanel,
  ControlPanel,
  Legend,
  StatusPanel,
  ShareButton,
  useUrlState,
  useVisualizerPlayback,
  VisualizationArea,
} from '../shared';

interface UFElement {
  id: number;
  parent: number;
  rank: number;
}

interface UnionFindStep {
  operation: 'init' | 'find' | 'pathCompress' | 'union' | 'unionByRank' | 'sameSet' | 'done';
  elements: UFElement[];
  highlightElements?: number[];
  highlightEdge?: [number, number];
  pathToRoot?: number[];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  queryResult?: boolean;
}

interface UnionFindVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const INITIAL_SIZE = 8;

const OPERATIONS: Array<{ op: 'union' | 'find' | 'connected'; a: number; b?: number }> = [
  { op: 'union', a: 0, b: 1 },
  { op: 'union', a: 2, b: 3 },
  { op: 'union', a: 4, b: 5 },
  { op: 'union', a: 6, b: 7 },
  { op: 'union', a: 0, b: 2 },
  { op: 'union', a: 4, b: 6 },
  { op: 'find', a: 3 },
  { op: 'connected', a: 1, b: 3 },
  { op: 'connected', a: 0, b: 5 },
  { op: 'union', a: 0, b: 4 },
  { op: 'connected', a: 3, b: 7 },
];

const UF_CODE = [
  'class UnionFind:',
  '  parent[] = [0, 1, ..., n-1]',
  '  rank[] = [0, 0, ..., 0]',
  '',
  'function find(x):',
  '  if parent[x] != x:',
  '    parent[x] = find(parent[x])',
  '    # path compression',
  '  return parent[x]',
  '',
  'function union(x, y):',
  '  rootX = find(x)',
  '  rootY = find(y)',
  '  if rootX == rootY: return',
  '  # union by rank',
  '  if rank[rootX] < rank[rootY]:',
  '    parent[rootX] = rootY',
  '  else if rank[rootX] > rank[rootY]:',
  '    parent[rootY] = rootX',
  '  else:',
  '    parent[rootY] = rootX',
  '    rank[rootX] += 1',
];

const LEGEND_ITEMS = [
  { color: 'bg-gray-100', label: 'Element', border: '#d1d5db' },
  { color: 'bg-blue-200', label: 'Current', border: '#60a5fa' },
  { color: 'bg-yellow-200', label: 'Path to root', border: '#fbbf24' },
  { color: 'bg-green-400', label: 'Root / Same set' },
  { color: 'bg-red-400', label: 'Different sets' },
  { color: 'bg-purple-400', label: 'Union edge' },
];

function cloneElements(elements: UFElement[]): UFElement[] {
  return elements.map((el) => ({ ...el }));
}

function generateUnionFindSteps(): UnionFindStep[] {
  const steps: UnionFindStep[] = [];

  // Initialize elements
  const elements: UFElement[] = Array.from({ length: INITIAL_SIZE }, (_, i) => ({
    id: i,
    parent: i,
    rank: 0,
  }));

  steps.push({
    operation: 'init',
    elements: cloneElements(elements),
    description: `Initialize ${INITIAL_SIZE} elements. Each element is its own parent (self-loop).`,
    codeLine: 1,
    variables: { n: INITIAL_SIZE },
  });

  const find = (x: number, trackPath: boolean = false): { root: number; path: number[] } => {
    const path: number[] = [x];
    let current = x;

    while (elements[current].parent !== current) {
      current = elements[current].parent;
      path.push(current);
    }

    // Path compression
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

      steps.push({
        operation: 'find',
        elements: cloneElements(elements),
        highlightElements: [x],
        description: `find(${x}): Find the root of element ${x}`,
        codeLine: 4,
        variables: { x },
      });

      const { root, path } = find(x);

      steps.push({
        operation: 'find',
        elements: cloneElements(elements),
        highlightElements: [root],
        pathToRoot: path,
        description: `Path: ${path.join(' → ')}. Root is ${root}`,
        codeLine: 8,
        variables: { x, root },
      });

      // Show path compression if needed
      if (path.length > 2) {
        find(x, true); // Apply path compression

        steps.push({
          operation: 'pathCompress',
          elements: cloneElements(elements),
          highlightElements: path.slice(0, -1),
          pathToRoot: path,
          description: `Path compression: All nodes on path now point directly to root ${root}`,
          codeLine: 6,
          variables: { x, root },
        });
      }
    } else if (operation.op === 'union') {
      const x = operation.a;
      const y = operation.b!;

      steps.push({
        operation: 'union',
        elements: cloneElements(elements),
        highlightElements: [x, y],
        description: `union(${x}, ${y}): Merge sets containing ${x} and ${y}`,
        codeLine: 10,
        variables: { x, y },
      });

      const { root: rootX, path: pathX } = find(x);
      const { root: rootY, path: pathY } = find(y);

      steps.push({
        operation: 'find',
        elements: cloneElements(elements),
        highlightElements: [rootX, rootY],
        pathToRoot: [...pathX, ...pathY],
        description: `find(${x}) = ${rootX}, find(${y}) = ${rootY}`,
        codeLine: 11,
        variables: { x, y, rootX, rootY },
      });

      if (rootX === rootY) {
        steps.push({
          operation: 'sameSet',
          elements: cloneElements(elements),
          highlightElements: [rootX],
          description: `Already in same set! No union needed.`,
          codeLine: 13,
          variables: { rootX, rootY, 'same': 'true' },
        });
      } else {
        // Union by rank
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
          highlightEdge: [rootX, rootY],
          description: `Union by rank: rank[${rootX}]=${rankX}, rank[${rootY}]=${rankY}. ${newRoot} becomes root.`,
          codeLine: rankX === rankY ? 20 : (rankX < rankY ? 16 : 18),
          variables: { rootX, rootY, rankX, rankY, newRoot },
        });
      }
    } else if (operation.op === 'connected') {
      const x = operation.a;
      const y = operation.b!;

      steps.push({
        operation: 'find',
        elements: cloneElements(elements),
        highlightElements: [x, y],
        description: `connected(${x}, ${y}): Check if ${x} and ${y} are in the same set`,
        codeLine: 4,
        variables: { x, y },
      });

      const { root: rootX, path: pathX } = find(x);
      const { root: rootY, path: pathY } = find(y);

      const connected = rootX === rootY;

      steps.push({
        operation: 'sameSet',
        elements: cloneElements(elements),
        highlightElements: connected ? [rootX] : [rootX, rootY],
        pathToRoot: [...pathX, ...pathY],
        description: connected
          ? `✓ Yes! Both ${x} and ${y} have root ${rootX}`
          : `✗ No! ${x} has root ${rootX}, ${y} has root ${rootY}`,
        codeLine: 13,
        variables: { x, y, rootX, rootY, connected: connected ? 'true' : 'false' },
        queryResult: connected,
      });
    }
  }

  // Count distinct sets
  const roots = new Set<number>();
  for (let i = 0; i < INITIAL_SIZE; i++) {
    roots.add(find(i).root);
  }

  steps.push({
    operation: 'done',
    elements: cloneElements(elements),
    description: `✓ Done! ${roots.size} distinct set(s) remain.`,
    codeLine: -1,
    variables: { sets: roots.size },
  });

  return steps;
}

const UnionFindVisualizerComponent: React.FC<UnionFindVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'unionfind-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'uf', scrollToId: VISUALIZER_ID });

  const generateSteps = useMemo(() => generateUnionFindSteps, []);

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
  } = useVisualizerPlayback<UnionFindStep>({
    generateSteps,
  });

  const stepData = currentStepData || {
    operation: 'init' as const,
    elements: [],
    description: '',
  };

  // Group elements by their root
  const groups = useMemo(() => {
    const groupMap = new Map<number, number[]>();
    for (const el of stepData.elements) {
      // Find root
      let current = el.id;
      while (stepData.elements[current].parent !== current) {
        current = stepData.elements[current].parent;
      }
      const root = current;

      if (!groupMap.has(root)) {
        groupMap.set(root, []);
      }
      groupMap.get(root)!.push(el.id);
    }
    return groupMap;
  }, [stepData.elements]);

  const getElementStyle = (id: number): string => {
    const isHighlighted = stepData.highlightElements?.includes(id);
    const isInPath = stepData.pathToRoot?.includes(id);
    const isRoot = stepData.elements[id]?.parent === id;

    if (isHighlighted && isRoot) return 'border-green-500 bg-green-100 ring-2 ring-green-300';
    if (isHighlighted) return 'border-blue-400 bg-blue-100 ring-2 ring-blue-300';
    if (isInPath) return 'border-yellow-400 bg-yellow-100';
    if (isRoot) return 'border-green-300 bg-green-50';
    return 'border-gray-300 bg-gray-50';
  };

  const getStatusVariant = () => {
    if (stepData.queryResult === false) return 'error' as const;
    if (stepData.queryResult === true) return 'success' as const;
    if (stepData.operation === 'done') return 'warning' as const;
    if (stepData.operation === 'pathCompress' || stepData.operation === 'unionByRank') return 'success' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  // Generate colors for groups
  const groupColors = ['bg-blue-50', 'bg-green-50', 'bg-yellow-50', 'bg-purple-50', 'bg-pink-50', 'bg-cyan-50', 'bg-orange-50', 'bg-rose-50'];

  return (
    <div
      id={VISUALIZER_ID}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">Union-Find (Disjoint Set)</h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-700 rounded">
                Find: O(α(n))
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                Union: O(α(n))
              </span>
            </div>
          </div>
          <ShareButton onShare={handleShare} />
        </div>
      </div>

      {/* Visualization Area */}
      <div className="p-4">
        <div className={`flex gap-4 ${showCode ? 'flex-col lg:flex-row' : ''}`}>
          {/* Main Visualization */}
          <VisualizationArea minHeight={400} className={showCode ? 'flex-1' : 'w-full'}>
            {/* Info Box */}
            <div className="mb-4 p-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-200">
              <div className="text-sm font-semibold text-violet-800 mb-2">
                🔗 Union-Find / Disjoint Set Union (DSU)
              </div>
              <div className="text-xs text-violet-700 space-y-1">
                <div>• <strong>Path Compression</strong>: Flattens tree on find()</div>
                <div>• <strong>Union by Rank</strong>: Attach smaller tree to larger</div>
                <div>• α(n) = inverse Ackermann, practically ≤ 4</div>
                <div>• Used in Kruskal's MST, cycle detection, networks</div>
              </div>
            </div>

            {/* Elements Grid */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Elements (parent pointers shown as arrows)
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {stepData.elements.map((el) => (
                  <div key={el.id} className="flex flex-col items-center">
                    <div
                      className={`
                        w-12 h-12 rounded-lg border-2 flex flex-col items-center justify-center
                        text-sm font-bold transition-all duration-300
                        ${getElementStyle(el.id)}
                      `}
                    >
                      <span>{el.id}</span>
                      <span className="text-[9px] text-gray-500">r:{el.rank}</span>
                    </div>
                    {el.parent !== el.id && (
                      <div className="text-xs text-gray-500 mt-1">↑ {el.parent}</div>
                    )}
                    {el.parent === el.id && (
                      <div className="text-xs text-green-600 mt-1 font-medium">root</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Groups Visualization */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Connected Components ({groups.size} set{groups.size !== 1 ? 's' : ''})
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(groups.entries()).map(([root, members], idx) => (
                  <div
                    key={root}
                    className={`px-3 py-2 rounded-lg border ${groupColors[idx % groupColors.length]} border-gray-300`}
                  >
                    <div className="text-xs text-gray-600 mb-1">Root: {root}</div>
                    <div className="flex gap-1">
                      {members.sort((a, b) => a - b).map((m) => (
                        <span
                          key={m}
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium
                            ${m === root ? 'bg-green-200 text-green-800' : 'bg-white text-gray-700 border border-gray-300'}
                          `}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <StatusPanel
              description={stepData.description}
              currentStep={currentStep}
              totalSteps={steps.length}
              variant={getStatusVariant()}
            />
          </VisualizationArea>

          {/* Code Panel */}
          {showCode && (
            <div className="w-full lg:w-56 flex-shrink-0 space-y-2">
              <CodePanel
                code={UF_CODE}
                activeLine={currentStepData?.codeLine ?? -1}
                variables={currentStepData?.variables}
              />
              <HelpPanel />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <ControlPanel
            isPlaying={isPlaying}
            currentStep={currentStep}
            totalSteps={steps.length}
            speed={speed}
            onPlayPause={handlePlayPause}
            onStep={handleStep}
            onStepBack={handleStepBack}
            onReset={handleReset}
            onSpeedChange={setSpeed}
            accentColor="violet"
          />
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
};

export const UnionFindVisualizer = React.memo(UnionFindVisualizerComponent);
export default UnionFindVisualizer;
