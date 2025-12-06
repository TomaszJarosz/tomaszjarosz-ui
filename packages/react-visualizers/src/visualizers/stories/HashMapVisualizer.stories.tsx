import type { Meta, StoryObj } from '@storybook/react-vite';
import { HashMapVisualizer } from '../HashMapVisualizer';

const meta: Meta<typeof HashMapVisualizer> = {
  title: 'Data Structures/HashMap',
  component: HashMapVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of HashMap with buckets, hash collisions, and resizing. Shows O(1) average-case operations.',
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
type Story = StoryObj<typeof HashMapVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
