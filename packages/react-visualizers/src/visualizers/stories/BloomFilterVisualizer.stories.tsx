import type { Meta, StoryObj } from '@storybook/react-vite';
import { BloomFilterVisualizer } from '../BloomFilterVisualizer';

const meta: Meta<typeof BloomFilterVisualizer> = {
  title: 'Data Structures/BloomFilter',
  component: BloomFilterVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Bloom Filter Visualizer

A **Bloom Filter** is a space-efficient probabilistic data structure used to test whether an element is a member of a set.

## Key Characteristics

- **Space efficient**: Uses a bit array instead of storing actual elements
- **Fast**: O(k) for add and query operations, where k = number of hash functions
- **Probabilistic**: May return false positives, but never false negatives

## Trade-offs

| Pros | Cons |
|------|------|
| Very space efficient | Cannot delete elements |
| O(k) operations | False positives possible |
| Simple implementation | Cannot retrieve elements |

## Use Cases

- **Spell checkers**: Quick lookup if word might be in dictionary
- **Databases**: Check if row exists before expensive disk lookup
- **Web caching**: Quick membership tests
- **Network routers**: Packet routing decisions
- **Cryptocurrency**: Bitcoin SPV clients

## False Positive Rate

The false positive rate depends on:
- **m**: size of bit array
- **n**: number of elements inserted
- **k**: number of hash functions

Optimal k = (m/n) * ln(2)
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
type Story = StoryObj<typeof BloomFilterVisualizer>;

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

export const CodeOnly: Story = {
  args: {
    showControls: false,
    showCode: true,
  },
};
