import type { Meta, StoryObj } from '@storybook/react-vite';
import { SortingComparisonVisualizer } from '../SortingComparisonVisualizer';

const meta: Meta<typeof SortingComparisonVisualizer> = {
  title: 'Algorithms/SortingComparison',
  component: SortingComparisonVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Side-by-side comparison of different sorting algorithms. See how QuickSort, MergeSort, and others perform on the same data.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text', description: 'Additional CSS classes' },
  },
};

export default meta;
type Story = StoryObj<typeof SortingComparisonVisualizer>;

export const Default: Story = {
  args: {},
};

export const CustomClass: Story = {
  args: { className: 'max-w-4xl mx-auto' },
};
