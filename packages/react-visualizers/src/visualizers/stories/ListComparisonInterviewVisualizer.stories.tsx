import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListComparisonInterviewVisualizer } from '../ListComparisonInterviewVisualizer';

const meta: Meta<typeof ListComparisonInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/ListComparisonInterviewVisualizer',
  component: ListComparisonInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# ArrayList vs LinkedList Interview Visualizer

Side-by-side comparison of ArrayList and LinkedList with **interview preparation mode** featuring 10 curated questions.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **Side-by-Side**: Watch both implementations simultaneously
- **10 Interview Questions**: Covering complexity, memory, and use cases
- **Access Counter**: Track operations for each list type

## Interview Topics

- Time complexity for get, add, remove operations
- Memory overhead (per-element cost)
- Cache performance and spatial locality
- When to use ArrayList vs LinkedList
- RandomAccess marker interface
- Growth factor and amortized complexity

## Complexity Comparison

| Operation | ArrayList | LinkedList |
|-----------|-----------|------------|
| get(i) | O(1) | O(n) |
| addFirst() | O(n) | O(1) |
| addLast() | O(1)* | O(1) |
| removeFirst() | O(n) | O(1) |

*amortized
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
        story: 'Start in interview mode to test your ArrayList vs LinkedList knowledge with 10 curated questions.',
      },
    },
  },
};
