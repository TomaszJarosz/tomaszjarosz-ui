import type { Meta, StoryObj } from '@storybook/react-vite';
import { DPInterviewVisualizer } from '../DPInterviewVisualizer';

const meta: Meta<typeof DPInterviewVisualizer> = {
  title: 'Interview Mode/DynamicProgramming',
  component: DPInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Dynamic Programming Interview Mode

0/1 Knapsack visualization with comprehensive DP interview questions.

## Topics Covered
- Optimal substructure and overlapping subproblems
- Top-down vs bottom-up approaches
- DP state definition
- Space optimization techniques
- Pseudopolynomial complexity
- Classic DP problems (LCS, Edit Distance)
- Problem identification
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DPInterviewVisualizer>;

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
