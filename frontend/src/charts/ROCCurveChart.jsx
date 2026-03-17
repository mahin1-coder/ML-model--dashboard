import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

export default function ROCCurveChart({ data }) {
  // data should have fpr, tpr arrays
  if (!data || !data.fpr || !data.tpr) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-500">
        No ROC curve data available
      </div>
    )
  }
  
  const chartData = data.fpr.map((fpr, i) => ({
    fpr: parseFloat(fpr.toFixed(4)),
    tpr: parseFloat(data.tpr[i].toFixed(4)),
  }))
  
  // Add diagonal reference line data
  const diagonalData = [
    { fpr: 0, diagonal: 0 },
    { fpr: 1, diagonal: 1 },
  ]
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis 
          dataKey="fpr" 
          type="number"
          domain={[0, 1]}
          label={{ value: 'False Positive Rate', position: 'bottom', offset: 0 }}
        />
        <YAxis 
          domain={[0, 1]}
          label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip 
          formatter={(value, name) => [
            value.toFixed(4), 
            name === 'tpr' ? 'True Positive Rate' : name
          ]}
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
          }}
        />
        <ReferenceLine 
          segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
          stroke="#94a3b8"
          strokeDasharray="5 5"
        />
        <Line 
          type="monotone" 
          dataKey="tpr" 
          stroke="#6366f1" 
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
