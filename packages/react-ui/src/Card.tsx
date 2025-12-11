import React from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardShadow = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Padding size */
  padding?: CardPadding;
  /** Shadow intensity */
  shadow?: CardShadow;
  /** Left accent border color */
  accentColor?: string;
  /** Enable hover effect */
  hover?: boolean;
  /** Make card clickable */
  onClick?: () => void;
  /** Additional className */
  className?: string;
  /** Overflow behavior */
  overflow?: 'visible' | 'hidden' | 'auto';
}

/**
 * Card Component
 *
 * Universal container component providing consistent card styling with:
 * - Flexible padding sizes (none, sm, md, lg)
 * - Multiple shadow intensities
 * - Optional left accent border
 * - Hover effects
 * - Overflow control
 *
 * @example
 * ```tsx
 * // Basic card
 * <Card>
 *   <h3>Title</h3>
 *   <p>Content</p>
 * </Card>
 *
 * // Card with accent border
 * <Card accentColor="#3b82f6" padding="lg">
 *   <h3>Important Card</h3>
 * </Card>
 *
 * // Interactive card
 * <Card hover onClick={() => navigate('/details')}>
 *   <p>Click me</p>
 * </Card>
 * ```
 */
export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  shadow = 'md',
  accentColor,
  hover = false,
  onClick,
  className = '',
  overflow = 'visible',
}) => {
  const cardClasses = [
    'card',
    padding !== 'none' ? `card--padding-${padding}` : '',
    shadow !== 'none' ? `card--shadow-${shadow}` : '',
    `card--overflow-${overflow}`,
    hover ? 'card--hover' : '',
    onClick ? 'card--clickable' : '',
    accentColor ? 'card--accent' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const style = accentColor
    ? ({ '--card-accent-color': accentColor } as React.CSSProperties)
    : undefined;

  return (
    <div className={cardClasses} onClick={onClick} style={style}>
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  /** Header content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * CardHeader Component - Standard header section for cards
 */
export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
}) => {
  return <div className={`card__header ${className}`}>{children}</div>;
};

export interface CardTitleProps {
  /** Title content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** HTML id attribute */
  id?: string;
}

/**
 * CardTitle Component - Standard title for cards
 */
export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className = '',
  id,
}) => {
  return (
    <h3 id={id} className={`card__title ${className}`}>
      {children}
    </h3>
  );
};

export interface CardFooterProps {
  /** Footer content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * CardFooter Component - Standard footer section for cards
 */
export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
}) => {
  return <div className={`card__footer ${className}`}>{children}</div>;
};

export default Card;
