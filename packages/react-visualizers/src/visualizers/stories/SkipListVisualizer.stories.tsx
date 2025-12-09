import type { Meta, StoryObj } from '@storybook/react-vite';
import { SkipListVisualizer } from '../SkipListVisualizer';

const meta: Meta<typeof SkipListVisualizer> = {
  title: 'Data Structures/Skip List',
  component: SkipListVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of a Skip List - a probabilistic data structure with multiple levels of linked lists that allows O(log n) search, insert, and delete operations.',
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
type Story = StoryObj<typeof SkipListVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
