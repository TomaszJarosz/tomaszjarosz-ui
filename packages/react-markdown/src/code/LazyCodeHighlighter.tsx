import React, { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyCodeHighlighterProps {
  code: string;
  language: string;
  highlightLines: number[];
  props?: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LowlightInstance = any;

// Lazy-loaded lowlight instance
let lowlightInstance: LowlightInstance = null;
let lowlightPromise: Promise<LowlightInstance> | null = null;

const getLowlight = async (): Promise<LowlightInstance> => {
  if (lowlightInstance) return lowlightInstance;

  if (!lowlightPromise) {
    lowlightPromise = import('lowlight').then(({ createLowlight, all }) => {
      lowlightInstance = createLowlight(all);
      return lowlightInstance;
    });
  }

  return lowlightPromise;
};

// Pre-load lowlight
getLowlight();

// Convert lowlight AST to React elements
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderNode = (node: any, index: number): React.ReactNode => {
  if (node.type === 'text') {
    return node.value;
  }

  if (node.type === 'element') {
    const className = node.properties?.className;
    return React.createElement(
      node.tagName,
      {
        key: index,
        className: className?.join(' '),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      node.children?.map((child: any, i: number) => renderNode(child, i))
    );
  }

  return null;
};

export const LazyCodeHighlighter: React.FC<LazyCodeHighlighterProps> = ({
  code,
  language,
  highlightLines,
}) => {
  const [lowlight, setLowlight] = useState<LowlightInstance>(lowlightInstance);

  useEffect(() => {
    if (!lowlight) {
      getLowlight().then(setLowlight);
    }
  }, [lowlight]);

  const highlighted = useMemo(() => {
    if (!lowlight || !code) return null;

    try {
      // Try to highlight with specific language, fall back to auto-detect
      const result = lowlight.registered(language)
        ? lowlight.highlight(language, code)
        : lowlight.highlightAuto(code);

      return result;
    } catch {
      // If highlighting fails, return plain text
      return null;
    }
  }, [lowlight, code, language]);

  const lines = useMemo(() => {
    if (!highlighted || !lowlight) {
      return code.split('\n').map((line, i) => ({
        lineNumber: i + 1,
        content: <span>{line}</span>,
      }));
    }

    // Convert AST to string, then split by lines
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderToString = (nodes: any[]): string => {
      return nodes
        .map((node) => {
          if (node.type === 'text') return node.value;
          if (node.type === 'element' && node.children) {
            return renderToString(node.children);
          }
          return '';
        })
        .join('');
    };

    const fullText = renderToString(highlighted.children);
    const lineTexts = fullText.split('\n');

    // Re-highlight each line separately for proper line-by-line rendering
    return lineTexts.map((lineText, i) => {
      try {
        const lineResult = lowlight.registered(language)
          ? lowlight.highlight(language, lineText)
          : lowlight.highlightAuto(lineText);

        return {
          lineNumber: i + 1,
          content: (
            <>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {lineResult.children.map((child: any, idx: number) =>
                renderNode(child, idx)
              )}
            </>
          ),
        };
      } catch {
        return {
          lineNumber: i + 1,
          content: <span>{lineText}</span>,
        };
      }
    });
  }, [highlighted, code, language, lowlight]);

  if (!lowlight) {
    return (
      <div className="flex items-center justify-center gap-2 p-4 bg-gray-900 rounded-lg min-h-[60px] text-gray-400 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading syntax highlighter...</span>
      </div>
    );
  }

  return (
    <pre
      className="hljs"
      style={{
        background: '#1f2937',
        color: '#e8e8e8',
        margin: 0,
        padding: '1rem',
        overflow: 'auto',
      }}
    >
      <code style={{ color: 'inherit' }}>
        {lines.map(({ lineNumber, content }) => {
          const isHighlighted = highlightLines.includes(lineNumber);
          return (
            <div
              key={lineNumber}
              style={{
                display: 'block',
                paddingLeft: isHighlighted ? '4px' : '0',
                ...(isHighlighted && {
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  borderLeft: '3px solid #3b82f6',
                  marginLeft: '-1rem',
                  paddingLeft: 'calc(1rem + 4px)',
                }),
              }}
            >
              {content}
              {'\n'}
            </div>
          );
        })}
      </code>
    </pre>
  );
};
