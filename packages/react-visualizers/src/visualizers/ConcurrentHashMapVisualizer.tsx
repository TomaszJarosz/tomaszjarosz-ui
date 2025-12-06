import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CodePanel,
  HelpPanel,
  ControlPanel,
  Legend,
  StatusPanel,
  VisualizationArea,
} from '../shared';

interface Segment {
  id: number;
  entries: Array<{ key: string; value: number }>;
  locked: boolean;
  lockOwner?: string;
}

interface ConcurrentStep {
  operation: 'put' | 'get' | 'lock' | 'unlock' | 'init' | 'done';
  thread: string;
  key?: string;
  value?: number;
  segmentId?: number;
  segments: Segment[];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  highlightSegment?: number;
  activeThreads?: string[];
}

interface ConcurrentHashMapVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const SEGMENT_COUNT = 4;

const OPERATIONS: Array<{
  thread: string;
  op: 'put' | 'get';
  key: string;
  value?: number;
}> = [
  { thread: 'T1', op: 'put', key: 'Alice', value: 100 },
  { thread: 'T2', op: 'put', key: 'Bob', value: 200 },
  { thread: 'T1', op: 'put', key: 'Charlie', value: 150 },
  { thread: 'T3', op: 'get', key: 'Alice' },
  { thread: 'T2', op: 'put', key: 'Diana', value: 300 },
  { thread: 'T1', op: 'get', key: 'Bob' },
  { thread: 'T3', op: 'put', key: 'Eve', value: 250 },
];

const CHM_CODE = [
  '// ConcurrentHashMap (Java 8+)',
  'put(key, value):',
  '  hash = spread(key.hashCode())',
  '  segment = hash & (n-1)',
  '  synchronized(segment):',
  '    // Only this segment locked',
  '    bucket.add(key, value)',
  '',
  'get(key):',
  '  // No lock needed!',
  '  // Volatile reads ensure visibility',
  '  return bucket.get(key)',
];

const LEGEND_ITEMS = [
  { color: 'bg-blue-50', label: 'Active segment', border: '#60a5fa' },
  { color: 'bg-red-50', label: 'Locked', border: '#f87171' },
  { color: 'bg-gray-50', label: 'Unlocked', border: '#d1d5db' },
];

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

function generateConcurrentSteps(): ConcurrentStep[] {
  const steps: ConcurrentStep[] = [];
  const segments: Segment[] = Array.from({ length: SEGMENT_COUNT }, (_, i) => ({
    id: i,
    entries: [],
    locked: false,
  }));

  const _threadColors: Record<string, string> = {
    T1: 'blue',
    T2: 'green',
    T3: 'purple',
  };

  steps.push({
    operation: 'init',
    thread: '',
    segments: segments.map((s) => ({ ...s, entries: [...s.entries] })),
    description: `Initialize ConcurrentHashMap with ${SEGMENT_COUNT} segments. Each segment can be locked independently for concurrent access.`,
    codeLine: -1,
    activeThreads: [],
  });

  for (const { thread, op, key, value } of OPERATIONS) {
    const hash = simpleHash(key);
    const segmentId = hash % SEGMENT_COUNT;

    if (op === 'put') {
      // Step 1: Calculate segment
      steps.push({
        operation: 'put',
        thread,
        key,
        value,
        segmentId,
        segments: segments.map((s) => ({ ...s, entries: [...s.entries] })),
        description: `${thread}: put("${key}", ${value}) → hash=${hash}, segment=${segmentId}`,
        codeLine: 2,
        variables: { thread, key: `"${key}"`, hash, segment: segmentId },
        highlightSegment: segmentId,
        activeThreads: [thread],
      });

      // Step 2: Acquire lock
      segments[segmentId].locked = true;
      segments[segmentId].lockOwner = thread;

      steps.push({
        operation: 'lock',
        thread,
        key,
        segmentId,
        segments: segments.map((s) => ({ ...s, entries: [...s.entries] })),
        description: `${thread}: Lock segment ${segmentId} (other segments remain accessible!)`,
        codeLine: 4,
        variables: { thread, segment: segmentId, locked: 'true' },
        highlightSegment: segmentId,
        activeThreads: [thread],
      });

      // Step 3: Insert
      const existingIdx = segments[segmentId].entries.findIndex(
        (e) => e.key === key
      );
      if (existingIdx >= 0) {
        segments[segmentId].entries[existingIdx].value = value ?? 0;
      } else {
        segments[segmentId].entries.push({ key, value: value ?? 0 });
      }

      steps.push({
        operation: 'put',
        thread,
        key,
        value,
        segmentId,
        segments: segments.map((s) => ({ ...s, entries: [...s.entries] })),
        description: `${thread}: Insert ("${key}", ${value}) into segment ${segmentId}`,
        codeLine: 6,
        variables: { thread, key: `"${key}"`, value: value ?? 0 },
        highlightSegment: segmentId,
        activeThreads: [thread],
      });

      // Step 4: Release lock
      segments[segmentId].locked = false;
      segments[segmentId].lockOwner = undefined;

      steps.push({
        operation: 'unlock',
        thread,
        segmentId,
        segments: segments.map((s) => ({ ...s, entries: [...s.entries] })),
        description: `${thread}: Unlock segment ${segmentId}`,
        codeLine: 4,
        variables: { thread, segment: segmentId, locked: 'false' },
        highlightSegment: segmentId,
        activeThreads: [thread],
      });
    } else {
      // GET operation - no lock needed!
      const entry = segments[segmentId].entries.find((e) => e.key === key);

      steps.push({
        operation: 'get',
        thread,
        key,
        value: entry?.value,
        segmentId,
        segments: segments.map((s) => ({ ...s, entries: [...s.entries] })),
        description: `${thread}: get("${key}") → segment ${segmentId}, NO LOCK needed! Returns: ${entry?.value ?? 'null'}`,
        codeLine: 9,
        variables: { thread, key: `"${key}"`, result: entry?.value ?? 'null' },
        highlightSegment: segmentId,
        activeThreads: [thread],
      });
    }
  }

  const totalEntries = segments.reduce((sum, s) => sum + s.entries.length, 0);
  steps.push({
    operation: 'done',
    thread: '',
    segments: segments.map((s) => ({ ...s, entries: [...s.entries] })),
    description: `✓ Done! ConcurrentHashMap: ${totalEntries} entries across ${SEGMENT_COUNT} segments. Lock-free reads, segment-level write locks.`,
    codeLine: -1,
    variables: { entries: totalEntries, segments: SEGMENT_COUNT },
    activeThreads: [],
  });

  return steps;
}

