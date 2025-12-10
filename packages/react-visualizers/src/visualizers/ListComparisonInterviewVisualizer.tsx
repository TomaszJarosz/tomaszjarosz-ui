import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  InterviewModePanel,
  useUrlState,
  useVisualizerPlayback,
  useInterviewMode,
} from '../shared';
import type { InterviewQuestion } from '../shared';

type Operation = 'get' | 'addFirst' | 'addLast' | 'addMiddle' | 'removeFirst' | 'removeLast' | 'removeMiddle';

interface ListStep {
  operation: Operation | 'init' | 'done';
  arrayList: {
    elements: number[];
    highlightIndex?: number;
    shiftIndices?: number[];
    accessCount: number;
    description: string;
  };
  linkedList: {
    elements: number[];
    highlightIndex?: number;
    traverseIndices?: number[];
    accessCount: number;
    description: string;
  };
  description: string;
  phase: 'start' | 'process' | 'complete';
}

interface ListComparisonInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
  shuffleQuestions?: boolean;
  onComplete?: (session: ReturnType<typeof useInterviewMode>['session']) => void;
}

const INITIAL_DATA = [10, 20, 30, 40, 50];

const OPERATIONS: Array<{ op: Operation; index?: number; value?: number }> = [
  { op: 'get', index: 2 },
  { op: 'addLast', value: 60 },
  { op: 'addFirst', value: 5 },
  { op: 'addMiddle', index: 3, value: 25 },
  { op: 'removeFirst' },
  { op: 'removeLast' },
];

const BADGES = [
  { label: 'Comparison', variant: 'blue' as const },
];

const LEGEND_ITEMS = [
  { color: 'bg-blue-500', label: 'ArrayList' },
  { color: 'bg-green-500', label: 'LinkedList' },
  { color: 'bg-amber-400', label: 'Current element' },
  { color: 'bg-red-400', label: 'Shifting/Traversing' },
];

