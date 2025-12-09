import React, { useState, useMemo, useCallback } from 'react';
import {
  ControlPanel,
  Legend,
  StatusPanel,
  ShareButton,
  useUrlState,
  useVisualizerPlayback,
  VisualizationArea,
} from '../shared';
import { InterviewModePanel } from '../shared/InterviewModePanel';
import { useInterviewMode, type InterviewQuestion } from '../shared/useInterviewMode';

interface VirtualNode {
  id: string;
  serverId: string;
  position: number;
  virtualIndex: number;
}

interface DataKey {
  key: string;
  position: number;
  assignedServer?: string;
}

interface ConsistentHashingStep {
  operation: 'init' | 'addServer' | 'addKey' | 'removeServer' | 'done';
  servers: string[];
  virtualNodes: VirtualNode[];
  dataKeys: DataKey[];
  description: string;
  highlightServer?: string;
  highlightKey?: string;
  movingKeys?: string[];
}

interface ConsistentHashingInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const LEGEND_ITEMS = [
  { color: 'bg-blue-500', label: 'Server A' },
  { color: 'bg-green-500', label: 'Server B' },
  { color: 'bg-purple-500', label: 'Server C' },
  { color: 'bg-yellow-400', label: 'Data key' },
  { color: 'bg-red-400', label: 'Moving' },
];

// Interview questions about Consistent Hashing
const CONSISTENT_HASHING_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'ch-1',
    question: 'What problem does consistent hashing solve compared to regular modular hashing?',
    options: [
      'It provides faster lookup times',
      'It minimizes key redistribution when nodes are added/removed',
      'It uses less memory',
      'It provides better hash distribution',
    ],
    correctAnswer: 1,
    explanation: 'With regular hash (key % N), adding/removing a server requires remapping almost all keys. Consistent hashing only remaps K/N keys on average (K=total keys, N=servers), providing minimal disruption.',
    difficulty: 'medium',
    topic: 'Core Concept',
  },
  {
    id: 'ch-2',
    question: 'What is the purpose of virtual nodes in consistent hashing?',
    options: [
      'To reduce memory usage',
      'To improve hash function quality',
      'To achieve better load distribution across servers',
      'To speed up key lookup',
    ],
    correctAnswer: 2,
    explanation: 'Without virtual nodes, servers may handle uneven portions of the ring. Virtual nodes place multiple points per server on the ring, improving load distribution and reducing variance.',
    hint: 'Think about what happens when servers are placed randomly on a ring.',
    difficulty: 'medium',
    topic: 'Virtual Nodes',
  },
  {
    id: 'ch-3',
    question: 'How is a key assigned to a server in consistent hashing?',
    options: [
      'Using modulo of hash value',
      'Random assignment',
      'Walk clockwise on ring to find first server',
      'Binary search through sorted servers',
    ],
    correctAnswer: 2,
    explanation: 'Hash the key to a position on the ring, then walk clockwise until you find the first server (or virtual node). That server owns the key. This can be implemented efficiently with a sorted data structure.',
    difficulty: 'easy',
    topic: 'Key Assignment',
  },
  {
    id: 'ch-4',
    question: 'When a server is removed, which keys need to be redistributed?',
    options: [
      'All keys in the system',
      'Only keys that were on the removed server',
      'Keys on adjacent servers',
      'A random subset of keys',
    ],
    correctAnswer: 1,
    explanation: 'Only keys assigned to the removed server need to move - they go to the next server clockwise on the ring. Keys on other servers are unaffected, minimizing data movement.',
    difficulty: 'easy',
    topic: 'Node Removal',
  },
  {
    id: 'ch-5',
    question: 'What is the time complexity of finding the server for a key in consistent hashing?',
    options: ['O(1)', 'O(log N)', 'O(N)', 'O(K)'],
    correctAnswer: 1,
    explanation: 'Using a balanced tree or sorted array for the ring positions, finding the next server clockwise is O(log N) where N is total virtual nodes. Some implementations use O(1) with a hash table for approximate positions.',
    difficulty: 'medium',
    topic: 'Time Complexity',
  },
  {
    id: 'ch-6',
    question: 'What happens when a new server is added to a consistent hashing ring?',
    options: [
      'All keys are redistributed evenly',
      'Keys between the new server and its predecessor move to it',
      'No keys are moved',
      'Half of all keys are redistributed',
    ],
    correctAnswer: 1,
    explanation: 'The new server takes over keys from the range between itself and the previous server on the ring. Only K/(N+1) keys move on average, where K is total keys and N is current server count.',
    difficulty: 'medium',
    topic: 'Node Addition',
  },
  {
    id: 'ch-7',
    question: 'Which of these is NOT a common use case for consistent hashing?',
    options: [
      'Distributed caching (Memcached, Redis)',
      'Database sharding',
      'Sorting algorithms',
      'CDN content distribution',
    ],
    correctAnswer: 2,
    explanation: 'Consistent hashing is used in distributed systems: caching (Memcached, Redis Cluster), databases (Cassandra, DynamoDB), load balancing, and CDNs. Sorting is unrelated to distributed key mapping.',
    difficulty: 'easy',
    topic: 'Applications',
  },
  {
    id: 'ch-8',
    question: 'How many virtual nodes per server is typically used in practice?',
    options: [
      '1-2 (minimal overhead)',
      '10-100 (balance of distribution and memory)',
      '1000+ (maximum distribution)',
      'Equal to number of keys',
    ],
    correctAnswer: 1,
    explanation: 'Typically 100-200 virtual nodes per server provides good distribution without excessive memory overhead. More virtual nodes = better balance but more memory and slightly slower lookups.',
    hint: 'Consider the trade-off between distribution quality and memory usage.',
    difficulty: 'hard',
    topic: 'Implementation',
  },
  {
    id: 'ch-9',
    question: 'What data structure is typically used to implement the consistent hashing ring?',
    options: [
      'Array',
      'Hash table',
      'Balanced binary search tree or sorted list',
      'Linked list',
    ],
    correctAnswer: 2,
    explanation: 'A balanced BST (like Red-Black or AVL tree) or sorted list allows O(log N) lookup for the next server position. TreeMap in Java or std::map in C++ are common choices.',
    difficulty: 'medium',
    topic: 'Data Structures',
  },
  {
    id: 'ch-10',
    question: 'What is "jump consistent hash" and how does it differ from ring-based consistent hashing?',
    options: [
      'It uses multiple hash rings',
      'It maps keys to buckets using a mathematical formula, no ring needed',
      'It allows faster additions',
      'It uses more memory for better distribution',
    ],
    correctAnswer: 1,
    explanation: 'Jump consistent hash uses a clever algorithm to map keys to N buckets using only the key and bucket count. It\'s O(1) memory but doesn\'t support arbitrary node names or weighted nodes like ring-based hashing.',
    difficulty: 'hard',
    topic: 'Alternatives',
  },
];

