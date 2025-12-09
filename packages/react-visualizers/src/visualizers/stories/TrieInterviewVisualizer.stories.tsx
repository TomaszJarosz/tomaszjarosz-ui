import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrieInterviewVisualizer } from '../TrieInterviewVisualizer';

const meta: Meta<typeof TrieInterviewVisualizer> = {
  title: 'Interview Mode/Trie Interview',
  component: TrieInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Trie (Prefix Tree) visualizer with Interview Mode. Practice interview questions about trie structure, complexity, and applications like autocomplete and spell checking.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showControls: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof TrieInterviewVisualizer>;

export const Default: Story = {
  args: { showControls: true },
};

export const Minimal: Story = {
  args: { showControls: false },
};
