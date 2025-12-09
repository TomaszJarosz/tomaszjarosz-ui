import React from 'react';

export interface VisualizationAreaProps {
  children: React.ReactNode;
  minHeight?: number;
  /** If true, height is fixed (not just minimum) with overflow scroll */
  fixedHeight?: boolean;
  className?: string;
}

/**
 * Container for visualization content with fixed minimum height
 * to prevent layout shifts during animation steps.
 */
export const VisualizationArea: React.FC<VisualizationAreaProps> = ({
  children,
  minHeight = 300,
  fixedHeight = false,
  className = '',
}) => {
  const style = fixedHeight
    ? { height: `${minHeight}px`, minHeight: `${minHeight}px`, maxHeight: `${minHeight}px` }
    : { minHeight: `${minHeight}px` };

  return (
    <div
      className={`relative ${fixedHeight ? 'overflow-auto' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default VisualizationArea;
