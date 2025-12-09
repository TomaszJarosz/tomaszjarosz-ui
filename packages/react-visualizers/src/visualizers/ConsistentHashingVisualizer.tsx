import React, { useMemo, useCallback } from 'react';
import {
  BaseVisualizerLayout,
  useUrlState,
  useVisualizerPlayback,
} from '../shared';

interface VirtualNode {
  id: string;
  serverId: string;
  position: number; // 0-359 degrees on ring
  isVirtual: boolean;
  virtualIndex?: number;
}

interface DataKey {
  key: string;
  hash: number;
  position: number;
  assignedServer?: string;
}

interface ConsistentHashingStep {
  operation: 'init' | 'addServer' | 'addKey' | 'findServer' | 'removeServer' | 'rebalance' | 'done';
  servers: string[];
  virtualNodes: VirtualNode[];
  dataKeys: DataKey[];
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number>;
  highlightPosition?: number;
  highlightServer?: string;
  highlightKey?: string;
  movingKeys?: string[];
}

interface ConsistentHashingVisualizerProps {
  showControls?: boolean;
  showCode?: boolean;
  className?: string;
}

const VIRTUAL_NODES_PER_SERVER = 3;

const OPERATIONS: Array<
  | { op: 'addServer'; server: string }
  | { op: 'addKey'; key: string }
  | { op: 'removeServer'; server: string }
> = [
  { op: 'addServer', server: 'Server-A' },
  { op: 'addServer', server: 'Server-B' },
  { op: 'addServer', server: 'Server-C' },
  { op: 'addKey', key: 'user:1001' },
  { op: 'addKey', key: 'user:1002' },
  { op: 'addKey', key: 'session:abc' },
  { op: 'addKey', key: 'cache:page1' },
  { op: 'removeServer', server: 'Server-B' },
];

const CONSISTENT_HASHING_CODE = [
  'class ConsistentHash:',
  '  ring = SortedMap()  # position → server',
  '  virtualNodes = 3    # replicas per server',
  '',
  'function addServer(server):',
  '  for i in range(virtualNodes):',
  '    pos = hash(server + "#" + i) % 360',
  '    ring[pos] = server',
  '',
  'function getServer(key):',
  '  pos = hash(key) % 360',
  '  # Find first server with pos >= key pos',
  '  server = ring.ceiling(pos)',
  '  if server is null:',
  '    server = ring.first()  # wrap around',
  '  return server',
  '',
  'function removeServer(server):',
  '  # Only keys on this server move',
  '  for i in range(virtualNodes):',
  '    pos = hash(server + "#" + i) % 360',
  '    ring.remove(pos)',
];

const LEGEND_ITEMS = [
  { color: 'bg-blue-500', label: 'Server A' },
  { color: 'bg-green-500', label: 'Server B' },
  { color: 'bg-purple-500', label: 'Server C' },
  { color: 'bg-yellow-400', label: 'Data key' },
  { color: 'bg-red-400', label: 'Removing / Moving' },
];

const BADGES = [
  { label: 'Distributed Systems', variant: 'cyan' as const },
  { label: 'Load Balancing', variant: 'blue' as const },
];

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

  // Find first node with position >= key position
  for (const node of sorted) {
    if (node.position >= position) {
      return node.serverId;
    }
  }

  // Wrap around to first node
  return sorted[0].serverId;
}

