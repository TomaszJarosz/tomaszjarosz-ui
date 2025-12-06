import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlockingQueueVisualizer } from '../BlockingQueueVisualizer';

const meta: Meta<typeof BlockingQueueVisualizer> = {
  title: 'Concurrency/BlockingQueue',
  component: BlockingQueueVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of BlockingQueue producer-consumer pattern. Shows thread blocking, queue capacity, and synchronization.',
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
type Story = StoryObj<typeof BlockingQueueVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
