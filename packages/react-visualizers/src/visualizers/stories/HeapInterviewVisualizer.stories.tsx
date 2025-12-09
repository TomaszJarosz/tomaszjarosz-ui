import type { Meta, StoryObj } from '@storybook/react-vite';
import { HeapInterviewVisualizer } from '../HeapInterviewVisualizer';

const meta: Meta<typeof HeapInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/HeapInterviewVisualizer',
  component: HeapInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Heap Interview Visualizer

Interactive heap visualizer with **interview preparation mode** featuring 10 curated questions about heap data structure.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **Max-Heap Operations**: Insert and extract-max with sift-up/sift-down animations
- **10 Interview Questions**: Covering time complexity, heap property, HeapSort, and advanced topics
- **Hints & Explanations**: Each question includes hints and detailed explanations

## Interview Topics

- Time complexity (insert, build heap, HeapSort)
- Index formulas (parent, left child, right child)
- Heap property and structure
- Space complexity
- Applications (priority queues)
- Advanced (Fibonacci heaps)

## Key Concepts

### Max-Heap Property
- Parent node is always **greater than or equal to** its children
- Root contains the **maximum** element

### Complexity
- Insert: O(log n)
- Extract-max: O(log n)
- Build heap: O(n)
- HeapSort: O(n log n)
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
        story: 'Start in interview mode to test your heap knowledge with 10 curated questions.',
      },
    },
  },
};
