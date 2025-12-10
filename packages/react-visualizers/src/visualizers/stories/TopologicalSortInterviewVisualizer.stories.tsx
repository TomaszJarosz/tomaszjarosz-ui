import type { Meta, StoryObj } from '@storybook/react-vite';
import { TopologicalSortInterviewVisualizer } from '../TopologicalSortInterviewVisualizer';

const meta: Meta<typeof TopologicalSortInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/TopologicalSortInterviewVisualizer',
  component: TopologicalSortInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Topological Sort Interview Visualizer

Interactive topological sort (Kahn's algorithm) visualizer with **interview preparation mode** featuring 10 curated questions.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **Kahn's Algorithm**: Watch BFS-based topological ordering step by step
- **10 Interview Questions**: Covering complexity, cycle detection, and applications
- **Hints & Explanations**: Each question includes hints and detailed explanations

## Interview Topics

- Time complexity O(V + E)
- In-degree concept
- Cycle detection (no valid ordering exists)
- Kahn's vs DFS approaches
- DAG (Directed Acyclic Graph) requirement
- Real-world applications
- Uniqueness of topological order

## Key Concepts

### Kahn's Algorithm (BFS)
1. Calculate in-degree for all vertices
2. Start with vertices having in-degree 0
3. Process vertex, reduce neighbors' in-degrees
4. Add newly zero in-degree vertices to queue

### Cycle Detection
- If not all vertices processed → cycle exists
- No valid topological order for cyclic graphs
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
        story: 'Start in interview mode to test your topological sort knowledge with 10 curated questions.',
      },
    },
  },
};
