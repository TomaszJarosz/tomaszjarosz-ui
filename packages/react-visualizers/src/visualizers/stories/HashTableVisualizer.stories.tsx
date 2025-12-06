import type { Meta, StoryObj } from '@storybook/react-vite';
import { HashTableVisualizer } from '../HashTableVisualizer';

const meta: Meta<typeof HashTableVisualizer> = {
  title: 'Data Structures/HashTable',
  component: HashTableVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of HashTable internals. Shows hash function, buckets, collision handling, and load factor.',
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
type Story = StoryObj<typeof HashTableVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
