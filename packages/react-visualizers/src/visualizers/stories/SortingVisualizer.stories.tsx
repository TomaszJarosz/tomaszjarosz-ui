import type { Meta, StoryObj } from '@storybook/react-vite';
import { SortingVisualizer } from '../SortingVisualizer';

const meta: Meta<typeof SortingVisualizer> = {
  title: 'Algorithms/Sorting',
  component: SortingVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of sorting algorithms. Watch elements being compared and swapped in real-time.',
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
type Story = StoryObj<typeof SortingVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
