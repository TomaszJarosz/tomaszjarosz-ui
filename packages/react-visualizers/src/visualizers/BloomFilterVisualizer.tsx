import React, { useMemo, useCallback, useState } from 'react';
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

interface BloomFilterStep {
  operation: 'init' | 'add' | 'hash' | 'setBit' | 'check' | 'checkBit' | 'result' | 'done';
  element?: string;
  hashIndex?: number;
  hashFunction?: number;
  bitArray: boolean[];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  highlightBits?: number[];
  result?: 'definitely_not' | 'probably_yes' | 'false_positive';
}

interface BloomFilterVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const BIT_ARRAY_SIZE = 16;
const NUM_HASH_FUNCTIONS = 3;

// Elements to add and check
const ADD_ELEMENTS = ['apple', 'banana', 'cherry'];
const CHECK_ELEMENTS = ['apple', 'grape', 'banana', 'mango'];

const BLOOM_FILTER_CODE = [
  'class BloomFilter:',
  '  def __init__(size, k):',
  '    self.bits = [0] * size',
  '    self.k = k  # hash functions',
  '',
  '  def add(element):',
  '    for i in range(k):',
  '      index = hash_i(element) % size',
  '      bits[index] = 1',
  '',
  '  def contains(element):',
  '    for i in range(k):',
  '      index = hash_i(element) % size',
  '      if bits[index] == 0:',
  '        return False  # definitely not',
  '    return True  # probably yes',
];

const LEGEND_ITEMS = [
  { color: 'bg-gray-200', label: 'Bit = 0' },
  { color: 'bg-indigo-500', label: 'Bit = 1' },
  { color: 'bg-yellow-400', label: 'Currently checking', border: '#fbbf24' },
  { color: 'bg-green-500', label: 'Match (probably in set)' },
  { color: 'bg-red-500', label: 'Miss (definitely not in set)' },
];

// Simple hash functions for visualization
function hash1(str: string, size: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % size;
  }
  return Math.abs(hash);
}

function hash2(str: string, size: number): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) % size;
  }
  return Math.abs(hash);
}

function hash3(str: string, size: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 17 + str.charCodeAt(i) * (i + 1)) % size;
  }
  return Math.abs(hash);
}

function getHashes(element: string, size: number): number[] {
  return [
    hash1(element, size),
    hash2(element, size),
    hash3(element, size),
  ];
}

