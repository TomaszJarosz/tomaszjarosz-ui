/**
 * @tomaszjarosz/react-visualizers
 *
 * Interactive algorithm and data structure visualizers for React.
 *
 * IMPORTANT: Import the CSS file in your application:
 * import '@tomaszjarosz/react-visualizers/styles.css';
 */

// Import CSS for Tailwind to scan and build
import './styles.css';

// Algorithm Visualizers
export { BinarySearchVisualizer } from './visualizers/BinarySearchVisualizer';
export { SortingVisualizer } from './visualizers/SortingVisualizer';
export { SortingComparisonVisualizer } from './visualizers/SortingComparisonVisualizer';
export { DijkstraVisualizer } from './visualizers/DijkstraVisualizer';
export { DPVisualizer } from './visualizers/DPVisualizer';
export { GraphVisualizer } from './visualizers/GraphVisualizer';

// Collection Visualizers
export { HashMapVisualizer } from './visualizers/HashMapVisualizer';
export { HashMapInterviewVisualizer } from './visualizers/HashMapInterviewVisualizer';
export { ListComparisonVisualizer } from './visualizers/ListComparisonVisualizer';

// Interview Mode Visualizers
export { TreeSetInterviewVisualizer } from './visualizers/TreeSetInterviewVisualizer';
export { SortingInterviewVisualizer } from './visualizers/SortingInterviewVisualizer';
export { GraphInterviewVisualizer } from './visualizers/GraphInterviewVisualizer';
export { BloomFilterInterviewVisualizer } from './visualizers/BloomFilterInterviewVisualizer';
export { BTreeInterviewVisualizer } from './visualizers/BTreeInterviewVisualizer';
export { DijkstraInterviewVisualizer } from './visualizers/DijkstraInterviewVisualizer';
export { DPInterviewVisualizer } from './visualizers/DPInterviewVisualizer';
export { ConsistentHashingInterviewVisualizer } from './visualizers/ConsistentHashingInterviewVisualizer';
export { RaftInterviewVisualizer } from './visualizers/RaftInterviewVisualizer';
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

// Probabilistic Data Structures
export { BloomFilterVisualizer } from './visualizers/BloomFilterVisualizer';

// Tree Structures
export { BTreeVisualizer } from './visualizers/BTreeVisualizer';

// Distributed Systems
export { ConsistentHashingVisualizer } from './visualizers/ConsistentHashingVisualizer';
export { RaftVisualizer } from './visualizers/RaftVisualizer';

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
export { useVisualizerPlayback, useUrlState, useInterviewMode } from './shared';

// Interview Mode
export { InterviewModePanel } from './shared';

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
export type {
  InterviewQuestion,
  InterviewResult,
  InterviewSession,
  UseInterviewModeOptions,
  UseInterviewModeReturn,
} from './shared';
