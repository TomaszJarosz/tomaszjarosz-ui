import type { Meta, StoryObj } from '@storybook/react-vite';
import { HashMapInterviewVisualizer } from '../HashMapInterviewVisualizer';

const meta: Meta<typeof HashMapInterviewVisualizer> = {
  title: 'Interview Mode/HashMapInterview',
  component: HashMapInterviewVisualizer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# HashMap Interview Mode Visualizer

Interactive HashMap visualizer with built-in interview preparation mode.

## Features

### Visualize Mode
Standard HashMap visualization showing:
- Bucket array structure
- Hash function computation
- Collision handling with linked lists
- Put, get, and remove operations

### Interview Mode
Test your knowledge with multiple-choice questions:
- 8 curated questions covering key HashMap concepts
- Difficulty levels: Easy, Medium, Hard
- Hints available for each question
- Detailed explanations after answering
- Score tracking and completion summary

## Interview Topics Covered

1. **Time Complexity** - Average vs worst case for operations
2. **Hash Functions** - hashCode() and how it's used
3. **Load Factor** - Default value and impact on performance
4. **Collision Handling** - Chaining vs other strategies
5. **Null Handling** - Special bucket for null keys
6. **Resizing** - When and how HashMap grows
7. **Thread Safety** - HashMap vs ConcurrentHashMap
8. **Java 8 Optimizations** - Tree bins for long chains

## Usage

Toggle between modes using the button in the top-right corner of the visualizer.

\`\`\`tsx
import { HashMapInterviewVisualizer } from '@tomaszjarosz/react-visualizers';

function App() {
  return <HashMapInterviewVisualizer showControls />;
}
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showControls: {
      control: 'boolean',
      description: 'Show playback controls in visualize mode',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HashMapInterviewVisualizer>;

export const Default: Story = {
  args: {
    showControls: true,
  },
};

export const InterviewFocused: Story = {
  args: {
    showControls: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Start in interview mode to test your HashMap knowledge.',
      },
    },
  },
};

export const VisualizationOnly: Story = {
  args: {
    showControls: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal mode without playback controls.',
      },
    },
  },
};