function generateConsistentHashingSteps(): ConsistentHashingStep[] {
  const steps: ConsistentHashingStep[] = [];
  const servers: string[] = [];
  const virtualNodes: VirtualNode[] = [];
  const dataKeys: DataKey[] = [];

  // Initialize
  steps.push({
    operation: 'init',
    servers: [...servers],
    virtualNodes: [...virtualNodes],
    dataKeys: [...dataKeys],
    description: `Initialize consistent hashing ring with ${VIRTUAL_NODES_PER_SERVER} virtual nodes per server`,
    codeLine: 0,
    variables: { virtualNodes: VIRTUAL_NODES_PER_SERVER },
  });

  for (const operation of OPERATIONS) {
    if (operation.op === 'addServer') {
      const { server } = operation;
      servers.push(server);

      steps.push({
        operation: 'addServer',
        servers: [...servers],
        virtualNodes: [...virtualNodes],
        dataKeys: [...dataKeys],
        description: `addServer("${server}"): Adding ${VIRTUAL_NODES_PER_SERVER} virtual nodes`,
        codeLine: 4,
        variables: { server: `"${server}"` },
        highlightServer: server,
      });

      // Add virtual nodes
      for (let i = 0; i < VIRTUAL_NODES_PER_SERVER; i++) {
        const nodeId = `${server}#${i}`;
        const position = simpleHash(nodeId);

        virtualNodes.push({
          id: nodeId,
          serverId: server,
          position,
          isVirtual: i > 0,
          virtualIndex: i,
        });

        steps.push({
          operation: 'addServer',
          servers: [...servers],
          virtualNodes: virtualNodes.map((v) => ({ ...v })),
          dataKeys: dataKeys.map((d) => ({ ...d })),
          description: `Virtual node ${i + 1}: hash("${nodeId}") = ${position}°`,
          codeLine: 6,
          variables: { i, position, nodeId: `"${nodeId}"` },
          highlightPosition: position,
          highlightServer: server,
        });
      }

      // Reassign any existing keys
      for (const key of dataKeys) {
        const newServer = findServer(key.position, virtualNodes);
        if (newServer !== key.assignedServer) {
          const oldServer = key.assignedServer;
          key.assignedServer = newServer;

          steps.push({
            operation: 'rebalance',
            servers: [...servers],
            virtualNodes: virtualNodes.map((v) => ({ ...v })),
            dataKeys: dataKeys.map((d) => ({ ...d })),
            description: `Key "${key.key}" reassigned: ${oldServer} → ${newServer}`,
            codeLine: -1,
            highlightKey: key.key,
            movingKeys: [key.key],
          });
        }
      }
    } else if (operation.op === 'addKey') {
      const { key } = operation;
      const position = simpleHash(key);
      const assignedServer = findServer(position, virtualNodes);

      steps.push({
        operation: 'addKey',
        servers: [...servers],
        virtualNodes: virtualNodes.map((v) => ({ ...v })),
        dataKeys: dataKeys.map((d) => ({ ...d })),
        description: `addKey("${key}"): hash = ${position}°`,
        codeLine: 9,
        variables: { key: `"${key}"`, position },
        highlightPosition: position,
        highlightKey: key,
      });

      dataKeys.push({
        key,
        hash: simpleHash(key),
        position,
        assignedServer,
      });

      steps.push({
        operation: 'findServer',
        servers: [...servers],
        virtualNodes: virtualNodes.map((v) => ({ ...v })),
        dataKeys: dataKeys.map((d) => ({ ...d })),
        description: `"${key}" (${position}°) → ${assignedServer || 'none'} (clockwise search)`,
        codeLine: 12,
        variables: { key: `"${key}"`, server: assignedServer || 'null' },
        highlightPosition: position,
        highlightKey: key,
        highlightServer: assignedServer,
      });
    } else if (operation.op === 'removeServer') {
      const { server } = operation;

      steps.push({
        operation: 'removeServer',
        servers: [...servers],
        virtualNodes: virtualNodes.map((v) => ({ ...v })),
        dataKeys: dataKeys.map((d) => ({ ...d })),
        description: `removeServer("${server}"): Only keys on this server will move!`,
        codeLine: 17,
        variables: { server: `"${server}"` },
        highlightServer: server,
      });

      // Find keys that will need to move
      const keysOnServer = dataKeys.filter((k) => k.assignedServer === server);

      // Remove virtual nodes
      const removedPositions: number[] = [];
      for (let i = virtualNodes.length - 1; i >= 0; i--) {
        if (virtualNodes[i].serverId === server) {
          removedPositions.push(virtualNodes[i].position);
          virtualNodes.splice(i, 1);
        }
      }

      servers.splice(servers.indexOf(server), 1);

      steps.push({
        operation: 'removeServer',
        servers: [...servers],
        virtualNodes: virtualNodes.map((v) => ({ ...v })),
        dataKeys: dataKeys.map((d) => ({ ...d })),
        description: `Removed ${VIRTUAL_NODES_PER_SERVER} virtual nodes at positions: ${removedPositions.join('°, ')}°`,
        codeLine: 20,
        highlightServer: server,
      });

      // Reassign affected keys
      for (const key of keysOnServer) {
        const newServer = findServer(key.position, virtualNodes);

        steps.push({
          operation: 'rebalance',
          servers: [...servers],
          virtualNodes: virtualNodes.map((v) => ({ ...v })),
          dataKeys: dataKeys.map((d) => ({ ...d })),
          description: `Key "${key.key}" moves: ${server} → ${newServer}`,
          codeLine: -1,
          highlightKey: key.key,
          highlightServer: newServer,
          movingKeys: [key.key],
        });

        key.assignedServer = newServer;
      }

      steps.push({
        operation: 'rebalance',
        servers: [...servers],
        virtualNodes: virtualNodes.map((v) => ({ ...v })),
        dataKeys: dataKeys.map((d) => ({ ...d })),
        description: `✓ Only ${keysOnServer.length} keys moved (minimal disruption!)`,
        codeLine: -1,
      });
    }
  }

  // Final state
  steps.push({
    operation: 'done',
    servers: [...servers],
    virtualNodes: virtualNodes.map((v) => ({ ...v })),
    dataKeys: dataKeys.map((d) => ({ ...d })),
    description: `✓ Done! ${servers.length} servers, ${virtualNodes.length} virtual nodes, ${dataKeys.length} keys distributed`,
    codeLine: -1,
    variables: {
      servers: servers.length,
      virtualNodes: virtualNodes.length,
      keys: dataKeys.length,
    },
  });

  return steps;
}

