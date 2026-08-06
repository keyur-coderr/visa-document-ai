import { cn } from "@/lib/utilities/cn";
import { TableWrapper } from "@/components/ui/TableWrapper";

export interface TableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
}

/** Generic, presentation-only data table — no sorting/filtering logic. */
export function Table<T>({ columns, rows, getRowKey, onRowClick, className }: TableProps<T>) {
  return (
    <TableWrapper className={className}>
      <table className="w-full min-w-[640px] divide-y divide-[color:var(--color-border)] text-sm">
        <thead className="bg-[color:var(--color-surface-subtle)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={cn("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-secondary)]", column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--color-border)] bg-[color:var(--color-surface)]">
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "text-[color:var(--color-text-primary)]",
                onRowClick && "cursor-pointer transition-colors hover:bg-[color:var(--color-surface-subtle)]",
              )}
            >
              {columns.map((column) => (
                <td key={column.id} className={cn("px-4 py-3.5", column.className)}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  );
}
