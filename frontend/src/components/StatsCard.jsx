import clsx from 'clsx'

export default function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  className 
}) {
  const changeColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-dark-500',
  }
  
  return (
    <div className={clsx("card p-6", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-dark-500 dark:text-dark-400">
            {title}
          </p>
          <p className="text-2xl font-bold mt-1">
            {value}
          </p>
          {change && (
            <p className={clsx("text-sm mt-1", changeColors[changeType])}>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900">
            <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
        )}
      </div>
    </div>
  )
}
