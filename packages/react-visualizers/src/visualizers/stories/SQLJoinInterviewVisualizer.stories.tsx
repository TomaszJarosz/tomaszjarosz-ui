import type { Meta, StoryObj } from '@storybook/react-vite';
import { SQLJoinInterviewVisualizer } from '../SQLJoinInterviewVisualizer';

const meta: Meta<typeof SQLJoinInterviewVisualizer> = {
  title: 'Visualizers/Interview Mode/SQLJoinInterviewVisualizer',
  component: SQLJoinInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# SQL JOIN Interview Visualizer

Interactive SQL JOIN visualizer with **interview preparation mode** featuring 10 curated questions.

## Features

- **Dual Mode**: Toggle between visualization and interview mode
- **All JOIN Types**: INNER, LEFT, RIGHT, FULL OUTER
- **10 Interview Questions**: Covering JOIN types, algorithms, and optimization
- **Venn Diagram**: Visual representation of each JOIN type

## Interview Topics

- INNER vs OUTER JOINs
- Nested Loop, Hash Join, Merge Join algorithms
- ON vs WHERE clause differences
- CROSS JOIN and Cartesian products
- Self-joins for hierarchical data
- Join optimization and indexing

## JOIN Types

- **INNER**: Only matching rows from both tables
- **LEFT**: All from left + matching from right (NULL if no match)
- **RIGHT**: All from right + matching from left (NULL if no match)
- **FULL OUTER**: All from both tables (NULL where no match)
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
        story: 'Start in interview mode to test your SQL JOIN knowledge with 10 curated questions.',
      },
    },
  },
};
