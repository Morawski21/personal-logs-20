'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'
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
  total: number | null
  [key: string]: any
}

interface ProductivityChartData {
  chart_data: ChartData[]
  categories: string[]
  category_colors: { [key: string]: string }
}

interface ProductivityChart30DaysProps {
  debugMode?: boolean
}

export function ProductivityChart30Days({ debugMode = false }: ProductivityChart30DaysProps) {
  const [chartData, setChartData] = useState<ProductivityChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/analytics/productivity-chart-30days`)

      if (response.ok) {
        const data = await response.json()
        if (data && Array.isArray(data.chart_data)) {
          setChartData(data)
        }
      }
    } catch (error) {
      console.error('Error fetching 30-day chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${minutes}m`
  }

  const formatTooltip = (value: any, name: string) => {
    if (value === null || value === undefined) return ['No data', name]
    return [formatTime(value), name]
  }

  const formatXAxisLabel = (tickItem: string, index: number) => {
    const date = new Date(tickItem)
    // Show every 3rd day
    if (index % 3 === 0) {
      return date.getDate().toString()
    }
    return ''
  }

  if (loading) {
    return (
      <motion.div
        className="bg-white/5 border border-white/20 rounded-2xl p-6 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center text-white/60 py-8">Loading 30-day chart...</div>
      </motion.div>
    )
  }

  if (!chartData || chartData.chart_data.length === 0) {
    return (
      <motion.div
        className="bg-white/5 border border-white/20 rounded-2xl p-6 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center text-white/60 py-8">No 30-day data available</div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl">
          <BarChart3 className="h-6 w-6 text-cyan-300" />
        </div>
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
            Last 30 Days Productivity
          </h3>
          <p className="text-sm text-white/60">Daily productivity breakdown by category</p>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData.chart_data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 40,
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxisLabel}
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval={0}
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
              labelFormatter={(label) => {
                const date = new Date(label)
                return `${date.toLocaleDateString('en', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}`
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px',
                color: '#f3f4f6'
              }}
            />
            {chartData.categories.map((category) => (
              <Bar
                key={category}
                dataKey={category}
                stackId="productivity"
                fill={chartData.category_colors[category]}
                radius={0}
                stroke="none"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-white/10">
        {chartData.categories.map((category) => {
          const total = chartData.chart_data.reduce((sum, day) => {
            const value = day[category]
            return sum + (typeof value === 'number' ? value : 0)
          }, 0)
          const average = total / chartData.chart_data.length
          
          return (
            <motion.div
              key={category}
              className="text-center bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors duration-200"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              <div 
                className="w-4 h-4 rounded-sm mx-auto mb-2"
                style={{ backgroundColor: chartData.category_colors[category] }}
              />
              <div className="text-lg font-bold text-white/90">{formatTime(total)}</div>
              <div className="text-sm text-white/70 font-medium">{category}</div>
              <div className="text-xs text-white/50">avg: {formatTime(Math.round(average))}</div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}