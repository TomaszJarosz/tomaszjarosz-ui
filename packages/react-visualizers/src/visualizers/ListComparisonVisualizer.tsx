import React, { useMemo, useCallback, useState } from 'react';
import {
  ControlPanel,
  Legend,
  StatusPanel,
  ShareButton,
  useUrlState,
  useVisualizerPlayback,
  VisualizationArea,
} from '../shared';

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

interface ListComparisonVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const INITIAL_DATA = [10, 20, 30, 40, 50];

const OPERATIONS: Array<{ op: Operation; index?: number; value?: number }> = [
  { op: 'get', index: 2 },
  { op: 'addLast', value: 60 },
  { op: 'addFirst', value: 5 },
  { op: 'addMiddle', index: 3, value: 25 },
  { op: 'removeFirst' },
  { op: 'removeLast' },
  { op: 'removeMiddle', index: 2 },
];

const LEGEND_ITEMS = [
  { color: 'bg-blue-500', label: 'ArrayList' },
  { color: 'bg-green-500', label: 'LinkedList' },
  { color: 'bg-yellow-400', label: 'Current element' },
  { color: 'bg-red-400', label: 'Shifting/Traversing' },
  { color: 'bg-purple-400', label: 'Result' },
];

function generateListComparisonSteps(): ListStep[] {
  const steps: ListStep[] = [];
  let arrayList = [...INITIAL_DATA];
  let linkedList = [...INITIAL_DATA];

  // Initial state
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
        // ArrayList: Direct access O(1)
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
        // ArrayList: Shift all elements O(n)
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
        // ArrayList: Amortized O(1)
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
        // ArrayList: Shift elements O(n)
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
        // ArrayList: Shift all O(n)
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
        // ArrayList: O(1)
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
            description: `Traverse to find tail's predecessor`,
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

      case 'removeMiddle': {
        const idx = index!;
        const removed = arrayList[idx];
        const shiftCount = arrayList.length - idx - 1;

        steps.push({
          operation: 'removeMiddle',
          arrayList: {
            elements: [...arrayList],
            highlightIndex: idx,
            shiftIndices: arrayList.slice(idx + 1).map((_, i) => idx + 1 + i),
            accessCount: shiftCount,
            description: `Shift ${shiftCount} elements left`,
          },
          linkedList: {
            elements: [...linkedList],
            traverseIndices: Array.from({ length: idx }, (_, i) => i),
            highlightIndex: idx,
            accessCount: idx + 1,
            description: `Traverse ${idx} nodes, then O(1) remove`,
          },
          description: `remove(${idx}): ArrayList O(n) vs LinkedList O(n)`,
          phase: 'process',
        });

        arrayList = [...arrayList.slice(0, idx), ...arrayList.slice(idx + 1)];
        linkedList = [...linkedList.slice(0, idx), ...linkedList.slice(idx + 1)];

        steps.push({
          operation: 'removeMiddle',
          arrayList: {
            elements: [...arrayList],
            accessCount: shiftCount,
            description: `Removed ${removed}, shifted elements`,
          },
          linkedList: {
            elements: [...linkedList],
            accessCount: idx + 1,
            description: `Removed ${removed} after traversal`,
          },
          description: `remove(${idx}) = ${removed} complete`,
          phase: 'complete',
        });
        break;
      }
    }
  }

  // Final summary
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
    description: '✓ Comparison complete! ArrayList wins for random access, LinkedList wins for front operations.',
    phase: 'complete',
  });

  return steps;
}

