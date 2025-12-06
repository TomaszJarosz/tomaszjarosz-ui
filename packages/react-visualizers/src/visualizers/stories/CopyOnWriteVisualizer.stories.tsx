import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyOnWriteVisualizer } from '../CopyOnWriteVisualizer';

const meta: Meta<typeof CopyOnWriteVisualizer> = {
  title: 'Concurrency/CopyOnWriteArrayList',
  component: CopyOnWriteVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of CopyOnWriteArrayList. Shows lock-free reads and full copy on writes for read-heavy scenarios.',
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
type Story = StoryObj<typeof CopyOnWriteVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
