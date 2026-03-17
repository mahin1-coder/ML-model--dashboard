import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

const variants = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: Info,
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: CheckCircle,
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: AlertTriangle,
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: AlertCircle,
  },
}

export default function Alert({ variant = 'info', title, children, className }) {
  const styles = variants[variant]
  const Icon = styles.icon
  
  return (
    <div
      className={clsx(
        "rounded-lg border p-4",
        styles.bg,
        styles.border,
        className
      )}
    >
      <div className="flex">
        <Icon className={clsx("w-5 h-5 flex-shrink-0", styles.text)} />
        <div className="ml-3">
          {title && (
            <h3 className={clsx("text-sm font-medium", styles.text)}>
              {title}
            </h3>
          )}
          {children && (
            <div className={clsx("text-sm mt-1", styles.text)}>
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
