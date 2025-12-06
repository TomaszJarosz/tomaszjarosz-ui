import type { Meta, StoryObj } from '@storybook/react-vite';
import { DijkstraVisualizer } from '../DijkstraVisualizer';

const meta: Meta<typeof DijkstraVisualizer> = {
  title: 'Algorithms/Dijkstra',
  component: DijkstraVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of Dijkstra\'s shortest path algorithm. See how distances are updated and the shortest path is found.',
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
type Story = StoryObj<typeof DijkstraVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
