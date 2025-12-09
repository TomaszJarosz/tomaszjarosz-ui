import React, { useMemo, useState, useCallback } from 'react';
import {
  CodePanel,
  HelpPanel,
  ControlPanel,
  Legend,
  StatusPanel,
  ShareButton,
  useUrlState,
  VisualizationArea,
  useVisualizerPlayback,
} from '../shared';

interface TableRow {
  id: number;
  name: string;
  foreignKey?: number | null;
}

interface JoinResult {
  leftRow: TableRow | null;
  rightRow: TableRow | null;
  matched: boolean;
}

type JoinType = 'inner' | 'left' | 'right' | 'full';

interface SQLJoinStep {
  operation: 'init' | 'scan' | 'compare' | 'match' | 'no_match' | 'include_null' | 'done';
  joinType: JoinType;
  leftTable: TableRow[];
  rightTable: TableRow[];
  results: JoinResult[];
  currentLeftIndex: number;
  currentRightIndex: number;
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  highlightLeft?: number;
  highlightRight?: number;
  highlightResult?: number;
}

interface SQLJoinVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const EMPLOYEES: TableRow[] = [
  { id: 1, name: 'Alice', foreignKey: 101 },
  { id: 2, name: 'Bob', foreignKey: 102 },
  { id: 3, name: 'Charlie', foreignKey: null },
  { id: 4, name: 'Diana', foreignKey: 101 },
];

const DEPARTMENTS: TableRow[] = [
  { id: 101, name: 'Engineering' },
  { id: 102, name: 'Marketing' },
  { id: 103, name: 'Sales' },
];

const JOIN_CODES: Record<JoinType, string[]> = {
  inner: [
    'SELECT e.name, d.name',
    'FROM employees e',
    'INNER JOIN departments d',
    '  ON e.dept_id = d.id',
    '',
    '-- Returns only matching rows',
    '-- from both tables',
    '',
    'Algorithm: Nested Loop',
    'for each row in employees:',
    '  for each row in departments:',
    '    if e.dept_id == d.id:',
    '      emit (e, d)',
  ],
  left: [
    'SELECT e.name, d.name',
    'FROM employees e',
    'LEFT JOIN departments d',
    '  ON e.dept_id = d.id',
    '',
    '-- Returns ALL rows from left',
    '-- + matching rows from right',
    '-- NULL if no match on right',
    '',
    'for each row in employees:',
    '  matched = false',
    '  for each row in departments:',
    '    if e.dept_id == d.id:',
    '      emit (e, d); matched=true',
    '  if not matched:',
    '    emit (e, NULL)',
  ],
  right: [
    'SELECT e.name, d.name',
    'FROM employees e',
    'RIGHT JOIN departments d',
    '  ON e.dept_id = d.id',
    '',
    '-- Returns ALL rows from right',
    '-- + matching rows from left',
    '-- NULL if no match on left',
    '',
    'for each row in departments:',
    '  matched = false',
    '  for each row in employees:',
    '    if e.dept_id == d.id:',
    '      emit (e, d); matched=true',
    '  if not matched:',
    '    emit (NULL, d)',
  ],
  full: [
    'SELECT e.name, d.name',
    'FROM employees e',
    'FULL OUTER JOIN departments d',
    '  ON e.dept_id = d.id',
    '',
    '-- Returns ALL rows from both',
    '-- NULL where no match exists',
    '',
    '// Step 1: LEFT JOIN logic',
    '// Step 2: Add unmatched right',
    '',
    'Combines LEFT + RIGHT results',
    'removing duplicates',
  ],
};

const LEGEND_ITEMS = [
  { color: 'bg-green-400', label: 'Matched rows' },
  { color: 'bg-blue-400', label: 'Current comparison' },
  { color: 'bg-yellow-400', label: 'NULL (no match)' },
  { color: 'bg-gray-300', label: 'Not included' },
];

