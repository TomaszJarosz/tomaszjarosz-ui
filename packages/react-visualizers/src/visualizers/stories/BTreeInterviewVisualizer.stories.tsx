import type { Meta, StoryObj } from '@storybook/react-vite';
import { BTreeInterviewVisualizer } from '../BTreeInterviewVisualizer';

const meta: Meta<typeof BTreeInterviewVisualizer> = {
  title: 'Interview Mode/BTree',
  component: BTreeInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# B-Tree Interview Mode

Database index structure visualization with interview questions.

## Topics Covered
- Why databases use B-Trees
- O(log n) complexity
- Node splitting on overflow
- Minimum fill factor (50%)
- B-Tree vs B+ Tree differences
- Balance guarantees
- Typical order in databases
- B-Tree vs BST comparison
- Height calculation
- Key properties
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BTreeInterviewVisualizer>;

export const Default: Story = {
  args: {
    showControls: true,
  },
};

export const InterviewFocused: Story = {
  args: {
    showControls: false,
  },
};
