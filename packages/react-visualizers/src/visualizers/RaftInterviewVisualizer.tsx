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

type NodeState = 'follower' | 'candidate' | 'leader';

interface LogEntry {
  term: number;
  command: string;
  committed: boolean;
}

interface RaftNode {
  id: string;
  state: NodeState;
  term: number;
  votedFor: string | null;
  log: LogEntry[];
  commitIndex: number;
}

interface RaftStep {
  operation: 'init' | 'timeout' | 'vote' | 'becomeLeader' | 'heartbeat' | 'replicate' | 'commit' | 'done';
  nodes: RaftNode[];
  description: string;
  highlightNode?: string;
  highlightEdge?: { from: string; to: string; type: 'vote' | 'heartbeat' };
  messageType?: string;
}

interface RaftInterviewVisualizerProps {
  showControls?: boolean;
  className?: string;
}

const LEGEND_ITEMS = [
  { color: 'bg-gray-400', label: 'Follower' },
  { color: 'bg-yellow-500', label: 'Candidate' },
  { color: 'bg-green-500', label: 'Leader' },
  { color: 'bg-blue-400', label: 'Vote' },
  { color: 'bg-purple-400', label: 'Heartbeat' },
];

// Interview questions about Raft Consensus
const RAFT_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'raft-1',
    question: 'What are the three states a Raft node can be in?',
    options: [
      'Primary, Secondary, Arbiter',
      'Master, Slave, Observer',
      'Follower, Candidate, Leader',
      'Active, Passive, Standby',
    ],
    correctAnswer: 2,
    explanation: 'Raft nodes transition between: Follower (passive, responds to leaders/candidates), Candidate (during elections), and Leader (handles all client requests, replicates to followers).',
    difficulty: 'easy',
    topic: 'Node States',
  },
  {
    id: 'raft-2',
    question: 'How does a Raft leader election begin?',
    options: [
      'Administrator manually promotes a node',
      'Follower\'s election timeout expires without heartbeat',
      'Nodes vote periodically',
      'Leader announces retirement',
    ],
    correctAnswer: 1,
    explanation: 'When a follower doesn\'t receive heartbeat from leader within election timeout (randomized 150-300ms typically), it becomes a candidate, increments term, votes for itself, and requests votes from others.',
    hint: 'What happens when a follower loses contact with the leader?',
    difficulty: 'medium',
    topic: 'Leader Election',
  },
  {
    id: 'raft-3',
    question: 'How many votes does a candidate need to become leader?',
    options: [
      'All nodes must vote yes',
      'Majority (more than half) of all nodes',
      'At least one other node',
      'Two-thirds of all nodes',
    ],
    correctAnswer: 1,
    explanation: 'A candidate needs votes from a majority (N/2 + 1) of nodes including itself. This ensures at most one leader per term, as two majorities always overlap.',
    difficulty: 'easy',
    topic: 'Quorum',
  },
  {
    id: 'raft-4',
    question: 'What is the purpose of terms in Raft?',
    options: [
      'To limit leader tenure',
      'To act as a logical clock and detect stale information',
      'To count the number of log entries',
      'To measure network latency',
    ],
    correctAnswer: 1,
    explanation: 'Terms serve as a logical clock. Each term has at most one leader. Nodes reject messages with older terms and update their term when seeing higher ones. This helps detect stale leaders/messages.',
    difficulty: 'medium',
    topic: 'Terms',
  },
  {
    id: 'raft-5',
    question: 'When is a log entry considered "committed" in Raft?',
    options: [
      'When the leader writes it to its log',
      'When the leader receives acknowledgment from all followers',
      'When a majority of nodes have the entry in their logs',
      'After a fixed time period',
    ],
    correctAnswer: 2,
    explanation: 'An entry is committed when replicated to a majority of nodes. Once committed, it\'s guaranteed to eventually appear in all nodes\' logs. The leader then applies it to its state machine and notifies followers.',
    difficulty: 'medium',
    topic: 'Log Replication',
  },
  {
    id: 'raft-6',
    question: 'What happens if a follower\'s log diverges from the leader\'s?',
    options: [
      'The follower is removed from the cluster',
      'A new election is triggered',
      'Leader overwrites follower\'s conflicting entries',
      'Both logs are merged',
    ],
    correctAnswer: 2,
    explanation: 'The leader finds the latest matching log entry, then overwrites all follower entries after that point with its own. AppendEntries includes prevLogIndex and prevLogTerm for consistency checking.',
    hint: 'The leader\'s log is authoritative.',
    difficulty: 'hard',
    topic: 'Log Consistency',
  },
  {
    id: 'raft-7',
    question: 'Why are election timeouts randomized in Raft?',
    options: [
      'For security against attacks',
      'To reduce likelihood of split votes',
      'To minimize network traffic',
      'To save energy',
    ],
    correctAnswer: 1,
    explanation: 'Randomized timeouts (e.g., 150-300ms) reduce the chance that multiple nodes become candidates simultaneously, causing split votes and repeated elections. One node typically times out first and wins.',
    difficulty: 'medium',
    topic: 'Election Optimization',
  },
  {
    id: 'raft-8',
    question: 'What safety guarantee does Raft provide about committed entries?',
    options: [
      'They can be removed by new leaders',
      'They are replicated to all nodes within 1 second',
      'They will never be overwritten or lost',
      'They are encrypted',
    ],
    correctAnswer: 2,
    explanation: 'Once committed, an entry is permanent. Future leaders are guaranteed to have it (election restriction requires candidates have all committed entries). This is Raft\'s State Machine Safety property.',
    difficulty: 'medium',
    topic: 'Safety Guarantees',
  },
  {
    id: 'raft-9',
    question: 'How does Raft ensure a new leader has all committed entries?',
    options: [
      'It syncs with all nodes after election',
      'Candidates only win if their log is at least as up-to-date as voters\'',
      'Committed entries are stored in a separate database',
      'There is no such guarantee',
    ],
    correctAnswer: 1,
    explanation: 'Nodes only vote for candidates with logs at least as up-to-date as their own (higher term or same term with longer log). Since committed entries exist on a majority, and any majority overlaps with voters, winners have all committed entries.',
    difficulty: 'hard',
    topic: 'Election Restriction',
  },
  {
    id: 'raft-10',
    question: 'What is the main advantage of Raft over Paxos?',
    options: [
      'Higher throughput',
      'Lower latency',
      'Understandability and ease of implementation',
      'Better fault tolerance',
    ],
    correctAnswer: 2,
    explanation: 'Raft was designed explicitly for understandability. It separates leader election, log replication, and safety into independent components. The authors showed students learned Raft more easily than Paxos.',
    difficulty: 'easy',
    topic: 'Design Philosophy',
  },
];

