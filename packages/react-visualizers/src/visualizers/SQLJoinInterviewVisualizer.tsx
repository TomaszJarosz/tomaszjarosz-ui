import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  InterviewModePanel,
  useUrlState,
  useVisualizerPlayback,
  useInterviewMode,
} from '../shared';
import type { InterviewQuestion } from '../shared';

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

interface SQLJoinInterviewVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
  shuffleQuestions?: boolean;
  onComplete?: (session: ReturnType<typeof useInterviewMode>['session']) => void;
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
  ],
  left: [
    'SELECT e.name, d.name',
    'FROM employees e',
    'LEFT JOIN departments d',
    '  ON e.dept_id = d.id',
    '',
    '-- Returns ALL rows from left',
    '-- NULL if no match on right',
  ],
  right: [
    'SELECT e.name, d.name',
    'FROM employees e',
    'RIGHT JOIN departments d',
    '  ON e.dept_id = d.id',
    '',
    '-- Returns ALL rows from right',
    '-- NULL if no match on left',
  ],
  full: [
    'SELECT e.name, d.name',
    'FROM employees e',
    'FULL OUTER JOIN departments d',
    '  ON e.dept_id = d.id',
    '',
    '-- Returns ALL rows from both',
    '-- NULL where no match exists',
  ],
};

const BADGES = [
  { label: 'SQL', variant: 'cyan' as const },
];

const LEGEND_ITEMS = [
  { color: 'bg-green-400', label: 'Matched rows' },
  { color: 'bg-blue-400', label: 'Current comparison' },
  { color: 'bg-amber-400', label: 'NULL (no match)' },
];

const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'sql-1',
    question: 'Which JOIN returns only rows with matches in BOTH tables?',
    options: [
      'INNER JOIN',
      'LEFT JOIN',
      'RIGHT JOIN',
      'FULL OUTER JOIN',
    ],
    correctAnswer: 0,
    explanation: 'INNER JOIN returns only rows where the join condition matches in both tables. This is the intersection of the two tables based on the join key.',
    hint: 'Think about the Venn diagram intersection.',
    difficulty: 'easy',
    topic: 'JOIN Types',
  },
  {
    id: 'sql-2',
    question: 'In LEFT JOIN, what happens when a left row has no matching right row?',
    options: [
      'The row is excluded from results',
      'The row appears with NULL values for right table columns',
      'An error is thrown',
      'The row is duplicated',
    ],
    correctAnswer: 1,
    explanation: 'LEFT JOIN preserves ALL rows from the left table. When no match exists in the right table, the right columns are filled with NULL values.',
    hint: 'LEFT JOIN guarantees all left table rows appear.',
    difficulty: 'easy',
    topic: 'LEFT JOIN',
  },
  {
    id: 'sql-3',
    question: 'What is the time complexity of a Nested Loop Join?',
    options: [
      'O(n)',
      'O(n log n)',
      'O(n * m) where n and m are table sizes',
      'O(1)',
    ],
    correctAnswer: 2,
    explanation: 'Nested Loop Join compares every row in the first table with every row in the second table, resulting in O(n * m) complexity. Hash Join or Merge Join can be more efficient.',
    hint: 'Think about the nested for loops in the algorithm.',
    difficulty: 'medium',
    topic: 'Performance',
  },
  {
    id: 'sql-4',
    question: 'Which JOIN type is supported by most databases but NOT standard SQL?',
    options: [
      'INNER JOIN',
      'CROSS JOIN',
      'NATURAL JOIN',
      'All are standard SQL',
    ],
    correctAnswer: 3,
    explanation: 'INNER, LEFT, RIGHT, FULL OUTER, CROSS, and NATURAL JOINs are all part of the SQL standard. Some databases add proprietary join types, but these core types are universal.',
    hint: 'SQL has been standardized since SQL-92.',
    difficulty: 'medium',
    topic: 'SQL Standard',
  },
  {
    id: 'sql-5',
    question: 'What does FULL OUTER JOIN return?',
    options: [
      'Only matched rows from both tables',
      'All rows from left table only',
      'All rows from both tables, with NULL for non-matches',
      'Cartesian product of both tables',
    ],
    correctAnswer: 2,
    explanation: 'FULL OUTER JOIN returns all rows from both tables. Matching rows are combined; non-matching rows appear with NULL values for the missing side.',
    hint: 'It combines LEFT JOIN and RIGHT JOIN results.',
    difficulty: 'easy',
    topic: 'FULL OUTER JOIN',
  },
  {
    id: 'sql-6',
    question: 'What is a CROSS JOIN?',
    options: [
      'Join that uses indexes',
      'Cartesian product of two tables (every row combined with every other row)',
      'Join that filters NULL values',
      'Join with multiple conditions',
    ],
    correctAnswer: 1,
    explanation: 'CROSS JOIN produces a Cartesian product: every row from the first table is combined with every row from the second table. If tables have n and m rows, result has n*m rows.',
    hint: 'No join condition is specified.',
    difficulty: 'medium',
    topic: 'CROSS JOIN',
  },
  {
    id: 'sql-7',
    question: 'Which join algorithm uses a hash table for better performance?',
    options: [
      'Nested Loop Join',
      'Hash Join',
      'Sort-Merge Join',
      'Index Nested Loop Join',
    ],
    correctAnswer: 1,
    explanation: 'Hash Join builds a hash table from the smaller table, then probes it with the larger table. This achieves O(n + m) average complexity, much better than Nested Loop O(n * m).',
    hint: 'The name contains the answer.',
    difficulty: 'medium',
    topic: 'Join Algorithms',
  },
  {
    id: 'sql-8',
    question: 'In which scenario would you use a SELF JOIN?',
    options: [
      'Joining two different databases',
      'Joining a table with itself (e.g., employee-manager hierarchy)',
      'Joining more than two tables',
      'Joining tables with same column names',
    ],
    correctAnswer: 1,
    explanation: 'SELF JOIN joins a table with itself, useful for hierarchical data like employee-manager relationships, or comparing rows within the same table.',
    hint: 'Think about organizational hierarchies.',
    difficulty: 'medium',
    topic: 'SELF JOIN',
  },
  {
    id: 'sql-9',
    question: 'What is the difference between ON and WHERE in JOINs?',
    options: [
      'No difference, they are interchangeable',
      'ON filters during join; WHERE filters after join (affects OUTER JOINs)',
      'ON is for INNER JOIN; WHERE is for OUTER JOIN',
      'WHERE is faster than ON',
    ],
    correctAnswer: 1,
    explanation: 'ON conditions are applied during the join (before NULL padding for outer joins). WHERE conditions filter after the join. This difference matters for OUTER JOINs.',
    hint: 'Try moving a condition from ON to WHERE in a LEFT JOIN.',
    difficulty: 'hard',
    topic: 'Join Conditions',
  },
  {
    id: 'sql-10',
    question: 'What happens if the join condition is always true (ON 1=1)?',
    options: [
      'Returns empty result',
      'Returns only matched rows',
      'Produces Cartesian product (same as CROSS JOIN)',
      'Throws a syntax error',
    ],
    correctAnswer: 2,
    explanation: 'If the join condition is always true (like ON 1=1), every row matches every other row, producing a Cartesian product. This is equivalent to CROSS JOIN.',
    hint: 'Every row "matches" every other row.',
    difficulty: 'medium',
    topic: 'Join Conditions',
  },
];

