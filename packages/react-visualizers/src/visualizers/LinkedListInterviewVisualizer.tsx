import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface ListNode {
  value: number;
  next: number | null;
}

interface LinkedListStep {
  operation: 'init' | 'traverse' | 'insert' | 'delete' | 'done';
  nodes: ListNode[];
  head: number | null;
  currentIdx?: number;
  description: string;
}

interface LinkedListInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const VISUALIZER_ID = 'linkedlist-interview-visualizer';

const BADGES = [
  { label: 'Interview Mode', variant: 'purple' as const },
  { label: 'O(1) insert', variant: 'blue' as const },
  { label: 'Linked List', variant: 'cyan' as const },
];

const INITIAL_VALUES = [10, 20, 30, 40, 50];

const LEGEND_ITEMS = [
  { color: 'bg-blue-100', label: 'Node', border: '#60a5fa' },
  { color: 'bg-yellow-400', label: 'Current' },
  { color: 'bg-green-400', label: 'Head' },
  { color: 'bg-red-400', label: 'Tail' },
];

// Interview questions about LinkedList
const LINKEDLIST_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'll-1',
    question: 'What is the time complexity of inserting at the beginning of a singly linked list?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
    correctAnswer: 0,
    explanation: 'Inserting at the head is O(1) - just create a new node, point it to old head, and update head pointer. No shifting of elements like in arrays.',
    difficulty: 'easy',
    topic: 'Complexity',
  },
  {
    id: 'll-2',
    question: 'What is the time complexity of accessing the k-th element in a linked list?',
    options: ['O(1)', 'O(log n)', 'O(k)', 'O(n)'],
    correctAnswer: 2,
    explanation: 'Must traverse k nodes from head, so O(k). Worst case is O(n) for the last element. Unlike arrays, there\'s no random access.',
    difficulty: 'easy',
    topic: 'Complexity',
  },
  {
    id: 'll-3',
    question: 'How do you detect a cycle in a linked list efficiently?',
    options: [
      'Hash set to track visited nodes - O(n) space',
      'Floyd\'s cycle detection (two pointers) - O(1) space',
      'Compare all pairs of nodes - O(n²) time',
      'Both A and B are valid approaches',
    ],
    correctAnswer: 3,
    explanation: 'Hash set works with O(n) space. Floyd\'s algorithm (slow/fast pointers) uses O(1) space - if there\'s a cycle, fast will meet slow. Both are O(n) time.',
    hint: 'Think about the trade-off between time and space.',
    difficulty: 'medium',
    topic: 'Algorithms',
  },
  {
    id: 'll-4',
    question: 'How do you find the middle element in one pass?',
    options: [
      'Count nodes first, then traverse to n/2',
      'Use two pointers: slow (1 step) and fast (2 steps)',
      'It\'s impossible in one pass',
      'Use recursion with a counter',
    ],
    correctAnswer: 1,
    explanation: 'Use slow and fast pointers. When fast reaches end, slow is at middle. For even length, slow is at the second middle element.',
    difficulty: 'medium',
    topic: 'Algorithms',
  },
  {
    id: 'll-5',
    question: 'What is the advantage of a doubly linked list over singly linked?',
    options: [
      'Faster insertion at head',
      'Less memory usage',
      'O(1) deletion when given a node reference',
      'Faster random access',
    ],
    correctAnswer: 2,
    explanation: 'With a doubly linked list, if you have a reference to a node, you can delete it in O(1) by accessing prev.next. Singly linked requires traversing from head to find the previous node.',
    difficulty: 'medium',
    topic: 'Data Structures',
  },
  {
    id: 'll-6',
    question: 'How do you reverse a singly linked list in-place?',
    options: [
      'Use a stack - O(n) extra space',
      'Iterate with three pointers (prev, curr, next) - O(1) space',
      'Create a new list in reverse order',
      'It\'s impossible without extra space',
    ],
    correctAnswer: 1,
    explanation: 'Use prev=null, curr=head. For each node: save next, point curr.next to prev, move prev and curr forward. O(n) time, O(1) space.',
    difficulty: 'medium',
    topic: 'Algorithms',
  },
  {
    id: 'll-7',
    question: 'When is a linked list preferred over an array?',
    options: [
      'When random access is needed frequently',
      'When memory is contiguous and cache efficiency matters',
      'When frequent insertions/deletions at arbitrary positions are needed',
      'When the size is fixed and known in advance',
    ],
    correctAnswer: 2,
    explanation: 'Linked lists excel at insertions/deletions anywhere - O(1) if you have the position. Arrays need O(n) shifts. However, arrays win for random access and cache locality.',
    difficulty: 'medium',
    topic: 'Use Cases',
  },
  {
    id: 'll-8',
    question: 'What is the space overhead of a singly linked list compared to an array?',
    options: [
      'No overhead',
      'One pointer per node',
      'Two pointers per node',
      'O(log n) extra space',
    ],
    correctAnswer: 1,
    explanation: 'Each node stores one extra pointer to the next node. For n elements: array uses n×sizeof(element), linked list uses n×(sizeof(element) + sizeof(pointer)).',
    difficulty: 'easy',
    topic: 'Memory',
  },
  {
    id: 'll-9',
    question: 'How do you merge two sorted linked lists?',
    options: [
      'Copy to arrays, merge, convert back',
      'Use a dummy head and iterate both lists',
      'Sort one list into the other',
      'Concatenate then sort',
    ],
    correctAnswer: 1,
    explanation: 'Create a dummy head. Compare current nodes of both lists, attach smaller one to result, advance that list\'s pointer. O(n+m) time, O(1) space.',
    difficulty: 'medium',
    topic: 'Algorithms',
  },
  {
    id: 'll-10',
    question: 'What problem does the "dummy head" technique solve?',
    options: [
      'Improves cache performance',
      'Reduces memory usage',
      'Simplifies edge cases (empty list, single node)',
      'Enables random access',
    ],
    correctAnswer: 2,
    explanation: 'A dummy head node eliminates special-case handling for the first node. Instead of checking "is head null?", you always operate on dummy.next, then return dummy.next at the end.',
    difficulty: 'medium',
    topic: 'Techniques',
  },
];

