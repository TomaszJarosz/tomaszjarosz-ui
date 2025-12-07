import type { Meta, StoryObj } from '@storybook/react-vite';
import { BTreeVisualizer } from '../BTreeVisualizer';

const meta: Meta<typeof BTreeVisualizer> = {
  title: 'Data Structures/BTree',
  component: BTreeVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# B-Tree Visualizer

A **B-Tree** is a self-balancing tree data structure that maintains sorted data and allows searches,
sequential access, insertions, and deletions in logarithmic time.

## Key Characteristics

- **Self-balancing**: All leaf nodes are at the same depth
- **Multiple keys per node**: Unlike binary trees, nodes can have many keys
- **Sorted**: Keys within each node are sorted
- **Efficient disk access**: Minimizes I/O operations

## Properties (Order m)

| Property | Value |
|----------|-------|
| Max keys per node | m - 1 |
| Max children per node | m |
| Min keys (non-root) | ⌈m/2⌉ - 1 |
| Min children (non-root) | ⌈m/2⌉ |

## Use Cases

- **Database indexes** (MySQL, PostgreSQL, MongoDB)
- **File systems** (NTFS, HFS+, ext4)
- **Key-value stores**
- **Search engines**

## Complexity

| Operation | Time |
|-----------|------|
| Search | O(log n) |
| Insert | O(log n) |
| Delete | O(log n) |
| Space | O(n) |

## Why B-Trees for Databases?

1. **Disk-friendly**: Nodes fit in disk pages
2. **Shallow depth**: Fewer disk reads
3. **Range queries**: Easy sequential access
4. **Cache-efficient**: Good locality
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showControls: {
      control: 'boolean',
      description: 'Show playback controls',
    },
    showCode: {
      control: 'boolean',
      description: 'Show pseudocode panel',
    },
  },
};

export default meta;
type Story = StoryObj<typeof BTreeVisualizer>;

export const Default: Story = {
  args: {
    showControls: true,
    showCode: true,
  },
};

export const Minimal: Story = {
  args: {
    showControls: false,
    showCode: false,
  },
};

export const ControlsOnly: Story = {
  args: {
    showControls: true,
    showCode: false,
  },
};
