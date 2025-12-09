import React, { useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';

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
  operation:
    | 'init'
    | 'timeout'
    | 'requestVote'
    | 'vote'
    | 'becomeLeader'
    | 'heartbeat'
    | 'appendEntries'
    | 'replicate'
    | 'commit'
    | 'done';
  nodes: RaftNode[];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  highlightNode?: string;
  highlightEdge?: { from: string; to: string; type: 'vote' | 'heartbeat' | 'append' };
  messageType?: string;
}

interface RaftVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const NODE_IDS = ['N1', 'N2', 'N3', 'N4', 'N5'];

const BADGES = [
  { label: 'Distributed', variant: 'orange' as const },
  { label: 'Consensus', variant: 'red' as const },
];

const RAFT_CODE = [
  '# Raft Consensus Algorithm',
  '',
  '# State: follower → candidate → leader',
  '',
  '# On election timeout (follower):',
  '  state = candidate',
  '  term += 1',
  '  votedFor = self',
  '  send RequestVote to all',
  '',
  '# On receiving votes (candidate):',
  '  if votes > N/2:',
  '    state = leader',
  '    send heartbeats',
  '',
  '# Leader operations:',
  '  append entry to log',
  '  replicate to followers',
  '  if majority ack:',
  '    commit entry',
];

const LEGEND_ITEMS = [
  { color: 'bg-gray-400', label: 'Follower' },
  { color: 'bg-yellow-500', label: 'Candidate' },
  { color: 'bg-green-500', label: 'Leader' },
  { color: 'bg-blue-400', label: 'Vote message' },
  { color: 'bg-purple-400', label: 'Heartbeat/AppendEntries' },
];

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

  // Initialize all nodes as followers
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
    description: `Initialize ${NODE_IDS.length} nodes as followers in term 0`,
    codeLine: 2,
    variables: { nodes: NODE_IDS.length, term: 0 },
  });

  // === LEADER ELECTION ===

  // N1 times out and becomes candidate
  const candidateId = 'N1';
  const candidateNode = nodes.find((n) => n.id === candidateId)!;
  candidateNode.state = 'candidate';
  candidateNode.term = 1;
  candidateNode.votedFor = candidateId;

  steps.push({
    operation: 'timeout',
    nodes: cloneNodes(nodes),
    description: `${candidateId} election timeout! Becomes candidate, increments term to 1`,
    codeLine: 4,
    variables: { node: candidateId, term: 1 },
    highlightNode: candidateId,
  });

  // Request votes from all
  steps.push({
    operation: 'requestVote',
    nodes: cloneNodes(nodes),
    description: `${candidateId} sends RequestVote(term=1) to all nodes`,
    codeLine: 8,
    variables: { from: candidateId, term: 1 },
    highlightNode: candidateId,
    messageType: 'RequestVote',
  });

  // Each follower votes
  let votes = 1; // Self-vote
  for (const node of nodes) {
    if (node.id !== candidateId && node.state === 'follower') {
      node.term = 1;
      node.votedFor = candidateId;
      votes++;

      steps.push({
        operation: 'vote',
        nodes: cloneNodes(nodes),
        description: `${node.id} grants vote to ${candidateId} (votes: ${votes}/${NODE_IDS.length})`,
        codeLine: 10,
        variables: { voter: node.id, candidate: candidateId, votes },
        highlightNode: node.id,
        highlightEdge: { from: node.id, to: candidateId, type: 'vote' },
      });

      // Check if majority
      if (votes > NODE_IDS.length / 2 && candidateNode.state === 'candidate') {
        candidateNode.state = 'leader';

        steps.push({
          operation: 'becomeLeader',
          nodes: cloneNodes(nodes),
          description: `${candidateId} received majority (${votes}/${NODE_IDS.length})! Becomes LEADER`,
          codeLine: 11,
          variables: { leader: candidateId, votes, needed: Math.floor(NODE_IDS.length / 2) + 1 },
          highlightNode: candidateId,
        });
        break;
      }
    }
  }

  // === HEARTBEATS ===
  steps.push({
    operation: 'heartbeat',
    nodes: cloneNodes(nodes),
    description: `Leader ${candidateId} sends heartbeats to maintain authority`,
    codeLine: 13,
    variables: { leader: candidateId },
    highlightNode: candidateId,
    messageType: 'Heartbeat',
  });

  // === LOG REPLICATION ===
  const leader = nodes.find((n) => n.state === 'leader')!;

  // Client request
  const command = 'SET x=5';
  leader.log.push({ term: 1, command, committed: false });

  steps.push({
    operation: 'appendEntries',
    nodes: cloneNodes(nodes),
    description: `Client request: "${command}". Leader appends to local log`,
    codeLine: 15,
    variables: { command: `"${command}"`, logIndex: 0 },
    highlightNode: leader.id,
  });

  // Replicate to followers
  let acks = 1; // Leader has it
  for (const node of nodes) {
    if (node.id !== leader.id) {
      node.log.push({ term: 1, command, committed: false });
      acks++;

      steps.push({
        operation: 'replicate',
        nodes: cloneNodes(nodes),
        description: `Replicate to ${node.id} (acks: ${acks}/${NODE_IDS.length})`,
        codeLine: 16,
        variables: { follower: node.id, acks },
        highlightNode: node.id,
        highlightEdge: { from: leader.id, to: node.id, type: 'append' },
      });

      // Check majority for commit
      if (acks > NODE_IDS.length / 2 && !leader.log[0].committed) {
        // Commit on leader
        leader.log[0].committed = true;
        leader.commitIndex = 0;

        steps.push({
          operation: 'commit',
          nodes: cloneNodes(nodes),
          description: `Majority acks (${acks})! Leader commits entry at index 0`,
          codeLine: 17,
          variables: { commitIndex: 0, acks },
          highlightNode: leader.id,
        });

        // Notify followers to commit
        for (const n of nodes) {
          if (n.id !== leader.id && n.log.length > 0) {
            n.log[0].committed = true;
            n.commitIndex = 0;
          }
        }

        steps.push({
          operation: 'commit',
          nodes: cloneNodes(nodes),
          description: `Followers apply committed entry: "${command}"`,
          codeLine: 18,
          variables: { command: `"${command}"` },
        });
        break;
      }
    }
  }

  // Final state
  steps.push({
    operation: 'done',
    nodes: cloneNodes(nodes),
    description: `✓ Consensus achieved! Leader: ${leader.id}, Term: 1, Committed entries: 1`,
    codeLine: -1,
    variables: { leader: leader.id, term: 1, entries: 1 },
  });

  return steps;
}