function generateJoinSteps(joinType: JoinType): SQLJoinStep[] {
  const steps: SQLJoinStep[] = [];
  const results: JoinResult[] = [];
  const leftTable = [...EMPLOYEES];
  const rightTable = [...DEPARTMENTS];
  const matchedRight = new Set<number>();

  // Initial state
  steps.push({
    operation: 'init',
    joinType,
    leftTable,
    rightTable,
    results: [],
    currentLeftIndex: -1,
    currentRightIndex: -1,
    description: `${joinType.toUpperCase()} JOIN: Combining employees (left) with departments (right).`,
    codeLine: 0,
  });

  // Process based on join type
  if (joinType === 'inner' || joinType === 'left' || joinType === 'full') {
    for (let i = 0; i < leftTable.length; i++) {
      const leftRow = leftTable[i];
      let foundMatch = false;

      steps.push({
        operation: 'scan',
        joinType,
        leftTable,
        rightTable,
        results: [...results],
        currentLeftIndex: i,
        currentRightIndex: -1,
        description: `Scanning left table: ${leftRow.name} (dept_id: ${leftRow.foreignKey ?? 'NULL'})`,
        codeLine: joinType === 'inner' ? 9 : 9,
        variables: { employee: leftRow.name, dept_id: leftRow.foreignKey ?? 'NULL' },
        highlightLeft: i,
      });

      for (let j = 0; j < rightTable.length; j++) {
        const rightRow = rightTable[j];

        steps.push({
          operation: 'compare',
          joinType,
          leftTable,
          rightTable,
          results: [...results],
          currentLeftIndex: i,
          currentRightIndex: j,
          description: `Compare: ${leftRow.foreignKey ?? 'NULL'} == ${rightRow.id}?`,
          codeLine: joinType === 'inner' ? 11 : 12,
          variables: { left_key: leftRow.foreignKey ?? 'NULL', right_key: rightRow.id },
          highlightLeft: i,
          highlightRight: j,
        });

        if (leftRow.foreignKey === rightRow.id) {
          foundMatch = true;
          matchedRight.add(j);
          results.push({ leftRow, rightRow, matched: true });

          steps.push({
            operation: 'match',
            joinType,
            leftTable,
            rightTable,
            results: [...results],
            currentLeftIndex: i,
            currentRightIndex: j,
            description: `Match found! ${leftRow.name} works in ${rightRow.name}.`,
            codeLine: joinType === 'inner' ? 12 : 13,
            highlightLeft: i,
            highlightRight: j,
            highlightResult: results.length - 1,
          });
        }
      }

      // Handle no match for LEFT/FULL JOIN
      if (!foundMatch && (joinType === 'left' || joinType === 'full')) {
        results.push({ leftRow, rightRow: null, matched: false });

        steps.push({
          operation: 'include_null',
          joinType,
          leftTable,
          rightTable,
          results: [...results],
          currentLeftIndex: i,
          currentRightIndex: -1,
          description: `No match for ${leftRow.name}. Include with NULL department.`,
          codeLine: 15,
          highlightLeft: i,
          highlightResult: results.length - 1,
        });
      } else if (!foundMatch && joinType === 'inner') {
        steps.push({
          operation: 'no_match',
          joinType,
          leftTable,
          rightTable,
          results: [...results],
          currentLeftIndex: i,
          currentRightIndex: -1,
          description: `No match for ${leftRow.name}. Skipped (INNER JOIN).`,
          codeLine: 11,
          highlightLeft: i,
        });
      }
    }
  }

  // For RIGHT or FULL JOIN: add unmatched right rows
  if (joinType === 'right' || joinType === 'full') {
    for (let j = 0; j < rightTable.length; j++) {
      if (joinType === 'right' || !matchedRight.has(j)) {
        const rightRow = rightTable[j];
        let foundMatch = false;

        if (joinType === 'right') {
          steps.push({
            operation: 'scan',
            joinType,
            leftTable,
            rightTable,
            results: [...results],
            currentLeftIndex: -1,
            currentRightIndex: j,
            description: `Scanning right table: ${rightRow.name} (id: ${rightRow.id})`,
            codeLine: 9,
            highlightRight: j,
          });

          for (let i = 0; i < leftTable.length; i++) {
            const leftRow = leftTable[i];

            steps.push({
              operation: 'compare',
              joinType,
              leftTable,
              rightTable,
              results: [...results],
              currentLeftIndex: i,
              currentRightIndex: j,
              description: `Compare: ${leftRow.foreignKey ?? 'NULL'} == ${rightRow.id}?`,
              codeLine: 12,
              highlightLeft: i,
              highlightRight: j,
            });

            if (leftRow.foreignKey === rightRow.id) {
              foundMatch = true;
              results.push({ leftRow, rightRow, matched: true });

              steps.push({
                operation: 'match',
                joinType,
                leftTable,
                rightTable,
                results: [...results],
                currentLeftIndex: i,
                currentRightIndex: j,
                description: `Match found! ${leftRow.name} works in ${rightRow.name}.`,
                codeLine: 13,
                highlightLeft: i,
                highlightRight: j,
                highlightResult: results.length - 1,
              });
            }
          }
        }

        if (!foundMatch && !matchedRight.has(j)) {
          results.push({ leftRow: null, rightRow, matched: false });

          steps.push({
            operation: 'include_null',
            joinType,
            leftTable,
            rightTable,
            results: [...results],
            currentLeftIndex: -1,
            currentRightIndex: j,
            description: `No employee in ${rightRow.name}. Include with NULL employee.`,
            codeLine: joinType === 'right' ? 15 : 10,
            highlightRight: j,
            highlightResult: results.length - 1,
          });
        }
      }
    }
  }

  // Final state
  steps.push({
    operation: 'done',
    joinType,
    leftTable,
    rightTable,
    results: [...results],
    currentLeftIndex: -1,
    currentRightIndex: -1,
    description: `${joinType.toUpperCase()} JOIN complete! ${results.length} rows returned.`,
    codeLine: -1,
    variables: { total_rows: results.length },
  });

  return steps;
}

