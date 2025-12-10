import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlockingQueueInterviewVisualizer } from '../BlockingQueueInterviewVisualizer';

const meta: Meta<typeof BlockingQueueInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/BlockingQueueInterviewVisualizer',
  component: BlockingQueueInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# BlockingQueue Interview Visualizer

Interactive BlockingQueue (producer-consumer) visualizer with **interview preparation mode** featuring 10 curated questions.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **Producer-Consumer Pattern**: Watch threads block when queue full/empty
- **10 Interview Questions**: Covering blocking behavior, implementations, and API
- **Hints & Explanations**: Each question includes hints and detailed explanations

## Interview Topics

- put() blocks if full, take() blocks if empty
- ArrayBlockingQueue vs LinkedBlockingQueue
- SynchronousQueue (zero-capacity handoff)
- PriorityBlockingQueue (priority ordering)
- offer() vs put(), poll() vs take()

## Key Concepts

### Blocking Methods
- put()/take(): Block indefinitely
- offer()/poll(): Return immediately or with timeout

### Implementations
- ArrayBlockingQueue: Single lock
- LinkedBlockingQueue: Two locks (higher throughput)
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
        story: 'Start in interview mode to test your BlockingQueue knowledge with 10 curated questions.',
      },
    },
  },
};
