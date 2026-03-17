import clsx from 'clsx'

export default function DataTable({ columns, data, emptyMessage = 'No data available' }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-dark-500">
        {emptyMessage}
      </div>
    )
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dark-200 dark:border-dark-700">
            {columns.map((column) => (
              <th
                key={column.key}
                className={clsx(
                  "px-4 py-3 text-left text-sm font-medium text-dark-500 dark:text-dark-400",
                  column.className
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-dark-100 dark:border-dark-800 hover:bg-dark-50 dark:hover:bg-dark-800/50"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={clsx(
                    "px-4 py-3 text-sm",
                    column.cellClassName
                  )}
                >
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
