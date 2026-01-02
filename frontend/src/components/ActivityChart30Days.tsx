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

interface ProductivityMetrics {
  avg_daily_productivity: number
  total_productive_hours: number
}

export function ActivityChart30Days() {
  const [data, setData] = useState<ActivityChartData | null>(null)
  const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    fetchMetrics()
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

        const updatedColors = {
          'Tech + Praca': '#3b82f6',
          'YouTube': '#ff4d6b',
          'Gitara': '#a855f7',
          'Czytanie': '#10b981',
          'Inne': '#f59e0b'
        }

        setData({
          ...chartData,
          chart_data: processedChartData,
          category_colors: updatedColors
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

  const fetchMetrics = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/analytics/productivity-metrics`)

      if (response.ok) {
        const metricsData = await response.json()
        setMetrics({
          avg_daily_productivity: metricsData.avg_daily_productivity,
          total_productive_hours: metricsData.total_productive_hours
        })
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }

  const formatTime = (minutes: number) => {
    const roundedMinutes = Math.round(minutes)
    if (roundedMinutes >= 60) {
      const hours = Math.floor(roundedMinutes / 60)
      const mins = roundedMinutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${roundedMinutes}m`
  }

  if (loading) {
    return (
      <div className="rounded-xl p-6 backdrop-blur-sm" style={{ backgroundColor: '#2d1b0e', borderColor: '#5c3d2e', borderWidth: '1px' }}>
        <div className="text-center" style={{ color: '#d4a574' }}>Loading activity data...</div>
      </div>
    )
  }

  if (!data || !data.chart_data || data.chart_data.length === 0) {
    return (
      <div className="rounded-xl p-6 backdrop-blur-sm" style={{ backgroundColor: '#2d1b0e', borderColor: '#5c3d2e', borderWidth: '1px' }}>
        <div className="text-center" style={{ color: '#d4a574' }}>No activity data available</div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0)

      return (
        <div className="rounded-lg p-3 backdrop-blur-sm" style={{ backgroundColor: 'rgba(45, 27, 14, 0.95)', borderColor: '#5c3d2e', borderWidth: '1px' }}>
          <p className="font-semibold mb-2" style={{ color: '#fef3c7' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {Math.round(entry.value)}m
            </p>
          ))}
          <p className="text-sm font-semibold mt-2 pt-2" style={{ color: '#fef3c7', borderTop: '1px solid #5c3d2e' }}>
            Total: {Math.round(total)}m ({(total / 60).toFixed(1)}h)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="rounded-xl p-6 backdrop-blur-sm" style={{ backgroundColor: '#2d1b0e', borderColor: '#5c3d2e', borderWidth: '1px' }}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: '#fef3c7' }}>
            Last 30 Days Activity
          </h3>
          {metrics && (
            <p className="text-sm mt-1" style={{ color: '#d4a574' }}>
              {metrics.total_productive_hours.toFixed(1)}h total • {formatTime(metrics.avg_daily_productivity)} daily avg
            </p>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data.chart_data} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#5c3d2e" opacity={0.3} />
          <XAxis
            dataKey="displayDate"
            stroke="#d4a574"
            tick={{ fill: '#d4a574', fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis
            stroke="#d4a574"
            tick={{ fill: '#d4a574', fontSize: 12 }}
            label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#d4a574', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="rect"
            formatter={(value) => <span style={{ color: '#fef3c7', fontSize: '13px' }}>{value}</span>}
          />
          {data.chart_data.map((point, index) =>
            point.isWeekStart && index > 0 ? (
              <ReferenceLine
                key={`week-${index}`}
                x={point.displayDate}
                stroke="#5c3d2e"
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
