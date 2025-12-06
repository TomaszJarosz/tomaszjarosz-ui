# @tomaszjarosz/react-visualizers

Interactive algorithm and data structure visualizers for React.

[![Storybook](https://img.shields.io/badge/Storybook-Live%20Demo-ff4785?logo=storybook&logoColor=white)](https://6934a2d9e17d1e509a92c935-rdicbxowdr.chromatic.com/)
[![npm version](https://img.shields.io/npm/v/@tomaszjarosz/react-visualizers)](https://www.npmjs.com/package/@tomaszjarosz/react-visualizers)

## Live Demo

**[View all visualizers in Storybook](https://6934a2d9e17d1e509a92c935-rdicbxowdr.chromatic.com/)**

## Installation

```bash
npm install @tomaszjarosz/react-visualizers
```

## Requirements

- React 17+
- Tailwind CSS 4+

## Available Visualizers

### Algorithms
| Visualizer | Description |
|------------|-------------|
| `BinarySearchVisualizer` | Binary search with O(log n) visualization |
| `SortingVisualizer` | Step-by-step sorting algorithm |
| `SortingComparisonVisualizer` | Side-by-side algorithm comparison |
| `GraphVisualizer` | DFS/BFS graph traversal |
| `DijkstraVisualizer` | Shortest path algorithm |
| `DPVisualizer` | Dynamic programming table |

### Data Structures
| Visualizer | Description |
|------------|-------------|
| `ArrayListVisualizer` | Dynamic array with resizing |
| `LinkedListVisualizer` | Node-based list operations |
| `HashMapVisualizer` | Hash table with buckets |
| `HashTableVisualizer` | Hash function internals |
| `ArrayDequeVisualizer` | Circular buffer deque |
| `PriorityQueueVisualizer` | Min-heap operations |
| `TreeSetVisualizer` | Red-Black tree (BST) |
| `LinkedHashMapVisualizer` | Hash + insertion order |
| `EnumSetVisualizer` | Bit vector set |

### Concurrency
| Visualizer | Description |
|------------|-------------|
| `BlockingQueueVisualizer` | Producer-consumer pattern |
| `ConcurrentHashMapVisualizer` | Segment-based locking |
| `CopyOnWriteVisualizer` | Copy-on-write pattern |
| `ImmutableCollectionsVisualizer` | Java 9+ immutable collections |

### Other
| Visualizer | Description |
|------------|-------------|
| `GCVisualizer` | JVM garbage collection |
| `SQLJoinVisualizer` | SQL JOIN operations |

## Usage

```tsx
import { BinarySearchVisualizer, HashMapVisualizer } from '@tomaszjarosz/react-visualizers';

function App() {
  return (
    <div>
      <BinarySearchVisualizer showControls={true} showCode={true} />
      <HashMapVisualizer showControls={true} showCode={true} />
    </div>
  );
}
```

### Props

All visualizers accept these props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showControls` | `boolean` | `true` | Show playback controls |
| `showCode` | `boolean` | `true` | Show code panel |
| `className` | `string` | `''` | Additional CSS classes |

## Shared Components

```tsx
import {
  ControlPanel,
  CodePanel,
  Legend,
  StatusPanel,
  VisualizationArea,
  HelpPanel
} from '@tomaszjarosz/react-visualizers';
```

## Development

```bash
# Run Storybook locally
pnpm run storybook

# Build library
pnpm run build

# Type check
pnpm run typecheck
```

## License

MIT
