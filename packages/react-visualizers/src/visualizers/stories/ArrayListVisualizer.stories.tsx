import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrayListVisualizer } from '../ArrayListVisualizer';

const meta: Meta<typeof ArrayListVisualizer> = {
  title: 'Data Structures/ArrayList',
  component: ArrayListVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of ArrayList operations. Shows dynamic array resizing and amortized O(1) insertions.',
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
type Story = StoryObj<typeof ArrayListVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