function generateJoinSteps(joinType: JoinType): SQLJoinStep[] {
  const steps: SQLJoinStep[] = [];
  const results: JoinResult[] = [];
  const leftTable = [...EMPLOYEES];
  const rightTable = [...DEPARTMENTS];
  const matchedRight = new Set<number>();

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
        codeLine: 2,
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
          codeLine: 3,
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
            codeLine: 3,
            highlightLeft: i,
            highlightRight: j,
            highlightResult: results.length - 1,
          });
        }
      }

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
          codeLine: 5,
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
          codeLine: 5,
          highlightLeft: i,
        });
      }
    }
  }

  if (joinType === 'right' || joinType === 'full') {
    for (let j = 0; j < rightTable.length; j++) {
      if (!matchedRight.has(j)) {
        const rightRow = rightTable[j];
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
          codeLine: 5,
          highlightRight: j,
          highlightResult: results.length - 1,
        });
      }
    }
  }

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

const SQLJoinInterviewVisualizerComponent: React.FC<SQLJoinInterviewVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
  shuffleQuestions = false,
  onComplete,
}) => {
  const VISUALIZER_ID = 'sqljoin-interview-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'sqljoin-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');
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

  const interview = useInterviewMode({
    questions: INTERVIEW_QUESTIONS,
    shuffleQuestions,
    onComplete,
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

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const getRowStyle = (index: number, isLeft: boolean): string => {
    const highlight = isLeft ? highlightLeft : highlightRight;
    if (index === highlight) {
      return 'bg-blue-400 text-white';
    }
    return 'bg-white';
  };

  const getResultStyle = (index: number, result: JoinResult): string => {
    if (index === highlightResult) {
      return result.matched ? 'bg-green-400 text-white' : 'bg-amber-400 text-gray-900';
    }
    if (result.matched) {
      return 'bg-green-100';
    }
    return 'bg-amber-100';
  };

  const getStatusVariant = () => {
    if (stepData.operation === 'match') return 'success' as const;
    if (stepData.operation === 'no_match') return 'error' as const;
    if (stepData.operation === 'include_null') return 'warning' as const;
    if (stepData.operation === 'done') return 'success' as const;
    return 'default' as const;
  };

  const headerExtra = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setMode('visualize')}
        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
          mode === 'visualize'
            ? 'bg-cyan-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
          mode === 'interview'
            ? 'bg-cyan-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Interview ({interview.session.results.length}/{INTERVIEW_QUESTIONS.length})
      </button>
      {mode === 'visualize' && (
        <div className="flex gap-1 ml-2">
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
      )}
    </div>
  );

  const visualization = mode === 'interview' ? (
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
  ) : (
    <>
      {/* Venn Diagram Info */}
      <div className="mb-4 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 100 60" className="w-24 h-14 flex-shrink-0">
            <circle
              cx="35"
              cy="30"
              r="22"
              fill={joinType === 'left' || joinType === 'full' ? '#06b6d4' : joinType === 'inner' ? 'transparent' : '#e5e7eb'}
              fillOpacity={joinType === 'left' || joinType === 'full' ? 0.6 : joinType === 'inner' ? 0 : 0.5}
              stroke="#0891b2"
              strokeWidth="2"
            />
            <circle
              cx="65"
              cy="30"
              r="22"
              fill={joinType === 'right' || joinType === 'full' ? '#06b6d4' : joinType === 'inner' ? 'transparent' : '#e5e7eb'}
              fillOpacity={joinType === 'right' || joinType === 'full' ? 0.6 : joinType === 'inner' ? 0 : 0.5}
              stroke="#0891b2"
              strokeWidth="2"
            />
            <clipPath id="leftClipInt">
              <circle cx="35" cy="30" r="22" />
            </clipPath>
            <circle
              cx="65"
              cy="30"
              r="22"
              fill="#22c55e"
              fillOpacity="0.7"
              clipPath="url(#leftClipInt)"
            />
            <text x="22" y="33" fontSize="8" fill="#0e7490" fontWeight="bold">L</text>
            <text x="74" y="33" fontSize="8" fill="#0e7490" fontWeight="bold">R</text>
          </svg>
          <div className="flex-1">
            <div className="text-sm font-semibold text-cyan-800 mb-1">
              {joinType.toUpperCase()} JOIN
            </div>
            <div className="text-xs text-cyan-700">
              {joinType === 'inner' && 'Returns only rows with matches in both tables.'}
              {joinType === 'left' && 'Returns all rows from left + matching from right.'}
              {joinType === 'right' && 'Returns all rows from right + matching from left.'}
              {joinType === 'full' && 'Returns all rows from both tables.'}
            </div>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs font-semibold text-gray-700 mb-2">employees (Left)</div>
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

        <div>
          <div className="text-xs font-semibold text-gray-700 mb-2">departments (Right)</div>
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
        <div className="border border-gray-300 rounded overflow-hidden max-h-32 overflow-y-auto">
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
            <div className="text-[10px] text-gray-400 text-center py-2">No results yet</div>
          )}
        </div>
      </div>
    </>
  );

  const dynamicBadges = mode === 'interview'
    ? [{ label: 'Interview Mode', variant: 'cyan' as const }]
    : BADGES;

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="SQL JOIN Operations"
      badges={dynamicBadges}
      gradient="cyan"
      className={className}
      minHeight={400}
      onShare={handleShare}
      headerExtra={headerExtra}
      status={mode === 'visualize' ? {
        description,
        currentStep,
        totalSteps: steps.length,
        variant: getStatusVariant(),
      } : undefined}
      controls={mode === 'visualize' ? {
        isPlaying,
        currentStep,
        totalSteps: steps.length,
        speed,
        onPlayPause: handlePlayPause,
        onStep: handleStep,
        onStepBack: handleStepBack,
        onReset: handleReset,
        onSpeedChange: setSpeed,
        accentColor: 'cyan',
      } : undefined}
      showControls={showControls && mode === 'visualize'}
      legendItems={mode === 'visualize' ? LEGEND_ITEMS : undefined}
      code={showCode && mode === 'visualize' ? JOIN_CODES[joinType] : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode && mode === 'visualize'}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const SQLJoinInterviewVisualizer = React.memo(SQLJoinInterviewVisualizerComponent);
export default SQLJoinInterviewVisualizer;
