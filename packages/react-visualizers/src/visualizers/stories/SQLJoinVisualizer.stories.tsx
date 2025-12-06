import type { Meta, StoryObj } from '@storybook/react-vite';
import { SQLJoinVisualizer } from '../SQLJoinVisualizer';

const meta: Meta<typeof SQLJoinVisualizer> = {
  title: 'Database/SQLJoin',
  component: SQLJoinVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of SQL JOIN operations. Shows INNER, LEFT, RIGHT, and FULL OUTER joins with Venn diagrams.',
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
type Story = StoryObj<typeof SQLJoinVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
