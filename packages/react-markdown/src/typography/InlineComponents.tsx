import React from 'react';

export interface InlineProps {
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
}

export const Strong: React.FC<InlineProps> = ({ children, className }) => (
  <strong className={className || "font-bold text-gray-900"}>{children}</strong>
);

export const Emphasis: React.FC<InlineProps> = ({ children, className }) => (
  <em className={className || "italic text-gray-700"}>{children}</em>
);

export const HorizontalRule: React.FC<{ className?: string }> = ({ className }) => (
  <hr className={className || "my-3 border-t-2 border-gray-200"} />
);

export const Strikethrough: React.FC<InlineProps> = ({ children, className }) => (
  <del className={className || "line-through text-gray-500"}>{children}</del>
);
