import { useMemo } from 'react'

export default function ConfusionMatrixChart({ matrix, labels }) {
  const data = useMemo(() => {
    if (!matrix || matrix.length === 0) return null
    
    const defaultLabels = labels || matrix.map((_, i) => `Class ${i}`)
    
    return {
      matrix,
      labels: defaultLabels,
      max: Math.max(...matrix.flat()),
    }
  }, [matrix, labels])
  
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-500">
        No confusion matrix data available
      </div>
    )
  }
  
  const getColor = (value) => {
    const intensity = value / data.max
    const r = Math.round(99 + (intensity * 0))
    const g = Math.round(102 + (intensity * -52))
    const b = Math.round(241 + (intensity * -141))
    return `rgb(${r}, ${g}, ${b})`
  }
  
  const getTextColor = (value) => {
    return value / data.max > 0.5 ? 'white' : 'inherit'
  }
  
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Header labels */}
        <div className="flex">
          <div className="w-24 flex-shrink-0" />
          <div className="flex-1 text-center text-sm font-medium text-dark-500 mb-2">
            Predicted
          </div>
        </div>
        
        <div className="flex">
          <div className="w-24 flex-shrink-0" />
          {data.labels.map((label, i) => (
            <div
              key={i}
              className="flex-1 text-center text-xs font-medium text-dark-600 dark:text-dark-400 p-2"
            >
              {label}
            </div>
          ))}
        </div>
        
        {/* Matrix rows */}
        <div className="flex">
          {/* Vertical label */}
          <div className="w-6 flex-shrink-0 flex items-center justify-center">
            <span 
              className="text-sm font-medium text-dark-500 transform -rotate-90 whitespace-nowrap"
              style={{ writingMode: 'vertical-lr' }}
            >
              Actual
            </span>
          </div>
          
          <div className="flex-1">
            {data.matrix.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                <div className="w-[72px] flex-shrink-0 flex items-center justify-end pr-2 text-xs font-medium text-dark-600 dark:text-dark-400">
                  {data.labels[rowIndex]}
                </div>
                {row.map((value, colIndex) => (
                  <div
                    key={colIndex}
                    className="flex-1 aspect-square flex items-center justify-center text-sm font-semibold m-0.5 rounded"
                    style={{
                      backgroundColor: getColor(value),
                      color: getTextColor(value),
                    }}
                  >
                    {value}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
