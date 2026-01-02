'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'

interface ChartDataPoint {
  date: string
  weekday: string
  total: number | null
  displayDate: string
  isWeekStart: boolean
  [key: string]: number | string | boolean | null
}

interface ActivityChartData {
  chart_data: ChartDataPoint[]
  categories: string[]
  category_colors: { [key: string]: string }
}

export function ActivityChart30Days() {
  const [data, setData] = useState<ActivityChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/analytics/productivity-chart-30days`)

      if (response.ok) {
        const chartData = await response.json()

        const processedChartData = chartData.chart_data.map((point: ChartDataPoint) => {
          const dateObj = new Date(point.date)
          const day = dateObj.getDate()
          const month = dateObj.getMonth() + 1
          const dayOfWeek = dateObj.getDay()

          return {
            ...point,
            displayDate: `${point.weekday} ${day}/${month}`,
            isWeekStart: dayOfWeek === 1
          }
        })

        setData({
          ...chartData,
          chart_data: processedChartData
        })
      } else {
        console.error('Failed to fetch 30-day chart data')
      }
    } catch (error) {
      console.error('Error fetching 30-day chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
        <div className="text-white/60 text-center">Loading activity data...</div>
      </div>
    )
  }

  if (!data || !data.chart_data || data.chart_data.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
        <div className="text-white/60 text-center">No activity data available</div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0)

      return (
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-lg p-3 backdrop-blur-sm">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {Math.round(entry.value)}m
            </p>
          ))}
          <p className="text-white/80 text-sm font-semibold mt-2 pt-2 border-t border-slate-700">
            Total: {Math.round(total)}m ({(total / 60).toFixed(1)}h)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white/90">
          Last 30 Days Activity
        </h3>
        <p className="text-white/60 text-sm">Activity minutes by category</p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data.chart_data} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="displayDate"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="rect"
            formatter={(value) => <span style={{ color: '#d1d5db', fontSize: '13px' }}>{value}</span>}
          />
          {data.chart_data.map((point, index) =>
            point.isWeekStart && index > 0 ? (
              <ReferenceLine
                key={`week-${index}`}
                x={point.displayDate}
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="0"
              />
            ) : null
          )}
          {data.categories.map((category) => (
            <Bar
              key={category}
              dataKey={category}
              stackId="a"
              fill={data.category_colors[category]}
              radius={[0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
