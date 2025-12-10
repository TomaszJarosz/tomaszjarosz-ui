import type { Meta, StoryObj } from '@storybook/react-vite';
import { LinkedHashMapInterviewVisualizer } from '../LinkedHashMapInterviewVisualizer';

const meta: Meta<typeof LinkedHashMapInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/LinkedHashMapInterviewVisualizer',
  component: LinkedHashMapInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# LinkedHashMap Interview Visualizer

Interactive LinkedHashMap visualizer with **interview preparation mode** featuring 10 curated questions.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **Access-Order Mode**: Watch entries move to end on access (LRU behavior)
- **10 Interview Questions**: Covering iteration order, LRU cache, and implementation
- **Hints & Explanations**: Each question includes hints and detailed explanations

## Interview Topics

- Insertion order vs access order
- LRU cache implementation with removeEldestEntry()
- Space overhead (before/after pointers)
- Thread safety considerations
- Iteration order guarantees

## Key Concepts

### Structure
- HashMap + Doubly Linked List
- O(1) operations with order maintenance

### LRU Cache
\`\`\`java
new LinkedHashMap<>(16, 0.75f, true) // access order
@Override
protected boolean removeEldestEntry(Map.Entry e) {
  return size() > MAX_SIZE;
}
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
        story: 'Start in interview mode to test your LinkedHashMap knowledge with 10 curated questions.',
      },
    },
  },
};
