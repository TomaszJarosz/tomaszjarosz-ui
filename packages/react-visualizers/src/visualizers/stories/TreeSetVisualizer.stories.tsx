import type { Meta, StoryObj } from '@storybook/react-vite';
import { TreeSetVisualizer } from '../TreeSetVisualizer';

const meta: Meta<typeof TreeSetVisualizer> = {
  title: 'Data Structures/TreeSet',
  component: TreeSetVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of TreeSet (Red-Black Tree). Shows BST property and self-balancing with O(log n) operations.',
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
type Story = StoryObj<typeof TreeSetVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
