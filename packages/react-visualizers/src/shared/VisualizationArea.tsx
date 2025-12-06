import React from 'react';

export interface VisualizationAreaProps {
  children: React.ReactNode;
  minHeight?: number;
  className?: string;
}

/**
 * Container for visualization content with fixed minimum height
 * to prevent layout shifts during animation steps.
 */
export const VisualizationArea: React.FC<VisualizationAreaProps> = ({
  children,
  minHeight = 300,
  className = '',
}) => {
  return (
    <div
      className={`relative ${className}`}
      style={{ minHeight: `${minHeight}px` }}
    >
      {children}
    </div>
  );
};

export default VisualizationArea;
