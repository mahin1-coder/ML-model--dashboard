import clsx from 'clsx'

export default function LoadingSpinner({ size = 'md', className }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }
  
  return (
    <div
      className={clsx(
        "spinner",
        sizeClasses[size],
        "text-primary-600",
        className
      )}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" />
    </div>
  )
}

export function ButtonLoader() {
  return <LoadingSpinner size="sm" className="mr-2" />
}
