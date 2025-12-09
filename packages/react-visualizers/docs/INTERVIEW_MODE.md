# Interview Mode

Interactive quiz system for algorithm and data structure visualizers, designed for technical interview preparation.

## Overview

Interview Mode adds a quiz panel to visualizers, allowing users to test their knowledge while watching algorithm animations. Each visualizer has 10 curated questions covering key concepts commonly asked in technical interviews.

## Features

- **Dual Mode Toggle** - Switch between "Visualize" (animation) and "Interview" (quiz) modes
- **Shuffled Questions** - Questions are randomized each session for varied practice
- **Hints** - Optional hints available before answering
- **Explanations** - Detailed explanations shown after each answer
- **Score Tracking** - Real-time score display (e.g., 7/10)
- **Session Restart** - Reset and try again with reshuffled questions

## Available Interview Visualizers

| Visualizer | Topics Covered |
|------------|----------------|
| `HashMapInterviewVisualizer` | O(1) complexity, collisions, load factor, treeification |
| `TreeSetInterviewVisualizer` | BST property, traversals, Red-Black trees, TreeSet vs HashSet |
| `SortingInterviewVisualizer` | QuickSort, MergeSort, stability, TimSort, comparison bounds |
| `GraphInterviewVisualizer` | BFS vs DFS, cycle detection, topological sort, connected components |
| `BloomFilterInterviewVisualizer` | False positives, hash functions, space efficiency, use cases |
| `BTreeInterviewVisualizer` | Database indexes, node splitting, B-Tree vs B+ Tree |
| `DijkstraInterviewVisualizer` | Priority queue, relaxation, negative edges, Bellman-Ford |
| `DPInterviewVisualizer` | Optimal substructure, memoization, Knapsack, LCS |
| `ConsistentHashingInterviewVisualizer` | Virtual nodes, minimal redistribution, distributed caching |
| `RaftInterviewVisualizer` | Leader election, terms, log replication, consensus |

## Usage

### Basic Usage

```tsx
import { HashMapInterviewVisualizer } from '@tomaszjarosz/react-visualizers';

function App() {
  return <HashMapInterviewVisualizer showControls={true} />;
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showControls` | `boolean` | `true` | Show playback controls |
| `className` | `string` | `''` | Additional CSS classes |

## Creating Custom Interview Visualizers

### 1. Define Questions

```typescript
import { type InterviewQuestion } from '@tomaszjarosz/react-visualizers';

const MY_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'q1',
    question: 'What is the time complexity of binary search?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 1, // 0-indexed
    explanation: 'Binary search halves the search space each iteration...',
    hint: 'Think about how many times you can divide n by 2.',
    difficulty: 'easy', // 'easy' | 'medium' | 'hard'
    topic: 'Time Complexity',
  },
  // ... more questions
];
```

### 2. Use the Hook

```tsx
import { useInterviewMode } from '@tomaszjarosz/react-visualizers';

const interview = useInterviewMode({
  questions: MY_QUESTIONS,
  shuffleQuestions: true,
});
```

### 3. Render the Panel

```tsx
import { InterviewModePanel } from '@tomaszjarosz/react-visualizers';

<InterviewModePanel
  currentQuestion={interview.currentQuestion}
  currentQuestionIndex={interview.session.currentQuestionIndex}
  totalQuestions={interview.session.questions.length}
  selectedAnswer={interview.selectedAnswer}
  showExplanation={interview.showExplanation}
  showHint={interview.showHint}
  isAnswered={interview.isAnswered}
  isComplete={interview.isComplete}
  score={interview.score}
  onSelectAnswer={interview.selectAnswer}
  onNextQuestion={interview.nextQuestion}
  onPreviousQuestion={interview.previousQuestion}
  onUseHint={interview.useHint}
  onRestart={interview.restartSession}
  accentColor="blue" // 'blue' | 'green' | 'orange' | 'purple' | 'cyan' | 'indigo'
/>
```

## Hook API

### `useInterviewMode(options)`

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `questions` | `InterviewQuestion[]` | required | Array of quiz questions |
| `shuffleQuestions` | `boolean` | `true` | Randomize question order |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `currentQuestion` | `InterviewQuestion \| null` | Current question object |
| `selectedAnswer` | `number \| null` | Selected answer index |
| `showExplanation` | `boolean` | Whether explanation is visible |
| `showHint` | `boolean` | Whether hint is visible |
| `isAnswered` | `boolean` | Whether current question is answered |
| `isComplete` | `boolean` | Whether all questions are answered |
| `score` | `{ correct: number, total: number }` | Current score |
| `session` | `InterviewSession` | Full session state |
| `selectAnswer` | `(index: number) => void` | Submit an answer |
| `nextQuestion` | `() => void` | Go to next question |
| `previousQuestion` | `() => void` | Go to previous question |
| `useHint` | `() => void` | Reveal hint |
| `restartSession` | `() => void` | Reset and reshuffle |

## Question Guidelines

When writing interview questions:

1. **Cover key concepts** - Focus on what interviewers actually ask
2. **Vary difficulty** - Mix easy, medium, and hard questions
3. **Include explanations** - Help users learn, not just test
4. **Add hints** - Guide thinking without giving away the answer
5. **Use clear language** - Avoid ambiguous wording
6. **Test understanding** - Not just memorization

### Good Question Example

```typescript
{
  id: 'hashmap-treeify',
  question: 'When does Java 8+ HashMap convert a bucket from LinkedList to a tree?',
  options: [
    'When load factor exceeds 0.75',
    'When bucket has more than 8 entries',
    'When total size exceeds 64',
    'When collision rate exceeds 50%',
  ],
  correctAnswer: 1,
  explanation: 'Java 8 converts buckets to Red-Black trees when they exceed 8 entries (TREEIFY_THRESHOLD). This improves worst-case from O(n) to O(log n). The bucket converts back to LinkedList when it shrinks below 6 entries.',
  hint: 'Think about the TREEIFY_THRESHOLD constant in HashMap source.',
  difficulty: 'medium',
  topic: 'Java Internals',
}
```

## Styling

Interview Mode uses Tailwind CSS classes. The `accentColor` prop controls the color theme:

- `blue` - Default, neutral
- `green` - Success/completion themed
- `orange` - Warning/attention themed
- `purple` - Creative/unique
- `cyan` - Technical/data themed
- `indigo` - Professional/enterprise

## Integration with Visualizers

The Interview Mode panel is designed to sit alongside the visualization:

```tsx
<div className="flex gap-4 flex-col lg:flex-row">
  {/* Visualization Panel */}
  <VisualizationArea className="flex-1">
    {/* Your visualization content */}
  </VisualizationArea>

  {/* Interview Panel (conditionally rendered) */}
  {mode === 'interview' && (
    <div className="w-full lg:w-96">
      <InterviewModePanel {...interviewProps} />
    </div>
  )}
</div>
```

## Best Practices

1. **10 questions per visualizer** - Enough for comprehensive coverage without fatigue
2. **Match accent colors** - Use the same color as the visualizer's theme
3. **Relevant topics** - Questions should relate to what the visualization demonstrates
4. **Progressive difficulty** - Start with fundamentals, build to advanced concepts
5. **Real interview focus** - Prioritize questions actually asked in interviews