const VIRTUAL_NODES_PER_SERVER = 3;

const SERVER_COLORS: Record<string, string> = {
  'Server-A': 'bg-blue-500',
  'Server-B': 'bg-green-500',
  'Server-C': 'bg-purple-500',
};

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash % 360;
}

function findServer(position: number, virtualNodes: VirtualNode[]): string | undefined {
  if (virtualNodes.length === 0) return undefined;
  const sorted = [...virtualNodes].sort((a, b) => a.position - b.position);
  for (const node of sorted) {
    if (node.position >= position) return node.serverId;
  }
  return sorted[0].serverId;
}

function generateConsistentHashingSteps(): ConsistentHashingStep[] {
  const steps: ConsistentHashingStep[] = [];
  const servers: string[] = [];
  const virtualNodes: VirtualNode[] = [];
  const dataKeys: DataKey[] = [];

  steps.push({
    operation: 'init',
    servers: [],
    virtualNodes: [],
    dataKeys: [],
    description: `Initialize consistent hashing ring`,
  });

  // Add servers
  for (const server of ['Server-A', 'Server-B', 'Server-C']) {
    servers.push(server);
    for (let i = 0; i < VIRTUAL_NODES_PER_SERVER; i++) {
      const nodeId = `${server}#${i}`;
      virtualNodes.push({
        id: nodeId,
        serverId: server,
        position: simpleHash(nodeId),
        virtualIndex: i,
      });
    }
    steps.push({
      operation: 'addServer',
      servers: [...servers],
      virtualNodes: virtualNodes.map(v => ({ ...v })),
      dataKeys: dataKeys.map(d => ({ ...d })),
      description: `Add ${server} with ${VIRTUAL_NODES_PER_SERVER} virtual nodes`,
      highlightServer: server,
    });
  }

  // Add keys
  for (const key of ['user:1001', 'session:abc', 'cache:page1']) {
    const position = simpleHash(key);
    const assignedServer = findServer(position, virtualNodes);
    dataKeys.push({ key, position, assignedServer });
    steps.push({
      operation: 'addKey',
      servers: [...servers],
      virtualNodes: virtualNodes.map(v => ({ ...v })),
      dataKeys: dataKeys.map(d => ({ ...d })),
      description: `Key "${key}" → ${assignedServer} (hash: ${position}°)`,
      highlightKey: key,
    });
  }

  // Remove server B
  const removedServer = 'Server-B';
  const keysOnRemovedServer = dataKeys.filter(k => k.assignedServer === removedServer);

  const remainingVirtualNodes = virtualNodes.filter(n => n.serverId !== removedServer);
  const remainingServers = servers.filter(s => s !== removedServer);

  steps.push({
    operation: 'removeServer',
    servers: remainingServers,
    virtualNodes: remainingVirtualNodes.map(v => ({ ...v })),
    dataKeys: dataKeys.map(d => ({ ...d })),
    description: `Remove ${removedServer} - ${keysOnRemovedServer.length} keys move`,
    highlightServer: removedServer,
    movingKeys: keysOnRemovedServer.map(k => k.key),
  });

  // Reassign keys
  for (const key of dataKeys) {
    key.assignedServer = findServer(key.position, remainingVirtualNodes);
  }

  steps.push({
    operation: 'done',
    servers: remainingServers,
    virtualNodes: remainingVirtualNodes.map(v => ({ ...v })),
    dataKeys: dataKeys.map(d => ({ ...d })),
    description: `✓ Done! Minimal disruption: only ${keysOnRemovedServer.length} keys moved`,
  });

  return steps;
}

