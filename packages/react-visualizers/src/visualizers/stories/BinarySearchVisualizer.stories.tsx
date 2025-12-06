import type { Meta, StoryObj } from '@storybook/react-vite';
import { BinarySearchVisualizer } from '../BinarySearchVisualizer';

const meta: Meta<typeof BinarySearchVisualizer> = {
  title: 'Algorithms/BinarySearch',
  component: BinarySearchVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of binary search algorithm. Shows how the search space is halved at each step with O(log n) complexity.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showControls: { control: 'boolean', description: 'Show playback controls' },
    showCode: { control: 'boolean', description: 'Show code panel' },
  },
};

export default meta;
type Story = StoryObj<typeof BinarySearchVisualizer>;

export const Default: Story = {
  args: {
    showControls: true,
    showCode: true,
  },
};

export const Minimal: Story = {
  args: {
    showControls: false,
    showCode: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact view without controls and code panel. Suitable for embedding in articles.',
      },
    },
  },
};

export const ControlsOnly: Story = {
  args: {
    showControls: true,
    showCode: false,
  },
};
