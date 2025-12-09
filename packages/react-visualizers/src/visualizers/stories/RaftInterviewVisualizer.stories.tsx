import type { Meta, StoryObj } from '@storybook/react-vite';
import { RaftInterviewVisualizer } from '../RaftInterviewVisualizer';

const meta: Meta<typeof RaftInterviewVisualizer> = {
  title: 'Interview Mode/Raft',
  component: RaftInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Raft Consensus Interview Mode

Distributed consensus algorithm visualization with interview questions.

## Topics Covered
- Follower, Candidate, Leader states
- Leader election and terms
- Majority quorum requirement
- Log replication and commitment
- Safety guarantees
- Election timeout randomization
- Comparison with Paxos
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RaftInterviewVisualizer>;

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