const ListComparisonVisualizerComponent: React.FC<ListComparisonVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'list-comparison-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'listcmp', scrollToId: VISUALIZER_ID });

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

  const renderArrayList = () => (
    <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-blue-800 text-sm">ArrayList</div>
        <div className="text-xs text-blue-600">
          Accesses: {arrayList.accessCount}
        </div>
      </div>

      {/* Array visualization - contiguous blocks */}
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
                ${isHighlighted ? 'bg-yellow-400 border-yellow-500' : ''}
                ${isShifting ? 'bg-red-300 border-red-400' : ''}
                ${!isHighlighted && !isShifting ? 'bg-blue-200 border-blue-300' : ''}
              `}
            >
              {el}
            </div>
          );
        })}
        {arrayList.elements.length === 0 && (
          <div className="text-gray-400 text-sm">empty</div>
        )}
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

      {/* Linked list visualization - nodes with arrows */}
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
                  ${isHighlighted ? 'bg-yellow-400 border-yellow-500' : ''}
                  ${isTraversing && !isHighlighted ? 'bg-red-300 border-red-400' : ''}
                  ${!isHighlighted && !isTraversing ? 'bg-green-200 border-green-300' : ''}
                `}
              >
                {el}
              </div>
              {idx < linkedList.elements.length - 1 && (
                <span className="text-gray-400 text-xs">→</span>
              )}
            </React.Fragment>
          );
        })}
        {linkedList.elements.length === 0 && (
          <div className="text-gray-400 text-sm">empty</div>
        )}
      </div>

      <div className="text-xs text-gray-600">{linkedList.description}</div>
    </div>
  );

  return (
    <div
      id={VISUALIZER_ID}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">ArrayList vs LinkedList</h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                Comparison
              </span>
            </div>
          </div>
          <ShareButton onShare={handleShare} accentColor="blue" />
        </div>
      </div>

      {/* Visualization Area */}
      <div className="p-4">
        <VisualizationArea minHeight={400}>
          {/* Complexity Comparison */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm font-bold text-gray-800 mb-2">Time Complexity Comparison</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-1 text-left">Operation</th>
                    <th className="px-2 py-1 text-center text-blue-700">ArrayList</th>
                    <th className="px-2 py-1 text-center text-green-700">LinkedList</th>
                    <th className="px-2 py-1 text-center">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-2 py-1">get(i)</td>
                    <td className="px-2 py-1 text-center font-mono text-blue-700">O(1)</td>
                    <td className="px-2 py-1 text-center font-mono text-green-700">O(n)</td>
                    <td className="px-2 py-1 text-center">🔵</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-2 py-1">addFirst()</td>
                    <td className="px-2 py-1 text-center font-mono text-blue-700">O(n)</td>
                    <td className="px-2 py-1 text-center font-mono text-green-700">O(1)</td>
                    <td className="px-2 py-1 text-center">🟢</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">addLast()</td>
                    <td className="px-2 py-1 text-center font-mono text-blue-700">O(1)*</td>
                    <td className="px-2 py-1 text-center font-mono text-green-700">O(1)**</td>
                    <td className="px-2 py-1 text-center">≈</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-2 py-1">add(i, e)</td>
                    <td className="px-2 py-1 text-center font-mono text-blue-700">O(n)</td>
                    <td className="px-2 py-1 text-center font-mono text-green-700">O(n)</td>
                    <td className="px-2 py-1 text-center">≈</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1">removeFirst()</td>
                    <td className="px-2 py-1 text-center font-mono text-blue-700">O(n)</td>
                    <td className="px-2 py-1 text-center font-mono text-green-700">O(1)</td>
                    <td className="px-2 py-1 text-center">🟢</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-2 py-1">removeLast()</td>
                    <td className="px-2 py-1 text-center font-mono text-blue-700">O(1)</td>
                    <td className="px-2 py-1 text-center font-mono text-green-700">O(n)</td>
                    <td className="px-2 py-1 text-center">🔵</td>
                  </tr>
                </tbody>
              </table>
              <div className="text-[10px] text-gray-500 mt-1">
                * amortized | ** Java&apos;s LinkedList has tail pointer
              </div>
            </div>
          </div>

          {/* Side by side visualization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {renderArrayList()}
            {renderLinkedList()}
          </div>

          {/* When to use */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs font-bold text-blue-800 mb-1">Use ArrayList when:</div>
              <ul className="text-[10px] text-blue-700 space-y-0.5">
                <li>• Random access needed</li>
                <li>• Mostly appending</li>
                <li>• Memory efficiency matters</li>
                <li>• Cache performance important</li>
              </ul>
            </div>
            <div className="p-2 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xs font-bold text-green-800 mb-1">Use LinkedList when:</div>
              <ul className="text-[10px] text-green-700 space-y-0.5">
                <li>• Frequent insert/remove at front</li>
                <li>• Queue/Deque operations</li>
                <li>• Iterator-based modifications</li>
                <li>• Size changes frequently</li>
              </ul>
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
            accentColor="blue"
          />
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
};

export const ListComparisonVisualizer = React.memo(ListComparisonVisualizerComponent);
export default ListComparisonVisualizer;
