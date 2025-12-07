import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListComparisonVisualizer } from '../ListComparisonVisualizer';

const meta: Meta<typeof ListComparisonVisualizer> = {
  title: 'Collections/ListComparison',
  component: ListComparisonVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# ArrayList vs LinkedList Comparison

Side-by-side visualization comparing ArrayList and LinkedList performance for various operations.

## Key Differences

### ArrayList (Dynamic Array)
- **Memory**: Contiguous block
- **Random Access**: O(1) - direct index calculation
- **Insert/Delete at front**: O(n) - must shift all elements
- **Cache-friendly**: Better locality

### LinkedList (Doubly-Linked)
- **Memory**: Scattered nodes with pointers
- **Random Access**: O(n) - must traverse from head
- **Insert/Delete at front**: O(1) - just update pointers
- **Overhead**: Extra memory for node pointers

## Complexity Comparison

| Operation | ArrayList | LinkedList | Better |
|-----------|-----------|------------|--------|
| get(i) | O(1) | O(n) | ArrayList |
| addFirst() | O(n) | O(1) | LinkedList |
| addLast() | O(1)* | O(1)** | Tie |
| add(i, e) | O(n) | O(n) | ArrayList*** |
| removeFirst() | O(n) | O(1) | LinkedList |
| removeLast() | O(1) | O(n) | ArrayList |
| contains() | O(n) | O(n) | ArrayList*** |
| iterator.remove() | O(n) | O(1) | LinkedList |

\\* amortized (occasional resize)
\\** Java's LinkedList maintains tail pointer
\\*** ArrayList has better cache locality

## When to Choose

### Use ArrayList for:
- Random access patterns
- Read-heavy workloads
- Known/bounded size
- Memory efficiency
- Cache-sensitive applications

### Use LinkedList for:
- Queue/Deque implementations
- Frequent insertions at front
- Iterator-based modifications
- Truly dynamic size requirements
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
  },
};

export default meta;
type Story = StoryObj<typeof ListComparisonVisualizer>;

export const Default: Story = {
  args: {
    showControls: true,
  },
};

export const Minimal: Story = {
  args: {
    showControls: false,
  },
};
