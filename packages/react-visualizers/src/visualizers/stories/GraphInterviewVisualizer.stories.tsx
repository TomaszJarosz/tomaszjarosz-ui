import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphInterviewVisualizer } from '../GraphInterviewVisualizer';

const meta: Meta<typeof GraphInterviewVisualizer> = {
  title: 'Interview Mode/Graph',
  component: GraphInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Graph Traversal Interview Mode

BFS and DFS visualization with graph algorithm interview questions.

## Features
- Toggle between BFS (Queue) and DFS (Stack)
- Visual queue/stack state
- Node visit order tracking

## Topics Covered
- BFS vs DFS data structures
- Time and space complexity
- Shortest path in unweighted graphs
- Topological sorting
- Cycle detection
- Connected components
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GraphInterviewVisualizer>;

export const Default: Story = {
  args: {
    showControls: false,
  },
};

export const InterviewFocused: Story = {
  args: {
    showControls: false,
  },
};
