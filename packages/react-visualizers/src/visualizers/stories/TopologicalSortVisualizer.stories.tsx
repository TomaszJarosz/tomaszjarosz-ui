import type { Meta, StoryObj } from '@storybook/react-vite';
import { TopologicalSortVisualizer } from '../TopologicalSortVisualizer';

const meta: Meta<typeof TopologicalSortVisualizer> = {
  title: 'Algorithms/Topological Sort',
  component: TopologicalSortVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of Topological Sort using Kahn\'s algorithm. Shows how to order vertices in a DAG so all edges point forward. Used for task scheduling, build systems, and dependency resolution.',
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
type Story = StoryObj<typeof TopologicalSortVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
