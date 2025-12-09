import type { Meta, StoryObj } from '@storybook/react-vite';
import { TreeSetInterviewVisualizer } from '../TreeSetInterviewVisualizer';

const meta: Meta<typeof TreeSetInterviewVisualizer> = {
  title: 'Interview Mode/TreeSet',
  component: TreeSetInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# TreeSet Interview Mode

Interactive TreeSet/BST visualizer with interview preparation questions.

## Topics Covered
- Time complexity (average vs worst case)
- BST property
- Tree traversal (in-order for sorted output)
- Red-Black Trees in Java
- Node deletion strategies
- Space complexity
- TreeSet vs HashSet comparison
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TreeSetInterviewVisualizer>;

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
