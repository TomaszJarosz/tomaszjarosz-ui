import type { Meta, StoryObj } from '@storybook/react-vite';
import { UnionFindVisualizer } from '../UnionFindVisualizer';

const meta: Meta<typeof UnionFindVisualizer> = {
  title: 'Data Structures/UnionFind',
  component: UnionFindVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Union-Find (Disjoint Set Union)

A data structure for efficiently tracking connected components.

## Use Cases
- Kruskal's MST algorithm
- Cycle detection in graphs
- Network connectivity
- Image segmentation
- Social network analysis

## Optimizations
- **Path Compression**: Flatten tree during find()
- **Union by Rank**: Attach smaller tree under larger

## Complexity
- Find: O(α(n)) ≈ O(1) amortized
- Union: O(α(n)) ≈ O(1) amortized
- α(n) = inverse Ackermann function (≤4 for practical n)
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof UnionFindVisualizer>;

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
};

export const Minimal: Story = {
  args: {
    showControls: false,
    showCode: false,
  },
};
