# @tomaszjarosz/react-visualizers

Interactive algorithm and data structure visualizers for React.

## Installation

```bash
npm install @tomaszjarosz/react-visualizers
```

## Requirements

- React 17+ or 18+
- Tailwind CSS

## Available Visualizers

### Sorting Algorithms
- `BubbleSortVisualizer`
- `SelectionSortVisualizer`
- `InsertionSortVisualizer`
- `MergeSortVisualizer`
- `QuickSortVisualizer`
- `HeapSortVisualizer`

### Data Structures
- `ArrayListVisualizer`
- `LinkedListVisualizer`
- `StackVisualizer`
- `QueueVisualizer`
- `HashMapVisualizer`
- `TreeSetVisualizer`
- `TreeMapVisualizer`
- `PriorityQueueVisualizer`
- `DequeVisualizer`

### Concurrency
- `ThreadPoolVisualizer`
- `SemaphoreVisualizer`
- `ReentrantLockVisualizer`
- `ReadWriteLockVisualizer`

### Other
- `RecursionTreeVisualizer`
- `BinarySearchVisualizer`

## Usage

```tsx
import { BubbleSortVisualizer, HashMapVisualizer } from '@tomaszjarosz/react-visualizers';

function App() {
  return (
    <div>
      <h2>Bubble Sort</h2>
      <BubbleSortVisualizer />
      
      <h2>HashMap Operations</h2>
      <HashMapVisualizer />
    </div>
  );
}
```

## Shared Components

```tsx
import { ControlPanel, CodePanel, Legend, StatusPanel } from '@tomaszjarosz/react-visualizers';
```

## License

MIT