function generateBloomFilterSteps(): BloomFilterStep[] {
  const steps: BloomFilterStep[] = [];
  const bitArray: boolean[] = new Array(BIT_ARRAY_SIZE).fill(false);
  const addedElements = new Set<string>();

  // Initialize
  steps.push({
    operation: 'init',
    bitArray: [...bitArray],
    description: `Initialize Bloom Filter with ${BIT_ARRAY_SIZE} bits and ${NUM_HASH_FUNCTIONS} hash functions. All bits start as 0.`,
    codeLine: 1,
    variables: { size: BIT_ARRAY_SIZE, k: NUM_HASH_FUNCTIONS },
  });

  // Add elements
  for (const element of ADD_ELEMENTS) {
    const hashes = getHashes(element, BIT_ARRAY_SIZE);

    // Step: Start adding element
    steps.push({
      operation: 'add',
      element,
      bitArray: [...bitArray],
      description: `add("${element}"): Calculate ${NUM_HASH_FUNCTIONS} hash positions`,
      codeLine: 5,
      variables: { element: `"${element}"` },
    });

    // Step through each hash function
    for (let i = 0; i < hashes.length; i++) {
      const hashIndex = hashes[i];

      // Show hash calculation
      steps.push({
        operation: 'hash',
        element,
        hashIndex,
        hashFunction: i + 1,
        bitArray: [...bitArray],
        description: `hash_${i + 1}("${element}") % ${BIT_ARRAY_SIZE} = ${hashIndex}`,
        codeLine: 7,
        variables: { i: i + 1, index: hashIndex },
        highlightBits: [hashIndex],
      });

      // Set bit
      const wasSet = bitArray[hashIndex];
      bitArray[hashIndex] = true;

      steps.push({
        operation: 'setBit',
        element,
        hashIndex,
        hashFunction: i + 1,
        bitArray: [...bitArray],
        description: wasSet
          ? `bits[${hashIndex}] already 1 (no change)`
          : `Set bits[${hashIndex}] = 1`,
        codeLine: 8,
        variables: { index: hashIndex, value: 1 },
        highlightBits: [hashIndex],
      });
    }

    addedElements.add(element);
  }

  // Check elements
  for (const element of CHECK_ELEMENTS) {
    const hashes = getHashes(element, BIT_ARRAY_SIZE);
    const isActuallyInSet = addedElements.has(element);

    // Start check
    steps.push({
      operation: 'check',
      element,
      bitArray: [...bitArray],
      description: `contains("${element}"): Check all ${NUM_HASH_FUNCTIONS} hash positions`,
      codeLine: 10,
      variables: { element: `"${element}"` },
    });

    let allBitsSet = true;
    let missIndex = -1;

    // Check each hash position
    for (let i = 0; i < hashes.length; i++) {
      const hashIndex = hashes[i];
      const bitValue = bitArray[hashIndex];

      steps.push({
        operation: 'checkBit',
        element,
        hashIndex,
        hashFunction: i + 1,
        bitArray: [...bitArray],
        description: `hash_${i + 1}("${element}") = ${hashIndex}, bits[${hashIndex}] = ${bitValue ? '1 ✓' : '0 ✗'}`,
        codeLine: 12,
        variables: { i: i + 1, index: hashIndex, bit: bitValue ? 1 : 0 },
        highlightBits: [hashIndex],
      });

      if (!bitValue) {
        allBitsSet = false;
        missIndex = hashIndex;
        break; // Early exit on miss
      }
    }

    // Result
    let result: 'definitely_not' | 'probably_yes' | 'false_positive';
    let resultDescription: string;
    let resultCodeLine: number;

    if (!allBitsSet) {
      result = 'definitely_not';
      resultDescription = `"${element}" is DEFINITELY NOT in the set (bit ${missIndex} is 0)`;
      resultCodeLine = 14;
    } else if (isActuallyInSet) {
      result = 'probably_yes';
      resultDescription = `"${element}" is PROBABLY in the set (all bits are 1) ✓ Correct!`;
      resultCodeLine = 15;
    } else {
      result = 'false_positive';
      resultDescription = `"${element}" is PROBABLY in the set (all bits are 1) ⚠️ FALSE POSITIVE! (not actually added)`;
      resultCodeLine = 15;
    }

    steps.push({
      operation: 'result',
      element,
      bitArray: [...bitArray],
      description: resultDescription,
      codeLine: resultCodeLine,
      variables: { element: `"${element}"`, result: result.replace('_', ' ') },
      highlightBits: hashes,
      result,
    });
  }

  // Final
  const setBits = bitArray.filter(b => b).length;
  steps.push({
    operation: 'done',
    bitArray: [...bitArray],
    description: `✓ Done! ${setBits}/${BIT_ARRAY_SIZE} bits set. Added: ${ADD_ELEMENTS.join(', ')}. False positive rate depends on size and hash functions.`,
    codeLine: -1,
    variables: { setBits, totalBits: BIT_ARRAY_SIZE, elements: ADD_ELEMENTS.length },
  });

  return steps;
}