const NODE_IDS = ['N1', 'N2', 'N3', 'N4', 'N5'];

const STATE_COLORS: Record<NodeState, string> = {
  follower: 'bg-gray-400',
  candidate: 'bg-yellow-500',
  leader: 'bg-green-500',
};

function cloneNodes(nodes: RaftNode[]): RaftNode[] {
  return nodes.map((n) => ({
    ...n,
    log: n.log.map((e) => ({ ...e })),
  }));
}

function generateRaftSteps(): RaftStep[] {
  const steps: RaftStep[] = [];

  let nodes: RaftNode[] = NODE_IDS.map((id) => ({
    id,
    state: 'follower',
    term: 0,
    votedFor: null,
    log: [],
    commitIndex: -1,
  }));

  steps.push({
    operation: 'init',
    nodes: cloneNodes(nodes),
    description: `Initialize ${NODE_IDS.length} nodes as followers (term 0)`,
  });

  // N1 times out
  const candidateId = 'N1';
  const candidateNode = nodes.find((n) => n.id === candidateId)!;
  candidateNode.state = 'candidate';
  candidateNode.term = 1;
  candidateNode.votedFor = candidateId;

  steps.push({
    operation: 'timeout',
    nodes: cloneNodes(nodes),
    description: `${candidateId} timeout! Becomes candidate, term=1`,
    highlightNode: candidateId,
  });

  // Voting
  let votes = 1;
  for (const node of nodes) {
    if (node.id !== candidateId && node.state === 'follower') {
      node.term = 1;
      node.votedFor = candidateId;
      votes++;

      steps.push({
        operation: 'vote',
        nodes: cloneNodes(nodes),
        description: `${node.id} votes for ${candidateId} (${votes}/${NODE_IDS.length})`,
        highlightNode: node.id,
        highlightEdge: { from: node.id, to: candidateId, type: 'vote' },
      });

      if (votes > NODE_IDS.length / 2 && candidateNode.state === 'candidate') {
        candidateNode.state = 'leader';
        steps.push({
          operation: 'becomeLeader',
          nodes: cloneNodes(nodes),
          description: `${candidateId} wins election! (${votes} votes)`,
          highlightNode: candidateId,
        });
        break;
      }
    }
  }

  // Heartbeat
  steps.push({
    operation: 'heartbeat',
    nodes: cloneNodes(nodes),
    description: `Leader ${candidateId} sends heartbeats`,
    highlightNode: candidateId,
    messageType: 'Heartbeat',
  });

  // Log replication
  const leader = nodes.find((n) => n.state === 'leader')!;
  const command = 'SET x=5';
  leader.log.push({ term: 1, command, committed: false });

  steps.push({
    operation: 'replicate',
    nodes: cloneNodes(nodes),
    description: `Client request: "${command}"`,
    highlightNode: leader.id,
  });

  let acks = 1;
  for (const node of nodes) {
    if (node.id !== leader.id) {
      node.log.push({ term: 1, command, committed: false });
      acks++;

      if (acks > NODE_IDS.length / 2 && !leader.log[0].committed) {
        leader.log[0].committed = true;
        leader.commitIndex = 0;
        for (const n of nodes) {
          if (n.log.length > 0) {
            n.log[0].committed = true;
            n.commitIndex = 0;
          }
        }
        steps.push({
          operation: 'commit',
          nodes: cloneNodes(nodes),
          description: `Entry committed! (${acks} acks)`,
          highlightNode: leader.id,
        });
        break;
      }
    }
  }

  steps.push({
    operation: 'done',
    nodes: cloneNodes(nodes),
    description: `✓ Consensus achieved! Leader: ${leader.id}`,
  });

  return steps;
}

