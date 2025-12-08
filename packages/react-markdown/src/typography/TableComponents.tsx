import React from 'react';

export interface TableProps {
  children: React.ReactNode;
  /** Custom class name for the table wrapper */
  className?: string;
}

export interface CellProps {
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className }) => (
  <div className={className || "overflow-x-auto my-1 rounded-md border border-gray-200 shadow-sm"}>
    <table className="min-w-full border-collapse">{children}</table>
  </div>
);

export const TableHeader: React.FC<CellProps> = ({ children, className }) => (
  <th className={className || "border-b border-gray-300 bg-gray-50 px-2 py-1 text-left font-semibold text-gray-800 text-xs"}>
    {children}
  </th>
);

export const TableCell: React.FC<CellProps> = ({ children, className }) => (
  <td className={className || "border-b border-gray-200 px-2 py-1 text-gray-700 text-xs"}>
    {children}
  </td>
);

export const TableRow: React.FC<TableProps> = ({ children, className }) => (
  <tr className={className}>{children}</tr>
);

export const TableHead: React.FC<TableProps> = ({ children, className }) => (
  <thead className={className}>{children}</thead>
);

export const TableBody: React.FC<TableProps> = ({ children, className }) => (
  <tbody className={className}>{children}</tbody>
);
