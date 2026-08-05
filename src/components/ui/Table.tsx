import { cn } from "@/lib/utilities/cn";

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
    <div className={cn("overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800", className)}>
      <table className="w-full min-w-[640px] divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
        <thead className="bg-neutral-50 dark:bg-neutral-900">
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={cn("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400", column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "text-neutral-700 dark:text-neutral-300",
                onRowClick && "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/60",
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
    </div>
  );
}
