import React, { useMemo, useState, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';

// Simulated enum with 8 values (fits in single long)
const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

interface EnumSetStep {
  operation: 'init' | 'add' | 'remove' | 'contains' | 'done';
  value?: DayOfWeek;
  bitmask: number;
  bitPosition?: number;
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  result?: boolean;
  highlightBit?: number;
  previousBitmask?: number;
}

interface EnumSetVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const OPERATIONS: Array<{
  op: 'add' | 'remove' | 'contains';
  value: DayOfWeek;
}> = [
  { op: 'add', value: 'MONDAY' },
  { op: 'add', value: 'WEDNESDAY' },
  { op: 'add', value: 'FRIDAY' },
  { op: 'add', value: 'SATURDAY' },
  { op: 'contains', value: 'WEDNESDAY' },
  { op: 'contains', value: 'TUESDAY' },
  { op: 'add', value: 'MONDAY' }, // Already exists
  { op: 'remove', value: 'FRIDAY' },
  { op: 'contains', value: 'FRIDAY' },
  { op: 'add', value: 'SUNDAY' },
];

const ENUMSET_CODE = [
  'class EnumSet<E extends Enum<E>> {',
  '  private long elements = 0L;',
  '',
  '  void add(E e) {',
  '    int ordinal = e.ordinal();',
  '    elements |= (1L << ordinal);',
  '  }',
  '',
  '  void remove(E e) {',
  '    int ordinal = e.ordinal();',
  '    elements &= ~(1L << ordinal);',
  '  }',
  '',
  '  boolean contains(E e) {',
  '    int ordinal = e.ordinal();',
  '    return (elements & (1L<<ordinal)) != 0;',
  '  }',
  '}',
];

const LEGEND_ITEMS = [
  { color: 'bg-green-500', label: 'Bit set (1)' },
  { color: 'bg-gray-200', label: 'Bit clear (0)' },
  { color: 'bg-blue-500', label: 'Current operation' },
  { color: 'bg-yellow-400', label: 'Changed bit' },
];

const BADGES = [
  { label: 'O(1) all ops', variant: 'green' as const },
  { label: 'Memory efficient', variant: 'green' as const },
];

function getBitPosition(day: DayOfWeek): number {
  return DAYS_OF_WEEK.indexOf(day);
}

function generateEnumSetSteps(): EnumSetStep[] {
  const steps: EnumSetStep[] = [];
  let bitmask = 0;

  // Initial state
  steps.push({
    operation: 'init',
    bitmask: 0,
    description:
      'Initialize EnumSet with empty bitmask (0). Each enum constant maps to a bit position based on ordinal().',
    codeLine: 1,
    variables: { elements: '0b0000000' },
  });

  for (const { op, value } of OPERATIONS) {
    const bitPos = getBitPosition(value);
    const bitMaskForValue = 1 << bitPos;
    const previousBitmask = bitmask;

    if (op === 'add') {
      const wasSet = (bitmask & bitMaskForValue) !== 0;
      bitmask |= bitMaskForValue;

      steps.push({
        operation: 'add',
        value,
        bitmask,
        bitPosition: bitPos,
        previousBitmask,
        description: wasSet
          ? `add(${value}): Bit ${bitPos} already set. No change needed.`
          : `add(${value}): Set bit ${bitPos}. elements |= (1L << ${bitPos})`,
        codeLine: 5,
        variables: {
          ordinal: bitPos,
          mask: `0b${bitMaskForValue.toString(2).padStart(7, '0')}`,
          elements: `0b${bitmask.toString(2).padStart(7, '0')}`,
        },
        highlightBit: bitPos,
      });
    } else if (op === 'remove') {
      const wasSet = (bitmask & bitMaskForValue) !== 0;
      bitmask &= ~bitMaskForValue;

      steps.push({
        operation: 'remove',
        value,
        bitmask,
        bitPosition: bitPos,
        previousBitmask,
        description: wasSet
          ? `remove(${value}): Clear bit ${bitPos}. elements &= ~(1L << ${bitPos})`
          : `remove(${value}): Bit ${bitPos} already clear. No change needed.`,
        codeLine: 10,
        variables: {
          ordinal: bitPos,
          mask: `0b${(~bitMaskForValue & 0x7f).toString(2).padStart(7, '0')}`,
          elements: `0b${bitmask.toString(2).padStart(7, '0')}`,
        },
        highlightBit: bitPos,
      });
    } else {
      // contains
      const isSet = (bitmask & bitMaskForValue) !== 0;

      steps.push({
        operation: 'contains',
        value,
        bitmask,
        bitPosition: bitPos,
        result: isSet,
        description: `contains(${value}): Check bit ${bitPos}. (elements & (1L << ${bitPos})) ${isSet ? '!= 0 → true' : '== 0 → false'}`,
        codeLine: 15,
        variables: {
          ordinal: bitPos,
          mask: `0b${bitMaskForValue.toString(2).padStart(7, '0')}`,
          result: isSet ? 'true' : 'false',
        },
        highlightBit: bitPos,
      });
    }
  }

  // Count set bits
  let count = 0;
  let temp = bitmask;
  while (temp > 0) {
    count += temp & 1;
    temp >>= 1;
  }

  steps.push({
    operation: 'done',
    bitmask,
    description: `✓ Done! EnumSet contains ${count} elements. O(1) for all operations!`,
    codeLine: -1,
    variables: {
      size: count,
      elements: `0b${bitmask.toString(2).padStart(7, '0')}`,
    },
  });

  return steps;
}

const EnumSetVisualizerComponent: React.FC<EnumSetVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'enumset-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'enumset', scrollToId: VISUALIZER_ID });

  const [showBinary, setShowBinary] = useState(true);
  const generateSteps = useMemo(() => generateEnumSetSteps, []);

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
  } = useVisualizerPlayback<EnumSetStep>({
    generateSteps,
  });

  const stepData = currentStepData || {
    operation: 'init' as const,
    bitmask: 0,
    description: '',
  };

  const { bitmask, highlightBit, description, result, previousBitmask } =
    stepData;

  const toggleBinaryView = useCallback(() => {
    setShowBinary((prev) => !prev);
  }, []);

  const getBitStyle = (bitIndex: number): string => {
    const isSet = (bitmask & (1 << bitIndex)) !== 0;
    const wasSet =
      previousBitmask !== undefined
        ? (previousBitmask & (1 << bitIndex)) !== 0
        : isSet;
    const isHighlighted = highlightBit === bitIndex;
    const changed = isSet !== wasSet;

    if (isHighlighted) {
      if (stepData.operation === 'contains') {
        return result
          ? 'bg-green-500 text-white ring-2 ring-green-300'
          : 'bg-red-400 text-white ring-2 ring-red-300';
      }
      if (changed) {
        return 'bg-yellow-400 text-gray-900 ring-2 ring-yellow-300';
      }
      return 'bg-blue-500 text-white ring-2 ring-blue-300';
    }

    return isSet
      ? 'bg-green-500 text-white'
      : 'bg-gray-200 text-gray-600';
  };

  const getStatusVariant = () => {
    if (stepData.operation === 'contains' && result === false)
      return 'error' as const;
    if (stepData.operation === 'contains' && result === true)
      return 'success' as const;
    if (stepData.operation === 'done') return 'warning' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const headerExtra = (
    <button
      onClick={toggleBinaryView}
      className="px-2 py-1 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
    >
      {showBinary ? 'Hide Binary' : 'Show Binary'}
    </button>
  );

  const visualization = (
    <>
      {/* Enum Values with Bits */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">
          DayOfWeek Enum → Bitmask Mapping
        </div>

        {/* Bitmask visualization */}
        <div className="flex flex-wrap gap-1 mb-4">
          {DAYS_OF_WEEK.map((day, idx) => {
            const isSet = (bitmask & (1 << idx)) !== 0;
            return (
              <div
                key={day}
                className="flex flex-col items-center"
              >
                <div
                  className={`w-14 h-10 flex flex-col items-center justify-center text-xs font-medium rounded transition-colors duration-200 ${getBitStyle(idx)}`}
                >
                  <span className="text-[10px] opacity-80">bit {idx}</span>
                  <span>{isSet ? '1' : '0'}</span>
                </div>
                <div className="text-[9px] text-gray-500 mt-1 text-center leading-tight">
                  {day.slice(0, 3)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Binary representation */}
        {showBinary && (
          <div className="p-3 bg-gray-900 rounded-lg text-sm font-mono">
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-green-400">elements</span>
              <span>=</span>
              <span className="text-yellow-300">
                0b{bitmask.toString(2).padStart(7, '0')}
              </span>
              <span className="text-gray-500">
                ({bitmask} in decimal)
              </span>
            </div>
            {stepData.operation === 'add' && highlightBit !== undefined && (
              <div className="mt-2 text-blue-300">
                <span className="text-gray-500">// Set bit: </span>
                elements |= (1L &lt;&lt; {highlightBit})
              </div>
            )}
            {stepData.operation === 'remove' && highlightBit !== undefined && (
              <div className="mt-2 text-orange-300">
                <span className="text-gray-500">// Clear bit: </span>
                elements &amp;= ~(1L &lt;&lt; {highlightBit})
              </div>
            )}
            {stepData.operation === 'contains' && highlightBit !== undefined && (
              <div className="mt-2 text-purple-300">
                <span className="text-gray-500">// Check bit: </span>
                (elements &amp; (1L &lt;&lt; {highlightBit})) != 0
              </div>
            )}
          </div>
        )}
      </div>

      {/* Set contents */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600 mb-2">
          <span className="font-medium">Set Contents:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {DAYS_OF_WEEK.filter((_, idx) => (bitmask & (1 << idx)) !== 0).map(
            (day) => (
              <span
                key={day}
                className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded"
              >
                {day}
              </span>
            )
          )}
          {bitmask === 0 && (
            <span className="text-xs text-gray-400 italic">Empty set</span>
          )}
        </div>
      </div>

      {/* Why EnumSet? Memory Comparison - PROMINENT */}
      <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-lime-50 rounded-xl border-2 border-green-200">
        <div className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
          <span className="text-lg">💡</span> Why EnumSet? Memory Efficiency!
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* EnumSet */}
          <div className="bg-white p-3 rounded-lg border-2 border-green-300">
            <div className="text-sm font-bold text-green-700 mb-2">EnumSet</div>
            <div className="text-2xl font-bold text-green-600 mb-1">8 bytes</div>
            <div className="text-xs text-gray-600">
              1 long for up to 64 enum values
            </div>
            <div className="mt-2 text-xs text-green-600">
              ✓ Single CPU instruction per operation
            </div>
          </div>
          {/* HashSet */}
          <div className="bg-white p-3 rounded-lg border-2 border-gray-300">
            <div className="text-sm font-bold text-gray-500 mb-2">HashSet</div>
            <div className="text-2xl font-bold text-gray-500 mb-1">~280 bytes</div>
            <div className="text-xs text-gray-500">
              For 7 enum values (~40 bytes each)
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Hash computation + object overhead
            </div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
            35x smaller memory footprint!
          </span>
        </div>
      </div>
    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="EnumSet Bit Operations"
      badges={BADGES}
      gradient="green"
      onShare={handleShare}
      className={className}
      minHeight={400}
      headerExtra={headerExtra}
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
        accentColor: 'green',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? ENUMSET_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const EnumSetVisualizer = React.memo(EnumSetVisualizerComponent);
export default EnumSetVisualizer;
