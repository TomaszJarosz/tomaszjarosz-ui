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

export {
  parseHighlightLines,
  extractLanguage,
} from './highlightUtils';

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
