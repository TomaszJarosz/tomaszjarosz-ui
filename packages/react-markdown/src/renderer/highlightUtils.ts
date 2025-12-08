/**
 * Utilities for parsing line highlight specifications in code blocks
 */

/**
 * Parse line highlight specification from className
 * Supports: {1}, {1,3}, {1-5}, {1,3-5,10-12}
 *
 * @example
 * parseHighlightLines('language-java{1,3-5}') // [1, 3, 4, 5]
 * parseHighlightLines('language-typescript{1}') // [1]
 * parseHighlightLines('language-python') // []
 */
export const parseHighlightLines = (className: string): number[] => {
  const match = /\{([^}]+)\}/.exec(className);
  if (!match) return [];

  const ranges = match[1].split(',');
  const lines: number[] = [];

  ranges.forEach((range) => {
    const trimmed = range.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          lines.push(i);
        }
      }
    } else {
      const num = Number(trimmed);
      if (!isNaN(num)) {
        lines.push(num);
      }
    }
  });

  return lines;
};

/**
 * Extract language from className (removes highlight specification)
 *
 * @example
 * extractLanguage('language-java{1,3-5}') // 'java'
 * extractLanguage('language-typescript') // 'typescript'
 * extractLanguage('') // ''
 */
export const extractLanguage = (className: string): string => {
  const match = /language-([\w-]+)/.exec(className || '');
  return match ? match[1].replace(/\{.*\}$/, '') : '';
};
