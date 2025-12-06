import type { Meta, StoryObj } from '@storybook/react-vite';
import { GCVisualizer } from '../GCVisualizer';

const meta: Meta<typeof GCVisualizer> = {
  title: 'JVM/GarbageCollection',
  component: GCVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of JVM Garbage Collection. Shows generational GC, Eden/Survivor spaces, and object promotion.',
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
type Story = StoryObj<typeof GCVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