const BloomFilterVisualizerComponent: React.FC<BloomFilterVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'bloom-filter-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'bloom', scrollToId: VISUALIZER_ID });

  const generateSteps = useMemo(() => generateBloomFilterSteps, []);

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
  } = useVisualizerPlayback<BloomFilterStep>({
    generateSteps,
  });

  const stepData: BloomFilterStep = currentStepData || {
    operation: 'init',
    bitArray: new Array(BIT_ARRAY_SIZE).fill(false),
    description: '',
    highlightBits: undefined,
    result: undefined,
  };

  const { bitArray, highlightBits, description, result } = stepData;

  const getBitStyle = (index: number, value: boolean): string => {
    const isHighlighted = highlightBits?.includes(index);

    if (isHighlighted) {
      if (stepData.operation === 'result') {
        if (result === 'definitely_not' && !value) {
          return 'bg-red-500 text-white border-red-600';
        }
        if (result === 'probably_yes') {
          return 'bg-green-500 text-white border-green-600';
        }
        if (result === 'false_positive') {
          return 'bg-yellow-500 text-white border-yellow-600';
        }
      }
      return 'bg-yellow-400 text-gray-900 border-yellow-500';
    }

    return value
      ? 'bg-indigo-500 text-white border-indigo-600'
      : 'bg-gray-200 text-gray-500 border-gray-300';
  };

  const getStatusVariant = () => {
    if (result === 'definitely_not') return 'error' as const;
    if (result === 'probably_yes') return 'success' as const;
    if (result === 'false_positive') return 'warning' as const;
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
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">Bloom Filter</h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                Space: O(m)
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-pink-100 text-pink-700 rounded">
                Probabilistic
              </span>
            </div>
          </div>
          <ShareButton onShare={handleShare} accentColor="purple" />
        </div>
      </div>

      {/* Visualization Area */}
      <div className="p-4">
        <div className={`flex gap-4 ${showCode ? 'flex-col lg:flex-row' : ''}`}>
          {/* Main Visualization */}
          <VisualizationArea minHeight={400} className={showCode ? 'flex-1' : 'w-full'}>
            {/* Key Concept */}
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
              <div className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
                <span className="text-lg">🎲</span> Probabilistic Data Structure
              </div>
              <div className="text-xs text-gray-700 space-y-1">
                <p><strong>False Positives:</strong> May say &quot;probably yes&quot; when element was never added</p>
                <p><strong>No False Negatives:</strong> If it says &quot;no&quot;, element is DEFINITELY not in set</p>
                <p><strong>No Deletion:</strong> Cannot remove elements (would cause false negatives)</p>
              </div>
            </div>

            {/* Bit Array Visualization */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                <span>Bit Array ({BIT_ARRAY_SIZE} bits, {NUM_HASH_FUNCTIONS} hash functions)</span>
                <span className="text-xs text-gray-500">
                  Set: {bitArray.filter(b => b).length} / {BIT_ARRAY_SIZE}
                </span>
              </div>

              {/* Bit array grid */}
              <div className="grid grid-cols-8 gap-1 mb-2">
                {bitArray.map((bit, idx) => (
                  <div
                    key={idx}
                    className={`
                      h-10 flex flex-col items-center justify-center rounded
                      border-2 transition-all duration-200 text-xs font-mono
                      ${getBitStyle(idx, bit)}
                    `}
                  >
                    <span className="text-[10px] opacity-60">{idx}</span>
                    <span className="font-bold">{bit ? '1' : '0'}</span>
                  </div>
                ))}
              </div>

              {/* Index labels */}
              <div className="grid grid-cols-8 gap-1">
                {bitArray.map((_, idx) => (
                  <div key={idx} className="text-center text-[9px] text-gray-400">
                    [{idx}]
                  </div>
                ))}
              </div>
            </div>

            {/* Current Operation */}
            {stepData.element && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm">
                  <span className="text-gray-500">Element: </span>
                  <span className="font-mono font-bold text-purple-600">&quot;{stepData.element}&quot;</span>
                  {stepData.hashFunction && (
                    <>
                      <span className="text-gray-500 ml-4">Hash #{stepData.hashFunction}: </span>
                      <span className="font-mono font-bold text-pink-600">{stepData.hashIndex}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Hash Functions Explanation */}
            {stepData.operation === 'init' && (
              <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="text-xs font-medium text-indigo-800 mb-2">Hash Functions (k={NUM_HASH_FUNCTIONS})</div>
                <div className="font-mono text-[10px] text-gray-600 space-y-1">
                  <div>hash_1(x) = (x * 31) % {BIT_ARRAY_SIZE}</div>
                  <div>hash_2(x) = (djb2 hash) % {BIT_ARRAY_SIZE}</div>
                  <div>hash_3(x) = (x * 17 * pos) % {BIT_ARRAY_SIZE}</div>
                </div>
              </div>
            )}

            {/* Elements Summary */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xs font-medium text-green-800 mb-1">Added Elements</div>
                <div className="text-xs text-green-700">
                  {ADD_ELEMENTS.map((el, i) => (
                    <span key={el} className="font-mono">
                      {el}{i < ADD_ELEMENTS.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs font-medium text-blue-800 mb-1">Checking</div>
                <div className="text-xs text-blue-700">
                  {CHECK_ELEMENTS.map((el, i) => (
                    <span key={el} className="font-mono">
                      {el}{i < CHECK_ELEMENTS.length - 1 ? ', ' : ''}
                    </span>
                  ))}
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
            <div className="w-full lg:w-56 flex-shrink-0 space-y-2">
              <CodePanel
                code={BLOOM_FILTER_CODE}
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
            accentColor="purple"
          />
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
};

export const BloomFilterVisualizer = React.memo(BloomFilterVisualizerComponent);
export default BloomFilterVisualizer;
