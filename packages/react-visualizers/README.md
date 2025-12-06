# @tomaszjarosz/react-visualizers

Interactive algorithm and data structure visualizers for React.

## Installation

```bash
pnpm add @tomaszjarosz/react-visualizers
# or
npm install @tomaszjarosz/react-visualizers
```

## Features

- **Algorithm Visualizers**: Binary Search, Sorting (Bubble, Quick, Merge), Dijkstra, Dynamic Programming
- **Data Structure Visualizers**: HashMap, LinkedList, TreeSet, PriorityQueue, ArrayDeque
- **Concurrency Visualizers**: ConcurrentHashMap, BlockingQueue, CopyOnWrite

## Usage

```tsx
import { SortingVisualizer, HashMapVisualizer } from '@tomaszjarosz/react-visualizers';

function App() {
  return (
    <div>
      <SortingVisualizer
        algorithm="quicksort"
        data={[5, 2, 8, 1, 9, 3]}
      />

      <HashMapVisualizer
        initialCapacity={16}
        loadFactor={0.75}
      />
    </div>
  );
}
```

## Available Components

### Algorithm Visualizers

| Component | Description |
|-----------|-------------|
| `BinarySearchVisualizer` | Step-by-step binary search animation |
| `SortingVisualizer` | Multiple sorting algorithms comparison |
| `DijkstraVisualizer` | Shortest path algorithm visualization |
| `DPVisualizer` | Dynamic programming visualization |
| `GraphVisualizer` | Graph traversal (BFS, DFS) |

### Collection Visualizers

| Component | Description |
|-----------|-------------|
| `HashMapVisualizer` | HashMap internal structure |
| `LinkedListVisualizer` | Linked list pointer animations |
| `TreeSetVisualizer` | Red-black tree structure |
| `PriorityQueueVisualizer` | Heap structure and operations |
| `ArrayDequeVisualizer` | Double-ended queue operations |

### Shared Components

| Component | Description |
|-----------|-------------|
| `ControlPanel` | Play/pause/step controls |
| `CodePanel` | Algorithm code display |
| `Legend` | Color/symbol legend |

## License

MIT
