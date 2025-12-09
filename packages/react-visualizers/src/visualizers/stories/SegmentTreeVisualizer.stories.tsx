import type { Meta, StoryObj } from '@storybook/react-vite';
import { SegmentTreeVisualizer } from '../SegmentTreeVisualizer';

const meta: Meta<typeof SegmentTreeVisualizer> = {
  title: 'Data Structures/Segment Tree',
  component: SegmentTreeVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of Segment Tree for range sum queries. Shows O(log n) query and update operations with tree structure and node ranges.',
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
type Story = StoryObj<typeof SegmentTreeVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
