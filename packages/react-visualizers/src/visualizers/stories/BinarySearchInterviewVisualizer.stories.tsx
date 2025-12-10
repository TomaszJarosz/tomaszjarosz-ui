import type { Meta, StoryObj } from '@storybook/react-vite';
import { BinarySearchInterviewVisualizer } from '../BinarySearchInterviewVisualizer';

const meta: Meta<typeof BinarySearchInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/BinarySearchInterviewVisualizer',
  component: BinarySearchInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Binary Search Interview Visualizer

Interactive binary search visualizer with **interview preparation mode** featuring 10 curated questions.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **Step-by-Step Search**: Watch how search space is halved each iteration
- **10 Interview Questions**: Covering complexity, invariants, and advanced variants
- **Hints & Explanations**: Each question includes hints and detailed explanations

## Interview Topics

- Time complexity O(log n)
- Overflow-safe mid calculation
- Binary search invariant
- Termination conditions
- Variants (lower bound, upper bound)
- Exponential search
- When to prefer linear search

## Key Concepts

### Search Space Halving
- Compare mid element with target
- Eliminate half of remaining elements
- Guaranteed O(log n) comparisons

### Safe Mid Calculation
\`\`\`java
mid = left + (right - left) / 2  // Overflow-safe
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showControls: true,
  },
};

export const InterviewMode: Story = {
  args: {
    showControls: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Start in interview mode to test your binary search knowledge with 10 curated questions.',
      },
    },
  },
};