const SQLJoinVisualizerComponent: React.FC<SQLJoinVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'sqljoin-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'sqljoin', scrollToId: VISUALIZER_ID });

  const [joinType, setJoinType] = useState<JoinType>('inner');

  const generateSteps = useMemo(
    () => () => generateJoinSteps(joinType),
    [joinType]
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
  } = useVisualizerPlayback<SQLJoinStep>({
    generateSteps,
  });

  const stepData = currentStepData || {
    operation: 'init' as const,
    joinType: 'inner' as const,
    leftTable: EMPLOYEES,
    rightTable: DEPARTMENTS,
    results: [],
    currentLeftIndex: -1,
    currentRightIndex: -1,
    description: '',
  };

  const {
    leftTable,
    rightTable,
    results,
    highlightLeft,
    highlightRight,
    highlightResult,
    description,
  } = stepData;

  const handleJoinTypeChange = useCallback((type: JoinType) => {
    setJoinType(type);
  }, []);

  const getRowStyle = (index: number, isLeft: boolean): string => {
    const highlight = isLeft ? highlightLeft : highlightRight;
    if (index === highlight) {
      return 'bg-blue-400 text-white';
    }
    return 'bg-white';
  };

  const getResultStyle = (index: number, result: JoinResult): string => {
    if (index === highlightResult) {
      return result.matched ? 'bg-green-400 text-white' : 'bg-yellow-400 text-gray-900';
    }
    if (result.matched) {
      return 'bg-green-100';
    }
    return 'bg-yellow-100';
  };

  const getStatusVariant = () => {
    if (stepData.operation === 'match') return 'success' as const;
    if (stepData.operation === 'no_match') return 'error' as const;
    if (stepData.operation === 'include_null') return 'warning' as const;
    if (stepData.operation === 'done') return 'success' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  return (
    <div
      id={VISUALIZER_ID}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">SQL JOIN Operations</h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-cyan-100 text-cyan-700 rounded">
              {joinType.toUpperCase()} JOIN
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton onShare={handleShare} />
            <div className="flex gap-1">
              {(['inner', 'left', 'right', 'full'] as JoinType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleJoinTypeChange(type)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    joinType === type
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visualization Area */}
      <div className="p-4">
        <div className={`flex gap-4 ${showCode ? 'flex-col lg:flex-row' : ''}`}>
          {/* Main Visualization */}
          <VisualizationArea minHeight={450} className={showCode ? 'flex-1' : 'w-full'}>
            {/* Tables */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Left Table (Employees) */}
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">
                  employees (Left)
                </div>
                <div className="border border-gray-300 rounded overflow-hidden">
                  <div className="grid grid-cols-3 bg-gray-100 text-[10px] font-semibold text-gray-600">
                    <div className="px-2 py-1 border-r">id</div>
                    <div className="px-2 py-1 border-r">name</div>
                    <div className="px-2 py-1">dept_id</div>
                  </div>
                  {leftTable.map((row, idx) => (
                    <div
                      key={row.id}
                      className={`grid grid-cols-3 text-[10px] border-t transition-colors ${getRowStyle(idx, true)}`}
                    >
                      <div className="px-2 py-1 border-r">{row.id}</div>
                      <div className="px-2 py-1 border-r">{row.name}</div>
                      <div className="px-2 py-1">{row.foreignKey ?? 'NULL'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Table (Departments) */}
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">
                  departments (Right)
                </div>
                <div className="border border-gray-300 rounded overflow-hidden">
                  <div className="grid grid-cols-2 bg-gray-100 text-[10px] font-semibold text-gray-600">
                    <div className="px-2 py-1 border-r">id</div>
                    <div className="px-2 py-1">name</div>
                  </div>
                  {rightTable.map((row, idx) => (
                    <div
                      key={row.id}
                      className={`grid grid-cols-2 text-[10px] border-t transition-colors ${getRowStyle(idx, false)}`}
                    >
                      <div className="px-2 py-1 border-r">{row.id}</div>
                      <div className="px-2 py-1">{row.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Result Table */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-700 mb-2">
                Result ({results.length} rows)
              </div>
              <div className="border border-gray-300 rounded overflow-hidden max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 bg-gray-100 text-[10px] font-semibold text-gray-600 sticky top-0">
                  <div className="px-2 py-1 border-r">e.name</div>
                  <div className="px-2 py-1">d.name</div>
                </div>
                {results.length > 0 ? (
                  results.map((result, idx) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-2 text-[10px] border-t transition-colors ${getResultStyle(idx, result)}`}
                    >
                      <div className="px-2 py-1 border-r">
                        {result.leftRow?.name ?? <span className="text-gray-400">NULL</span>}
                      </div>
                      <div className="px-2 py-1">
                        {result.rightRow?.name ?? <span className="text-gray-400">NULL</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-gray-400 text-center py-2">
                    No results yet
                  </div>
                )}
              </div>
            </div>

            {/* Join Type Explanation with Venn Diagram */}
            <div className="mb-4 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
              <div className="flex items-center gap-4">
                {/* Venn Diagram */}
                <svg viewBox="0 0 100 60" className="w-24 h-14 flex-shrink-0">
                  {/* Left circle (Employees) */}
                  <circle
                    cx="35"
                    cy="30"
                    r="22"
                    fill={joinType === 'left' || joinType === 'full' ? '#06b6d4' : joinType === 'inner' ? 'transparent' : '#e5e7eb'}
                    fillOpacity={joinType === 'left' || joinType === 'full' ? 0.6 : joinType === 'inner' ? 0 : 0.5}
                    stroke="#0891b2"
                    strokeWidth="2"
                  />
                  {/* Right circle (Departments) */}
                  <circle
                    cx="65"
                    cy="30"
                    r="22"
                    fill={joinType === 'right' || joinType === 'full' ? '#06b6d4' : joinType === 'inner' ? 'transparent' : '#e5e7eb'}
                    fillOpacity={joinType === 'right' || joinType === 'full' ? 0.6 : joinType === 'inner' ? 0 : 0.5}
                    stroke="#0891b2"
                    strokeWidth="2"
                  />
                  {/* Intersection - always highlighted for all join types */}
                  <clipPath id="leftClip">
                    <circle cx="35" cy="30" r="22" />
                  </clipPath>
                  <circle
                    cx="65"
                    cy="30"
                    r="22"
                    fill="#22c55e"
                    fillOpacity="0.7"
                    clipPath="url(#leftClip)"
                  />
                  {/* Labels */}
                  <text x="22" y="33" fontSize="8" fill="#0e7490" fontWeight="bold">L</text>
                  <text x="74" y="33" fontSize="8" fill="#0e7490" fontWeight="bold">R</text>
                </svg>

                {/* Explanation */}
                <div className="flex-1">
                  <div className="text-sm font-semibold text-cyan-800 mb-1">
                    {joinType.toUpperCase()} JOIN
                  </div>
                  <div className="text-xs text-cyan-700">
                    {joinType === 'inner' && (
                      <>Returns only rows with matches in <strong>both</strong> tables (green intersection).</>
                    )}
                    {joinType === 'left' && (
                      <>Returns <strong>all</strong> rows from left table + matching rows from right. NULL if no match.</>
                    )}
                    {joinType === 'right' && (
                      <>Returns <strong>all</strong> rows from right table + matching rows from left. NULL if no match.</>
                    )}
                    {joinType === 'full' && (
                      <>Returns <strong>all</strong> rows from both tables. NULL where no match exists.</>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <StatusPanel
              description={description}
              currentStep={currentStep}
              totalSteps={steps.length}
              variant={getStatusVariant()}
            />
          </VisualizationArea>

          {/* Code Panel */}
          {showCode && (
            <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
              <CodePanel
                code={JOIN_CODES[joinType]}
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
            accentColor="cyan"
          />
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
};

export const SQLJoinVisualizer = React.memo(SQLJoinVisualizerComponent);
export default SQLJoinVisualizer;
