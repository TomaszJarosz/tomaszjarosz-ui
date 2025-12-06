import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Lock, Shield } from 'lucide-react';
import {
  CodePanel,
  HelpPanel,
  ControlPanel,
  Legend,
  StatusPanel,
  VisualizationArea,
} from '../shared';

interface ImmutableStep {
  operation: 'create' | 'tryModify' | 'derive' | 'init' | 'done';
  method?: string;
  original: string[];
  derived?: string[];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  error?: boolean;
  showDerived?: boolean;
}

interface ImmutableCollectionsVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const IMMUTABLE_CODE = [
  '// Java 9+ Immutable Collections',
  '',
  '// Creation - O(1) for small, O(n) copy',
  'List.of("A", "B", "C")',
  'Set.of(1, 2, 3)',
  'Map.of("k1", "v1", "k2", "v2")',
  '',
  '// Modification attempts throw!',
  'list.add("D")  // UnsupportedOp!',
  'list.set(0, "X")  // UnsupportedOp!',
  '',
  '// Safe derivation pattern',
  'var newList = new ArrayList<>(list)',
  'newList.add("D")  // Works!',
];

const LEGEND_ITEMS = [
  { color: 'bg-violet-100', label: 'Immutable', border: '#c4b5fd' },
  { color: 'bg-green-100', label: 'Mutable copy', border: '#86efac' },
  { color: 'bg-red-100', label: 'Error', border: '#fca5a5' },
];

function generateImmutableSteps(): ImmutableStep[] {
  const steps: ImmutableStep[] = [];

  steps.push({
    operation: 'init',
    original: [],
    description:
      'Immutable Collections (Java 9+): Thread-safe by design. No locks needed - nothing can change!',
    codeLine: -1,
  });

  // Create immutable list
  steps.push({
    operation: 'create',
    method: 'List.of()',
    original: ['A', 'B', 'C'],
    description:
      'List.of("A", "B", "C") → Creates unmodifiable List. Compact, no extra memory overhead.',
    codeLine: 3,
    variables: { size: 3, type: 'ImmutableList' },
  });

  // Try to add
  steps.push({
    operation: 'tryModify',
    method: 'add()',
    original: ['A', 'B', 'C'],
    description:
      'list.add("D") → UnsupportedOperationException! Immutable means NO modifications.',
    codeLine: 8,
    variables: { method: 'add', result: 'Exception!' },
    error: true,
  });

  // Try to set
  steps.push({
    operation: 'tryModify',
    method: 'set()',
    original: ['A', 'B', 'C'],
    description:
      'list.set(0, "X") → UnsupportedOperationException! Even index-based changes fail.',
    codeLine: 9,
    variables: { method: 'set', result: 'Exception!' },
    error: true,
  });

  // Try to remove
  steps.push({
    operation: 'tryModify',
    method: 'remove()',
    original: ['A', 'B', 'C'],
    description:
      'list.remove(0) → UnsupportedOperationException! No element can be removed.',
    codeLine: 8,
    variables: { method: 'remove', result: 'Exception!' },
    error: true,
  });

  // Derive new collection
  steps.push({
    operation: 'derive',
    method: 'new ArrayList<>()',
    original: ['A', 'B', 'C'],
    derived: ['A', 'B', 'C'],
    description:
      'new ArrayList<>(list) → Create mutable copy. Original stays unchanged forever!',
    codeLine: 12,
    variables: { copied: 3 },
    showDerived: true,
  });

  // Modify derived
  steps.push({
    operation: 'derive',
    method: 'newList.add()',
    original: ['A', 'B', 'C'],
    derived: ['A', 'B', 'C', 'D'],
    description:
      'newList.add("D") → Works! Mutable copy can be modified. Original unchanged.',
    codeLine: 13,
    variables: { newSize: 4, originalSize: 3 },
    showDerived: true,
  });

  steps.push({
    operation: 'done',
    original: ['A', 'B', 'C'],
    description:
      '✓ Immutable = Thread-safe without locks. Share freely between threads!',
    codeLine: -1,
    variables: { 'thread-safe': 'always' },
  });

  return steps;
}

const ImmutableCollectionsVisualizerComponent: React.FC<
  ImmutableCollectionsVisualizerProps
