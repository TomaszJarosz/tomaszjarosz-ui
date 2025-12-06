import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphVisualizer } from '../GraphVisualizer';

const meta: Meta<typeof GraphVisualizer> = {
  title: 'Algorithms/Graph',
  component: GraphVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of graph traversal algorithms (DFS, BFS). Watch nodes being visited and edges being explored.',
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
type Story = StoryObj<typeof GraphVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
