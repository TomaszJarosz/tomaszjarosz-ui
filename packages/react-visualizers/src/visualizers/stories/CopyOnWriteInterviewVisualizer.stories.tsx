import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyOnWriteInterviewVisualizer } from '../CopyOnWriteInterviewVisualizer';

const meta: Meta<typeof CopyOnWriteInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/CopyOnWriteInterviewVisualizer',
  component: CopyOnWriteInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# CopyOnWriteArrayList Interview Visualizer

Interactive CopyOnWriteArrayList visualizer with **interview preparation mode** featuring 10 curated questions.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **Copy-on-Write Pattern**: Watch array copy during writes, lock-free reads
- **10 Interview Questions**: Covering thread safety, iterator behavior, and use cases
- **Hints & Explanations**: Each question includes hints and detailed explanations

## Interview Topics

- O(1) reads, O(n) writes
- Lock-free reads with volatile array reference
- Snapshot iterators (never throw ConcurrentModificationException)
- When to use (read-heavy, rarely-modified data)
- CopyOnWriteArraySet variant

## Key Concepts

### Thread Safety
- Reads: No locking, see consistent snapshot
- Writes: ReentrantLock, full array copy

### Best For
- Listener lists, configuration data
- Read-heavy workloads
- When ConcurrentModificationException is unacceptable
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
        story: 'Start in interview mode to test your CopyOnWriteArrayList knowledge with 10 curated questions.',
      },
    },
  },
};
