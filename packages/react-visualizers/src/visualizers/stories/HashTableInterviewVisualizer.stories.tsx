import type { Meta, StoryObj } from '@storybook/react-vite';
import { HashTableInterviewVisualizer } from '../HashTableInterviewVisualizer';

const meta: Meta<typeof HashTableInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/HashTableInterviewVisualizer',
  component: HashTableInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Hash Table Interview Visualizer

Interactive hash table (with separate chaining) visualizer with **interview preparation mode** featuring 10 curated questions.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **Collision Handling**: Watch separate chaining in action
- **10 Interview Questions**: Covering hashing, collisions, and rehashing
- **Custom Keys**: Add your own keys to test

## Interview Topics

- Average O(1) vs worst O(n) complexity
- Separate chaining vs open addressing
- Load factor and rehashing triggers
- hashCode() and equals() contract
- Hash function properties (uniform distribution)
- Java 8 treeification optimization

## Key Concepts

### Separate Chaining
- Each bucket holds a linked list (or tree)
- Colliding keys coexist in the same bucket
- Easy to implement, handles high load

### Load Factor
- loadFactor = entries / capacity
- Default threshold: 0.75
- Triggers rehashing when exceeded
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showControls: true,
    showCode: true,
  },
};

export const InterviewMode: Story = {
  args: {
    showControls: true,
    showCode: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Start in interview mode to test your hash table knowledge with 10 curated questions.',
      },
    },
  },
};
