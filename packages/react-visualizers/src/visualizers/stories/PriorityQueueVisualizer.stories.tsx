import type { Meta, StoryObj } from '@storybook/react-vite';
import { PriorityQueueVisualizer } from '../PriorityQueueVisualizer';

const meta: Meta<typeof PriorityQueueVisualizer> = {
  title: 'Data Structures/PriorityQueue',
  component: PriorityQueueVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of PriorityQueue (min-heap). Shows heap property maintenance with O(log n) insert and extract operations.',
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
type Story = StoryObj<typeof PriorityQueueVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
