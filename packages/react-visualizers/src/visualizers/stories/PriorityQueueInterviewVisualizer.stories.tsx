import type { Meta, StoryObj } from '@storybook/react-vite';
import { PriorityQueueInterviewVisualizer } from '../PriorityQueueInterviewVisualizer';

const meta: Meta<typeof PriorityQueueInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/PriorityQueueInterviewVisualizer',
  component: PriorityQueueInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# PriorityQueue Interview Visualizer

Interactive PriorityQueue (binary heap) visualizer with **interview preparation mode** featuring 10 curated questions.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **Min-Heap Operations**: offer/poll with sift-up/sift-down animations
- **10 Interview Questions**: Covering heap property, complexity, and implementation details
- **Hints & Explanations**: Each question includes hints and detailed explanations

## Interview Topics

- Time complexity (offer, poll, peek, build heap)
- Index formulas (parent, left child, right child)
- Heap property and heap sort
- PriorityQueue API (null handling, iterator behavior)
- Internal implementation (array-based binary heap)

## Key Concepts

### Min-Heap Property
- Parent ≤ children
- Root is always minimum

### Complexity
- offer/poll: O(log n)
- peek: O(1)
- build heap: O(n)
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
        story: 'Start in interview mode to test your PriorityQueue knowledge with 10 curated questions.',
      },
    },
  },
};
