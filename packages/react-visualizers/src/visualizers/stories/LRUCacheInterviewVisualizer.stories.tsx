import type { Meta, StoryObj } from '@storybook/react-vite';
import { LRUCacheInterviewVisualizer } from '../LRUCacheInterviewVisualizer';

const meta: Meta<typeof LRUCacheInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/LRUCacheInterviewVisualizer',
  component: LRUCacheInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# LRU Cache Interview Visualizer

Interactive LRU Cache visualizer with **interview preparation mode** featuring 10 curated questions.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **HashMap + DLL**: Optimal O(1) implementation
- **10 Interview Questions**: Time complexity, design choices, real-world applications

## Interview Topics

- Time complexity (O(1) get/put)
- Data structures (HashMap + Doubly Linked List)
- Why DLL over SLL?
- Eviction policy
- Real-world applications (Redis, browser cache)
- LRU vs LFU comparison
- Thread-safety considerations
- Java LinkedHashMap

## Key Concepts

### Data Structures
- **HashMap**: O(1) key lookup
- **Doubly Linked List**: O(1) reordering

### Operations
- **get()**: O(1) - lookup + move to head
- **put()**: O(1) - insert at head, evict from tail if full

### Real-World Usage
- Browser cache
- Database query cache
- Redis eviction policy
- CPU cache replacement
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
        story: 'Start in interview mode to test your LRU Cache knowledge with 10 curated questions.',
      },
    },
  },
};