const RaftVisualizerComponent: React.FC<RaftVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'raft-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'raft', scrollToId: VISUALIZER_ID });

  const generateSteps = useMemo(() => generateRaftSteps, []);

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
  } = useVisualizerPlayback<RaftStep>({
    generateSteps,
  });

  const stepData: RaftStep = currentStepData || {
    operation: 'init',
    nodes: [],
    description: '',
  };

  const { nodes, description, highlightNode, highlightEdge } = stepData;

  const getNodeStyle = (nodeId: string, state: NodeState): string => {
    const baseColor = STATE_COLORS[state];
    const isHighlighted = highlightNode === nodeId;

    if (isHighlighted) {
      return `${baseColor} ring-4 ring-yellow-300 ring-offset-2`;
    }
    return baseColor;
  };

  const getStatusVariant = () => {
    if (stepData.operation === 'becomeLeader') return 'success' as const;
    if (stepData.operation === 'commit') return 'success' as const;
    if (stepData.operation === 'done') return 'success' as const;
    if (stepData.operation === 'timeout') return 'warning' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  // Node positions in a circle
  const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
    N1: { x: 150, y: 50 },
    N2: { x: 250, y: 100 },
    N3: { x: 220, y: 200 },
    N4: { x: 80, y: 200 },
    N5: { x: 50, y: 100 },
  };

  const visualization = (
    <>
      {/* Key Concept */}
      <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
        <div className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-2">
          <span className="text-lg">🗳️</span> Raft Consensus Protocol
        </div>
        <div className="text-xs text-gray-700 space-y-1">
          <p><strong>Purpose:</strong> Replicated state machine consensus for distributed systems</p>
          <p><strong>Safety:</strong> At most one leader per term, committed entries never lost</p>
          <p><strong>Liveness:</strong> System makes progress if majority of nodes are alive</p>
        </div>
      </div>

      {/* Cluster Visualization */}
      <div className="mb-4 flex justify-center">
        <svg width="300" height="260" className="overflow-visible">
          {/* Connection lines */}
          {highlightEdge && (
            <line
              x1={NODE_POSITIONS[highlightEdge.from].x}
              y1={NODE_POSITIONS[highlightEdge.from].y}
              x2={NODE_POSITIONS[highlightEdge.to].x}
              y2={NODE_POSITIONS[highlightEdge.to].y}
              stroke={highlightEdge.type === 'vote' ? '#60a5fa' : '#a855f7'}
              strokeWidth="3"
              strokeDasharray="5,5"
              markerEnd="url(#arrowhead)"
            />
          )}

          {/* Arrow marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={highlightEdge?.type === 'vote' ? '#60a5fa' : '#a855f7'}
              />
            </marker>
          </defs>

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = NODE_POSITIONS[node.id];
            const isHighlighted = highlightNode === node.id;
            const stateColor =
              node.state === 'leader'
                ? '#22c55e'
                : node.state === 'candidate'
                  ? '#eab308'
                  : '#9ca3af';

            return (
              <g key={node.id}>
                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHighlighted ? 28 : 25}
                  fill={stateColor}
                  stroke={isHighlighted ? '#fbbf24' : 'white'}
                  strokeWidth={isHighlighted ? 4 : 2}
                  className="transition-all"
                />

                {/* Node ID */}
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-bold fill-white"
                >
                  {node.id}
                </text>

                {/* State label */}
                <text
                  x={pos.x}
                  y={pos.y + 40}
                  textAnchor="middle"
                  className="text-[10px] fill-gray-600 font-medium"
                >
                  {node.state}
                </text>

                {/* Term badge */}
                <g transform={`translate(${pos.x + 20}, ${pos.y - 20})`}>
                  <circle r="10" fill="#3b82f6" />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[9px] fill-white font-bold"
                  >
                    T{node.term}
                  </text>
                </g>

                {/* Log indicator */}
                {node.log.length > 0 && (
                  <g transform={`translate(${pos.x - 20}, ${pos.y - 20})`}>
                    <rect
                      x="-8"
                      y="-8"
                      width="16"
                      height="16"
                      rx="2"
                      fill={node.log[0]?.committed ? '#22c55e' : '#f59e0b'}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[9px] fill-white font-bold"
                    >
                      {node.log.length}
                    </text>
                  </g>
                )}
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

      {/* Node Details Table */}
      <div className="mb-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 text-left">Node</th>
              <th className="px-2 py-1 text-left">State</th>
              <th className="px-2 py-1 text-left">Term</th>
              <th className="px-2 py-1 text-left">Voted For</th>
              <th className="px-2 py-1 text-left">Log</th>
              <th className="px-2 py-1 text-left">Commit</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr
                key={node.id}
                className={highlightNode === node.id ? 'bg-yellow-100' : ''}
              >
                <td className="px-2 py-1 font-mono font-bold">{node.id}</td>
                <td className="px-2 py-1">
                  <span
                    className={`px-1.5 py-0.5 rounded text-white text-[10px] ${STATE_COLORS[node.state]}`}
                  >
                    {node.state}
                  </span>
                </td>
                <td className="px-2 py-1">{node.term}</td>
                <td className="px-2 py-1">{node.votedFor || '-'}</td>
                <td className="px-2 py-1">{node.log.length} entries</td>
                <td className="px-2 py-1">{node.commitIndex >= 0 ? node.commitIndex : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Raft Guarantees */}
      <div className="mb-4 grid grid-cols-2 gap-2 text-[10px]">
        <div className="p-2 bg-green-50 rounded border border-green-200">
          <div className="font-bold text-green-800">Election Safety</div>
          <div className="text-green-700">At most one leader per term</div>
        </div>
        <div className="p-2 bg-blue-50 rounded border border-blue-200">
          <div className="font-bold text-blue-800">Log Matching</div>
          <div className="text-blue-700">Same index+term = same entry</div>
        </div>
      </div>
    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="Raft Consensus"
      badges={BADGES}
      gradient="orange"
      className={className}
      minHeight={450}
      onShare={handleShare}
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
        accentColor: 'orange',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? RAFT_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const RaftVisualizer = React.memo(RaftVisualizerComponent);
export default RaftVisualizer;
