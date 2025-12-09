import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConsistentHashingInterviewVisualizer } from '../ConsistentHashingInterviewVisualizer';

const meta: Meta<typeof ConsistentHashingInterviewVisualizer> = {
  title: 'Interview Mode/ConsistentHashing',
  component: ConsistentHashingInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Consistent Hashing Interview Mode

Distributed systems key distribution visualization with interview questions.

## Topics Covered
- Minimal key redistribution
- Virtual nodes for load balancing
- Clockwise assignment
- Node addition/removal impact
- Time complexity O(log N)
- Real-world applications (caching, sharding)
- Jump consistent hash alternative
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ConsistentHashingInterviewVisualizer>;

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
