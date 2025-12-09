import React, { useMemo, useState, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';

interface HeapObject {
  id: string;
  size: number;
  age: number;
  reachable: boolean;
  generation: 'eden' | 'survivor0' | 'survivor1' | 'old';
}

interface GCStep {
  operation:
    | 'init'
    | 'allocate'
    | 'mark'
    | 'sweep'
    | 'promote'
    | 'minor_gc'
    | 'major_gc'
    | 'done';
  objects: HeapObject[];
  eden: string[];
  survivor0: string[];
  survivor1: string[];
  old: string[];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  highlightObjects?: string[];
  gcType?: 'minor' | 'major';
  activeSurvivor?: 0 | 1;
}

interface GCVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const GC_CODE = [
  '// JVM Generational GC',
  '',
  '// 1. Object Allocation',
  'Object obj = new Object(); // Eden',
  '',
  '// 2. Minor GC (Young Gen)',
  'for (obj in eden + survivor_from) {',
  '  if (isReachable(obj)) {',
  '    if (obj.age >= threshold) {',
  '      promote(obj, oldGen);',
  '    } else {',
  '      copy(obj, survivor_to);',
  '      obj.age++;',
  '    }',
  '  }',
  '}',
  '',
  '// 3. Major GC (Old Gen)',
  'mark(); // Mark reachable objects',
  'sweep(); // Free unreachable',
];

const LEGEND_ITEMS = [
  { color: 'bg-green-400', label: 'Reachable' },
  { color: 'bg-red-400', label: 'Unreachable (garbage)' },
  { color: 'bg-yellow-400', label: 'Being collected' },
  { color: 'bg-blue-400', label: 'Promoted' },
];

const BADGES = [
  { label: 'Generational GC', variant: 'purple' as const },
];

const PROMOTION_THRESHOLD = 3;

function generateGCSteps(): GCStep[] {
  const steps: GCStep[] = [];
  let objects: HeapObject[] = [];
  let eden: string[] = [];
  let survivor0: string[] = [];
  let survivor1: string[] = [];
  let old: string[] = [];
  let objCounter = 0;
  let activeSurvivor: 0 | 1 = 0;

  const createObject = (reachable: boolean): HeapObject => ({
    id: `obj${++objCounter}`,
    size: Math.floor(Math.random() * 3) + 1,
    age: 0,
    reachable,
    generation: 'eden',
  });

  // Initial state
  steps.push({
    operation: 'init',
    objects: [],
    eden: [],
    survivor0: [],
    survivor1: [],
    old: [],
    description: 'JVM Heap initialized. Young Gen: Eden + 2 Survivor spaces. Old Gen for long-lived objects.',
    codeLine: 0,
    activeSurvivor: 0,
  });

  // Allocate objects in Eden
  for (let i = 0; i < 5; i++) {
    const obj = createObject(i % 2 === 0 || i === 1); // Some reachable, some not
    objects.push(obj);
    eden.push(obj.id);

    steps.push({
      operation: 'allocate',
      objects: objects.map((o) => ({ ...o })),
      eden: [...eden],
      survivor0: [...survivor0],
      survivor1: [...survivor1],
      old: [...old],
      description: `Allocate ${obj.id} in Eden (size: ${obj.size}KB). ${obj.reachable ? 'Referenced' : 'No references'}.`,
      codeLine: 3,
      variables: { allocated: obj.id, edenUsed: eden.length },
      highlightObjects: [obj.id],
      activeSurvivor,
    });
  }

  // Minor GC #1
  steps.push({
    operation: 'minor_gc',
    objects: objects.map((o) => ({ ...o })),
    eden: [...eden],
    survivor0: [...survivor0],
    survivor1: [...survivor1],
    old: [...old],
    description: 'Eden full! Triggering Minor GC (Young Generation collection).',
    codeLine: 5,
    gcType: 'minor',
    activeSurvivor,
  });

  // Mark phase
  const reachableInYoung = objects.filter(
    (o) => o.reachable && (eden.includes(o.id) || survivor0.includes(o.id) || survivor1.includes(o.id))
  );

  steps.push({
    operation: 'mark',
    objects: objects.map((o) => ({ ...o })),
    eden: [...eden],
    survivor0: [...survivor0],
    survivor1: [...survivor1],
    old: [...old],
    description: `Mark phase: Found ${reachableInYoung.length} reachable objects in Young Gen.`,
    codeLine: 7,
    highlightObjects: reachableInYoung.map((o) => o.id),
    activeSurvivor,
  });

  // Move survivors to survivor space
  const targetSurvivor = activeSurvivor === 0 ? survivor1 : survivor0;
  const targetKey = activeSurvivor === 0 ? 'survivor1' : 'survivor0';

  for (const obj of reachableInYoung) {
    obj.age++;
    obj.generation = targetKey as 'survivor0' | 'survivor1';
    targetSurvivor.push(obj.id);
  }

  // Clear eden and source survivor
  const garbage = objects.filter(
    (o) => !o.reachable && (eden.includes(o.id) || survivor0.includes(o.id) || survivor1.includes(o.id))
  );
  objects = objects.filter((o) => o.reachable || old.includes(o.id));
  eden = [];
  if (activeSurvivor === 0) {
    survivor0 = [];
  } else {
    survivor1 = [];
  }

  steps.push({
    operation: 'sweep',
    objects: objects.map((o) => ({ ...o })),
    eden: [...eden],
    survivor0: [...survivor0],
    survivor1: [...survivor1],
    old: [...old],
    description: `Copy ${reachableInYoung.length} survivors to S${activeSurvivor === 0 ? 1 : 0}. Freed ${garbage.length} objects. Eden cleared.`,
    codeLine: 11,
    variables: { survivors: reachableInYoung.length, freed: garbage.length },
    highlightObjects: reachableInYoung.map((o) => o.id),
    activeSurvivor: activeSurvivor === 0 ? 1 : 0,
  });

  activeSurvivor = activeSurvivor === 0 ? 1 : 0;

  // More allocations
  for (let i = 0; i < 4; i++) {
    const obj = createObject(i < 2);
    objects.push(obj);
    eden.push(obj.id);
  }

  steps.push({
    operation: 'allocate',
    objects: objects.map((o) => ({ ...o })),
    eden: [...eden],
    survivor0: [...survivor0],
    survivor1: [...survivor1],
    old: [...old],
    description: `Allocated 4 more objects in Eden. Preparing for next Minor GC.`,
    codeLine: 3,
    variables: { edenUsed: eden.length },
    activeSurvivor,
  });

  // Minor GC #2+ - simulate multiple cycles to show promotion
  for (let gc = 0; gc < 4; gc++) {
    steps.push({
      operation: 'minor_gc',
      objects: objects.map((o) => ({ ...o })),
      eden: [...eden],
      survivor0: [...survivor0],
      survivor1: [...survivor1],
      old: [...old],
      description: `Minor GC #${gc + 2}: Collecting Young Generation.`,
      codeLine: 5,
      gcType: 'minor',
      activeSurvivor,
    });

    const allYoung = [...eden, ...(activeSurvivor === 0 ? survivor0 : survivor1)];
    const reachable = objects.filter((o) => o.reachable && allYoung.includes(o.id));
    const toPromote = reachable.filter((o) => o.age >= PROMOTION_THRESHOLD);
    const toSurvivor = reachable.filter((o) => o.age < PROMOTION_THRESHOLD);

    // Promote old objects
    for (const obj of toPromote) {
      obj.generation = 'old';
      old.push(obj.id);
    }

    if (toPromote.length > 0) {
      steps.push({
        operation: 'promote',
        objects: objects.map((o) => ({ ...o })),
        eden: [...eden],
        survivor0: [...survivor0],
        survivor1: [...survivor1],
        old: [...old],
        description: `Promoted ${toPromote.length} objects to Old Gen (age >= ${PROMOTION_THRESHOLD}).`,
        codeLine: 9,
        variables: { promoted: toPromote.length, threshold: PROMOTION_THRESHOLD },
        highlightObjects: toPromote.map((o) => o.id),
        activeSurvivor,
      });
    }

    // Move survivors
    const targetSurv = activeSurvivor === 0 ? survivor1 : survivor0;
    for (const obj of toSurvivor) {
      obj.age++;
      obj.generation = (activeSurvivor === 0 ? 'survivor1' : 'survivor0') as 'survivor0' | 'survivor1';
      if (!targetSurv.includes(obj.id)) {
        targetSurv.push(obj.id);
      }
    }

    // Clear
    const freedCount = allYoung.length - reachable.length;
    objects = objects.filter((o) => o.reachable || !allYoung.includes(o.id));
    eden = [];
    if (activeSurvivor === 0) {
      survivor0 = [];
    } else {
      survivor1 = [];
    }

    steps.push({
      operation: 'sweep',
      objects: objects.map((o) => ({ ...o })),
      eden: [...eden],
      survivor0: [...survivor0],
      survivor1: [...survivor1],
      old: [...old],
      description: `Minor GC complete. Freed ${freedCount} objects. Survivors: ${toSurvivor.length}.`,
      codeLine: 15,
      variables: { freed: freedCount, survivors: toSurvivor.length },
      activeSurvivor: activeSurvivor === 0 ? 1 : 0,
    });

    activeSurvivor = activeSurvivor === 0 ? 1 : 0;

    // Allocate more objects between GC cycles
    if (gc < 3) {
      const newObjs: HeapObject[] = [];
      for (let i = 0; i < 3; i++) {
        const obj = createObject(gc < 2 ? true : i === 0); // Mix of reachable/unreachable
        objects.push(obj);
        eden.push(obj.id);
        newObjs.push(obj);
      }

      steps.push({
        operation: 'allocate',
        objects: objects.map((o) => ({ ...o })),
        eden: [...eden],
        survivor0: [...survivor0],
        survivor1: [...survivor1],
        old: [...old],
        description: `Allocated ${newObjs.length} new objects in Eden.`,
        codeLine: 3,
        variables: { edenUsed: eden.length },
        highlightObjects: newObjs.map((o) => o.id),
        activeSurvivor,
      });
    }
  }

  // Major GC
  // Make some old gen objects unreachable
  const oldObjs = objects.filter((o) => old.includes(o.id));
  if (oldObjs.length > 0) {
    oldObjs[0].reachable = false;
  }

  steps.push({
    operation: 'major_gc',
    objects: objects.map((o) => ({ ...o })),
    eden: [...eden],
    survivor0: [...survivor0],
    survivor1: [...survivor1],
    old: [...old],
    description: 'Old Gen filling up! Triggering Major GC (Full GC).',
    codeLine: 17,
    gcType: 'major',
    activeSurvivor,
  });

  // Mark
  const reachableOld = objects.filter((o) => o.reachable && old.includes(o.id));
  const unreachableOld = objects.filter((o) => !o.reachable && old.includes(o.id));

  steps.push({
    operation: 'mark',
    objects: objects.map((o) => ({ ...o })),
    eden: [...eden],
    survivor0: [...survivor0],
    survivor1: [...survivor1],
    old: [...old],
    description: `Major GC Mark: ${reachableOld.length} reachable, ${unreachableOld.length} unreachable in Old Gen.`,
    codeLine: 18,
    highlightObjects: [...reachableOld.map((o) => o.id), ...unreachableOld.map((o) => o.id)],
    activeSurvivor,
  });

  // Sweep old gen
  objects = objects.filter((o) => o.reachable || !old.includes(o.id));
  old = old.filter((id) => objects.find((o) => o.id === id && o.reachable));

  steps.push({
    operation: 'sweep',
    objects: objects.map((o) => ({ ...o })),
    eden: [...eden],
    survivor0: [...survivor0],
    survivor1: [...survivor1],
    old: [...old],
    description: `Major GC Sweep: Freed ${unreachableOld.length} objects from Old Gen.`,
    codeLine: 19,
    variables: { freed: unreachableOld.length, remaining: old.length },
    activeSurvivor,
  });

  // Final state
  const totalObjects = objects.length;
  steps.push({
    operation: 'done',
    objects: objects.map((o) => ({ ...o })),
    eden: [...eden],
    survivor0: [...survivor0],
    survivor1: [...survivor1],
    old: [...old],
    description: `GC Demo complete! ${totalObjects} live objects. Young Gen uses copy collector, Old Gen uses mark-sweep.`,
    codeLine: -1,
    variables: { total: totalObjects, eden: eden.length, survivors: survivor0.length + survivor1.length, old: old.length },
    activeSurvivor,
  });

  return steps;
}

const GCVisualizerComponent: React.FC<GCVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'gc-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'gc', scrollToId: VISUALIZER_ID });

  const [showDetails, setShowDetails] = useState(true);
  const generateSteps = useMemo(() => generateGCSteps, []);

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
  } = useVisualizerPlayback<GCStep>({
    generateSteps,
  });

  const stepData = currentStepData || {
    operation: 'init' as const,
    objects: [],
    eden: [],
    survivor0: [],
    survivor1: [],
    old: [],
    description: '',
  };

  const { objects, eden, survivor0, survivor1, old, highlightObjects, description, gcType, activeSurvivor } =
    stepData;

  const toggleDetails = useCallback(() => {
    setShowDetails((prev) => !prev);
  }, []);

  const getObjectStyle = (obj: HeapObject): string => {
    const isHighlighted = highlightObjects?.includes(obj.id);

    if (isHighlighted && stepData.operation === 'promote') {
      return 'bg-blue-400 text-white ring-2 ring-blue-300';
    }
    if (isHighlighted && !obj.reachable) {
      return 'bg-red-400 text-white ring-2 ring-red-300';
    }
    if (isHighlighted) {
      return 'bg-yellow-400 text-gray-900 ring-2 ring-yellow-300';
    }
    if (!obj.reachable) {
      return 'bg-red-300 text-red-800';
    }
    return 'bg-green-400 text-white';
  };

  const renderGeneration = (
    name: string,
    ids: string[],
    color: string,
    capacity: number
  ) => {
    const genObjects = objects.filter((o) => ids.includes(o.id));
    const fillPercent = Math.min((ids.length / capacity) * 100, 100);

    return (
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">{name}</span>
          <span className="text-[10px] text-gray-500">
            {ids.length}/{capacity}
          </span>
        </div>
        <div className={`h-12 ${color} rounded border border-gray-300 relative overflow-hidden`}>
          <div
            className="absolute inset-y-0 left-0 bg-opacity-30 bg-gray-500 transition-[width] duration-300"
            style={{ width: `${fillPercent}%` }}
          />
          <div className="absolute inset-0 flex flex-wrap items-center gap-1 p-1">
            {genObjects.map((obj) => (
              <div
                key={obj.id}
                className={`px-1.5 py-0.5 text-[9px] font-medium rounded transition-colors duration-200 ${getObjectStyle(obj)}`}
                title={`${obj.id} (age: ${obj.age}, ${obj.reachable ? 'reachable' : 'garbage'})`}
              >
                {obj.id.replace('obj', '')}
                {showDetails && <span className="opacity-70">:{obj.age}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getStatusVariant = () => {
    if (gcType === 'major') return 'error' as const;
    if (gcType === 'minor') return 'warning' as const;
    if (stepData.operation === 'done') return 'success' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  const dynamicBadges = gcType
    ? [...BADGES, { label: gcType === 'major' ? 'Major GC' : 'Minor GC', variant: gcType === 'major' ? 'red' as const : 'orange' as const }]
    : BADGES;

  const headerExtra = (
    <button
      onClick={toggleDetails}
      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
        showDetails
          ? 'bg-purple-500 text-white'
          : 'bg-gray-200 text-gray-700'
      }`}
    >
      {showDetails ? 'Hide Ages' : 'Show Ages'}
    </button>
  );

  const visualization = (
    <>
      {/* Generational Hypothesis - Prominent */}
      <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
        <div className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
          <span className="text-lg">🧬</span> Generational Hypothesis
        </div>
        <div className="font-mono text-sm bg-white rounded-lg p-3 border border-purple-200">
          <div className="text-center text-purple-700 font-bold mb-2">
            &quot;Most objects die young&quot;
          </div>
          <div className="text-xs text-gray-500 text-center">
            ~95% of objects become garbage before first GC • Optimize for the common case
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-blue-100 p-2 rounded-lg border border-blue-300 text-center">
            <div className="font-bold text-blue-700">Young Gen</div>
            <div className="text-blue-600">Fast copy collection</div>
            <div className="text-[10px] text-blue-500">Minor GC (frequent)</div>
          </div>
          <div className="bg-amber-100 p-2 rounded-lg border border-amber-300 text-center">
            <div className="font-bold text-amber-700">Old Gen</div>
            <div className="text-amber-600">Mark-sweep collection</div>
            <div className="text-[10px] text-amber-500">Major GC (rare, slow)</div>
          </div>
        </div>
      </div>

      {/* Heap Layout */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">
          JVM Heap Memory
        </div>

        {/* Young Generation */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-xs font-semibold text-blue-700 mb-2">
            Young Generation
          </div>
          {renderGeneration('Eden Space', eden, 'bg-blue-100', 8)}
          <div className="grid grid-cols-2 gap-2">
            <div className={activeSurvivor === 0 ? 'ring-2 ring-blue-400 rounded' : ''}>
              {renderGeneration('Survivor 0 (From)', survivor0, 'bg-cyan-100', 4)}
            </div>
            <div className={activeSurvivor === 1 ? 'ring-2 ring-blue-400 rounded' : ''}>
              {renderGeneration('Survivor 1 (To)', survivor1, 'bg-cyan-100', 4)}
            </div>
          </div>
        </div>

        {/* Old Generation */}
        <div className="p-3 bg-amber-50 rounded-lg">
          <div className="text-xs font-semibold text-amber-700 mb-2">
            Old Generation (Tenured)
          </div>
          {renderGeneration('Old Space', old, 'bg-amber-100', 12)}
        </div>
      </div>

      {/* GC Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-700 grid grid-cols-2 gap-2">
          <div>
            <span className="font-semibold">Minor GC:</span> Collects Young Gen
          </div>
          <div>
            <span className="font-semibold">Major GC:</span> Collects Old Gen
          </div>
          <div>
            <span className="font-semibold">Promotion:</span> age {'>='} {PROMOTION_THRESHOLD}
          </div>
          <div>
            <span className="font-semibold">Algorithm:</span> Copy + Mark-Sweep
          </div>
        </div>
      </div>
    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="JVM Garbage Collection"
      badges={dynamicBadges}
      gradient="purple"
      className={className}
      minHeight={400}
      onShare={handleShare}
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
        accentColor: 'purple',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? GC_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const GCVisualizer = React.memo(GCVisualizerComponent);
export default GCVisualizer;
