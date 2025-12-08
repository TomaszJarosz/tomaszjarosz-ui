import React from 'react';

interface FlowDiagramProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Component for rendering flow/architecture diagrams with arrow indicators.
 * Converts text arrows (→, ←) into styled arrow elements.
 *
 * @example
 * ```tsx
 * <FlowDiagram>
 *   Client → API Gateway → Service → Database
 * </FlowDiagram>
 * ```
 */
const FlowDiagram: React.FC<FlowDiagramProps> = ({
  children,
  className = '',
}) => {
  // Replace text arrows with styled elements
  const processFlowText = (text: React.ReactNode): React.ReactNode => {
    if (typeof text !== 'string') return text;

    // Find and replace arrows
    const parts = text.split(/(\s→\s|\s←\s|\s→|\s←|→|←)/);

    return parts.map((part, index) => {
      if (part.includes('→')) {
        return (
          <span key={index} className="rm-flow-diagram__arrow">
            <svg
              className="rm-flow-diagram__arrow-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        );
      }
      if (part.includes('←')) {
        return (
          <span key={index} className="rm-flow-diagram__arrow">
            <svg
              className="rm-flow-diagram__arrow-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`rm-flow-diagram ${className}`.trim()}>
      <div className="rm-flow-diagram__container">
        <code className="rm-flow-diagram__code">
          {processFlowText(children)}
        </code>
      </div>
    </div>
  );
};

export default FlowDiagram;
export { FlowDiagram };
export type { FlowDiagramProps };