const ConcurrentHashMapVisualizerComponent: React.FC<
  ConcurrentHashMapVisualizerProps
> = ({ showControls = true, showCode = true, className = '' }) => {
  const [speed, setSpeed] = useState(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<ConcurrentStep[]>([]);

  const playingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initialize = useCallback(() => {
    const newSteps = generateConcurrentSteps();
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

  const handlePlayPause = useCallback(() => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
    playingRef.current = !isPlaying;
  }, [currentStep, steps.length, isPlaying]);

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
  }, [handleStep, handleStepBack, handlePlayPause, isPlaying]);

  const currentStepData = steps[currentStep] || {
    operation: 'init',
    thread: '',
    segments: [],
    description: '',
  };

  const { segments, highlightSegment, description, activeThreads } =
    currentStepData;

  const getSegmentStyle = (seg: Segment, idx: number): string => {
    if (idx === highlightSegment) {
      if (seg.locked) {
        return 'border-red-400 bg-red-50';
      }
      return 'border-blue-400 bg-blue-50';
    }
    if (seg.locked) {
      return 'border-orange-300 bg-orange-50';
    }
    return 'border-gray-200 bg-gray-50';
  };

  const getThreadColor = (thread: string): string => {
    const colors: Record<string, string> = {
      T1: 'bg-blue-500',
      T2: 'bg-green-500',
      T3: 'bg-purple-500',
    };
    return colors[thread] || 'bg-gray-500';
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">ConcurrentHashMap</h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                Segment Locks
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                Lock-free Reads
              </span>
            </div>
          </div>
          {/* Active Threads */}
          <div className="flex items-center gap-2">
            {['T1', 'T2', 'T3'].map((t) => (
              <div
                key={t}
                className={`px-2 py-0.5 text-xs font-medium rounded transition-opacity ${getThreadColor(t)} text-white ${
                  activeThreads?.includes(t) ? 'opacity-100' : 'opacity-30'
                }`}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visualization Area */}
      <div className="p-4">
        <div className={`flex gap-4 ${showCode ? 'flex-col lg:flex-row' : ''}`}>
          {/* Main Visualization */}
          <VisualizationArea minHeight={350}>
            {/* ConcurrentHashMap vs synchronized - Prominent */}
            <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-2 border-red-200">
              <div className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                <span className="text-lg">⚡</span> Why ConcurrentHashMap?
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-red-100 p-2 rounded-lg border border-red-300">
                  <div className="font-bold text-red-700">synchronized HashMap</div>
                  <div className="text-red-600">❌ Single lock for entire map</div>
                  <div className="text-[10px] text-red-500">All threads wait for one lock</div>
                </div>
                <div className="bg-green-100 p-2 rounded-lg border border-green-300">
                  <div className="font-bold text-green-700">ConcurrentHashMap</div>
                  <div className="text-green-600">✓ Segment-level locking</div>
                  <div className="text-[10px] text-green-500">Threads work in parallel on different segments</div>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-gray-600 text-center">
                get() never blocks • put() only locks one segment • Much better concurrency!
              </div>
            </div>

            {/* Segments */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Segments (independent locks)
              </div>
              <div className="grid grid-cols-2 gap-3">
                {segments.map((seg, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border-2 p-3 transition-colors ${getSegmentStyle(seg, idx)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">
                        Segment {idx}
                      </span>
                      {seg.locked && (
                        <span className="flex items-center gap-1 text-[10px] text-red-600 font-medium">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          Locked by {seg.lockOwner}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {seg.entries.length > 0 ? (
                        seg.entries.map((entry, eIdx) => (
                          <div
                            key={eIdx}
                            className="flex justify-between px-2 py-1 bg-white rounded text-xs border border-gray-200"
                          >
                            <span className="text-gray-700">{entry.key}</span>
                            <span className="text-gray-500">{entry.value}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-gray-400 text-center py-2">
                          Empty
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Concurrency Info */}
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <div className="text-xs text-gray-600">
                <span className="font-medium">Key insight:</span> Multiple
                threads can write to different segments simultaneously. Reads
                never block!
              </div>
            </div>

            {/* Status */}
            <StatusPanel
              description={description}
              currentStep={currentStep}
              totalSteps={steps.length}
              variant={currentStepData.operation === 'done' ? 'success' : 'default'}
            />
          </VisualizationArea>

          {/* Code Panel */}
          {showCode && (
            <div className="w-full lg:w-56 flex-shrink-0 space-y-2">
              <CodePanel
                code={CHM_CODE}
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
            accentColor="red"
          />
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
};

export const ConcurrentHashMapVisualizer = React.memo(
  ConcurrentHashMapVisualizerComponent
);
export default ConcurrentHashMapVisualizer;
