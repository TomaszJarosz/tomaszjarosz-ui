import React, { useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  InfoBox,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';

interface Node {
  value: number;
  id: number;
}

interface LinkedListStep {
  operation:
    | 'addFirst'
    | 'addLast'
    | 'removeFirst'
    | 'removeLast'
    | 'get'
    | 'init'
    | 'done';
  value?: number;
  index?: number;
  nodes: Node[];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  highlightNode?: number;
  traverseProgress?: number;
}

interface LinkedListVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const OPERATIONS: Array<{
  op: 'addFirst' | 'addLast' | 'removeFirst' | 'removeLast' | 'get';
  value?: number;
  index?: number;
}> = [
  { op: 'addFirst', value: 10 },
  { op: 'addLast', value: 20 },
  { op: 'addLast', value: 30 },
  { op: 'addFirst', value: 5 },
  { op: 'addLast', value: 40 },
  { op: 'get', index: 2 },
  { op: 'removeFirst' },
  { op: 'removeLast' },
  { op: 'get', index: 1 },
];

const LINKEDLIST_CODE = [
  'class Node { value, next, prev }',
  '',
  'addFirst(value):',
  '  node = new Node(value)',
  '  node.next = head',
  '  head.prev = node',
  '  head = node',
  '',
  'addLast(value):',
  '  node = new Node(value)',
  '  tail.next = node',
  '  node.prev = tail',
  '  tail = node',
  '',
  'get(index):',
  '  node = head',
  '  for i = 0 to index:',
  '    node = node.next',
  '  return node.value',
];

const LEGEND_ITEMS = [
  { color: 'bg-white', label: 'Node', border: '#d1d5db' },
  { color: 'bg-blue-500', label: 'Active' },
];

const BADGES = [
  { label: 'Ends: O(1)', variant: 'blue' as const },
  { label: 'Index: O(n)', variant: 'indigo' as const },
];

let nodeIdCounter = 0;

function generateLinkedListSteps(): LinkedListStep[] {
  const steps: LinkedListStep[] = [];
  let nodes: Node[] = [];
  nodeIdCounter = 0;

  steps.push({
    operation: 'init',
    nodes: [],
    description:
      'Initialize empty LinkedList (doubly-linked). O(1) for add/remove at ends, O(n) for indexed access.',
    codeLine: -1,
  });

  for (const { op, value, index } of OPERATIONS) {
    if (op === 'addFirst' && value !== undefined) {
      const newNode: Node = { value, id: nodeIdCounter++ };
      nodes = [newNode, ...nodes];

      steps.push({
        operation: 'addFirst',
        value,
        nodes: [...nodes],
        description: `addFirst(${value}): Create new node, link to old head, update head pointer → O(1)`,
        codeLine: 2,
        variables: { value, size: nodes.length },
        highlightNode: newNode.id,
      });
    } else if (op === 'addLast' && value !== undefined) {
      const newNode: Node = { value, id: nodeIdCounter++ };
      nodes = [...nodes, newNode];

      steps.push({
        operation: 'addLast',
        value,
        nodes: [...nodes],
        description: `addLast(${value}): Create new node, link from old tail, update tail pointer → O(1)`,
        codeLine: 8,
        variables: { value, size: nodes.length },
        highlightNode: newNode.id,
      });
    } else if (op === 'removeFirst') {
      const removed = nodes[0];
      nodes = nodes.slice(1);

      steps.push({
        operation: 'removeFirst',
        value: removed?.value,
        nodes: [...nodes],
        description: `removeFirst(): Remove head node (${removed?.value}), update head to next → O(1)`,
        codeLine: 2,
        variables: { removed: removed?.value ?? 'null', size: nodes.length },
      });
    } else if (op === 'removeLast') {
      const removed = nodes[nodes.length - 1];
      nodes = nodes.slice(0, -1);

      steps.push({
        operation: 'removeLast',
        value: removed?.value,
        nodes: [...nodes],
        description: `removeLast(): Remove tail node (${removed?.value}), update tail to prev → O(1)`,
        codeLine: 8,
        variables: { removed: removed?.value ?? 'null', size: nodes.length },
      });
    } else if (op === 'get' && index !== undefined) {
      for (let i = 0; i <= index && i < nodes.length; i++) {
        steps.push({
          operation: 'get',
          index,
          nodes: [...nodes],
          description:
            i < index
              ? `get(${index}): Traversing... at index ${i}, need to reach ${index}`
              : `get(${index}): Found! Value = ${nodes[i]?.value} after ${i + 1} steps → O(n)`,
          codeLine: i < index ? 16 : 17,
          variables: { index, current: i, value: nodes[i]?.value ?? 'null' },
          highlightNode: nodes[i]?.id,
          traverseProgress: i,
        });
      }
    }
  }

  steps.push({
    operation: 'done',
    nodes: [...nodes],
    description: `✓ Done! LinkedList has ${nodes.length} elements. Remember: O(1) ends, O(n) middle access.`,
    codeLine: -1,
    variables: { size: nodes.length },
  });

  return steps;
}

const LinkedListVisualizerComponent: React.FC<LinkedListVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'linkedlist-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'linkedlist', scrollToId: VISUALIZER_ID });

  const generateSteps = useMemo(() => generateLinkedListSteps, []);

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
  } = useVisualizerPlayback<LinkedListStep>({
    generateSteps,
  });

  const stepData = currentStepData || {
    operation: 'init' as const,
    nodes: [],
    description: '',
  };

  const { nodes, highlightNode, description } = stepData;

  const getStatusVariant = () => {
    if (stepData.operation === 'done') return 'success' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  // Comparison table as info box
  const infoBox = (
    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
      <div className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
        <span className="text-lg">🔗</span> LinkedList vs ArrayList
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-white p-2 rounded-lg border border-blue-200 text-center">
          <div className="font-semibold text-gray-700 mb-1">Operation</div>
        </div>
        <div className="bg-blue-100 p-2 rounded-lg border border-blue-300 text-center">
          <div className="font-semibold text-blue-700 mb-1">LinkedList</div>
        </div>
        <div className="bg-orange-100 p-2 rounded-lg border border-orange-300 text-center">
          <div className="font-semibold text-orange-700 mb-1">ArrayList</div>
        </div>

        <div className="bg-white p-2 rounded-lg border border-gray-200 text-center font-medium">add/remove (ends)</div>
        <div className="bg-green-100 p-2 rounded-lg border border-green-300 text-center font-bold text-green-700">O(1)</div>
        <div className="bg-green-100 p-2 rounded-lg border border-green-300 text-center font-bold text-green-700">O(1)*</div>

        <div className="bg-white p-2 rounded-lg border border-gray-200 text-center font-medium">add/remove (middle)</div>
        <div className="bg-green-100 p-2 rounded-lg border border-green-300 text-center font-bold text-green-700">O(1)**</div>
        <div className="bg-red-100 p-2 rounded-lg border border-red-300 text-center font-bold text-red-700">O(n)</div>

        <div className="bg-white p-2 rounded-lg border border-gray-200 text-center font-medium">get(index)</div>
        <div className="bg-red-100 p-2 rounded-lg border border-red-300 text-center font-bold text-red-700">O(n)</div>
        <div className="bg-green-100 p-2 rounded-lg border border-green-300 text-center font-bold text-green-700">O(1)</div>
      </div>
      <div className="mt-2 text-[10px] text-gray-500 text-center">
        * amortized | ** if you have the node reference
      </div>
    </div>
  );

  const visualization = (
    <>
      {infoBox}

      {/* LinkedList Visualization */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Doubly-Linked List</div>
        <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
          {nodes.length > 0 ? (
            <div className="flex items-center gap-1 min-w-max">
              <div className="text-xs text-gray-500 font-mono mr-2">head →</div>
              {nodes.map((node, idx) => (
                <React.Fragment key={node.id}>
                  <div
                    className={`flex flex-col items-center transition-transform ${
                      node.id === highlightNode ? 'scale-110' : ''
                    }`}
                  >
                    <div
                      className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 font-medium transition-colors ${
                        node.id === highlightNode
                          ? 'bg-blue-500 border-blue-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      {node.value}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">idx:{idx}</div>
                  </div>
                  {idx < nodes.length - 1 && (
                    <div className="flex items-center text-gray-400">
                      <span className="text-lg">⇄</span>
                    </div>
                  )}
                </React.Fragment>
              ))}
              <div className="text-xs text-gray-500 font-mono ml-2">← tail</div>
            </div>
          ) : (
            <div className="h-16 flex items-center justify-center text-gray-400 text-sm">
              Empty list (head = tail = null)
            </div>
          )}
        </div>
      </div>

      {/* Pointers Info - always visible */}
      <div className="mb-4 p-3 bg-gray-100 rounded-lg min-h-[44px]">
        {nodes.length > 0 ? (
          <div className="text-xs text-gray-600 flex gap-4">
            <span>
              <span className="font-medium">head:</span> {nodes[0]?.value}
            </span>
            <span>
              <span className="font-medium">tail:</span> {nodes[nodes.length - 1]?.value}
            </span>
            <span>
              <span className="font-medium">size:</span> {nodes.length}
            </span>
          </div>
        ) : (
          <div className="text-xs text-gray-400 text-center">head = tail = null, size = 0</div>
        )}
      </div>
    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="LinkedList Operations"
      badges={BADGES}
      gradient="blue"
      onShare={handleShare}
      className={className}
      minHeight={350}
      status={{
        description,
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
        accentColor: 'blue',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? LINKEDLIST_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const LinkedListVisualizer = React.memo(LinkedListVisualizerComponent);
export default LinkedListVisualizer;