const RaftInterviewVisualizerComponent: React.FC<RaftInterviewVisualizerProps> = ({
  showControls = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'raft-interview-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'raft-int', scrollToId: VISUALIZER_ID });

  const [mode, setMode] = useState<'visualize' | 'interview'>('visualize');

  const generateSteps = useMemo(() => generateRaftSteps, []);

  const playback = useVisualizerPlayback<RaftStep>({ generateSteps });

  const interview = useInterviewMode({
    questions: RAFT_QUESTIONS,
    shuffleQuestions: true,
  });

  const stepData: RaftStep = playback.currentStepData || {
    operation: 'init',
    nodes: [],
    description: '',
  };

  const { nodes, description, highlightNode, highlightEdge } = stepData;

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: playback.currentStep });
  }, [copyUrlToClipboard, playback.currentStep]);

  // Node positions
  const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
    N1: { x: 120, y: 40 },
    N2: { x: 200, y: 80 },
    N3: { x: 180, y: 160 },
    N4: { x: 60, y: 160 },
    N5: { x: 40, y: 80 },
  };

  return (
    <div
      id={VISUALIZER_ID}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">Raft Consensus</h3>
            <div className="flex gap-1 bg-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setMode('visualize')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === 'visualize'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Visualize
              </button>
              <button
                onClick={() => setMode('interview')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  mode === 'interview'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Interview
              </button>
            </div>
            <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded">
              Distributed Consensus
            </span>
          </div>
          <ShareButton onShare={handleShare} accentColor="orange" />
        </div>
      </div>

      <div className="p-4">
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* Visualization Panel */}
          <VisualizationArea minHeight={400} className="flex-1">
            {/* Key Concept */}
            <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-sm font-medium text-orange-800 mb-1">Raft Protocol</div>
              <div className="text-xs text-gray-700">
                Consensus algorithm for replicated state machines.
                Ensures safety if any majority of nodes are alive.
              </div>
            </div>

            {/* Cluster Visualization */}
            <div className="mb-4 flex justify-center">
              <svg width="240" height="200" className="overflow-visible">
                {/* Edge highlight */}
                {highlightEdge && (
                  <line
                    x1={NODE_POSITIONS[highlightEdge.from].x}
                    y1={NODE_POSITIONS[highlightEdge.from].y}
                    x2={NODE_POSITIONS[highlightEdge.to].x}
                    y2={NODE_POSITIONS[highlightEdge.to].y}
                    stroke={highlightEdge.type === 'vote' ? '#60a5fa' : '#a855f7'}
                    strokeWidth="3"
                    strokeDasharray="5,5"
                  />
                )}

                {/* Nodes */}
                {nodes.map((node) => {
                  const pos = NODE_POSITIONS[node.id];
                  const isHighlighted = highlightNode === node.id;
                  const stateColor =
                    node.state === 'leader' ? '#22c55e' :
                    node.state === 'candidate' ? '#eab308' : '#9ca3af';

                  return (
                    <g key={node.id}>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isHighlighted ? 22 : 20}
                        fill={stateColor}
                        stroke={isHighlighted ? '#fbbf24' : 'white'}
                        strokeWidth={isHighlighted ? 3 : 2}
                      />
                      <text
                        x={pos.x}
                        y={pos.y + 4}
                        textAnchor="middle"
                        className="text-xs font-bold fill-white"
                      >
                        {node.id}
                      </text>
                      {/* Term badge */}
                      <g transform={`translate(${pos.x + 15}, ${pos.y - 15})`}>
                        <circle r="8" fill="#3b82f6" />
                        <text textAnchor="middle" dominantBaseline="middle" className="text-[8px] fill-white font-bold">
                          T{node.term}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Message Type */}
            {stepData.messageType && (
              <div className="mb-4 text-center">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  📨 {stepData.messageType}
                </span>
              </div>
            )}

            {/* Node Table */}
            <div className="mb-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-1 text-left">Node</th>
                    <th className="px-2 py-1 text-left">State</th>
                    <th className="px-2 py-1 text-left">Term</th>
                    <th className="px-2 py-1 text-left">Voted</th>
                    <th className="px-2 py-1 text-left">Log</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((node) => (
                    <tr key={node.id} className={highlightNode === node.id ? 'bg-yellow-100' : ''}>
                      <td className="px-2 py-1 font-mono font-bold">{node.id}</td>
                      <td className="px-2 py-1">
                        <span className={`px-1.5 py-0.5 rounded text-white text-[10px] ${STATE_COLORS[node.state]}`}>
                          {node.state}
                        </span>
                      </td>
                      <td className="px-2 py-1">{node.term}</td>
                      <td className="px-2 py-1">{node.votedFor || '-'}</td>
                      <td className="px-2 py-1">
                        {node.log.length > 0 ? (
                          <span className={`px-1 py-0.5 rounded text-[10px] ${node.log[0]?.committed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {node.log.length} {node.log[0]?.committed ? '✓' : '?'}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Raft Guarantees */}
            <div className="mb-4 grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 bg-green-50 rounded border border-green-200">
                <div className="font-bold text-green-800">Election Safety</div>
                <div className="text-green-700">≤1 leader per term</div>
              </div>
              <div className="p-2 bg-blue-50 rounded border border-blue-200">
                <div className="font-bold text-blue-800">Log Matching</div>
                <div className="text-blue-700">Same index+term = same</div>
              </div>
            </div>

            {/* Status */}
            <StatusPanel
              description={description}
              currentStep={playback.currentStep}
              totalSteps={playback.steps.length}
              variant={
                stepData.operation === 'done' || stepData.operation === 'becomeLeader' || stepData.operation === 'commit'
                  ? 'success'
                  : stepData.operation === 'timeout'
                    ? 'warning'
                    : 'default'
              }
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
                accentColor="orange"
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
            accentColor="orange"
          />
          <Legend items={LEGEND_ITEMS} />
        </div>
      )}
    </div>
  );
};

export const RaftInterviewVisualizer = React.memo(RaftInterviewVisualizerComponent);
export default RaftInterviewVisualizer;
