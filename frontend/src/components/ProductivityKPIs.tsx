'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, BarChart3, Clock, Target, Calendar, Award } from 'lucide-react'

interface ProductivityMetrics {
  avg_daily_productivity: number
  max_daily_productivity: number
  total_productive_hours: number
  avg_daily_productivity_change: number
  max_daily_productivity_change: number
  total_productive_hours_change: number
}

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

export function ProductivityKPIs() {
  const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null)
  const [chartData, setChartData] = useState<ProductivityChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [metricsResponse, chartResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/productivity-metrics`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/productivity-chart-30days`)
      ])

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData)
      }

      if (chartResponse.ok) {
        const chartData = await chartResponse.json()
        setChartData(chartData)
      }
    } catch (error) {
      console.error('Error fetching productivity data:', error)
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

  const formatChange = (change: number) => {
    const isPositive = change >= 0
    return {
      value: `${isPositive ? '+' : ''}${change.toFixed(1)}%`,
      color: isPositive ? 'text-emerald-400' : 'text-red-400',
      bgColor: isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-white/60">Loading productivity insights...</div>
      </div>
    )
  }

  const maxTotal = chartData ? Math.max(...chartData.chart_data.map(d => d.total), 1) : 1

  return (
    <motion.div
      className="container mx-auto px-4 py-8 relative z-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* KPIs Section */}
      {metrics && (
        <div className="mb-8">
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-2">
              7-Day Productivity Insights
            </h3>
            <p className="text-white/60 text-sm">Key metrics compared to previous period</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-blue-300" />
                </div>
                <h4 className="font-medium text-white/90 text-sm">Average Daily</h4>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                  {formatTime(metrics.avg_daily_productivity)}
                </p>
                <div className={`text-xs px-2 py-1 rounded-full inline-block ${formatChange(metrics.avg_daily_productivity_change).bgColor}`}>
                  <span className={formatChange(metrics.avg_daily_productivity_change).color}>
                    {formatChange(metrics.avg_daily_productivity_change).value}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Target className="h-4 w-4 text-purple-300" />
                </div>
                <h4 className="font-medium text-white/90 text-sm">Peak Day</h4>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                  {formatTime(metrics.max_daily_productivity)}
                </p>
                <div className={`text-xs px-2 py-1 rounded-full inline-block ${formatChange(metrics.max_daily_productivity_change).bgColor}`}>
                  <span className={formatChange(metrics.max_daily_productivity_change).color}>
                    {formatChange(metrics.max_daily_productivity_change).value}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Clock className="h-4 w-4 text-emerald-300" />
                </div>
                <h4 className="font-medium text-white/90 text-sm">Total Hours</h4>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                  {metrics.total_productive_hours.toFixed(1)}h
                </p>
                <div className={`text-xs px-2 py-1 rounded-full inline-block ${formatChange(metrics.total_productive_hours_change).bgColor}`}>
                  <span className={formatChange(metrics.total_productive_hours_change).color}>
                    {formatChange(metrics.total_productive_hours_change).value}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* 30-Day Chart */}
      {chartData && chartData.chart_data.length > 0 && (
        <motion.div
          className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <BarChart3 className="h-5 w-5 text-cyan-300" />
            </div>
            <h3 className="text-xl font-semibold text-white/90">Last 30 Days</h3>
          </div>

          {/* Chart */}
          <div className="relative">
            <div className="flex items-end justify-between gap-1 h-48 px-2">
              {chartData.chart_data.map((day, index) => {
                const isNA = day.total === null || day.total === undefined
                const height = isNA ? maxTotal * 0.8 : (day.total / maxTotal) * 100

                return (
                  <motion.div
                    key={day.date}
                    className="flex-1 flex flex-col items-center group max-w-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.01 }}
                  >
                    {/* Bar */}
                    <div className="relative flex flex-col-reverse w-full">
                      {isNA ? (
                        <motion.div
                          className="w-full rounded-sm bg-slate-600/20 border border-slate-500/30"
                          style={{ 
                            height: `${height * 0.48}px`,
                            minHeight: '2px',
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(148, 163, 184, 0.1) 2px, rgba(148, 163, 184, 0.1) 4px)'
                          }}
                          initial={{ height: 0 }}
                          animate={{ height: `${height * 0.48}px` }}
                          transition={{ duration: 0.8, delay: index * 0.01 }}
                        />
                      ) : (
                        chartData.categories.map((category) => {
                          const value = day[category] || 0
                          const segmentHeight = maxTotal > 0 ? (value / maxTotal) * 48 : 0
                          
                          if (value === 0) return null
                          
                          return (
                            <motion.div
                              key={category}
                              className="w-full rounded-sm relative overflow-hidden"
                              style={{ 
                                backgroundColor: chartData.category_colors[category] || '#64748b',
                                height: `${segmentHeight}px`,
                                minHeight: value > 0 ? '1px' : '0px',
                                filter: 'saturate(0.7) brightness(0.9)'
                              }}
                              initial={{ height: 0 }}
                              animate={{ height: `${segmentHeight}px` }}
                              transition={{ duration: 0.8, delay: index * 0.01 }}
                            />
                          )
                        })
                      )}
                      
                      {/* Tooltip on hover */}
                      <motion.div 
                        className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10"
                        whileHover={{ y: -2 }}
                      >
                        <div className="bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded border border-white/20 whitespace-nowrap">
                          {isNA ? 'No data' : `${formatTime(day.total)} - ${day.weekday}`}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-48 flex flex-col justify-between py-1 -ml-12">
              {[...Array(3)].map((_, i) => {
                const value = Math.round((maxTotal * (2 - i)) / 2)
                return (
                  <div key={i} className="text-xs text-white/40">
                    {formatTime(value)}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center mt-6 pt-4 border-t border-white/10">
            {chartData.categories.map((category) => (
              <div key={category} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm"
                  style={{ 
                    backgroundColor: chartData.category_colors[category] || '#64748b',
                    filter: 'saturate(0.7) brightness(0.9)'
                  }}
                />
                <span className="text-sm text-white/70">{category}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm border border-slate-500/30"
                style={{ 
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(148, 163, 184, 0.2) 1px, rgba(148, 163, 184, 0.2) 2px)'
                }}
              />
              <span className="text-sm text-white/70">No data</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}