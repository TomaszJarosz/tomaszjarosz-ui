import type { Meta, StoryObj } from '@storybook/react-vite';
import { SortingInterviewVisualizer } from '../SortingInterviewVisualizer';

const meta: Meta<typeof SortingInterviewVisualizer> = {
  title: 'Interview Mode/Sorting',
  component: SortingInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Sorting Interview Mode

QuickSort visualization with comprehensive sorting algorithm interview questions.

## Topics Covered
- QuickSort average and worst case complexity
- MergeSort stability and space complexity
- Insertion Sort for nearly sorted data
- Counting Sort (non-comparison)
- HeapSort guarantees
- Lower bound for comparison sorting
- Java's Arrays.sort() implementation
- TimSort and real-world optimizations
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SortingInterviewVisualizer>;

export const Default: Story = {
  args: {
    showControls: true,
  },
};

export const InterviewFocused: Story = {
  args: {
    showControls: false,
  },
};
