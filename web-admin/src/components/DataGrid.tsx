import React from 'react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: string;
}

interface DataGridProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyStateMessage?: string;
}

export default function DataGrid<T>({ columns, data, keyExtractor, onRowClick, emptyStateMessage = "No records found" }: DataGridProps<T>) {
  if (!data || data.length === 0) {
    return (
      <div className="card glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        {emptyStateMessage}
      </div>
    );
  }

  return (
    <div className="card glass-panel data-grid-container" style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
      <table className="data-grid">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{ width: col.width, background: 'rgba(0,0,0,0.02)' }}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr 
              key={keyExtractor(row)} 
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default', transition: 'background 0.2s' }}
            >
              {columns.map((col, i) => (
                <td key={i}>
                  {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
