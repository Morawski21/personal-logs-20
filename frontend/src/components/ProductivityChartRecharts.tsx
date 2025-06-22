'use client'

import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

interface ChartData {
  date: string
  weekday: string
  total: number
  [key: string]: any
}

interface ProductivityChartData {
  chart_data: ChartData[]
  categories: string[]
  category_colors: { [key: string]: string }
}

interface ProductivityChartProps {
  data: ProductivityChartData
}

export function ProductivityChart({ data }: ProductivityChartProps) {
  const { chart_data, categories, category_colors } = data

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${minutes}m`
  }

  const formatTooltip = (value: any, name: string) => {
    if (value === null || value === undefined || value === 0) return ['0m', name]
    return [formatTime(value), name]
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chart_data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              opacity={0.3}
            />
            <XAxis
              dataKey="weekday"
              stroke="#9ca3af"
              fontSize={13}
              fontWeight={500}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}m`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid rgba(55, 65, 81, 0.6)',
                borderRadius: '12px',
                backdropFilter: 'blur(8px)',
                color: '#f3f4f6',
                fontSize: '14px',
                padding: '12px'
              }}
              formatter={formatTooltip}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  const date = new Date(payload[0].payload.date)
                  return `${label}, ${date.toLocaleDateString('en', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}`
                }
                return label
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px',
                color: '#f3f4f6'
              }}
            />
            {categories.map((category) => (
              <Bar
                key={category}
                dataKey={category}
                stackId="productivity"
                fill={category_colors[category]}
                radius={0}
                stroke="none"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-white/10">
        {categories.map((category) => {
          const total = chart_data.reduce((sum, day) => sum + (day[category] || 0), 0)
          return (
            <motion.div
              key={category}
              className="text-center bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors duration-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div 
                className="w-4 h-4 rounded-sm mx-auto mb-2"
                style={{ backgroundColor: category_colors[category] }}
              />
              <div className="text-lg font-bold text-white/90">{formatTime(total)}</div>
              <div className="text-sm text-white/70 font-medium">{category}</div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}