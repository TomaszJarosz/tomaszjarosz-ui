import React from 'react';

export interface AccessibleSVGProps extends React.SVGProps<SVGSVGElement> {
  /** Title for screen readers - required for accessibility */
  title: string;
  /** Optional detailed description for complex visualizations */
  description?: string;
  /** Children elements (SVG content) */
  children: React.ReactNode;
}

/**
 * Accessible SVG wrapper component
 * Provides proper ARIA attributes for screen reader support
 */
export const AccessibleSVG: React.FC<AccessibleSVGProps> = ({
  title,
  description,
  children,
  className,
  ...svgProps
}) => {
  const titleId = React.useId();
  const descId = React.useId();

  return (
    <svg
      role="img"
      aria-labelledby={description ? `${titleId} ${descId}` : titleId}
      className={className}
      {...svgProps}
    >
      <title id={titleId}>{title}</title>
      {description && <desc id={descId}>{description}</desc>}
      {children}
    </svg>
  );
};

export default AccessibleSVG;
