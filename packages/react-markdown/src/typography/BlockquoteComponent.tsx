import React from 'react';

export interface BlockquoteProps {
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
}

export const BlockquoteComponent: React.FC<BlockquoteProps> = ({
  children,
  className,
}) => (
  <blockquote className={className || 'rm-blockquote'}>
    <div className="rm-blockquote-quote">"</div>
    <div className="rm-blockquote-content">{children}</div>
  </blockquote>
);