function generateLinkedListSteps(): LinkedListStep[] {
  const steps: LinkedListStep[] = [];
  const nodes: ListNode[] = INITIAL_VALUES.map((value, idx) => ({
    value,
    next: idx < INITIAL_VALUES.length - 1 ? idx + 1 : null,
  }));

  steps.push({
    operation: 'init',
    nodes: nodes.map((n) => ({ ...n })),
    head: 0,
    description: `Linked List with ${nodes.length} nodes: ${INITIAL_VALUES.join(' → ')}`,
  });

  // Traverse
  for (let i = 0; i < nodes.length; i++) {
    steps.push({
      operation: 'traverse',
      nodes: nodes.map((n) => ({ ...n })),
      head: 0,
      currentIdx: i,
      description: `Traverse: visiting node ${nodes[i].value}`,
    });
  }

  steps.push({
    operation: 'done',
    nodes: nodes.map((n) => ({ ...n })),
    head: 0,
    description: '✓ Traversal complete. O(n) time to visit all nodes.',
  });

  return steps;
}

const LinkedListInterviewVisualizerComponent: React.FC<LinkedListInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const { copyUrlToClipboard } = useUrlState({ prefix: 'll-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateLinkedListSteps, []);

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
  } = useVisualizerPlayback<LinkedListStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: LINKEDLIST_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: LinkedListStep = currentStepData || {
    operation: 'init',
    nodes: [],
    head: null,
    description: '',
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const visualization = (
    <>
      {/* Info */}
      <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-xs text-blue-800 text-center">
          <span className="font-medium">Singly Linked List:</span> O(1) insert/delete at head, O(n) access
        </div>
      </div>

      {/* Linked List Visualization */}
      <div className="flex items-center justify-center gap-2 py-4 overflow-x-auto">
        <div className="text-xs text-gray-500 font-medium">HEAD</div>
        <div className="text-gray-400">→</div>
        {stepData.nodes.map((node, idx) => {
          const isCurrent = stepData.currentIdx === idx;
          const isHead = idx === 0;
          const isTail = node.next === null;

          return (
            <React.Fragment key={idx}>
              <div
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all
                  ${isCurrent ? 'bg-yellow-100 border-yellow-400 ring-2 ring-yellow-300' :
                    isHead ? 'bg-green-100 border-green-400' :
                    isTail ? 'bg-red-100 border-red-400' :
                    'bg-blue-100 border-blue-400'}
                `}
              >
                <div className="text-lg font-bold text-gray-800">{node.value}</div>
                <div className="text-xs text-gray-500">
                  {isHead && !isTail && '(head)'}
                  {isTail && !isHead && '(tail)'}
                  {isHead && isTail && '(only)'}
                </div>
              </div>
              {node.next !== null && (
                <div className="text-gray-400 text-lg">→</div>
              )}
            </React.Fragment>
          );
        })}
        <div className="text-gray-400">→</div>
        <div className="text-xs text-gray-500 font-medium">NULL</div>
      </div>
    </>
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
      accentColor="blue"
    />
  ) : undefined;

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="Linked List (Interview Mode)"
      badges={BADGES}
      gradient="blue"
      className={className}
      minHeight={400}
      onShare={handleShare}
      status={{
        description: stepData.description,
        currentStep,
        totalSteps: steps.length,
        variant: stepData.operation === 'done' ? 'success' : 'default',
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
        accentColor: 'blue',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      sidePanel={sidePanel}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const LinkedListInterviewVisualizer = React.memo(LinkedListInterviewVisualizerComponent);
export default LinkedListInterviewVisualizer;
