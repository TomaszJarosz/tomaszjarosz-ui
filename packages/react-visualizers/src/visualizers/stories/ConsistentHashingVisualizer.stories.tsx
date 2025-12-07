import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConsistentHashingVisualizer } from '../ConsistentHashingVisualizer';

const meta: Meta<typeof ConsistentHashingVisualizer> = {
  title: 'Distributed Systems/ConsistentHashing',
  component: ConsistentHashingVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Consistent Hashing Visualizer

**Consistent Hashing** is a distributed hashing scheme that provides minimal key redistribution when the number of servers changes.

## The Problem with Regular Hashing

With \`server = hash(key) % N\`:
- Adding/removing a server changes N
- ALL keys get redistributed
- Cache invalidation storm!

## Consistent Hashing Solution

- Hash both keys AND servers onto a ring (0-359°)
- Each key goes to the first server clockwise
- Adding/removing server only moves ~K/N keys

## Virtual Nodes

Without virtual nodes, distribution can be uneven. Virtual nodes:
- Create multiple positions per server
- Better load distribution
- Typical: 100-200 virtual nodes per server

## Use Cases

| System | Usage |
|--------|-------|
| **Amazon DynamoDB** | Partition data across nodes |
| **Apache Cassandra** | Token ring partitioning |
| **Discord** | Chat server assignment |
| **Memcached** | Distributed cache |
| **CDNs** | Content routing |

## Complexity

| Operation | Time |
|-----------|------|
| Add key | O(log N) |
| Find server | O(log N) |
| Add server | O(K/N + log N) |
| Remove server | O(K/N + log N) |

Where N = number of (virtual) nodes, K = total keys
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
type Story = StoryObj<typeof ConsistentHashingVisualizer>;

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
