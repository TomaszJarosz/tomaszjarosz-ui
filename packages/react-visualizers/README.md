# @tomaszjarosz/react-visualizers

Interactive algorithm and data structure visualizers for React. Perfect for learning, teaching, and interview preparation.

[![npm version](https://img.shields.io/npm/v/@tomaszjarosz/react-visualizers)](https://www.npmjs.com/package/@tomaszjarosz/react-visualizers)
[![Storybook](https://img.shields.io/badge/Storybook-Live%20Demo-ff4785?logo=storybook&logoColor=white)](https://6934a2d9e17d1e509a92c935-oajoxaxuir.chromatic.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **65 interactive visualizers** covering algorithms, data structures, and distributed systems
- **Interview Mode** with built-in questions, scoring, hints, and explanations
- **Step-by-step animations** with playback controls (play, pause, step forward/back)
- **Code highlighting** showing the current line being executed
- **Keyboard shortcuts** for efficient navigation
- **URL state persistence** for sharing specific states
- **Fully typed** with TypeScript
- **Zero runtime dependencies** (only `lucide-react` for icons)

## Live Demo

**[View all visualizers in Storybook](https://6934a2d9e17d1e509a92c935-oajoxaxuir.chromatic.com/)**

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

### Algorithms (8)

| Visualizer | Description |
|------------|-------------|
| `BinarySearchVisualizer` | Binary search with O(log n) visualization |
| `SortingVisualizer` | Bubble, Selection, Insertion, Quick, Merge sort |
| `SortingComparisonVisualizer` | Side-by-side algorithm race |
| `GraphVisualizer` | DFS and BFS traversal |
| `DijkstraVisualizer` | Shortest path with distance relaxation |
| `DPVisualizer` | Dynamic programming table (Fibonacci) |
| `AStarVisualizer` | A* pathfinding with f(n) = g(n) + h(n) |
| `TopologicalSortVisualizer` | Kahn's algorithm for DAG ordering |

### Data Structures (13)

| Visualizer | Description |
|------------|-------------|
| `ArrayListVisualizer` | Dynamic array with amortized resizing |
| `LinkedListVisualizer` | Singly linked list operations |
| `HashMapVisualizer` | Hash table with separate chaining |
| `HashTableVisualizer` | Hash function internals and collisions |
| `ArrayDequeVisualizer` | Circular buffer double-ended queue |
| `PriorityQueueVisualizer` | Binary min-heap operations |
| `HeapVisualizer` | Max-heap with build heap and HeapSort |
| `TreeSetVisualizer` | Red-Black tree (balanced BST) |
| `LinkedHashMapVisualizer` | HashMap + insertion order linked list |
| `EnumSetVisualizer` | Bit vector implementation |
| `ListComparisonVisualizer` | ArrayList vs LinkedList performance |
| `LRUCacheVisualizer` | Least Recently Used cache with HashMap + DLL |
| `SegmentTreeVisualizer` | Range sum queries with O(log n) updates |

### Concurrency (4)

| Visualizer | Description |
|------------|-------------|
| `BlockingQueueVisualizer` | Producer-consumer with blocking |
| `ConcurrentHashMapVisualizer` | Segment-based concurrent access |
| `CopyOnWriteVisualizer` | Copy-on-write pattern for reads |
| `ImmutableCollectionsVisualizer` | Java 9+ immutable collections |

### Advanced Data Structures (5)

| Visualizer | Description |
|------------|-------------|
| `BloomFilterVisualizer` | Probabilistic set membership |
| `BTreeVisualizer` | B-Tree with node splitting |
| `TrieVisualizer` | Prefix tree for autocomplete, spell checking |
| `UnionFindVisualizer` | Disjoint set union with path compression |
| `SkipListVisualizer` | Probabilistic sorted list with O(log n) operations |

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

### Interview Mode (28)

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
| `TrieInterviewVisualizer` | Prefix operations, autocomplete, space complexity |
| `UnionFindInterviewVisualizer` | Path compression, union by rank, cycle detection |
| `AStarInterviewVisualizer` | f=g+h, admissible heuristics, Manhattan distance |
| `SkipListInterviewVisualizer` | Probabilistic levels, expected complexity, Redis |
| `LinkedListInterviewVisualizer` | Two-pointer techniques, cycle detection, reversal |
| `HeapInterviewVisualizer` | Heap property, HeapSort, time complexity, priority queues |
| `SegmentTreeInterviewVisualizer` | Range queries, point updates, lazy propagation, space complexity |
| `LRUCacheInterviewVisualizer` | HashMap + DLL, O(1) operations, eviction policy, thread-safety |
| `ArrayListInterviewVisualizer` | Amortized O(1), growth factor, thread safety, LinkedList comparison |
| `BinarySearchInterviewVisualizer` | O(log n), overflow prevention, invariant, lower/upper bound |
| `TopologicalSortInterviewVisualizer` | Kahn's algorithm, in-degree, cycle detection, DAG ordering |
| `ConcurrentHashMapInterviewVisualizer` | Segment locking, CAS operations, lock-free reads, atomic methods |
| `PriorityQueueInterviewVisualizer` | Min-heap, sift-up/down, build heap O(n), iterator behavior |
| `ArrayDequeInterviewVisualizer` | Circular buffer, bitwise indexing, stack/queue usage |
| `LinkedHashMapInterviewVisualizer` | Insertion/access order, LRU cache, removeEldestEntry |
| `EnumSetInterviewVisualizer` | Bit vector, O(1) ops, 35x memory savings vs HashSet |
| `BlockingQueueInterviewVisualizer` | Producer-consumer, put/take blocking, implementations |
| `CopyOnWriteInterviewVisualizer` | Lock-free reads, O(n) writes, snapshot iterators |

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

This project uses **bun** as the package manager.

```bash
# Clone the repository
git clone https://github.com/tomaszjarosz/tomaszjarosz-ui.git
cd tomaszjarosz-ui/packages/react-visualizers

# Install dependencies
bun install

# Run Storybook locally (port 6006)
bun run storybook

# Build library
bun run build

# Type check
bun run typecheck

# Run unit tests
bun run test

# Run tests in watch mode
bun run test:watch
```

## Storybook

All visualizers have interactive stories in [Storybook](https://storybook.js.org/):

- **Local:** `bun run storybook` → http://localhost:6006
- **Live Demo:** https://6934a2d9e17d1e509a92c935-oajoxaxuir.chromatic.com/

Stories are located in `src/visualizers/stories/` directory.

## Chromatic (Visual Testing)

This project uses [Chromatic](https://www.chromatic.com/) for visual regression testing and Storybook hosting.

- **Automatic deployment** on every push to `main` branch
- **Visual diff detection** for UI changes
- **Storybook hosting** at the live demo URL

Chromatic runs via GitHub Actions (`.github/workflows/chromatic.yml`).

## Project Structure

```
packages/react-visualizers/
├── src/
│   ├── index.ts              # Main exports
│   ├── styles.css            # Tailwind entry point
│   ├── shared/               # Shared components & hooks
│   │   ├── ControlPanel.tsx
│   │   ├── CodePanel.tsx
│   │   ├── useVisualizerPlayback.ts
│   │   ├── useInterviewMode.ts
│   │   └── *.test.ts         # Unit tests
│   └── visualizers/          # All visualizers
│       ├── SortingVisualizer.tsx
│       ├── HashMapVisualizer.tsx
│       └── stories/          # Storybook stories
├── dist/                     # Build output
├── .storybook/               # Storybook config
├── package.json
└── vite.config.ts
```

## Publishing

```bash
# Bump version
npm version patch  # or minor/major

# Build
bun run build

# Publish to npm
npm publish --access public

# Push version tag
git push && git push --tags
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass (`bun run test`)
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Tomasz Jarosz** - [tomaszjarosz.dev](https://tomaszjarosz.dev)
