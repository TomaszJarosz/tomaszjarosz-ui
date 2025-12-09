import type { Meta, StoryObj } from '@storybook/react-vite';
import { LinkedListInterviewVisualizer } from '../LinkedListInterviewVisualizer';

const meta: Meta<typeof LinkedListInterviewVisualizer> = {
  title: 'Interview Mode/Linked List Interview',
  component: LinkedListInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Linked List visualizer with Interview Mode. Practice questions about time complexity, two-pointer techniques, cycle detection, reversal, and comparison with arrays.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showControls: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof LinkedListInterviewVisualizer>;

export const Default: Story = {
  args: { showControls: true },
};
