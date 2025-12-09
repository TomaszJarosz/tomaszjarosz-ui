import type { Meta, StoryObj } from '@storybook/react-vite';
import { DijkstraInterviewVisualizer } from '../DijkstraInterviewVisualizer';

const meta: Meta<typeof DijkstraInterviewVisualizer> = {
  title: 'Interview Mode/Dijkstra',
  component: DijkstraInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Dijkstra's Algorithm Interview Mode

Shortest path algorithm visualization with interview questions.

## Topics Covered
- Time complexity O((V+E) log V)
- Priority queue usage
- Negative edge weight limitation
- Relaxation concept
- Space complexity
- Path reconstruction
- Bellman-Ford alternative
- Applications (GPS, routing)
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DijkstraInterviewVisualizer>;

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