const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'list-1',
    question: 'What is the time complexity of get(i) for ArrayList?',
    options: [
      'O(1)',
      'O(n)',
      'O(log n)',
      'O(n log n)',
    ],
    correctAnswer: 0,
    explanation: 'ArrayList uses a contiguous array, so accessing by index is O(1) - just calculate the memory address: base + index * elementSize.',
    hint: 'Arrays provide direct access by index.',
    difficulty: 'easy',
    topic: 'ArrayList',
  },
  {
    id: 'list-2',
    question: 'What is the time complexity of get(i) for LinkedList?',
    options: [
      'O(1)',
      'O(n)',
      'O(log n)',
      'O(n/2) = O(n)',
    ],
    correctAnswer: 1,
    explanation: 'LinkedList must traverse from head (or tail) to reach index i. While Java optimizes by starting from the closer end, worst case is still O(n).',
    hint: 'Must follow node pointers one by one.',
    difficulty: 'easy',
    topic: 'LinkedList',
  },
  {
    id: 'list-3',
    question: 'Why is ArrayList addFirst() O(n)?',
    options: [
      'It needs to traverse to find the position',
      'It needs to shift all existing elements right',
      'It needs to create a new array',
      'It needs to update all node pointers',
    ],
    correctAnswer: 1,
    explanation: 'Adding at index 0 requires shifting all n elements one position right to make room. This is a costly operation: System.arraycopy for n elements.',
    hint: 'Think about what must move to make space.',
    difficulty: 'medium',
    topic: 'ArrayList',
  },
  {
    id: 'list-4',
    question: 'Why is LinkedList addFirst() O(1)?',
    options: [
      'LinkedList uses an array internally',
      'Just update the head pointer and new node next pointer',
      'It preallocates space at the beginning',
      'It uses a circular buffer',
    ],
    correctAnswer: 1,
    explanation: 'LinkedList just creates a new node, sets its next to current head, and updates head to point to new node. No elements need to be moved.',
    hint: 'Only pointer updates needed.',
    difficulty: 'medium',
    topic: 'LinkedList',
  },
  {
    id: 'list-5',
    question: 'What is the amortized time complexity of ArrayList add() (append)?',
    options: [
      'O(n) always',
      'O(1) amortized',
      'O(log n)',
      'O(1) worst case',
    ],
    correctAnswer: 1,
    explanation: 'ArrayList doubles capacity when full. Resizing is O(n), but happens rarely. Averaged over n insertions, each insert is O(1) amortized. Occasional O(n) spikes.',
    hint: 'Growth strategy affects amortized cost.',
    difficulty: 'medium',
    topic: 'Amortized Analysis',
  },
  {
    id: 'list-6',
    question: 'Which list type has better cache performance?',
    options: [
      'LinkedList (nodes can be anywhere)',
      'ArrayList (contiguous memory)',
      'Both have equal cache performance',
      'Depends on the operation',
    ],
    correctAnswer: 1,
    explanation: 'ArrayList stores elements contiguously in memory. When iterating, the CPU cache prefetches adjacent elements. LinkedList nodes are scattered in memory, causing cache misses.',
    hint: 'Spatial locality matters for CPU caches.',
    difficulty: 'hard',
    topic: 'Performance',
  },
  {
    id: 'list-7',
    question: 'What additional memory does LinkedList use per element?',
    options: [
      'None, same as ArrayList',
      'One pointer (4-8 bytes)',
      'Two pointers (8-16 bytes for prev and next) + object header',
      '50% more than ArrayList',
    ],
    correctAnswer: 2,
    explanation: 'Each LinkedList node stores: element reference + prev pointer + next pointer + object header (~16 bytes). Total overhead is ~24-40 bytes per element vs 4-8 for ArrayList.',
    hint: 'Its a doubly-linked list in Java.',
    difficulty: 'medium',
    topic: 'Memory',
  },
  {
    id: 'list-8',
    question: 'When is LinkedList preferred over ArrayList?',
    options: [
      'When you need fast random access',
      'When you frequently add/remove at the beginning',
      'When memory is limited',
      'When you need to sort frequently',
    ],
    correctAnswer: 1,
    explanation: 'LinkedList excels at O(1) addFirst/removeFirst. Use it for queue/deque patterns or when insertion position is already known (via iterator). Avoid for random access.',
    hint: 'Think about queue operations.',
    difficulty: 'medium',
    topic: 'Use Cases',
  },
  {
    id: 'list-9',
    question: 'What interface does Java LinkedList NOT implement?',
    options: [
      'List',
      'Deque',
      'Queue',
      'RandomAccess',
    ],
    correctAnswer: 3,
    explanation: 'LinkedList implements List, Deque, and Queue. It does NOT implement RandomAccess marker interface, which signals O(1) index access. ArrayList implements RandomAccess.',
    hint: 'Its a marker interface for O(1) access.',
    difficulty: 'medium',
    topic: 'Java API',
  },
  {
    id: 'list-10',
    question: 'What happens when ArrayList capacity is exceeded?',
    options: [
      'ArrayIndexOutOfBoundsException is thrown',
      'Capacity grows by 50% (newCapacity = oldCapacity * 1.5)',
      'Capacity doubles (newCapacity = oldCapacity * 2)',
      'A new ArrayList is created and old one discarded',
    ],
    correctAnswer: 1,
    explanation: 'Java ArrayList grows by 50%: newCapacity = oldCapacity + (oldCapacity >> 1). This is more memory efficient than doubling. Elements are copied to new array.',
    hint: 'Check the grow() method in ArrayList source.',
    difficulty: 'hard',
    topic: 'Implementation',
  },
];

