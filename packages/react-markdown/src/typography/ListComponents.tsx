import React from 'react';

export interface ListProps {
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
}

export const UnorderedList: React.FC<ListProps> = ({ children, className }) => (
  <ul className={className || 'rm-ul'}>{children}</ul>
);

export const OrderedList: React.FC<ListProps> = ({ children, className }) => (
  <ol className={className || 'rm-ol'}>{children}</ol>
);

export const ListItem: React.FC<ListProps> = ({ children, className }) => (
  <li className={className || 'rm-li'}>{children}</li>
);
