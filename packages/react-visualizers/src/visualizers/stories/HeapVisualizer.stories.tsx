import type { Meta, StoryObj } from '@storybook/react-vite';
import { HeapVisualizer } from '../HeapVisualizer';

const meta: Meta<typeof HeapVisualizer> = {
  title: 'Visualizers/Data Structures/HeapVisualizer',
  component: HeapVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Heap (Max-Heap) Visualizer

Interactive visualization of the **Max-Heap** data structure and **HeapSort** algorithm.

## Features

- **Build Max-Heap**: Watch the heapify process build a max-heap from an unsorted array
- **HeapSort**: See how elements are extracted from the heap to sort the array
- **Tree + Array View**: Dual visualization showing both tree structure and array representation
- **Step-by-step**: Follow each comparison, swap, and heapify operation

## Key Concepts

### Max-Heap Property
- Parent node is always **greater than or equal to** its children
- Root contains the **maximum** element
- Complete binary tree stored in array

### Index Formulas
- \`parent(i) = ⌊(i-1)/2⌋\`
- \`left(i) = 2i + 1\`
- \`right(i) = 2i + 2\`

### Time Complexity
- **Build Heap**: O(n) - bottom-up heapify
- **HeapSort**: O(n log n) - n extractions, each O(log n)
- **Insert/Extract**: O(log n)

## HeapSort Algorithm
1. Build max-heap from unsorted array
2. Repeatedly extract max (root) and place at end
3. Reduce heap size and heapify root
4. Continue until heap is empty

## Use Cases
- Priority queues (max/min element access)
- Scheduling algorithms
- Graph algorithms (Dijkstra, Prim)
- K-th largest/smallest element problems
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showControls: {
      control: 'boolean',
      description: 'Show playback controls',
      defaultValue: true,
    },
    showCode: {
      control: 'boolean',
      description: 'Show code panel',
      defaultValue: true,
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showControls: true,
    showCode: true,
  },
};

export const WithoutCode: Story = {
  args: {
    showControls: true,
    showCode: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Heap visualizer without the code panel, focusing on the visual representation.',
      },
    },
  },
};

export const MinimalControls: Story = {
  args: {
    showControls: false,
    showCode: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal view showing only the heap visualization.',
      },
    },
  },
};
