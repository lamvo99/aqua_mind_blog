export interface TableCell {
  _key?: string
  value?: string
}

export interface TableRow {
  _key?: string
  cells?: TableCell[]
}

export interface TableColumn {
  _key?: string
  label?: string
}

export interface TableBlockData {
  _key?: string
  _type?: string
  caption?: string
  hasHeader?: boolean
  columns?: TableColumn[]
  rows?: TableRow[]
}

function cellValue(cell: TableCell | null | undefined): string {
  return typeof cell?.value === "string" ? cell.value : ""
}

export default function ResponsiveTable({ data }: { data: TableBlockData }) {
  const columns = data?.columns ?? []
  const rows = data?.rows ?? []
  const columnCount = Math.max(
    columns.length,
    ...rows.map((row) => row?.cells?.length ?? 0),
  )
  const hasHeader = data?.hasHeader !== false

  const wrapperClass =
    "my-8 overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700/60 shadow-sm"
  const tableClass = "w-full min-w-[480px] border-collapse text-sm"
  const headClass = "bg-aqua-50 dark:bg-aqua-950/40"
  const thClass =
    "px-4 py-3 text-left font-semibold text-gray-900 dark:text-slate-100"
  const trClass =
    "border-b border-gray-200 dark:border-slate-700/60 even:bg-gray-50/60 dark:even:bg-slate-800/20 last:border-0"
  const tdClass =
    "px-4 py-3 align-top break-words text-gray-700 dark:text-slate-300"

  if (columnCount === 0) return null

  return (
    <div className={wrapperClass} data-testid="responsive-table">
      <table className={tableClass}>
        {data.caption ? (
          <caption className="px-4 pt-3 pb-1 text-left text-sm font-medium text-gray-500 dark:text-slate-400">
            {data.caption}
          </caption>
        ) : null}
        {hasHeader && columns.length > 0 ? (
          <thead className={headClass}>
            <tr>
              {columns.map((col, i) => (
                <th key={col._key || `col-${i}`} scope="col" className={thClass}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {rows.map((row, i) => (
            <tr key={row._key || `row-${i}`} className={trClass}>
              {Array.from({ length: columnCount }, (_, c) => (
                <td key={`cell-${c}`} className={tdClass}>
                  {cellValue(row.cells?.[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}