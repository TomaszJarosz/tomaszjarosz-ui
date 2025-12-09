import type { Meta, StoryObj } from '@storybook/react-vite';
import { LRUCacheVisualizer } from '../LRUCacheVisualizer';

const meta: Meta<typeof LRUCacheVisualizer> = {
  title: 'Data Structures/LRU Cache',
  component: LRUCacheVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of LRU (Least Recently Used) Cache. Shows how HashMap + Doubly Linked List achieves O(1) get and put operations. A classic interview question!',
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
type Story = StoryObj<typeof LRUCacheVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
