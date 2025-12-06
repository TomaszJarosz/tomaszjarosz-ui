import React, { useMemo, useCallback } from 'react';
import { List, ChevronRight } from 'lucide-react';
import { useActiveSection, useScrollToSection, useReadingProgress } from '../hooks';
import type { TableOfContentsItem } from '../hooks';

interface TableOfContentsProps {
  /** Array of table of contents items */
  items: TableOfContentsItem[];
  /** Custom class for the container */
  className?: string;
  /** Title to display (default: "Table of Contents") */
  title?: string;
  /** Whether to show reading progress (default: true) */
  showProgress?: boolean;
  /** Offset from top when scrolling to section (default: 80) */
  scrollOffset?: number;
}

/**
 * Table of Contents component with navigation
 *
 * Features:
 * - Automatic active section tracking
 * - Smooth scroll to sections
 * - Reading progress indicator
 * - Responsive design
 *
 * @example
 * const items = [
 *   { id: 'intro', text: 'Introduction', level: 2, originalText: 'Introduction' },
 *   { id: 'setup', text: 'Setup', level: 2, originalText: 'Setup' },
 *   { id: 'config', text: 'Configuration', level: 3, originalText: 'Configuration' },
 * ];
 *
 * <TableOfContents items={items} />
 */
export const TableOfContents: React.FC<TableOfContentsProps> = ({
  items,
  className = '',
  title = 'Table of Contents',
  showProgress = true,
  scrollOffset = 80,
}) => {
  const activeSection = useActiveSection(items);
  const scrollToSection = useScrollToSection(scrollOffset);
  const readingProgress = useReadingProgress();

  const handleClick = useCallback(
    (sectionId: string) => {
      scrollToSection(sectionId);
    },
    [scrollToSection]
  );

  const getIndentClass = (level: number): string => {
    const indentMap: Record<number, string> = {
      1: 'pl-0',
      2: 'pl-0',
      3: 'pl-4',
      4: 'pl-8',
      5: 'pl-12',
      6: 'pl-16',
    };
    return indentMap[level] || 'pl-0';
  };

  const getFontSizeClass = (level: number): string => {
    const sizeMap: Record<number, string> = {
      1: 'text-sm font-semibold',
      2: 'text-sm font-medium',
      3: 'text-xs',
      4: 'text-xs',
      5: 'text-xs',
      6: 'text-xs',
    };
    return sizeMap[level] || 'text-xs';
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Header with progress */}
      <div className="relative">
        {showProgress && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-150"
              style={{ width: `${readingProgress}%` }}
              role="progressbar"
              aria-valuenow={readingProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Reading progress: ${readingProgress}%`}
            />
          </div>
        )}

        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <List className="h-3.5 w-3.5 text-white" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
          </div>

          {showProgress && (
            <span className="text-xs text-gray-500 font-medium tabular-nums">
              {readingProgress}%
            </span>
          )}
        </div>
      </div>

      {/* Navigation items */}
      <nav
        className="space-y-0.5 px-2 py-2 max-h-[60vh] overflow-y-auto"
        aria-label="Table of contents navigation"
      >
        {items.map((item) => {
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`
                w-full text-left flex items-center gap-1.5 py-1.5 px-2 rounded transition-all duration-200
                ${getIndentClass(item.level)}
                ${getFontSizeClass(item.level)}
                ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-2 border-blue-500 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
              title={item.originalText}
            >
              {isActive && (
                <ChevronRight className="h-3 w-3 text-blue-500 flex-shrink-0" />
              )}
              <span className="truncate leading-tight">{item.text}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
