import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

export default function MetricsRadarChart({ metrics }) {
  // Filter and format metrics for radar chart
  const validMetrics = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc', 'r2']
  
  const chartData = validMetrics
    .filter(key => metrics && metrics[key] !== undefined)
    .map(key => ({
      metric: key.replace('_', ' ').toUpperCase(),
      value: parseFloat((metrics[key] * 100).toFixed(1)),
      fullMark: 100,
    }))
  
  if (chartData.length < 3) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-500">
        Not enough metrics for radar chart
      </div>
    )
  }
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={chartData}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis 
          dataKey="metric" 
          tick={{ fontSize: 11, fill: '#64748b' }}
        />
        <PolarRadiusAxis 
          angle={30} 
          domain={[0, 100]}
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          formatter={(value) => [`${value}%`]}
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
          }}
        />
        <Radar
          name="Metrics"
          dataKey="value"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
