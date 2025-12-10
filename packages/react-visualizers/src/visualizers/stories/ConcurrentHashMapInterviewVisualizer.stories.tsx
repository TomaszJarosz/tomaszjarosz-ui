import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConcurrentHashMapInterviewVisualizer } from '../ConcurrentHashMapInterviewVisualizer';

const meta: Meta<typeof ConcurrentHashMapInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/ConcurrentHashMapInterviewVisualizer',
  component: ConcurrentHashMapInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# ConcurrentHashMap Interview Visualizer

Interactive ConcurrentHashMap visualizer with **interview preparation mode** featuring 10 curated questions.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **Segment-Level Locking**: See how concurrent access works
- **10 Interview Questions**: Covering thread safety, CAS operations, and design
- **Hints & Explanations**: Each question includes hints and detailed explanations

## Interview Topics

- Segment locking (Java 7) vs fine-grained (Java 8+)
- Lock-free reads with volatile
- CAS (Compare-And-Swap) operations
- Null key/value restrictions
- Atomic operations (computeIfAbsent, etc.)
- Weakly consistent iterators
- Comparison with Collections.synchronizedMap

## Key Concepts

### Java 8+ Implementation
- No segment locking
- CAS for head node updates
- synchronized for bucket modifications
- Lock-free reads via volatile

### Atomic Operations
\`\`\`java
map.computeIfAbsent(key, k -> expensiveComputation(k))
map.merge(key, value, (old, new) -> old + new)
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
        story: 'Start in interview mode to test your ConcurrentHashMap knowledge with 10 curated questions.',
      },
    },
  },
};
