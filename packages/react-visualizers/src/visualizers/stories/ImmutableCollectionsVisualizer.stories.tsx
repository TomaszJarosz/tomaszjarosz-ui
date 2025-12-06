import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImmutableCollectionsVisualizer } from '../ImmutableCollectionsVisualizer';

const meta: Meta<typeof ImmutableCollectionsVisualizer> = {
  title: 'Concurrency/ImmutableCollections',
  component: ImmutableCollectionsVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive visualization of Java 9+ immutable collections (List.of, Set.of). Shows thread-safety by design.',
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
type Story = StoryObj<typeof ImmutableCollectionsVisualizer>;

export const Default: Story = {
  args: { showControls: true, showCode: true },
};

export const Minimal: Story = {
  args: { showControls: false, showCode: false },
};
