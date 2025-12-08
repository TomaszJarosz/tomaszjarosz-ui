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
  <div className={className || 'rm-table-wrapper'}>
    <table className="rm-table">{children}</table>
  </div>
);

export const TableHeader: React.FC<CellProps> = ({ children, className }) => (
  <th className={className || 'rm-th'}>{children}</th>
);

export const TableCell: React.FC<CellProps> = ({ children, className }) => (
  <td className={className || 'rm-td'}>{children}</td>
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
