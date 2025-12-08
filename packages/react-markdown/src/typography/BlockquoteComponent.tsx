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
  <blockquote
    className={
      className ||
      "border-l-3 border-blue-500 pl-3 pr-2 italic text-gray-600 text-sm my-1 bg-gradient-to-r from-blue-50 to-transparent py-1 rounded-r-md relative leading-relaxed"
    }
  >
    <div className="absolute top-0.5 left-0.5 text-blue-300 text-xl leading-none">
      "
    </div>
    <div className="relative z-10">{children}</div>
  </blockquote>
);