function generateListComparisonSteps(): ListStep[] {
  const steps: ListStep[] = [];
  let arrayList = [...INITIAL_DATA];
  let linkedList = [...INITIAL_DATA];

  steps.push({
    operation: 'init',
    arrayList: {
      elements: [...arrayList],
      accessCount: 0,
      description: 'Contiguous memory block',
    },
    linkedList: {
      elements: [...linkedList],
      accessCount: 0,
      description: 'Linked nodes in memory',
    },
    description: `Initialize both lists with [${INITIAL_DATA.join(', ')}]`,
    phase: 'complete',
  });

  for (const { op, index, value } of OPERATIONS) {
    switch (op) {
      case 'get': {
        const idx = index!;
        steps.push({
          operation: 'get',
          arrayList: {
            elements: [...arrayList],
            highlightIndex: idx,
            accessCount: 1,
            description: `Direct access: array[${idx}] = ${arrayList[idx]}`,
          },
          linkedList: {
            elements: [...linkedList],
            traverseIndices: Array.from({ length: idx + 1 }, (_, i) => i),
            accessCount: idx + 1,
            description: `Traverse ${idx + 1} nodes to reach index ${idx}`,
          },
          description: `get(${idx}): ArrayList O(1) vs LinkedList O(n)`,
          phase: 'complete',
        });
        break;
      }

      case 'addFirst': {
        const val = value!;
        steps.push({
          operation: 'addFirst',
          arrayList: {
            elements: [...arrayList],
            shiftIndices: arrayList.map((_, i) => i),
            accessCount: arrayList.length,
            description: `Shift ${arrayList.length} elements right`,
          },
          linkedList: {
            elements: [...linkedList],
            highlightIndex: 0,
            accessCount: 1,
            description: 'Update head pointer only',
          },
          description: `addFirst(${val}): ArrayList O(n) vs LinkedList O(1)`,
          phase: 'process',
        });

        arrayList = [val, ...arrayList];
        linkedList = [val, ...linkedList];

        steps.push({
          operation: 'addFirst',
          arrayList: {
            elements: [...arrayList],
            highlightIndex: 0,
            accessCount: arrayList.length - 1,
            description: `Inserted ${val} at index 0`,
          },
          linkedList: {
            elements: [...linkedList],
            highlightIndex: 0,
            accessCount: 1,
            description: `New head: ${val}`,
          },
          description: `addFirst(${val}) complete`,
          phase: 'complete',
        });
        break;
      }

      case 'addLast': {
        const val = value!;
        steps.push({
          operation: 'addLast',
          arrayList: {
            elements: [...arrayList],
            highlightIndex: arrayList.length,
            accessCount: 1,
            description: 'Direct append (amortized O(1))',
          },
          linkedList: {
            elements: [...linkedList],
            traverseIndices: linkedList.map((_, i) => i),
            accessCount: linkedList.length,
            description: `Traverse to tail (${linkedList.length} nodes)`,
          },
          description: `addLast(${val}): ArrayList O(1)* vs LinkedList O(n)`,
          phase: 'process',
        });

        arrayList = [...arrayList, val];
        linkedList = [...linkedList, val];

        steps.push({
          operation: 'addLast',
          arrayList: {
            elements: [...arrayList],
            highlightIndex: arrayList.length - 1,
            accessCount: 1,
            description: `Appended ${val}`,
          },
          linkedList: {
            elements: [...linkedList],
            highlightIndex: linkedList.length - 1,
            accessCount: linkedList.length - 1,
            description: `New tail: ${val}`,
          },
          description: `addLast(${val}) complete`,
          phase: 'complete',
        });
        break;
      }

      case 'addMiddle': {
        const idx = index!;
        const val = value!;
        const shiftCount = arrayList.length - idx;

        steps.push({
          operation: 'addMiddle',
          arrayList: {
            elements: [...arrayList],
            shiftIndices: arrayList.slice(idx).map((_, i) => idx + i),
            accessCount: shiftCount,
            description: `Shift ${shiftCount} elements right`,
          },
          linkedList: {
            elements: [...linkedList],
            traverseIndices: Array.from({ length: idx }, (_, i) => i),
            accessCount: idx,
            description: `Traverse ${idx} nodes, then O(1) insert`,
          },
          description: `add(${idx}, ${val}): ArrayList O(n) vs LinkedList O(n)`,
          phase: 'process',
        });

        arrayList = [...arrayList.slice(0, idx), val, ...arrayList.slice(idx)];
        linkedList = [...linkedList.slice(0, idx), val, ...linkedList.slice(idx)];

        steps.push({
          operation: 'addMiddle',
          arrayList: {
            elements: [...arrayList],
            highlightIndex: idx,
            accessCount: shiftCount,
            description: `Inserted ${val} at index ${idx}`,
          },
          linkedList: {
            elements: [...linkedList],
            highlightIndex: idx,
            accessCount: idx + 1,
            description: `Inserted ${val} after traversal`,
          },
          description: `add(${idx}, ${val}) complete`,
          phase: 'complete',
        });
        break;
      }

      case 'removeFirst': {
        const removed = arrayList[0];
        steps.push({
          operation: 'removeFirst',
          arrayList: {
            elements: [...arrayList],
            highlightIndex: 0,
            shiftIndices: arrayList.slice(1).map((_, i) => i + 1),
            accessCount: arrayList.length - 1,
            description: `Remove and shift ${arrayList.length - 1} elements left`,
          },
          linkedList: {
            elements: [...linkedList],
            highlightIndex: 0,
            accessCount: 1,
            description: 'Update head pointer only',
          },
          description: `removeFirst(): ArrayList O(n) vs LinkedList O(1)`,
          phase: 'process',
        });

        arrayList = arrayList.slice(1);
        linkedList = linkedList.slice(1);

        steps.push({
          operation: 'removeFirst',
          arrayList: {
            elements: [...arrayList],
            accessCount: arrayList.length,
            description: `Removed ${removed}, shifted elements`,
          },
          linkedList: {
            elements: [...linkedList],
            accessCount: 1,
            description: `Removed ${removed}, new head`,
          },
          description: `removeFirst() = ${removed} complete`,
          phase: 'complete',
        });
        break;
      }

      case 'removeLast': {
        const removed = arrayList[arrayList.length - 1];
        steps.push({
          operation: 'removeLast',
          arrayList: {
            elements: [...arrayList],
            highlightIndex: arrayList.length - 1,
            accessCount: 1,
            description: 'Direct removal O(1)',
          },
          linkedList: {
            elements: [...linkedList],
            traverseIndices: linkedList.map((_, i) => i),
            accessCount: linkedList.length,
            description: `Traverse to find tails predecessor`,
          },
          description: `removeLast(): ArrayList O(1) vs LinkedList O(n)`,
          phase: 'process',
        });

        arrayList = arrayList.slice(0, -1);
        linkedList = linkedList.slice(0, -1);

        steps.push({
          operation: 'removeLast',
          arrayList: {
            elements: [...arrayList],
            accessCount: 1,
            description: `Removed ${removed}`,
          },
          linkedList: {
            elements: [...linkedList],
            accessCount: linkedList.length + 1,
            description: `Removed ${removed} after traversal`,
          },
          description: `removeLast() = ${removed} complete`,
          phase: 'complete',
        });
        break;
      }
    }
  }

  steps.push({
    operation: 'done',
    arrayList: {
      elements: [...arrayList],
      accessCount: 0,
      description: `Final: [${arrayList.join(', ')}]`,
    },
    linkedList: {
      elements: [...linkedList],
      accessCount: 0,
      description: `Final: [${linkedList.join(', ')}]`,
    },
    description: 'Comparison complete! ArrayList wins for random access, LinkedList wins for front operations.',
    phase: 'complete',
  });

  return steps;
}