const ConsistentHashingVisualizerComponent: React.FC<ConsistentHashingVisualizerProps> = ({
  showControls = true,
  showCode = true,
  className = '',
}) => {
  const VISUALIZER_ID = 'consistent-hashing-visualizer';
  const { copyUrlToClipboard } = useUrlState({ prefix: 'chash', scrollToId: VISUALIZER_ID });

  const generateSteps = useMemo(() => generateConsistentHashingSteps, []);

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
  } = useVisualizerPlayback<ConsistentHashingStep>({
    generateSteps,
  });

  const stepData: ConsistentHashingStep = currentStepData || {
    operation: 'init',
    servers: [],
    virtualNodes: [],
    dataKeys: [],
    description: '',
  };

  const {
    servers,
    virtualNodes,
    dataKeys,
    description,
    highlightPosition,
    highlightServer,
    highlightKey,
    movingKeys,
  } = stepData;

  const getStatusVariant = () => {
    if (stepData.operation === 'removeServer') return 'error' as const;
    if (stepData.operation === 'rebalance' && movingKeys?.length) return 'warning' as const;
    if (stepData.operation === 'done') return 'success' as const;
    return 'default' as const;
  };

  const handleShare = useCallback(async () => {
    return copyUrlToClipboard({ step: currentStep });
  }, [copyUrlToClipboard, currentStep]);

  // Ring visualization
  const RING_RADIUS = 120;
  const CENTER = { x: 150, y: 150 };

  const getPositionOnRing = (degrees: number) => {
    const radians = ((degrees - 90) * Math.PI) / 180;
    return {
      x: CENTER.x + RING_RADIUS * Math.cos(radians),
      y: CENTER.y + RING_RADIUS * Math.sin(radians),
    };
  };

  const visualization = (
    <>
      {/* Key Concept */}
      <div className="mb-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200">
        <div className="text-sm font-bold text-cyan-800 mb-2 flex items-center gap-2">
          <span className="text-lg">🔄</span> Why Consistent Hashing?
        </div>
        <div className="text-xs text-gray-700 space-y-1">
          <p><strong>Problem:</strong> Regular hash (key % N) redistributes ALL keys when N changes</p>
          <p><strong>Solution:</strong> Consistent hashing only moves K/N keys (minimal disruption)</p>
          <p><strong>Virtual nodes:</strong> Multiple positions per server for better distribution</p>
        </div>
      </div>

      {/* Hash Ring SVG */}
      <div className="mb-4 flex justify-center">
        <svg width="300" height="300" className="overflow-visible">
          {/* Ring circle */}
          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r={RING_RADIUS}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="2"
          />

          {/* Degree markers */}
          {[0, 90, 180, 270].map((deg) => {
            const pos = getPositionOnRing(deg);
            return (
              <g key={deg}>
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[10px] fill-gray-400"
                  dx={deg === 0 ? 0 : deg === 90 ? 15 : deg === 180 ? 0 : -15}
                  dy={deg === 0 ? -15 : deg === 180 ? 15 : 0}
                >
                  {deg}°
                </text>
              </g>
            );
          })}

          {/* Virtual nodes */}
          {virtualNodes.map((node) => {
            const pos = getPositionOnRing(node.position);
            const isHighlighted = highlightServer === node.serverId;
            const color = SERVER_COLORS[node.serverId] || 'bg-gray-500';
            const fillColor = color
              .replace('bg-', '')
              .replace('blue-500', '#3b82f6')
              .replace('green-500', '#22c55e')
              .replace('purple-500', '#a855f7')
              .replace('gray-500', '#6b7280');

            return (
              <g key={node.id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHighlighted ? 10 : 8}
                  fill={fillColor}
                  stroke={isHighlighted ? '#fbbf24' : 'white'}
                  strokeWidth={isHighlighted ? 3 : 2}
                  className="transition-all"
                />
                {/* Label on hover or highlight */}
                {isHighlighted && (
                  <text
                    x={pos.x}
                    y={pos.y - 15}
                    textAnchor="middle"
                    className="text-[9px] fill-gray-700 font-medium"
                  >
                    {node.serverId}#{node.virtualIndex}
                  </text>
                )}
              </g>
            );
          })}

          {/* Data keys */}
          {dataKeys.map((key) => {
            const pos = getPositionOnRing(key.position);
            const isHighlighted = highlightKey === key.key;
            const isMoving = movingKeys?.includes(key.key);

            return (
              <g key={key.key}>
                {/* Line to assigned server */}
                {key.assignedServer && !isMoving && (
                  <line
                    x1={pos.x}
                    y1={pos.y}
                    x2={CENTER.x}
                    y2={CENTER.y}
                    stroke="#d1d5db"
                    strokeWidth="1"
                    strokeDasharray="3"
                  />
                )}
                <rect
                  x={pos.x - 4}
                  y={pos.y - 4}
                  width={8}
                  height={8}
                  fill={isMoving ? '#ef4444' : '#fbbf24'}
                  stroke={isHighlighted ? '#000' : 'white'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  transform={`rotate(45 ${pos.x} ${pos.y})`}
                  className="transition-all"
                />
                {isHighlighted && (
                  <text
                    x={pos.x}
                    y={pos.y + 18}
                    textAnchor="middle"
                    className="text-[8px] fill-gray-700 font-medium"
                  >
                    {key.key}
                  </text>
                )}
              </g>
            );
          })}

          {/* Highlight position indicator */}
          {highlightPosition !== undefined && (
            <g>
              {(() => {
                const pos = getPositionOnRing(highlightPosition);
                return (
                  <>
                    <line
                      x1={CENTER.x}
                      y1={CENTER.y}
                      x2={pos.x}
                      y2={pos.y}
                      stroke="#fbbf24"
                      strokeWidth="2"
                      strokeDasharray="5"
                    />
                    <text
                      x={pos.x}
                      y={pos.y - 12}
                      textAnchor="middle"
                      className="text-[10px] fill-yellow-600 font-bold"
                    >
                      {highlightPosition}°
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* Center label */}
          <text
            x={CENTER.x}
            y={CENTER.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] fill-gray-500"
          >
            Hash Ring
          </text>
        </svg>
      </div>

      {/* Server Legend */}
      <div className="mb-4 flex flex-wrap gap-2 justify-center">
        {servers.map((server) => (
          <div
            key={server}
            className={`
              flex items-center gap-2 px-2 py-1 rounded-lg border
              ${highlightServer === server ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-gray-50'}
            `}
          >
            <div className={`w-3 h-3 rounded-full ${SERVER_COLORS[server]}`} />
            <span className="text-xs font-medium">{server}</span>
            <span className="text-[10px] text-gray-500">
              ({dataKeys.filter((k) => k.assignedServer === server).length} keys)
            </span>
          </div>
        ))}
      </div>

      {/* Data Keys Table */}
      {dataKeys.length > 0 && (
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-left">Key</th>
                <th className="px-2 py-1 text-left">Hash (°)</th>
                <th className="px-2 py-1 text-left">Server</th>
              </tr>
            </thead>
            <tbody>
              {dataKeys.map((key) => (
                <tr
                  key={key.key}
                  className={`
                    ${highlightKey === key.key ? 'bg-yellow-100' : ''}
                    ${movingKeys?.includes(key.key) ? 'bg-red-100' : ''}
                  `}
                >
                  <td className="px-2 py-1 font-mono">{key.key}</td>
                  <td className="px-2 py-1">{key.position}°</td>
                  <td className="px-2 py-1">
                    <span
                      className={`
                        px-1.5 py-0.5 rounded text-white text-[10px]
                        ${SERVER_COLORS[key.assignedServer || ''] || 'bg-gray-400'}
                      `}
                    >
                      {key.assignedServer || 'none'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  return (
    <BaseVisualizerLayout
      id={VISUALIZER_ID}
      title="Consistent Hashing"
      badges={BADGES}
      gradient="cyan"
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
        accentColor: 'cyan',
      }}
      showControls={showControls}
      legendItems={LEGEND_ITEMS}
      code={showCode ? CONSISTENT_HASHING_CODE : undefined}
      currentCodeLine={currentStepData?.codeLine}
      codeVariables={currentStepData?.variables}
      showCode={showCode}
    >
      {visualization}
    </BaseVisualizerLayout>
  );
};

export const ConsistentHashingVisualizer = React.memo(ConsistentHashingVisualizerComponent);
export default ConsistentHashingVisualizer;