> = ({ showControls = true, showCode = true, className = '' }) => {
  const [speed, setSpeed] = useState(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ImmutableStep[]>([]);

  const playingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initialize = useCallback(() => {
    const newSteps = generateImmutableSteps();
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
    playingRef.current = false;
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      playingRef.current = true;
      const delay = Math.max(100, 2000 - speed * 19);

      timeoutRef.current = setTimeout(() => {
        if (playingRef.current) {
          setCurrentStep((prev) => prev + 1);
        }
      }, delay);
    } else if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
      playingRef.current = false;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, currentStep, steps.length, speed]);

  const handlePlayPause = () => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
    playingRef.current = !isPlaying;
  };

  const handleStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, steps.length]);

  const handleStepBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleReset = () => {
    setIsPlaying(false);
    playingRef.current = false;
    setCurrentStep(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      // Don't intercept browser shortcuts (Ctrl/Cmd + key)
      if (e.ctrlKey || e.metaKey) {
        return;
      }
      switch (e.key) {
        case 'p':
        case 'P':
          e.preventDefault();
          handlePlayPause();
          break;
        case '[':
          e.preventDefault();
          if (!isPlaying) handleStepBack();
          break;
        case ']':
          e.preventDefault();
          if (!isPlaying) handleStep();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          handleReset();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlePlayPause excluded to prevent infinite loop
  }, [handleStep, handleStepBack, isPlaying]);

  const currentStepData = steps[currentStep] || {
    operation: 'init',
    original: [],
    description: '',
  };

  const { original, derived, description, error, showDerived } =
    currentStepData;

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">
              Immutable Collections
            </h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-700 rounded flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Unmodifiable
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Thread-safe
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visualization Area */}
      <div className="p-4">
        <div className={`flex gap-4 ${showCode ? 'flex-col lg:flex-row' : ''}`}>
          {/* Main Visualization */}
          <VisualizationArea minHeight={350}>
            {/* Collections Display */}
            <div className="mb-4 space-y-4">
              {/* Original Immutable */}
              {original.length > 0 && (
                <div className="p-4 bg-violet-50 rounded-lg border-2 border-violet-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-medium text-violet-700">
                      Immutable List (List.of)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {original.map((item, idx) => (
                      <div
                        key={idx}
                        className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 font-bold transition-colors ${
                          error
                            ? 'bg-red-100 border-red-300 text-red-700 animate-pulse'
                            : 'bg-violet-100 border-violet-300 text-violet-700'
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                    {error && (
                      <div className="flex items-center text-red-600 text-sm font-medium ml-2">
                        ✗ Cannot modify!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Derived Mutable */}
              {showDerived && derived && (
                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-green-700">
                      Mutable Copy (ArrayList)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {derived.map((item, idx) => (
                      <div
                        key={idx}
                        className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 font-bold ${
                          idx === derived.length - 1 &&
                          derived.length > original.length
                            ? 'bg-green-500 border-green-600 text-white'
                            : 'bg-green-100 border-green-300 text-green-700'
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                    <div className="flex items-center text-green-600 text-sm font-medium ml-2">
                      ✓ Modifiable
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <div className="text-xs text-gray-600 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="font-medium text-violet-700">No Locks</div>
                  <div className="text-gray-500">Thread-safe by nature</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-violet-700">Compact</div>
                  <div className="text-gray-500">Optimized memory</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-violet-700">
                    Safe Sharing
                  </div>
                  <div className="text-gray-500">Pass freely</div>
                </div>
              </div>
            </div>

            {/* Status */}
            <StatusPanel
              description={description}
              currentStep={currentStep}
              totalSteps={steps.length}
              variant={
                error
                  ? 'error'
                  : currentStepData.operation === 'done'
                    ? 'success'
                    : 'default'
              }
            />
          </VisualizationArea>

          {/* Code Panel */}
          {showCode && (
            <div className="w-full lg:w-56 flex-shrink-0 space-y-2">
              <CodePanel
                code={IMMUTABLE_CODE}
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

export const ImmutableCollectionsVisualizer = React.memo(
  ImmutableCollectionsVisualizerComponent
);
export default ImmutableCollectionsVisualizer;