const ListComparisonInterviewVisualizerComponent: React.FC<ListComparisonInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
  shuffleQuestions = false,
  onComplete,
}) => {
  const VISUALIZER_ID = 'list-comparison-interview-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'listcmp-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');
  const generateSteps = useMemo(() => generateListComparisonSteps, []);

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
  } = useVisualizerPlayback<ListStep>({
    generateSteps,
  });

  const interview = useInterviewMode({
    questions: INTERVIEW_QUESTIONS,
    shuffleQuestions,
    onComplete,
  });

  const stepData: ListStep = currentStepData || {
    operation: 'init',
    arrayList: { elements: [], accessCount: 0, description: '' },
    linkedList: { elements: [], accessCount: 0, description: '' },
    description: '',
    phase: 'complete',
  };

  const { arrayList, linkedList, description } = stepData;

  const getStatusVariant = () => {
    if (stepData.operation === 'done') return 'success' as const;
    if (stepData.phase === 'process') return 'warning' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const headerExtra = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setMode('visualize')}
        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
          mode === 'visualize'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
          mode === 'interview'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Interview ({interview.session.results.length}/{INTERVIEW_QUESTIONS.length})
      </button>
    </div>
  );

  const renderArrayList = () => (
    <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-blue-800 text-sm">ArrayList</div>
        <div className="text-xs text-blue-600">
          Accesses: {arrayList.accessCount}
        </div>
      </div>
      <div className="flex gap-0.5 mb-2 overflow-x-auto">
        {arrayList.elements.map((el, idx) => {
          const isHighlighted = arrayList.highlightIndex === idx;
          const isShifting = arrayList.shiftIndices?.includes(idx);
          return (
            <div
              key={idx}
              className={`
                w-10 h-10 flex items-center justify-center text-sm font-mono font-bold
                border-2 transition-all
                ${isHighlighted ? 'bg-amber-400 border-amber-500' : ''}
                ${isShifting ? 'bg-red-300 border-red-400' : ''}
                ${!isHighlighted && !isShifting ? 'bg-blue-200 border-blue-300' : ''}
              `}
            >
              {el}
            </div>
          );
        })}
      </div>
      <div className="text-xs text-gray-600">{arrayList.description}</div>
    </div>
  );

  const renderLinkedList = () => (
    <div className="p-3 bg-green-50 rounded-lg border-2 border-green-200">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-green-800 text-sm">LinkedList</div>
        <div className="text-xs text-green-600">
          Accesses: {linkedList.accessCount}
        </div>
      </div>
      <div className="flex items-center gap-1 mb-2 overflow-x-auto">
        {linkedList.elements.map((el, idx) => {
          const isHighlighted = linkedList.highlightIndex === idx;
          const isTraversing = linkedList.traverseIndices?.includes(idx);
          return (
            <React.Fragment key={idx}>
              <div
                className={`
                  w-10 h-10 flex items-center justify-center text-sm font-mono font-bold
                  rounded-lg border-2 transition-all
                  ${isHighlighted ? 'bg-amber-400 border-amber-500' : ''}
                  ${isTraversing && !isHighlighted ? 'bg-red-300 border-red-400' : ''}
                  ${!isHighlighted && !isTraversing ? 'bg-green-200 border-green-300' : ''}
                `}
              >
                {el}
              </div>
              {idx < linkedList.elements.length - 1 && (
                <span className="text-gray-400 text-xs">-</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="text-xs text-gray-600">{linkedList.description}</div>
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
      accentColor="blue"
    />
  ) : (
    <>
      {/* Complexity Table */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm font-bold text-gray-800 mb-2">Time Complexity</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-left">Operation</th>
                <th className="px-2 py-1 text-center text-blue-700">ArrayList</th>
                <th className="px-2 py-1 text-center text-green-700">LinkedList</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2 py-1">get(i)</td>
                <td className="px-2 py-1 text-center font-mono text-blue-700">O(1)</td>
                <td className="px-2 py-1 text-center font-mono text-green-700">O(n)</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-2 py-1">addFirst()</td>
                <td className="px-2 py-1 text-center font-mono text-blue-700">O(n)</td>
                <td className="px-2 py-1 text-center font-mono text-green-700">O(1)</td>
              </tr>
              <tr>
                <td className="px-2 py-1">addLast()</td>
                <td className="px-2 py-1 text-center font-mono text-blue-700">O(1)*</td>
                <td className="px-2 py-1 text-center font-mono text-green-700">O(1)**</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-2 py-1">removeFirst()</td>
                <td className="px-2 py-1 text-center font-mono text-blue-700">O(n)</td>
                <td className="px-2 py-1 text-center font-mono text-green-700">O(1)</td>
              </tr>
            </tbody>
          </table>
          <div className="text-[10px] text-gray-500 mt-1">
            * amortized | ** Java LinkedList has tail pointer
          </div>
        </div>
      </div>

      {/* Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {renderArrayList()}
        {renderLinkedList()}
      </div>
    </>
  );

  const dynamicBadges = mode === 'interview'
    ? [{ label: 'Interview Mode', variant: 'blue' as const }]
    : BADGES;

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="ArrayList vs LinkedList"
      badges={dynamicBadges}
      gradient="blue"
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
        accentColor: 'blue',
      } : undefined}
      showControls={showControls && mode === 'visualize'}
      legendItems={mode === 'visualize' ? LEGEND_ITEMS : undefined}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const ListComparisonInterviewVisualizer = React.memo(ListComparisonInterviewVisualizerComponent);
export default ListComparisonInterviewVisualizer;
