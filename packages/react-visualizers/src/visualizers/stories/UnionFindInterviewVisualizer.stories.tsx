import type { Meta, StoryObj } from '@storybook/react-vite';
import { UnionFindInterviewVisualizer } from '../UnionFindInterviewVisualizer';

const meta: Meta<typeof UnionFindInterviewVisualizer> = {
  title: 'Interview Mode/Union-Find Interview',
  component: UnionFindInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Union-Find (Disjoint Set Union) visualizer with Interview Mode. Practice questions about path compression, union by rank, time complexity, and applications like cycle detection in Kruskal\'s algorithm.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showControls: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof UnionFindInterviewVisualizer>;

export const Default: Story = {
  args: { showControls: true },
};

export const Minimal: Story = {
  args: { showControls: false },
};
