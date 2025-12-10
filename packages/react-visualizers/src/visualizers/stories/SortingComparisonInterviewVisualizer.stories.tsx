import type { Meta, StoryObj } from '@storybook/react-vite';
import { SortingComparisonInterviewVisualizer } from '../SortingComparisonInterviewVisualizer';

const meta: Meta<typeof SortingComparisonInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/SortingComparisonInterviewVisualizer',
  component: SortingComparisonInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Sorting Algorithm Race Interview Visualizer

Watch Bubble Sort vs Quick Sort race side-by-side with **interview preparation mode** featuring 10 curated questions.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **Race Mode**: Watch two algorithms compete on the same array
- **10 Interview Questions**: Covering complexity, stability, and use cases
- **Live Statistics**: Track comparisons and swaps in real-time

## Interview Topics

- Time complexity (average, worst, best case)
- Stability in sorting algorithms
- Space complexity and in-place sorting
- When Quick Sort degrades to O(n^2)
- Divide-and-conquer vs iterative approaches
- Java's dual-pivot Quick Sort and Tim Sort

## Algorithm Comparison

| Algorithm | Best | Average | Worst | Stable |
|-----------|------|---------|-------|--------|
| Bubble | O(n) | O(n^2) | O(n^2) | Yes |
| Selection | O(n^2) | O(n^2) | O(n^2) | No |
| Insertion | O(n) | O(n^2) | O(n^2) | Yes |
| Quick | O(n log n) | O(n log n) | O(n^2) | No |
| Merge | O(n log n) | O(n log n) | O(n log n) | Yes |
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showControls: true,
  },
};

export const InterviewMode: Story = {
  args: {
    showControls: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Start in interview mode to test your sorting algorithm knowledge with 10 curated questions.',
      },
    },
  },
};
