import type { Meta, StoryObj } from '@storybook/react-vite';
import { EnumSetVisualizer } from '../EnumSetVisualizer';

const meta: Meta<typeof EnumSetVisualizer> = {
  title: 'Data Structures/EnumSet',
  component: EnumSetVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of EnumSet using bit vector. Shows ultra-efficient O(1) operations with minimal memory.',
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
type Story = StoryObj<typeof EnumSetVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
