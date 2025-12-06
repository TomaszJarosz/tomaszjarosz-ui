import React, { lazy, Suspense, useMemo } from 'react';

const LazyCodeHighlighterComponent = lazy(() =>
  import('./LazyCodeHighlighter').then((mod) => ({
    default: mod.LazyCodeHighlighter,
  }))
);

interface LazyCodeHighlighterProps {
  code: string;
  language: string;
  highlightLines: number[];
  props?: Record<string, unknown>;
}

/**
 * Fallback component that shows code without syntax highlighting
 * Styled to match the final appearance to prevent layout shift
 */
const CodeFallback: React.FC<{ code: string }> = React.memo(({ code }) => (
  <pre
    className="bg-[#1e1e1e] text-gray-300 p-4 overflow-x-auto font-mono text-sm leading-relaxed"
    style={{ margin: 0, minHeight: '60px' }}
  >
    <code>{code}</code>
  </pre>
));

CodeFallback.displayName = 'CodeFallback';

/**
 * Wrapper component that lazy loads react-syntax-highlighter only when needed
 * This reduces initial bundle size by ~300KB (gzipped)
 */
export const LazyCodeHighlighterWrapper: React.FC<LazyCodeHighlighterProps> = (
  props
) => {
  // Memoize fallback to prevent re-renders during loading
  const fallback = useMemo(
    () => <CodeFallback code={props.code} />,
    [props.code]
  );

  return (
    <Suspense fallback={fallback}>
      <LazyCodeHighlighterComponent {...props} />
    </Suspense>
  );
};
