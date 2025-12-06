import type { Meta, StoryObj } from '@storybook/react-vite';
import { LinkedListVisualizer } from '../LinkedListVisualizer';

const meta: Meta<typeof LinkedListVisualizer> = {
  title: 'Data Structures/LinkedList',
  component: LinkedListVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of LinkedList operations. Shows node connections, insertion, and removal with O(1) head/tail operations.',
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
type Story = StoryObj<typeof LinkedListVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
