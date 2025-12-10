import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImmutableCollectionsInterviewVisualizer } from '../ImmutableCollectionsInterviewVisualizer';

const meta: Meta<typeof ImmutableCollectionsInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/ImmutableCollectionsInterviewVisualizer',
  component: ImmutableCollectionsInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Immutable Collections Interview Visualizer

Interactive Java 9+ immutable collections visualizer with **interview preparation mode** featuring 10 curated questions.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **Immutability Demo**: Watch modification attempts fail
- **10 Interview Questions**: Covering immutability, thread safety, and API
- **Safe Derivation**: Learn the copy-modify pattern

## Interview Topics

- List.of(), Set.of(), Map.of() factory methods
- UnsupportedOperationException on modification
- Thread safety without locks
- Collections.unmodifiableList() vs List.of()
- Null handling (not allowed)
- List.copyOf() in Java 10

## Key Concepts

### Immutable Benefits
- Thread-safe by design (no locks needed)
- Safe to share between threads
- Compact memory representation

### Derivation Pattern
\`\`\`java
var mutable = new ArrayList<>(immutableList);
mutable.add("new");
var newImmutable = List.copyOf(mutable);
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
        story: 'Start in interview mode to test your immutable collections knowledge with 10 curated questions.',
      },
    },
  },
};
