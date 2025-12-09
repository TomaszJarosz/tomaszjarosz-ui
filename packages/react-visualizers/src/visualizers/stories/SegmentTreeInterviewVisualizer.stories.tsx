import type { Meta, StoryObj } from '@storybook/react-vite';
import { SegmentTreeInterviewVisualizer } from '../SegmentTreeInterviewVisualizer';

const meta: Meta<typeof SegmentTreeInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/SegmentTreeInterviewVisualizer',
  component: SegmentTreeInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Segment Tree Interview Visualizer

Interactive Segment Tree visualizer with **interview preparation mode** featuring 10 curated questions about Segment Trees.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **Range Queries**: Sum queries with O(log n) complexity
- **Point Updates**: Update single elements in O(log n)
- **10 Interview Questions**: Covering time/space complexity, lazy propagation, and advanced topics

## Interview Topics

- Time complexity (query, update, build)
- Space complexity (why 4n?)
- Index formulas (children, parent)
- Lazy propagation
- Comparison with Fenwick Tree (BIT)
- 2D Segment Trees

## Key Concepts

### Time Complexity
- Build: O(n)
- Query: O(log n)
- Update: O(log n)

### Space Complexity
- O(4n) for safe array indexing

### Applications
- Range sum/min/max queries
- Range GCD/LCM
- With lazy propagation: range updates
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
        story: 'Start in interview mode to test your Segment Tree knowledge with 10 curated questions.',
      },
    },
  },
};
