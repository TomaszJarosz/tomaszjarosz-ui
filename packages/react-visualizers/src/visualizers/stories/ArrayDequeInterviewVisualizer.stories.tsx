import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrayDequeInterviewVisualizer } from '../ArrayDequeInterviewVisualizer';

const meta: Meta<typeof ArrayDequeInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/ArrayDequeInterviewVisualizer',
  component: ArrayDequeInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# ArrayDeque Interview Visualizer

Interactive ArrayDeque (circular buffer) visualizer with **interview preparation mode** featuring 10 curated questions.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **Circular Buffer**: Watch head/tail pointers wrap around
- **10 Interview Questions**: Covering time complexity, circular indexing, and API
- **Hints & Explanations**: Each question includes hints and detailed explanations

## Interview Topics

- O(1) amortized time for all operations
- Circular buffer wrap-around (bitwise AND)
- Power-of-2 capacity requirement
- ArrayDeque vs LinkedList performance
- Null handling and interface implementation

## Key Concepts

### Circular Indexing
\`\`\`java
next = (index + 1) & (capacity - 1)
prev = (index - 1) & (capacity - 1)
\`\`\`

### Use Cases
- Stack (push/pop) or Queue (offer/poll)
- Better than LinkedList for most cases
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
        story: 'Start in interview mode to test your ArrayDeque knowledge with 10 curated questions.',
      },
    },
  },
};
