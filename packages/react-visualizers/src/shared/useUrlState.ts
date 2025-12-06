import { useState, useEffect, useCallback } from 'react';

export interface VisualizerState {
  array?: number[];
  algorithm?: string;
  step?: number;
  speed?: number;
}

export interface UseUrlStateOptions {
  prefix?: string;
  enabled?: boolean;
  scrollToId?: string;
}

export interface UseUrlStateReturn {
  state: VisualizerState | null;
  updateUrl: (state: VisualizerState) => void;
  getShareableUrl: (state: VisualizerState) => string;
  copyUrlToClipboard: (state: VisualizerState) => Promise<boolean>;
  clearUrlState: () => void;
}

function encodeState(state: VisualizerState): string {
  const parts: string[] = [];

  if (state.array && state.array.length > 0) {
    parts.push(`a=${state.array.join(',')}`);
  }
  if (state.algorithm) {
    parts.push(`alg=${state.algorithm}`);
  }
  if (state.step !== undefined) {
    parts.push(`s=${state.step}`);
  }
  if (state.speed !== undefined) {
    parts.push(`sp=${state.speed}`);
  }

  return parts.join('&');
}

function decodeState(hash: string): VisualizerState | null {
  if (!hash || hash === '#') return null;

  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const state: VisualizerState = {};

  const arrayStr = params.get('a');
  if (arrayStr) {
    const numbers = arrayStr.split(',').map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));
    if (numbers.length > 0) {
      state.array = numbers;
    }
  }

  const algorithm = params.get('alg');
  if (algorithm) {
    state.algorithm = algorithm;
  }

  const step = params.get('s');
  if (step) {
    const stepNum = parseInt(step, 10);
    if (!isNaN(stepNum)) {
      state.step = stepNum;
    }
  }

  const speed = params.get('sp');
  if (speed) {
    const speedNum = parseInt(speed, 10);
    if (!isNaN(speedNum)) {
      state.speed = speedNum;
    }
  }

  return Object.keys(state).length > 0 ? state : null;
}

export function useUrlState(options: UseUrlStateOptions = {}): UseUrlStateReturn {
  const { prefix = '', enabled = true, scrollToId } = options;
  const [state, setState] = useState<VisualizerState | null>(null);

  // Read initial state from URL on mount and scroll to visualizer if needed
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const hash = window.location.hash;
    const decoded = decodeState(hash);
    if (decoded) {
      setState(decoded);
      // Scroll to visualizer after a short delay to ensure component is rendered
      if (scrollToId) {
        setTimeout(() => {
          const element = document.getElementById(scrollToId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [enabled, scrollToId]);

  // Update URL with current state
  const updateUrl = useCallback(
    (newState: VisualizerState) => {
      if (!enabled || typeof window === 'undefined') return;

      const encoded = encodeState(newState);
      const newHash = prefix ? `${prefix}-${encoded}` : encoded;

      // Use replaceState to avoid polluting history
      window.history.replaceState(null, '', `#${newHash}`);
    },
    [enabled, prefix]
  );

  // Get shareable URL without modifying current URL
  const getShareableUrl = useCallback(
    (shareState: VisualizerState): string => {
      if (typeof window === 'undefined') return '';

      const encoded = encodeState(shareState);
      const hash = prefix ? `${prefix}-${encoded}` : encoded;
      const url = new URL(window.location.href);
      url.hash = hash;
      return url.toString();
    },
    [prefix]
  );

  // Copy shareable URL to clipboard
  const copyUrlToClipboard = useCallback(
    async (shareState: VisualizerState): Promise<boolean> => {
      const url = getShareableUrl(shareState);

      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(url);
          return true;
        } catch {
          return false;
        }
      }

      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      } catch {
        return false;
      }
    },
    [getShareableUrl]
  );

  // Clear URL state
  const clearUrlState = useCallback(() => {
    if (typeof window === 'undefined') return;

    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setState(null);
  }, []);

  return {
    state,
    updateUrl,
    getShareableUrl,
    copyUrlToClipboard,
    clearUrlState,
  };
}

export default useUrlState;
