import React, { useState, useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  InterviewModePanel,
  useUrlState,
  useVisualizerPlayback,
  useInterviewMode,
} from '../shared';
import type { InterviewQuestion } from '../shared';

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

interface GCInterviewVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
  shuffleQuestions?: boolean;
  onComplete?: (session: ReturnType<typeof useInterviewMode>['session']) => void;
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

const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'gc-1',
    question: 'What is the "Generational Hypothesis" that JVM GC is based on?',
    options: [
      'Most objects die young (weak generational hypothesis)',
      'Old objects reference new objects more than vice versa',
      'All objects have the same lifetime',
      'Objects should be allocated in Old Gen first',
    ],
    correctAnswer: 0,
    explanation: 'The Generational Hypothesis states that most objects die young (~95% become garbage before the first GC). JVM divides heap into Young Gen (Eden + Survivors) and Old Gen to optimize for this pattern.',
    hint: 'Think about typical object lifetimes in applications.',
    difficulty: 'easy',
    topic: 'Fundamentals',
  },
  {
    id: 'gc-2',
    question: 'What algorithm does Young Generation use in HotSpot JVM?',
    options: [
      'Mark-Sweep',
      'Mark-Compact',
      'Copying (Copy Collection)',
      'Reference Counting',
    ],
    correctAnswer: 2,
    explanation: 'Young Gen uses Copying collection: live objects are copied from Eden + Survivor(from) to Survivor(to). This is fast because most objects are dead, so copying only live objects is efficient.',
    hint: 'Consider the tradeoff when most objects are garbage.',
    difficulty: 'medium',
    topic: 'Algorithms',
  },
  {
    id: 'gc-3',
    question: 'When does an object get promoted to Old Generation?',
    options: [
      'When it survives one Minor GC',
      'When it survives a threshold number of Minor GCs (default 15)',
      'When Old Gen has free space',
      'During Major GC only',
    ],
    correctAnswer: 1,
    explanation: 'Objects are promoted when their age (number of GC cycles survived) reaches MaxTenuringThreshold (default 15 in most JVMs). The age is stored in the object header.',
    hint: 'Look at the "age" counter in objects.',
    difficulty: 'medium',
    topic: 'Promotion',
  },
  {
    id: 'gc-4',
    question: 'What triggers a Minor GC?',
    options: [
      'When Old Gen is full',
      'When Eden space is full',
      'When total heap reaches 80%',
      'On a fixed time interval',
    ],
    correctAnswer: 1,
    explanation: 'Minor GC is triggered when Eden space fills up. It collects Young Generation only (Eden + Survivors). Minor GCs are frequent but fast (typically <100ms).',
    hint: 'Where are new objects allocated?',
    difficulty: 'easy',
    topic: 'Triggers',
  },
  {
    id: 'gc-5',
    question: 'Why are there two Survivor spaces (S0 and S1)?',
    options: [
      'For redundancy in case one fails',
      'To implement copying collection without fragmentation',
      'One for minor GC, one for major GC',
      'To double the survivor capacity',
    ],
    correctAnswer: 1,
    explanation: 'Two survivors enable copying collection: objects are always copied from (Eden + Survivor-from) to Survivor-to. After GC, the roles swap. This eliminates fragmentation and keeps survivors compact.',
    hint: 'Think about how copying collection works.',
    difficulty: 'medium',
    topic: 'Memory Layout',
  },
  {
    id: 'gc-6',
    question: 'What is a "Stop-The-World" (STW) pause?',
    options: [
      'When the JVM crashes',
      'When all application threads are paused for GC',
      'When network I/O blocks',
      'When heap runs out of memory',
    ],
    correctAnswer: 1,
    explanation: 'STW pause occurs when all application threads are stopped to allow GC to safely collect garbage. Both Minor and Major GCs have STW phases, though Major GC pauses are typically longer.',
    hint: 'GC needs exclusive access to safely modify memory.',
    difficulty: 'easy',
    topic: 'Performance',
  },
  {
    id: 'gc-7',
    question: 'Which GC collector is best for low-latency applications?',
    options: [
      'Serial GC',
      'Parallel GC',
      'G1 GC or ZGC',
      'CMS (deprecated)',
    ],
    correctAnswer: 2,
    explanation: 'G1 GC (default since Java 9) and ZGC (since Java 11) are designed for low latency. ZGC can achieve <10ms pauses even with TB-sized heaps. G1 targets predictable pause times.',
    hint: 'Modern collectors focus on pause time control.',
    difficulty: 'medium',
    topic: 'Collectors',
  },
  {
    id: 'gc-8',
    question: 'What is the default heap ratio for Young:Old generation?',
    options: [
      '1:1',
      '1:2 (NewRatio=2)',
      '1:4',
      '1:8',
    ],
    correctAnswer: 1,
    explanation: 'Default NewRatio=2 means Old Gen is twice the size of Young Gen (1:2 ratio). This can be tuned with -XX:NewRatio. Young Gen is further divided: Eden:S0:S1 = 8:1:1 by default.',
    hint: 'Check the -XX:NewRatio default value.',
    difficulty: 'hard',
    topic: 'Configuration',
  },
  {
    id: 'gc-9',
    question: 'What happens during the "Mark" phase of Major GC?',
    options: [
      'Objects are moved to a new location',
      'Unreachable objects are freed',
      'Reachable objects are identified by traversing from GC roots',
      'Object headers are updated with new addresses',
    ],
    correctAnswer: 2,
    explanation: 'Mark phase traverses the object graph starting from GC roots (stack frames, static fields, JNI references) and marks all reachable objects. Unmarked objects are garbage.',
    hint: 'How do you determine if an object is still in use?',
    difficulty: 'medium',
    topic: 'Mark-Sweep',
  },
  {
    id: 'gc-10',
    question: 'What are GC Roots in Java?',
    options: [
      'Objects in Old Generation',
      'The largest objects in heap',
      'Stack variables, static fields, JNI references, thread objects',
      'Objects that reference other objects',
    ],
    correctAnswer: 2,
    explanation: 'GC Roots are entry points for reachability analysis: local variables on thread stacks, static fields, JNI global references, active thread objects, and class loaders. Objects reachable from roots are live.',
    hint: 'What keeps an object from being garbage collected?',
    difficulty: 'medium',
    topic: 'Fundamentals',
  },
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

  for (let i = 0; i < 5; i++) {
    const obj = createObject(i % 2 === 0 || i === 1);
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

  const targetSurvivor = activeSurvivor === 0 ? survivor1 : survivor0;
  const targetKey = activeSurvivor === 0 ? 'survivor1' : 'survivor0';

  for (const obj of reachableInYoung) {
    obj.age++;
    obj.generation = targetKey as 'survivor0' | 'survivor1';
    targetSurvivor.push(obj.id);
  }

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
    description: `Copy ${reachableInYoung.length} survivors to S${activeSurvivor === 0 ? 1 : 0}. Freed ${garbage.length} objects.`,
    codeLine: 11,
    variables: { survivors: reachableInYoung.length, freed: garbage.length },
    highlightObjects: reachableInYoung.map((o) => o.id),
    activeSurvivor: activeSurvivor === 0 ? 1 : 0,
  });

  activeSurvivor = activeSurvivor === 0 ? 1 : 0;

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
    description: `Allocated 4 more objects in Eden.`,
    codeLine: 3,
    variables: { edenUsed: eden.length },
    activeSurvivor,
  });

  for (let gc = 0; gc < 3; gc++) {
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

    const targetSurv = activeSurvivor === 0 ? survivor1 : survivor0;
    for (const obj of toSurvivor) {
      obj.age++;
      obj.generation = (activeSurvivor === 0 ? 'survivor1' : 'survivor0') as 'survivor0' | 'survivor1';
      if (!targetSurv.includes(obj.id)) {
        targetSurv.push(obj.id);
      }
    }

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
      description: `Minor GC complete. Freed ${freedCount} objects.`,
      codeLine: 15,
      variables: { freed: freedCount, survivors: toSurvivor.length },
      activeSurvivor: activeSurvivor === 0 ? 1 : 0,
    });

    activeSurvivor = activeSurvivor === 0 ? 1 : 0;

    if (gc < 2) {
      const newObjs: HeapObject[] = [];
      for (let i = 0; i < 3; i++) {
        const obj = createObject(gc < 1 ? true : i === 0);
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

  const totalObjects = objects.length;
  steps.push({
    operation: 'done',
    objects: objects.map((o) => ({ ...o })),
    eden: [...eden],
    survivor0: [...survivor0],
    survivor1: [...survivor1],
    old: [...old],
    description: `GC Demo complete! ${totalObjects} live objects.`,
    codeLine: -1,
    variables: { total: totalObjects, eden: eden.length, old: old.length },
    activeSurvivor,
  });

  return steps;
}

const GCInterviewVisualizerComponent: React.FC<GCInterviewVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
  shuffleQuestions = false,
  onComplete,
}) => {
  const VISUALIZER_ID = 'gc-interview-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'gc-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');
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

  const interview = useInterviewMode({
    questions: INTERVIEW_QUESTIONS,
    shuffleQuestions,
    onComplete,
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

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

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
                <span className="opacity-70">:{obj.age}</span>
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

  const headerExtra = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setMode('visualize')}
        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
          mode === 'visualize'
            ? 'bg-purple-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Visualize
      </button>
      <button
        onClick={() => setMode('interview')}
        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
          mode === 'interview'
            ? 'bg-purple-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Interview ({interview.session.results.length}/{INTERVIEW_QUESTIONS.length})
      </button>
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
      accentColor="purple"
    />
  ) : (
    <>
      {/* Generational Hypothesis */}
      <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
        <div className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
          <span className="text-lg">🧬</span> Generational Hypothesis
        </div>
        <div className="font-mono text-sm bg-white rounded-lg p-3 border border-purple-200">
          <div className="text-center text-purple-700 font-bold mb-2">
            &quot;Most objects die young&quot;
          </div>
          <div className="text-xs text-gray-500 text-center">
            ~95% of objects become garbage before first GC
          </div>
        </div>
      </div>

      {/* Heap Layout */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">
          JVM Heap Memory
        </div>

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

  const dynamicBadges = mode === 'interview'
    ? [{ label: 'Interview Mode', variant: 'purple' as const }]
    : gcType
      ? [...BADGES, { label: gcType === 'major' ? 'Major GC' : 'Minor GC', variant: gcType === 'major' ? 'orange' as const : 'orange' as const }]
      : BADGES;

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
        accentColor: 'purple',
      } : undefined}
      showControls={showControls && mode === 'visualize'}
      legendItems={mode === 'visualize' ? LEGEND_ITEMS : undefined}
      code={showCode && mode === 'visualize' ? GC_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode && mode === 'visualize'}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const GCInterviewVisualizer = React.memo(GCInterviewVisualizerComponent);
export default GCInterviewVisualizer;
