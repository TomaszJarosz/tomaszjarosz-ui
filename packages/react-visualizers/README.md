# @tomaszjarosz/react-visualizers

Interactive algorithm and data structure visualizers for React. Perfect for learning, teaching, and interview preparation.

[![npm version](https://img.shields.io/npm/v/@tomaszjarosz/react-visualizers)](https://www.npmjs.com/package/@tomaszjarosz/react-visualizers)
[![Storybook](https://img.shields.io/badge/Storybook-Live%20Demo-ff4785?logo=storybook&logoColor=white)](https://6934a2d9e17d1e509a92c935-rdicbxowdr.chromatic.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **36 interactive visualizers** covering algorithms, data structures, and distributed systems
- **Interview Mode** with built-in questions, scoring, hints, and explanations
- **Step-by-step animations** with playback controls (play, pause, step forward/back)
- **Code highlighting** showing the current line being executed
- **Keyboard shortcuts** for efficient navigation
- **URL state persistence** for sharing specific states
- **Fully typed** with TypeScript
- **Zero runtime dependencies** (only `lucide-react` for icons)

## Live Demo

**[View all visualizers in Storybook](https://6934a2d9e17d1e509a92c935-rdicbxowdr.chromatic.com/)**

## Installation

```bash
npm install @tomaszjarosz/react-visualizers
# or
pnpm add @tomaszjarosz/react-visualizers
# or
yarn add @tomaszjarosz/react-visualizers
```

**Important:** Import the CSS file in your application entry point:

```tsx
import '@tomaszjarosz/react-visualizers/styles.css';
```

## Requirements

- React 17+
- The library includes compiled Tailwind CSS, no additional setup needed

## Quick Start

```tsx
import { HashMapVisualizer } from '@tomaszjarosz/react-visualizers';
import '@tomaszjarosz/react-visualizers/styles.css';

function App() {
  return <HashMapVisualizer showControls showCode />;
}
```

## Available Visualizers

### Algorithms (6)

| Visualizer | Description |
|------------|-------------|
| `BinarySearchVisualizer` | Binary search with O(log n) visualization |
| `SortingVisualizer` | Bubble, Selection, Insertion, Quick, Merge sort |
| `SortingComparisonVisualizer` | Side-by-side algorithm race |
| `GraphVisualizer` | DFS and BFS traversal |
| `DijkstraVisualizer` | Shortest path with distance relaxation |
| `DPVisualizer` | Dynamic programming table (Fibonacci) |

### Data Structures (10)

| Visualizer | Description |
|------------|-------------|
| `ArrayListVisualizer` | Dynamic array with amortized resizing |
| `LinkedListVisualizer` | Singly linked list operations |
| `HashMapVisualizer` | Hash table with separate chaining |
| `HashTableVisualizer` | Hash function internals and collisions |
| `ArrayDequeVisualizer` | Circular buffer double-ended queue |
| `PriorityQueueVisualizer` | Binary min-heap operations |
| `TreeSetVisualizer` | Red-Black tree (balanced BST) |
| `LinkedHashMapVisualizer` | HashMap + insertion order linked list |
| `EnumSetVisualizer` | Bit vector implementation |
| `ListComparisonVisualizer` | ArrayList vs LinkedList performance |

### Concurrency (4)

| Visualizer | Description |
|------------|-------------|
| `BlockingQueueVisualizer` | Producer-consumer with blocking |
| `ConcurrentHashMapVisualizer` | Segment-based concurrent access |
| `CopyOnWriteVisualizer` | Copy-on-write pattern for reads |
| `ImmutableCollectionsVisualizer` | Java 9+ immutable collections |

### Advanced Data Structures (2)

| Visualizer | Description |
|------------|-------------|
| `BloomFilterVisualizer` | Probabilistic set membership |
| `BTreeVisualizer` | B-Tree with node splitting |

### Distributed Systems (2)

| Visualizer | Description |
|------------|-------------|
| `ConsistentHashingVisualizer` | Hash ring with virtual nodes |
| `RaftVisualizer` | Raft consensus algorithm |

### Other (2)

| Visualizer | Description |
|------------|-------------|
| `GCVisualizer` | JVM generational garbage collection |
| `SQLJoinVisualizer` | SQL JOIN operations (INNER, LEFT, RIGHT, FULL) |

### Interview Mode (10)

Interview visualizers include built-in questions with multiple choice answers, hints, and detailed explanations. Perfect for interview preparation.

| Visualizer | Topics |
|------------|--------|
| `HashMapInterviewVisualizer` | Hashing, collisions, load factor, rehashing |
| `TreeSetInterviewVisualizer` | BST properties, Red-Black balancing, rotations |
| `SortingInterviewVisualizer` | Time complexity, stability, space complexity |
| `GraphInterviewVisualizer` | DFS vs BFS, cycle detection, topological sort |
| `DijkstraInterviewVisualizer` | Shortest path, negative weights, relaxation |
| `DPInterviewVisualizer` | Overlapping subproblems, memoization |
| `BloomFilterInterviewVisualizer` | False positives, hash functions, bit arrays |
| `BTreeInterviewVisualizer` | Node splitting, disk-based storage, order |
| `ConsistentHashingInterviewVisualizer` | Virtual nodes, rebalancing, hot spots |
| `RaftInterviewVisualizer` | Leader election, log replication, safety |

## Interview Mode Usage

```tsx
import { HashMapInterviewVisualizer } from '@tomaszjarosz/react-visualizers';

function InterviewPrep() {
  return (
    <HashMapInterviewVisualizer
      showControls
      showCode
      onComplete={(session) => {
        console.log(`Score: ${session.results.filter(r => r.isCorrect).length}/${session.results.length}`);
      }}
    />
  );
}
```

## Props

All visualizers accept these common props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showControls` | `boolean` | `true` | Show playback controls |
| `showCode` | `boolean` | `true` | Show code panel with highlighting |
| `className` | `string` | `''` | Additional CSS classes |

Interview visualizers also accept:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `shuffleQuestions` | `boolean` | `false` | Randomize question order |
| `onComplete` | `(session) => void` | - | Callback when all questions answered |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `→` | Next step |
| `←` | Previous step |
| `R` | Reset |
| `?` | Show help |

## Building Custom Visualizers

The library exports shared components and hooks for building your own visualizers:

```tsx
import {
  ControlPanel,
  CodePanel,
  Legend,
  StatusPanel,
  VisualizationArea,
  useVisualizerPlayback,
  useInterviewMode,
} from '@tomaszjarosz/react-visualizers';

function CustomVisualizer() {
  const { currentStep, isPlaying, play, pause, next, prev, reset } = useVisualizerPlayback({
    totalSteps: 10,
    intervalMs: 500,
  });

  return (
    <div>
      <VisualizationArea>
        {/* Your visualization */}
      </VisualizationArea>
      <ControlPanel
        isPlaying={isPlaying}
        onPlay={play}
        onPause={pause}
        onNext={next}
        onPrev={prev}
        onReset={reset}
        currentStep={currentStep}
        totalSteps={10}
      />
    </div>
  );
}
```

### Available Hooks

| Hook | Description |
|------|-------------|
| `useVisualizerPlayback` | Step-through animation control with play/pause |
| `useUrlState` | Persist visualizer state in URL for sharing |
| `useInterviewMode` | Interview session with questions and scoring |

### Available Components

| Component | Description |
|-----------|-------------|
| `ControlPanel` | Play, pause, step, reset buttons |
| `CodePanel` | Syntax-highlighted code with line highlighting |
| `Legend` | Color legend for visualization |
| `StatusPanel` | Current step description |
| `VisualizationArea` | Container with consistent styling |
| `HelpPanel` | Keyboard shortcuts overlay |
| `ArrayInput` | Custom array input for sorting visualizers |
| `StepHistory` | List of executed steps |
| `InterviewModePanel` | Question display with options and scoring |

## TypeScript

The library is fully typed. All types are exported:

```tsx
import type {
  ControlPanelProps,
  LegendItem,
  InterviewQuestion,
  InterviewSession,
  UseVisualizerPlaybackOptions,
  UseInterviewModeReturn,
} from '@tomaszjarosz/react-visualizers';
```

## Development

```bash
# Clone the repository
git clone https://github.com/tomaszjarosz/tomaszjarosz-ui.git
cd tomaszjarosz-ui/packages/react-visualizers

# Install dependencies
pnpm install

# Run Storybook locally
pnpm run storybook

# Build library
pnpm run build

# Type check
pnpm run typecheck
```

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a PR.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Tomasz Jarosz** - [tomaszjarosz.dev](https://tomaszjarosz.dev)
