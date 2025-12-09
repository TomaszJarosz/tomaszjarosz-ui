import type { Meta, StoryObj } from '@storybook/react-vite';
import { AStarInterviewVisualizer } from '../AStarInterviewVisualizer';

const meta: Meta<typeof AStarInterviewVisualizer> = {
  title: 'Interview Mode/A* Pathfinding Interview',
  component: AStarInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A* pathfinding visualizer with Interview Mode. Practice questions about f=g+h, admissible heuristics, Manhattan distance, and algorithm properties.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showControls: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof AStarInterviewVisualizer>;

export const Default: Story = {
  args: { showControls: true },
};
