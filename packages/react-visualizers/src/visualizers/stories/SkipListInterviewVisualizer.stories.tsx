import type { Meta, StoryObj } from '@storybook/react-vite';
import { SkipListInterviewVisualizer } from '../SkipListInterviewVisualizer';

const meta: Meta<typeof SkipListInterviewVisualizer> = {
  title: 'Interview Mode/Skip List Interview',
  component: SkipListInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Skip List visualizer with Interview Mode. Practice questions about probabilistic structure, expected complexity, level determination, and real-world applications like Redis.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showControls: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof SkipListInterviewVisualizer>;

export const Default: Story = {
  args: { showControls: true },
};
