import type { Meta, StoryObj } from '@storybook/react-vite';
import { TreeSetInterviewVisualizer } from '../TreeSetInterviewVisualizer';
import { SortingInterviewVisualizer } from '../SortingInterviewVisualizer';
import { GraphInterviewVisualizer } from '../GraphInterviewVisualizer';
import { BloomFilterInterviewVisualizer } from '../BloomFilterInterviewVisualizer';
import { BTreeInterviewVisualizer } from '../BTreeInterviewVisualizer';
import { HashMapInterviewVisualizer } from '../HashMapInterviewVisualizer';

// TreeSet Interview
const treeSetMeta: Meta<typeof TreeSetInterviewVisualizer> = {
  title: 'Interview Mode/TreeSet',
  component: TreeSetInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# TreeSet Interview Mode

Interactive TreeSet/BST visualizer with interview preparation questions.

## Topics Covered
- Time complexity (average vs worst case)
- BST property
- Tree traversal (in-order for sorted output)
- Red-Black Trees in Java
- Node deletion strategies
- Space complexity
- TreeSet vs HashSet comparison
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default treeSetMeta;

type TreeSetStory = StoryObj<typeof TreeSetInterviewVisualizer>;

export const TreeSetInterview: TreeSetStory = {
  args: {
    showControls: true,
  },
};

// Sorting Interview
const sortingMeta: Meta<typeof SortingInterviewVisualizer> = {
  title: 'Interview Mode/Sorting',
  component: SortingInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Sorting Interview Mode

QuickSort visualization with comprehensive sorting algorithm interview questions.

## Topics Covered
- QuickSort average and worst case complexity
- MergeSort stability and space complexity
- Insertion Sort for nearly sorted data
- Counting Sort (non-comparison)
- HeapSort guarantees
- Lower bound for comparison sorting
- Java's Arrays.sort() implementation
- TimSort and real-world optimizations
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export const SortingInterview: StoryObj<typeof SortingInterviewVisualizer> = {
  args: {
    showControls: true,
  },
  render: (args) => <SortingInterviewVisualizer {...args} />,
};

// Graph Interview
const graphMeta: Meta<typeof GraphInterviewVisualizer> = {
  title: 'Interview Mode/Graph',
  component: GraphInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Graph Traversal Interview Mode

BFS and DFS visualization with graph algorithm interview questions.

## Features
- Toggle between BFS (Queue) and DFS (Stack)
- Visual queue/stack state
- Node visit order tracking

## Topics Covered
- BFS vs DFS data structures
- Time and space complexity
- Shortest path in unweighted graphs
- Topological sorting
- Cycle detection
- Connected components
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export const GraphInterview: StoryObj<typeof GraphInterviewVisualizer> = {
  args: {
    showControls: true,
  },
  render: (args) => <GraphInterviewVisualizer {...args} />,
};

// Bloom Filter Interview
const bloomFilterMeta: Meta<typeof BloomFilterInterviewVisualizer> = {
  title: 'Interview Mode/BloomFilter',
  component: BloomFilterInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Bloom Filter Interview Mode

Probabilistic data structure visualization with interview questions.

## Topics Covered
- Probabilistic vs exact membership
- False positives vs false negatives
- Time complexity O(k)
- Multiple hash functions purpose
- Deletion limitations
- False positive rate factors
- Optimal hash function count
- Real-world use cases (caching, spell check)
- Space efficiency
- Counting Bloom Filter variant
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export const BloomFilterInterview: StoryObj<typeof BloomFilterInterviewVisualizer> = {
  args: {
    showControls: true,
  },
  render: (args) => <BloomFilterInterviewVisualizer {...args} />,
};

// B-Tree Interview
const btreeMeta: Meta<typeof BTreeInterviewVisualizer> = {
  title: 'Interview Mode/BTree',
  component: BTreeInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# B-Tree Interview Mode

Database index structure visualization with interview questions.

## Topics Covered
- Why databases use B-Trees
- O(log n) complexity
- Node splitting on overflow
- Minimum fill factor (50%)
- B-Tree vs B+ Tree differences
- Balance guarantees
- Typical order in databases
- B-Tree vs BST comparison
- Height calculation
- Key properties
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export const BTreeInterview: StoryObj<typeof BTreeInterviewVisualizer> = {
  args: {
    showControls: true,
  },
  render: (args) => <BTreeInterviewVisualizer {...args} />,
};

// HashMap Interview (already exists but adding to collection)
const hashMapMeta: Meta<typeof HashMapInterviewVisualizer> = {
  title: 'Interview Mode/HashMap',
  component: HashMapInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# HashMap Interview Mode

Hash table visualization with interview questions.

## Topics Covered
- O(1) average time complexity
- Collision handling (chaining)
- Java 8 treeification
- Load factor (0.75 default)
- equals/hashCode contract
- Worst case O(n)
- Bucket index calculation
- Thread safety
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export const HashMapInterview: StoryObj<typeof HashMapInterviewVisualizer> = {
  args: {
    showControls: true,
  },
  render: (args) => <HashMapInterviewVisualizer {...args} />,
};
