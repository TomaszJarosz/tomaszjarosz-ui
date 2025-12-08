import React from 'react';
import {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  UnorderedList,
  OrderedList,
  ListItem,
  Table,
  TableHeader,
  TableCell,
  BlockquoteComponent,
  Strong,
  Emphasis,
  HorizontalRule,
} from '../typography';
import { ParagraphComponent } from '../paragraph';
import { LinkComponent, ImageComponent } from '../media';
import { CodeBlockWithLanguage, SimpleCodeBlock, InlineCode } from '../code';
import { MermaidDiagram } from '../diagram';
import type {
  MarkdownComponentProps,
  MarkdownComponents,
  HeadingProps,
  DetectCallout,
  GetContentOptimizedStyle,
  GenerateHeadingId,
} from './types';

/**
 * Helper to parse highlight lines from className
 */
const parseHighlightLines = (className: string): number[] => {
  const match = /\{([^}]+)\}/.exec(className);
  if (!match) return [];

  const ranges = match[1].split(',');
  const lines: number[] = [];

  ranges.forEach((range) => {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        lines.push(i);
      }
    } else {
      lines.push(Number(range));
    }
  });

  return lines;
};

const createHeading = (
  Component: React.FC<HeadingProps>,
  id: string,
  children: React.ReactNode
) => <Component id={id}>{children}</Component>;

export interface CreateMarkdownComponentsOptions {
  /** Function to generate heading IDs */
  generateHeadingId: GenerateHeadingId;
  /** Function to detect callouts in text */
  detectCallout: DetectCallout;
  /** Function to get optimized styles for content */
  contentOptimizedStyle?: GetContentOptimizedStyle;
  /** Custom code component for handling visualizers etc. */
  codeComponent?: React.ComponentType<MarkdownComponentProps & { inline?: boolean }>;
  /** Patterns for internal links */
  internalLinkPatterns?: (string | RegExp)[];
}

/**
 * Factory function to create markdown component mappings
 */
export const createMarkdownComponents = ({
  generateHeadingId,
  detectCallout,
  contentOptimizedStyle = () => ({}),
  codeComponent,
  internalLinkPatterns,
}: CreateMarkdownComponentsOptions): MarkdownComponents => {
  // Default code component
  const CodeComponent = codeComponent || (({
    inline,
    className,
    children,
    ...props
  }: MarkdownComponentProps & { inline?: boolean }) => {
    const match = /language-([\w-]+)/.exec(className || '');
    const language = match ? match[1] : '';
    const codeContent = String(children).replace(/\n$/, '');
    const highlightLines = className ? parseHighlightLines(className) : [];

    // Mermaid diagrams
    if (language === 'mermaid') {
      return <MermaidDiagram chart={codeContent} />;
    }

    // Inline code
    if (
      inline ||
      (!language && codeContent.length < 50 && !codeContent.includes('\n'))
    ) {
      return <InlineCode {...props}>{children}</InlineCode>;
    }

    // Code blocks with language
    if (!inline && language) {
      const codeStyle = contentOptimizedStyle('code');

      return (
        <CodeBlockWithLanguage
          language={language}
          code={codeContent}
          highlightLines={highlightLines}
          codeStyle={codeStyle}
          props={props}
        />
      );
    }

    // Code blocks without language
    return (
      <SimpleCodeBlock code={codeContent} props={props}>
        {children}
      </SimpleCodeBlock>
    );
  });

  return {
    // Headings
    h1: ({ children }: MarkdownComponentProps) =>
      createHeading(H1, generateHeadingId(children), children),
    h2: ({ children }: MarkdownComponentProps) =>
      createHeading(H2, generateHeadingId(children), children),
    h3: ({ children }: MarkdownComponentProps) =>
      createHeading(H3, generateHeadingId(children), children),
    h4: ({ children }: MarkdownComponentProps) =>
      createHeading(H4, generateHeadingId(children), children),
    h5: ({ children }: MarkdownComponentProps) =>
      createHeading(H5, generateHeadingId(children), children),
    h6: ({ children }: MarkdownComponentProps) =>
      createHeading(H6, generateHeadingId(children), children),

    // Paragraphs
    p: ({ children }: MarkdownComponentProps) => (
      <ParagraphComponent detectCallout={detectCallout}>
        {children}
      </ParagraphComponent>
    ),

    // Lists
    ul: ({ children }: MarkdownComponentProps) => (
      <UnorderedList>{children}</UnorderedList>
    ),
    ol: ({ children }: MarkdownComponentProps) => (
      <OrderedList>{children}</OrderedList>
    ),
    li: ({ children }: MarkdownComponentProps) => (
      <ListItem>{children}</ListItem>
    ),

    // Code
    code: CodeComponent as React.ComponentType<MarkdownComponentProps>,

    // Blockquotes
    blockquote: ({ children }: MarkdownComponentProps) => (
      <BlockquoteComponent>{children}</BlockquoteComponent>
    ),

    // Tables
    table: ({ children }: MarkdownComponentProps) => <Table>{children}</Table>,
    th: ({ children }: MarkdownComponentProps) => (
      <TableHeader>{children}</TableHeader>
    ),
    td: ({ children }: MarkdownComponentProps) => (
      <TableCell>{children}</TableCell>
    ),

    // Links
    a: ({ children, href }: MarkdownComponentProps) => (
      <LinkComponent
        href={href}
        internalPatterns={internalLinkPatterns}
      >
        {children}
      </LinkComponent>
    ),

    // Images
    img: ({ src, alt }: MarkdownComponentProps) => (
      <ImageComponent src={src} alt={alt} />
    ),

    // Misc
    hr: () => <HorizontalRule />,
    br: () => <br />,
    strong: ({ children }: MarkdownComponentProps) => (
      <Strong>{children}</Strong>
    ),
    em: ({ children }: MarkdownComponentProps) => (
      <Emphasis>{children}</Emphasis>
    ),
  };
};
