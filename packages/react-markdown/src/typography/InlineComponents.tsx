import React from 'react';

export interface InlineProps {
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
}

export const Strong: React.FC<InlineProps> = ({ children, className }) => (
  <strong className={className || 'rm-strong'}>{children}</strong>
);

export const Emphasis: React.FC<InlineProps> = ({ children, className }) => (
  <em className={className || 'rm-em'}>{children}</em>
);

export const HorizontalRule: React.FC<{ className?: string }> = ({ className }) => (
  <hr className={className || 'rm-hr'} />
);

export const Strikethrough: React.FC<InlineProps> = ({ children, className }) => (
  <del className={className || 'rm-del'}>{children}</del>
);
