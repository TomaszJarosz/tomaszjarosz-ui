import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrayDequeVisualizer } from '../ArrayDequeVisualizer';

const meta: Meta<typeof ArrayDequeVisualizer> = {
  title: 'Data Structures/ArrayDeque',
  component: ArrayDequeVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of ArrayDeque (double-ended queue). Shows circular buffer with O(1) operations at both ends.',
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
type Story = StoryObj<typeof ArrayDequeVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
