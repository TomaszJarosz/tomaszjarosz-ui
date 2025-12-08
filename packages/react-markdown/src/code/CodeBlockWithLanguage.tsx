import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CodeBlockHeader } from './CodeBlockHeader';
import { CopyCodeButton } from './CopyCodeButton';
import { LazyCodeHighlighterWrapper as LazyCodeHighlighter } from './LazyCodeHighlighterWrapper';

// Configuration for collapsible code blocks
const COLLAPSE_THRESHOLD = 30; // Lines threshold to enable collapse
const COLLAPSE_MARGIN = 1.3; // Only collapse if exceeds threshold by 30% (e.g., 30 lines threshold → collapse at 39+ lines)
const COLLAPSED_HEIGHT = 300; // Max height in px when collapsed

interface CodeBlockWithLanguageProps {
  language: string;
  code: string;
  highlightLines: number[];
  codeStyle: React.CSSProperties;
  props?: Record<string, unknown>;
  /** Custom class name for wrapper */
  className?: string;
}

/**
 * Code block component with syntax highlighting for a specific language
 * Automatically collapses long code blocks (>39 lines with smart threshold)
 */
export const CodeBlockWithLanguage: React.FC<CodeBlockWithLanguageProps> = ({
  language,
  code,
  highlightLines,
  codeStyle,
  props = {},
  className,
}) => {
  const isDiff = language === 'diff';

  // Count lines and determine if collapsible
  // Only collapse if code exceeds threshold by at least 30% to avoid collapsing nearly-fitting code
  const lineCount = useMemo(() => code.split('\n').length, [code]);
  const isCollapsible = lineCount > COLLAPSE_THRESHOLD * COLLAPSE_MARGIN;

  // Start collapsed if code is long
  const [isCollapsed, setIsCollapsed] = useState(isCollapsible);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className={className || 'rm-code-block'} style={codeStyle}>
      <CodeBlockHeader language={language} isDiff={isDiff} lineCount={lineCount} />
      <div className="rm-code-content">
        <CopyCodeButton code={code} />
        <div
          className={`rm-code-scroll${isCollapsed && isCollapsible ? ' rm-code-scroll-collapsed' : ''}`}
          style={{
            maxHeight: isCollapsed && isCollapsible ? COLLAPSED_HEIGHT : undefined,
          }}
        >
          <LazyCodeHighlighter
            code={code}
            language={language}
            highlightLines={highlightLines}
            props={props}
          />
        </div>
        {/* Fade overlay when collapsed */}
        {isCollapsible && isCollapsed && <div className="rm-code-fade" />}
      </div>
      {/* Expand/Collapse button */}
      {isCollapsible && (
        <button
          onClick={toggleCollapse}
          className={`rm-code-toggle${!isCollapsed ? ' rm-code-toggle-collapsed' : ''}`}
        >
          {isCollapsed ? (
            <>
              <ChevronDown />
              <span>Show all {lineCount} lines</span>
            </>
          ) : (
            <>
              <ChevronUp />
              <span>Collapse</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
