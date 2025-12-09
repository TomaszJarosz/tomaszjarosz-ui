import type { Meta, StoryObj } from '@storybook/react-vite';
import { AStarVisualizer } from '../AStarVisualizer';

const meta: Meta<typeof AStarVisualizer> = {
  title: 'Algorithms/A* Pathfinding',
  component: AStarVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of the A* pathfinding algorithm. Watch how the algorithm explores the grid using f(n) = g(n) + h(n) to find the optimal path from start to goal.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showControls: { control: 'boolean' },
    showCode: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof AStarVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
