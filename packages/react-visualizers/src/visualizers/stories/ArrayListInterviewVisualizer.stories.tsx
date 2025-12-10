import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrayListInterviewVisualizer } from '../ArrayListInterviewVisualizer';

const meta: Meta<typeof ArrayListInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/ArrayListInterviewVisualizer',
  component: ArrayListInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# ArrayList Interview Visualizer

Interactive ArrayList/dynamic array visualizer with **interview preparation mode** featuring 10 curated questions.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **Dynamic Resize**: Watch array double when capacity is exceeded
- **10 Interview Questions**: Covering time complexity, amortized analysis, and design decisions
- **Hints & Explanations**: Each question includes hints and detailed explanations

## Interview Topics

- Time complexity (get, add, remove)
- Amortized O(1) analysis
- Growth factor (doubling strategy)
- Thread safety considerations
- ArrayList vs LinkedList comparison
- Initial capacity and memory

## Key Concepts

### Amortized O(1)
- Most add() operations are O(1)
- Occasional resize is O(n)
- Average over many operations is O(1)

### Growth Strategy
- Double capacity when full
- Prevents frequent resizing
- Uses extra memory for speed
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
        story: 'Start in interview mode to test your ArrayList knowledge with 10 curated questions.',
      },
    },
  },
};
