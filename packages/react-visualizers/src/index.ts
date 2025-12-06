/**
 * @tomaszjarosz/react-visualizers
 *
 * Interactive algorithm and data structure visualizers for React.
 */

// Algorithm Visualizers
export { BinarySearchVisualizer } from './visualizers/BinarySearchVisualizer';
export { SortingVisualizer } from './visualizers/SortingVisualizer';
export { SortingComparisonVisualizer } from './visualizers/SortingComparisonVisualizer';
export { DijkstraVisualizer } from './visualizers/DijkstraVisualizer';
export { DPVisualizer } from './visualizers/DPVisualizer';
export { GraphVisualizer } from './visualizers/GraphVisualizer';

// Collection Visualizers
export { HashMapVisualizer } from './visualizers/HashMapVisualizer';
export { HashTableVisualizer } from './visualizers/HashTableVisualizer';
export { LinkedListVisualizer } from './visualizers/LinkedListVisualizer';
export { LinkedHashMapVisualizer } from './visualizers/LinkedHashMapVisualizer';
export { ArrayListVisualizer } from './visualizers/ArrayListVisualizer';
export { ArrayDequeVisualizer } from './visualizers/ArrayDequeVisualizer';
export { TreeSetVisualizer } from './visualizers/TreeSetVisualizer';
export { EnumSetVisualizer } from './visualizers/EnumSetVisualizer';
export { PriorityQueueVisualizer } from './visualizers/PriorityQueueVisualizer';

// Concurrency Visualizers
export { ConcurrentHashMapVisualizer } from './visualizers/ConcurrentHashMapVisualizer';
export { BlockingQueueVisualizer } from './visualizers/BlockingQueueVisualizer';
export { CopyOnWriteVisualizer } from './visualizers/CopyOnWriteVisualizer';
export { ImmutableCollectionsVisualizer } from './visualizers/ImmutableCollectionsVisualizer';

// Other Visualizers
export { GCVisualizer } from './visualizers/GCVisualizer';
export { SQLJoinVisualizer } from './visualizers/SQLJoinVisualizer';

// Shared components (for building custom visualizers)
export {
  ControlPanel,
  CodePanel,
  HelpPanel,
  Legend,
  StatusPanel,
  ArrayInput,
  StepHistory,
  VisualizationArea,
} from './shared';

// Hooks
export { useVisualizerPlayback, useUrlState } from './shared';

// Types
export type { ControlPanelProps } from './shared';
export type { LegendItem, LegendProps } from './shared';
export type { StatusPanelProps } from './shared';
export type { ArrayInputProps } from './shared';
export type { StepHistoryProps, Step } from './shared';
export type { VisualizationAreaProps } from './shared';
export type {
  UseVisualizerPlaybackOptions,
  UseVisualizerPlaybackReturn,
} from './shared';
export type {
  VisualizerState,
  UseUrlStateOptions,
  UseUrlStateReturn,
} from './shared';
