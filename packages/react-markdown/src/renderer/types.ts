import React from 'react';
import type { CalloutType, CalloutResult, DetectCallout } from '../paragraph';

/**
 * Re-export callout types for convenience
 */
export type { CalloutType, CalloutResult, DetectCallout };

/**
 * Heading component props
 */
export interface HeadingProps {
  children: React.ReactNode;
  id: string;
}

/**
 * Standard component props used by most markdown components
 */
export interface MarkdownComponentProps {
  children?: React.ReactNode;
  href?: string;
  src?: string;
  alt?: string;
  className?: string;
  node?: unknown; // react-markdown node type (from unified)
}

/**
 * Props for components that need additional HTML attributes
 */
export type MarkdownComponentPropsWithExtras = MarkdownComponentProps &
  React.HTMLAttributes<HTMLElement>;

/**
 * Function to generate heading IDs from text
 */
export type GenerateHeadingId = (text: React.ReactNode) => string;

/**
 * Function to get optimized styles for content
 */
export type GetContentOptimizedStyle = (type: string) => React.CSSProperties;

/**
 * Markdown components map (used by react-markdown)
 */
export type MarkdownComponents = {
  [key: string]: React.ComponentType<MarkdownComponentProps>;
};

/**
 * Props for createMarkdownComponents factory
 */
export interface CreateMarkdownComponentsParams {
  generateHeadingId: GenerateHeadingId;
  detectCallout: DetectCallout;
  contentOptimizedStyle: GetContentOptimizedStyle;
}

/**
 * Code component specific types
 */
export interface CodeComponentProps extends MarkdownComponentPropsWithExtras {
  inline?: boolean;
  getContentOptimizedStyle: GetContentOptimizedStyle;
}

/**
 * Remark/Rehype plugin type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MarkdownPlugin = any;

/**
 * React markdown plugins array
 */
export type MarkdownPlugins = MarkdownPlugin[];
