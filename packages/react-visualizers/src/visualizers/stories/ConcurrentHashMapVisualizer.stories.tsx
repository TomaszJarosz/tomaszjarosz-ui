import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConcurrentHashMapVisualizer } from '../ConcurrentHashMapVisualizer';

const meta: Meta<typeof ConcurrentHashMapVisualizer> = {
  title: 'Concurrency/ConcurrentHashMap',
  component: ConcurrentHashMapVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of ConcurrentHashMap with segment locking. Shows concurrent access without blocking readers.',
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
type Story = StoryObj<typeof ConcurrentHashMapVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
