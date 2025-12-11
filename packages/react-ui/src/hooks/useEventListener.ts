import { useEffect, useRef } from 'react';

type EventTarget = Window | Document | HTMLElement | null;

export interface UseEventListenerOptions extends AddEventListenerOptions {
  /** Enable the listener (default: true) */
  enabled?: boolean;
}

/**
 * Hook for adding event listeners with automatic cleanup.
 *
 * Features:
 * - Type-safe event handling
 * - Automatic cleanup on unmount or dependency change
 * - Supports window, document, or any HTMLElement
 * - Configurable options (passive, capture, once)
 * - Can be conditionally enabled/disabled
 *
 * @param eventName - Name of the event to listen for
 * @param handler - Event handler function
 * @param element - Target element (default: window)
 * @param options - Event listener options
 *
 * @example
 * ```tsx
 * // Window scroll event (passive by default)
 * useEventListener('scroll', handleScroll);
 *
 * // Keyboard event on document
 * useEventListener('keydown', handleKeyDown, document);
 *
 * // Click on specific element
 * useEventListener('click', handleClick, buttonRef.current);
 *
 * // Conditionally enabled
 * useEventListener('mousemove', handleMove, window, { enabled: isTracking });
 * ```
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: Window | null,
  options?: UseEventListenerOptions
): void;

export function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  element: Document | null,
  options?: UseEventListenerOptions
): void;

export function useEventListener<K extends keyof HTMLElementEventMap>(
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  element: HTMLElement | null,
  options?: UseEventListenerOptions
): void;

export function useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  element: EventTarget = typeof window !== 'undefined' ? window : null,
  options: UseEventListenerOptions = {}
): void {
  const { enabled = true, ...listenerOptions } = options;

  // Store handler in ref to avoid recreating listener on handler change
  const savedHandler = useRef(handler);

  // Update ref when handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Skip if disabled or no element
    if (!enabled || !element) {
      return;
    }

    // Create event listener that calls current handler
    const eventListener = (event: Event) => {
      savedHandler.current(event);
    };

    // Default to passive for scroll/touch events for better performance
    const defaultPassive =
      eventName === 'scroll' ||
      eventName === 'touchstart' ||
      eventName === 'touchmove' ||
      eventName === 'wheel';

    const finalOptions: AddEventListenerOptions = {
      passive: defaultPassive,
      ...listenerOptions,
    };

    element.addEventListener(eventName, eventListener, finalOptions);

    return () => {
      element.removeEventListener(eventName, eventListener, finalOptions);
    };
  }, [
    eventName,
    element,
    enabled,
    listenerOptions.capture,
    listenerOptions.passive,
    listenerOptions.once,
  ]);
}

export default useEventListener;