const ConsistentHashingInterviewVisualizerComponent: React.FC<ConsistentHashingInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'consistent-hashing-interview-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'ch-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateConsistentHashingSteps, []);

  const playback = useVisualizerPlayback<ConsistentHashingStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: CONSISTENT_HASHING_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: ConsistentHashingStep = playback.currentStepData || {
    operation: 'init',
    servers: [],
    virtualNodes: [],
    dataKeys: [],
    description: '',
  };

  const { servers, virtualNodes, dataKeys, description, highlightServer, highlightKey, movingKeys } = stepData;

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  // Ring visualization
  const RING_RADIUS = 100;
  const CENTER = { x: 120, y: 120 };

  const getPositionOnRing = (degrees: number) => {
    const radians = ((degrees - 90) * Math.PI) / 180;
    return {
      x: CENTER.x + RING_RADIUS * Math.cos(radians),
      y: CENTER.y + RING_RADIUS * Math.sin(radians),
    };
  };

  return (
    <div
      id={VISUALIZER_ID}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">Consistent Hashing</h3>
            <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setMode('visualize')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === 'visualize'
                    ? 'bg-white text-cyan-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Visualize
              </button>
              <button
                onClick={() => setMode('interview')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === 'interview'
                    ? 'bg-white text-cyan-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Interview
              </button>
            </div>
            <span className="px-2 py-0.5 text-xs font-medium bg-cyan-100 text-cyan-700 rounded">
              Distributed Systems
            </span>
          </div>
          <ShareButton onShare={handleShare} accentColor="cyan" />
        </div>
      </div>

      <div className="p-4">
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* Visualization Panel */}
          <VisualizationArea minHeight={400} className="flex-1">
            {/* Key Concept */}
            <div className="mb-4 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
              <div className="text-sm font-medium text-cyan-800 mb-1">Key Insight</div>
              <div className="text-xs text-gray-700">
                Regular hashing (key % N) remaps ~100% of keys when N changes.
                Consistent hashing only remaps ~K/N keys (minimal disruption).
              </div>
            </div>

            {/* Hash Ring */}
            <div className="mb-4 flex justify-center">
              <svg width="240" height="240" className="overflow-visible">
                {/* Ring */}
                <circle
                  cx={CENTER.x}
                  cy={CENTER.y}
                  r={RING_RADIUS}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />

                {/* Virtual nodes */}
                {virtualNodes.map((node) => {
                  const pos = getPositionOnRing(node.position);
                  const isHighlighted = highlightServer === node.serverId;
                  const fillColor = SERVER_COLORS[node.serverId]
                    ?.replace('bg-', '')
                    .replace('blue-500', '#3b82f6')
                    .replace('green-500', '#22c55e')
                    .replace('purple-500', '#a855f7') || '#6b7280';

                  return (
                    <circle
                      key={node.id}
                      cx={pos.x}
                      cy={pos.y}
                      r={isHighlighted ? 9 : 7}
                      fill={fillColor}
                      stroke={isHighlighted ? '#fbbf24' : 'white'}
                      strokeWidth={isHighlighted ? 3 : 2}
                    />
                  );
                })}

                {/* Data keys */}
                {dataKeys.map((key) => {
                  const pos = getPositionOnRing(key.position);
                  const isHighlighted = highlightKey === key.key;
                  const isMoving = movingKeys?.includes(key.key);

                  return (
                    <rect
                      key={key.key}
                      x={pos.x - 4}
                      y={pos.y - 4}
                      width={8}
                      height={8}
                      fill={isMoving ? '#ef4444' : '#fbbf24'}
                      stroke={isHighlighted ? '#000' : 'white'}
                      strokeWidth={isHighlighted ? 2 : 1}
                      transform={`rotate(45 ${pos.x} ${pos.y})`}
                    />
                  );
                })}

                {/* Center label */}
                <text x={CENTER.x} y={CENTER.y} textAnchor="middle" dominantBaseline="middle" className="text-[9px] fill-gray-500">
                  Hash Ring
                </text>
              </svg>
            </div>

            {/* Server Legend */}
            <div className="mb-4 flex flex-wrap gap-2 justify-center">
              {servers.map((server) => (
                <div
                  key={server}
                  className={`flex items-center gap-1 px-2 py-1 rounded border ${
                    highlightServer === server ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${SERVER_COLORS[server]}`} />
                  <span className="text-xs">{server}</span>
                  <span className="text-[10px] text-gray-500">
                    ({dataKeys.filter((k) => k.assignedServer === server).length})
                  </span>
                </div>
              ))}
            </div>

            {/* Keys Table */}
            {dataKeys.length > 0 && (
              <div className="mb-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 text-left">Key</th>
                      <th className="px-2 py-1 text-left">Hash</th>
                      <th className="px-2 py-1 text-left">Server</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataKeys.map((key) => (
                      <tr
                        key={key.key}
                        className={`${highlightKey === key.key ? 'bg-yellow-100' : ''} ${movingKeys?.includes(key.key) ? 'bg-red-100' : ''}`}
                      >
                        <td className="px-2 py-1 font-mono">{key.key}</td>
                        <td className="px-2 py-1">{key.position}°</td>
                        <td className="px-2 py-1">
                          <span className={`px-1.5 py-0.5 rounded text-white text-[10px] ${SERVER_COLORS[key.assignedServer || ''] || 'bg-gray-400'}`}>
                            {key.assignedServer || 'none'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Status */}
            <StatusPanel
              description={description}
              currentStep={playback.currentStep}
              totalSteps={playback.steps.length}
              variant={stepData.operation === 'done' ? 'success' : stepData.operation === 'removeServer' ? 'warning' : 'default'}
            />
          </VisualizationArea>

          {/* Interview Panel */}
          {mode === 'interview' && (
            <div className="w-full lg:w-96 flex-shrink-0">
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
                accentColor="cyan"
              />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <ControlPanel
            isPlaying={playback.isPlaying}
            currentStep={playback.currentStep}
            totalSteps={playback.steps.length}
            speed={playback.speed}
            onPlayPause={playback.handlePlayPause}
            onStep={playback.handleStep}
            onStepBack={playback.handleStepBack}
            onReset={playback.handleReset}
            onSpeedChange={playback.setSpeed}
            accentColor="cyan"
          />
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
};

export const ConsistentHashingInterviewVisualizer = React.memo(ConsistentHashingInterviewVisualizerComponent);
export default ConsistentHashingInterviewVisualizer;
