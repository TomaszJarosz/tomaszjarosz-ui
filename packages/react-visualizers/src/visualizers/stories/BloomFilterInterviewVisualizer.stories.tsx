import type { Meta, StoryObj } from '@storybook/react-vite';
import { BloomFilterInterviewVisualizer } from '../BloomFilterInterviewVisualizer';

const meta: Meta<typeof BloomFilterInterviewVisualizer> = {
  title: 'Interview Mode/BloomFilter',
  component: BloomFilterInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Bloom Filter Interview Mode

Probabilistic data structure visualization with interview questions.

## Topics Covered
- Probabilistic vs exact membership
- False positives vs false negatives
- Time complexity O(k)
- Multiple hash functions purpose
- Deletion limitations
- False positive rate factors
- Optimal hash function count
- Real-world use cases (caching, spell check)
- Space efficiency
- Counting Bloom Filter variant
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BloomFilterInterviewVisualizer>;

export const Default: Story = {
  args: {
    showControls: true,
  },
};

export const InterviewFocused: Story = {
  args: {
    showControls: false,
  },
};
