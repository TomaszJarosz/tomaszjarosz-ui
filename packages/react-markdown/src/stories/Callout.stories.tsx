import type { Meta, StoryObj } from '@storybook/react-vite';
import { Callout } from '../callout';

const meta: Meta<typeof Callout> = {
  title: 'Components/Callout',
  component: Callout,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['info', 'warning', 'success', 'error', 'note', 'tip', 'example', 'problem', 'solution'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Callout>;

export const Info: Story = {
  args: {
    type: 'info',
    title: 'Information',
    children: 'This is an informational callout that provides helpful context to the reader.',
  },
};

export const Warning: Story = {
  args: {
    type: 'warning',
    title: 'Warning',
    children: 'Be careful! This operation cannot be undone.',
  },
};

export const Success: Story = {
  args: {
    type: 'success',
    title: 'Success',
    children: 'The operation completed successfully.',
  },
};

export const Error: Story = {
  args: {
    type: 'error',
    title: 'Error',
    children: 'Something went wrong. Please try again later.',
  },
};

export const Note: Story = {
  args: {
    type: 'note',
    title: 'Note',
    children: 'This is an important note to remember.',
  },
};

export const Tip: Story = {
  args: {
    type: 'tip',
    title: 'Pro Tip',
    children: 'Here is a helpful tip to improve your workflow.',
  },
};

export const Example: Story = {
  args: {
    type: 'example',
    title: 'Example',
    children: 'Here is an example of how to use this feature.',
  },
};

export const Problem: Story = {
  args: {
    type: 'problem',
    title: 'Problem',
    children: 'This describes a problem that needs to be solved.',
  },
};

export const Solution: Story = {
  args: {
    type: 'solution',
    title: 'Solution',
    children: 'Here is the recommended solution to the problem.',
  },
};

export const WithoutTitle: Story = {
  args: {
    type: 'info',
    children: 'A callout without a custom title uses the type as default.',
  },
};

export const AllTypes: Story = {
  render: () => (
    <div className="space-y-4">
      <Callout type="info" title="Info">Information callout</Callout>
      <Callout type="warning" title="Warning">Warning callout</Callout>
      <Callout type="success" title="Success">Success callout</Callout>
      <Callout type="error" title="Error">Error callout</Callout>
      <Callout type="note" title="Note">Note callout</Callout>
      <Callout type="tip" title="Tip">Tip callout</Callout>
      <Callout type="example" title="Example">Example callout</Callout>
      <Callout type="problem" title="Problem">Problem callout</Callout>
      <Callout type="solution" title="Solution">Solution callout</Callout>
    </div>
  ),
};
