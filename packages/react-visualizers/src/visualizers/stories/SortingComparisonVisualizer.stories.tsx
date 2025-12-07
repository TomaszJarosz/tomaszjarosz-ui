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
    showControls: { control: 'boolean', description: 'Show playback controls' },
    showCode: { control: 'boolean', description: 'Show code panels' },
    className: { control: 'text', description: 'Additional CSS classes' },
  },
};

export default meta;
type Story = StoryObj<typeof SortingComparisonVisualizer>;

export const Default: Story = {
  args: {
    showControls: true,
    showCode: true,
  },
};

export const WithoutCode: Story = {
  args: {
    showControls: true,
    showCode: false,
  },
};

export const WithoutControls: Story = {
  args: {
    showControls: false,
    showCode: true,
  },
};

export const MinimalView: Story = {
  args: {
    showControls: false,
    showCode: false,
  },
};

export const CustomClass: Story = {
  args: {
    showControls: true,
    showCode: true,
    className: 'max-w-4xl mx-auto',
  },
};
