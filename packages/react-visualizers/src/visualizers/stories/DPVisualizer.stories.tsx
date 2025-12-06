import type { Meta, StoryObj } from '@storybook/react-vite';
import { DPVisualizer } from '../DPVisualizer';

const meta: Meta<typeof DPVisualizer> = {
  title: 'Algorithms/DynamicProgramming',
  component: DPVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of Dynamic Programming. Watch the DP table being filled and understand subproblem dependencies.',
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
type Story = StoryObj<typeof DPVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
