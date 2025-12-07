import type { Meta, StoryObj } from '@storybook/react-vite';
import { RaftVisualizer } from '../RaftVisualizer';

const meta: Meta<typeof RaftVisualizer> = {
  title: 'Distributed Systems/Raft',
  component: RaftVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Raft Consensus Visualizer

**Raft** is a consensus algorithm designed to be easy to understand. It's equivalent to Paxos in fault-tolerance but structured differently.

## Key Concepts

### Node States
- **Follower**: Default state, accepts logs from leader
- **Candidate**: Trying to become leader
- **Leader**: Handles all client requests, replicates logs

### Terms
- Logical clock for the cluster
- Each term has at most one leader
- Used to detect stale leaders

## Election Process

1. Follower times out (no heartbeat from leader)
2. Becomes candidate, increments term
3. Votes for self, requests votes from others
4. If majority votes received → becomes leader
5. Leader sends heartbeats to prevent new elections

## Log Replication

1. Client sends command to leader
2. Leader appends to local log
3. Leader replicates to followers (AppendEntries RPC)
4. When majority acknowledge → entry is committed
5. Leader notifies followers to apply committed entries

## Safety Guarantees

| Property | Guarantee |
|----------|-----------|
| Election Safety | At most one leader per term |
| Leader Append-Only | Leader never overwrites or deletes entries |
| Log Matching | Same index + term = same command |
| Leader Completeness | Committed entries present in all future leaders |
| State Machine Safety | All nodes apply same commands in same order |

## Use Cases

- **etcd** (Kubernetes)
- **Consul** (HashiCorp)
- **TiKV** (TiDB)
- **CockroachDB**
- **MongoDB** (similar protocol)

## Fault Tolerance

- Tolerates (N-1)/2 failures
- 3 nodes → tolerates 1 failure
- 5 nodes → tolerates 2 failures
- 7 nodes → tolerates 3 failures
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showControls: {
      control: 'boolean',
      description: 'Show playback controls',
    },
    showCode: {
      control: 'boolean',
      description: 'Show pseudocode panel',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RaftVisualizer>;

export const Default: Story = {
  args: {
    showControls: true,
    showCode: true,
  },
};

export const Minimal: Story = {
  args: {
    showControls: false,
    showCode: false,
  },
};

export const ControlsOnly: Story = {
  args: {
    showControls: true,
    showCode: false,
  },
};
