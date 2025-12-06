import type { Meta, StoryObj } from '@storybook/react-vite';
import { LinkedHashMapVisualizer } from '../LinkedHashMapVisualizer';

const meta: Meta<typeof LinkedHashMapVisualizer> = {
  title: 'Data Structures/LinkedHashMap',
  component: LinkedHashMapVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of LinkedHashMap. Shows dual structure: hash table + doubly-linked list for insertion order.',
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
type Story = StoryObj<typeof LinkedHashMapVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
