/**
 * @tomaszjarosz/react-visualizers
 *
 * Interactive algorithm and data structure visualizers for React.
 */

// Visualizers
export { BinarySearchVisualizer } from './visualizers/BinarySearchVisualizer';
export { SortingVisualizer } from './visualizers/SortingVisualizer';
export { HashMapVisualizer } from './visualizers/HashMapVisualizer';

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
