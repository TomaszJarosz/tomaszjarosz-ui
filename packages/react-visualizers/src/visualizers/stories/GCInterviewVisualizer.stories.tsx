import type { Meta, StoryObj } from '@storybook/react-vite';
import { GCInterviewVisualizer } from '../GCInterviewVisualizer';

const meta: Meta<typeof GCInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/GCInterviewVisualizer',
  component: GCInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# JVM Garbage Collection Interview Visualizer

Interactive JVM GC visualizer with **interview preparation mode** featuring 10 curated questions.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **Generational GC**: Watch objects move through Eden, Survivors, and Old Gen
- **10 Interview Questions**: Covering GC algorithms, heap layout, and tuning
- **Hints & Explanations**: Each question includes hints and detailed explanations

## Interview Topics

- Generational hypothesis ("most objects die young")
- Minor GC vs Major GC
- Copying vs Mark-Sweep algorithms
- Object promotion and tenuring threshold
- GC roots and reachability
- G1 GC, ZGC, and pause time optimization

## Key Concepts

### Heap Generations
- Eden: New objects allocated here
- Survivor (S0, S1): Objects that survive Minor GC
- Old Gen: Long-lived objects (age >= threshold)

### GC Types
- Minor GC: Young Gen only, fast, frequent
- Major GC: Old Gen, slower, less frequent
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
    showCode: true,
  },
};

export const InterviewMode: Story = {
  args: {
    showControls: true,
    showCode: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Start in interview mode to test your JVM GC knowledge with 10 curated questions.',
      },
    },
  },
};
