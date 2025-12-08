import React from 'react';

export interface ListProps {
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
}

export const UnorderedList: React.FC<ListProps> = ({ children, className }) => (
  <ul className={className || "mb-1 mt-0 pl-4 list-disc marker:text-gray-400 [margin-block:0]"}>
    {children}
  </ul>
);

export const OrderedList: React.FC<ListProps> = ({ children, className }) => (
  <ol className={className || "mb-1 mt-0 pl-4 list-decimal marker:text-gray-400 [margin-block:0]"}>
    {children}
  </ol>
);

export const ListItem: React.FC<ListProps> = ({ children, className }) => (
  <li className={className || "text-sm text-gray-700 leading-tight m-0 p-0"}>
    {children}
  </li>
);
