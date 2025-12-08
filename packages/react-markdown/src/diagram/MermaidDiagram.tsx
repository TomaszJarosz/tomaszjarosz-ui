import React, { useEffect, useRef, useState, useCallback } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { Loader2, AlertCircle } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
  onError?: (error: Error) => void;
}

/**
 * Component for rendering Mermaid diagrams with lazy loading
 */
export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  chart,
  className = '',
  onError,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mermaid, setMermaid] = useState<
    typeof import('mermaid').default | null
  >(null);

  // Dynamically load Mermaid only when needed
  useEffect(() => {
    const loadMermaid = async () => {
      try {
        const mermaidModule = await import('mermaid');
        const mermaidInstance = mermaidModule.default;

        mermaidInstance.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'strict',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis',
          },
          sequence: {
            useMaxWidth: true,
            wrap: true,
          },
          gantt: {
            useMaxWidth: true,
          },
          journey: {
            useMaxWidth: true,
          },
          pie: {
            useMaxWidth: true,
          },
          er: {
            useMaxWidth: true,
          },
          class: {
            useMaxWidth: true,
          },
          state: {
            useMaxWidth: true,
          },
        });
        setMermaid(mermaidInstance);
        setIsInitialized(true);
      } catch (err) {
        console.error('Mermaid loading/initialization error:', err);
        const errorMsg = 'Failed to load Mermaid library';
        setError(errorMsg);
        setIsLoading(false);
        onError?.(new Error(errorMsg));
      }
    };

    if (!isInitialized && !mermaid) {
      loadMermaid();
    }
  }, [isInitialized, mermaid, onError]);

  const renderDiagram = useCallback(async () => {
    if (!ref.current || !chart || !isInitialized || !mermaid) return;

    try {
      setIsLoading(true);
      setError(null);

      // Clear previous diagram
      if (ref.current) {
        ref.current.innerHTML = '';
      }

      // Generate unique ID for the diagram
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Check if chart is not empty
      if (!chart.trim()) {
        throw new Error('Chart content is empty');
      }

      // Render diagram with timeout
      const renderPromise = mermaid.render(id, chart);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Rendering timeout')), 10000)
      );

      const result = (await Promise.race([renderPromise, timeoutPromise])) as {
        svg: string;
      };
      const { svg } = result;

      // Check if ref still exists before inserting
      if (!ref.current) {
        console.warn('Ref became null during rendering');
        return;
      }

      // Sanitize SVG before inserting to prevent XSS attacks
      const sanitizedSvg = DOMPurify.sanitize(svg, {
        USE_PROFILES: { svg: true, svgFilters: true },
        ADD_TAGS: ['use', 'foreignObject', 'tspan'],
        ADD_ATTR: ['xlink:href', 'xmlns', 'xmlns:xlink', 'xml:space'],
      });

      // Insert sanitized SVG to DOM
      if (ref.current) {
        ref.current.innerHTML = sanitizedSvg;
      }

      // Add responsive styling to SVG
      const svgElement = ref.current?.querySelector('svg');
      if (svgElement) {
        svgElement.style.maxWidth = '100%';
        svgElement.style.height = 'auto';
        svgElement.style.display = 'block';
        svgElement.style.margin = '0 auto';
        svgElement.removeAttribute('width');
      }
    } catch (err: unknown) {
      console.error('Mermaid rendering error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to render diagram';
      setError(errorMsg);
      onError?.(err instanceof Error ? err : new Error(errorMsg));
    } finally {
      setIsLoading(false);
    }
  }, [chart, isInitialized, mermaid, onError]);

  useEffect(() => {
    if (isInitialized && ref.current && chart && mermaid) {
      renderDiagram();
    }
  }, [chart, isInitialized, mermaid, renderDiagram]);

  if (error) {
    return (
      <div className={className || 'rm-mermaid-error'}>
        <div className="rm-mermaid-error-header">
          <AlertCircle />
          <span>Diagram Error</span>
        </div>
        <p className="rm-mermaid-error-message">{error}</p>
        <details className="rm-mermaid-error-details">
          <summary>Show diagram source</summary>
          <pre className="rm-mermaid-error-source">{chart}</pre>
        </details>
        <div className="rm-mermaid-error-hint">
          Try refreshing the page or check the diagram syntax.
        </div>
      </div>
    );
  }

  return (
    <div className={className || 'rm-mermaid-wrapper'}>
      {isLoading && (
        <div className="rm-mermaid-loading">
          <Loader2 />
          <span>
            {!mermaid ? 'Loading Mermaid library...' : 'Rendering diagram...'}
          </span>
        </div>
      )}

      <div
        ref={ref}
        className={`rm-mermaid-diagram${isLoading ? ' rm-mermaid-hidden' : ''}`}
      />

      {!isLoading && !error && (
        <div className="rm-mermaid-label">
          <span>Mermaid Diagram</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(MermaidDiagram);
