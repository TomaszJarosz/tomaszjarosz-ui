import { useState, useCallback, useEffect, RefObject } from 'react';

export interface UseKeyboardNavigationOptions {
  /** Total number of items in the list */
  itemCount: number;
  /** Callback when item is selected (Enter key) */
  onSelect: (index: number) => void;
  /** Enable/disable keyboard navigation */
  isEnabled?: boolean;
  /** Container element ref for scroll-into-view */
  containerRef?: RefObject<HTMLElement | null>;
  /** Data attribute to identify items for scrolling (default: 'data-item') */
  itemSelector?: string;
  /** Wrap around when reaching start/end of list */
  wrapAround?: boolean;
}

export interface UseKeyboardNavigationReturn {
  /** Currently selected index (-1 if none) */
  selectedIndex: number;
  /** Manually set selected index */
  setSelectedIndex: (index: number) => void;
  /** Reset selection to -1 */
  resetSelection: () => void;
}

/**
 * Hook for keyboard navigation in lists (search results, dropdowns, menus, etc.)
 *
 * Features:
 * - Arrow up/down to navigate
 * - Enter to select
 * - Escape to reset
 * - Auto-scroll selected item into view
 * - Wrap around navigation (optional)
 *
 * @example
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { selectedIndex, resetSelection } = useKeyboardNavigation({
 *   itemCount: items.length,
 *   onSelect: (index) => handleSelect(items[index]),
 *   isEnabled: isOpen,
 *   containerRef,
 * });
 *
 * return (
 *   <div ref={containerRef}>
 *     {items.map((item, i) => (
 *       <div
 *         key={item.id}
 *         data-item
 *         className={i === selectedIndex ? 'selected' : ''}
 *       >
 *         {item.label}
 *       </div>
 *     ))}
 *   </div>
 * );
 */
export function useKeyboardNavigation({
  itemCount,
  onSelect,
  isEnabled = true,
  containerRef,
  itemSelector = '[data-item]',
  wrapAround = true,
}: UseKeyboardNavigationOptions): UseKeyboardNavigationReturn {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Reset selection when item count changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [itemCount]);

  const scrollItemIntoView = useCallback(
    (index: number) => {
      if (!containerRef?.current) return;

      const items = containerRef.current.querySelectorAll(itemSelector);
      const item = items[index] as HTMLElement;

      if (item) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    },
    [containerRef, itemSelector]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isEnabled || itemCount === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => {
            let next: number;
            if (wrapAround) {
              next = prev < itemCount - 1 ? prev + 1 : 0;
            } else {
              next = Math.min(prev + 1, itemCount - 1);
            }
            scrollItemIntoView(next);
            return next;
          });
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => {
            let next: number;
            if (wrapAround) {
              next = prev > 0 ? prev - 1 : itemCount - 1;
            } else {
              next = Math.max(prev - 1, 0);
            }
            scrollItemIntoView(next);
            return next;
          });
          break;

        case 'Enter':
          if (selectedIndex >= 0) {
            e.preventDefault();
            onSelect(selectedIndex);
          }
          break;

        case 'Escape':
          setSelectedIndex(-1);
          break;
      }
    },
    [isEnabled, itemCount, selectedIndex, onSelect, scrollItemIntoView, wrapAround]
  );

  useEffect(() => {
    if (!isEnabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, handleKeyDown]);

  const resetSelection = useCallback(() => {
    setSelectedIndex(-1);
  }, []);

  return {
    selectedIndex,
    setSelectedIndex,
    resetSelection,
  };
}

export default useKeyboardNavigation;
