/**
 * Markdown renderer utilities
 */

export {
  createMarkdownComponents,
  type CreateMarkdownComponentsOptions,
} from './createMarkdownComponents';

export {
  createHeadingIdGenerator,
  generateHeadingId,
} from './headingUtils';

export type {
  HeadingProps,
  MarkdownComponentProps,
  MarkdownComponentPropsWithExtras,
  GenerateHeadingId,
  GetContentOptimizedStyle,
  MarkdownComponents,
  CreateMarkdownComponentsParams,
  CodeComponentProps,
  MarkdownPlugin,
  MarkdownPlugins,
  CalloutType,
  CalloutResult,
  DetectCallout,
} from './types';
