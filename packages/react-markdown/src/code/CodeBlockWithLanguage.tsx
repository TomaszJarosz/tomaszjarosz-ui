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
    <div
      className="my-1.5 rounded-md shadow-sm border border-gray-200 relative"
      style={codeStyle}
    >
      <CodeBlockHeader language={language} isDiff={isDiff} lineCount={lineCount} />
      <div className="relative">
        <CopyCodeButton code={code} />
        <div
          className={`overflow-x-auto transition-all duration-300 ${
            isCollapsed && isCollapsible ? 'overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800' : ''
          }`}
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
        {/* Fade overlay when collapsed - subtle transparent darkening */}
        {isCollapsible && isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
        )}
      </div>
      {/* Expand/Collapse button - matches gradient fade */}
      {isCollapsible && (
        <button
          onClick={toggleCollapse}
          className={`w-full py-2.5 px-4 text-xs font-medium flex items-center justify-center gap-2 transition-all rounded-b-md ${
            isCollapsed
              ? 'bg-black/70 text-blue-400 hover:bg-black/80 hover:text-blue-300'
              : 'bg-black/70 text-gray-400 hover:bg-black/80 hover:text-gray-300'
          }`}
        >
          {isCollapsed ? (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              <span>Show all {lineCount} lines</span>
            </>
          ) : (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
