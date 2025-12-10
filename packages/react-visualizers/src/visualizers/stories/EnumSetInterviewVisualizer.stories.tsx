import type { Meta, StoryObj } from '@storybook/react-vite';
import { EnumSetInterviewVisualizer } from '../EnumSetInterviewVisualizer';

const meta: Meta<typeof EnumSetInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/EnumSetInterviewVisualizer',
  component: EnumSetInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# EnumSet Interview Visualizer

Interactive EnumSet (bit vector) visualizer with **interview preparation mode** featuring 10 curated questions.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **Bit Operations**: Watch bits toggle on add/remove/contains
- **10 Interview Questions**: Covering bit manipulation, memory efficiency, and API
- **Hints & Explanations**: Each question includes hints and detailed explanations

## Interview Topics

- Bit vector implementation (long bitmask)
- O(1) time complexity for all operations
- ~35x memory savings vs HashSet
- 64 constant limit (RegularEnumSet vs JumboEnumSet)
- Factory methods (allOf, noneOf, of)

## Key Operations

\`\`\`java
add:      elements |= (1L << ordinal)
remove:   elements &= ~(1L << ordinal)
contains: (elements & (1L << ordinal)) != 0
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
        story: 'Start in interview mode to test your EnumSet knowledge with 10 curated questions.',
      },
    },
  },
};
