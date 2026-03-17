import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', 
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#84cc16', '#22c55e', '#14b8a6',
]

export default function FeatureImportanceChart({ data }) {
  // Convert object to array and sort by importance
  const chartData = Object.entries(data || {})
    .map(([name, value]) => ({
      name: name.length > 20 ? name.substring(0, 20) + '...' : name,
      fullName: name,
      value: parseFloat((value * 100).toFixed(2)),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) // Top 10 features
  
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-500">
        No feature importance data available
      </div>
    )
  }
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis 
          type="number" 
          domain={[0, 'dataMax']}
          tickFormatter={(value) => `${value}%`}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          width={90}
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value, name, props) => [
            `${value}%`, 
            props.payload.fullName
          ]}
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
