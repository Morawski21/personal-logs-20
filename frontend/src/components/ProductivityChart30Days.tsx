'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'

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
      if (debugMode) {
        console.log('Fetching 30-day chart from API URL:', apiUrl)
      }
      
      const response = await fetch(`${apiUrl}/api/analytics/productivity-chart-30days`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (debugMode) {
        console.log('30-day chart response status:', response.status)
      }

      if (response.ok) {
        const data = await response.json()
        if (debugMode) {
          console.log('30-day chart data:', data)
        }
        
        // Validate data structure
        if (data && Array.isArray(data.chart_data)) {
          setChartData(data)
        } else {
          console.warn('Invalid 30-day chart data structure:', data)
        }
      } else {
        console.error('Failed to fetch 30-day chart:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching 30-day chart data:', error)
    } finally {
      setLoading(false)
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
      <div className="bg-white/5 border border-white/20 rounded-xl p-6 backdrop-blur-sm">
        <div className="text-center text-white/60 py-8">Loading 30-day chart...</div>
      </div>
    )
  }

  if (!chartData || chartData.chart_data.length === 0) {
    return (
      <div className="bg-white/5 border border-white/20 rounded-xl p-6 backdrop-blur-sm">
        <div className="text-center text-white/60 py-8">No 30-day data available</div>
      </div>
    )
  }

  // Calculate max total for proper scaling, excluding null values
  const validTotals = chartData.chart_data
    .map(d => d.total)
    .filter(total => total !== null && total !== undefined) as number[]
  const maxTotal = validTotals.length > 0 ? Math.max(...validTotals) : 1

  // Better color palette - more distinguishable and professional
  const improvedColors = {
    "Tech": "#3b82f6",      // Blue - clear and professional
    "YouTube": "#ef4444",   // Red - distinct
    "Reading": "#10b981",   // Emerald - good contrast
    "Music": "#f59e0b",     // Amber - warm and visible
    "Fitness": "#8b5cf6",   // Purple - distinct from others
    "Learning": "#06b6d4",  // Cyan - for learning
    "Other": "#6b7280"      // Gray - for misc
  }

  // Use improved colors, fallback to original
  const finalColors = { ...chartData.category_colors, ...improvedColors }

  return (
    <motion.div
      className="bg-white/5 border border-white/20 rounded-xl p-6 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Debug info if enabled */}
      {debugMode && (
        <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
          <h4 className="text-white font-bold text-sm">🐛 Debug: 30-Day Chart</h4>
          <p className="text-white/80 text-xs">Max Total: {maxTotal} | Categories: {chartData.categories.length} | Data Points: {chartData.chart_data.length}</p>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-cyan-500/20 rounded-lg">
          <BarChart3 className="h-5 w-5 text-cyan-300" />
        </div>
        <h3 className="text-xl font-semibold text-white/90">Last 30 Days Productivity</h3>
      </div>

      {/* Chart */}
      <div className="relative">
        <div className="flex items-end justify-between gap-1 h-64 px-4">
          {chartData.chart_data.map((day, index) => {
            const isNA = day.total === null || day.total === undefined
            const date = new Date(day.date)
            const isWeekend = date.getDay() === 0 || date.getDay() === 6
            
            return (
              <motion.div
                key={day.date}
                className={`flex-1 flex flex-col items-center group max-w-2 ${isWeekend ? 'opacity-80' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.02 }}
              >
                {/* Bar */}
                <div className="relative flex flex-col-reverse w-full h-full">
                  {isNA ? (
                    <motion.div
                      className="w-full rounded-sm bg-slate-600/30 border border-slate-500/40"
                      style={{ 
                        height: '16px',
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(148, 163, 184, 0.2) 2px, rgba(148, 163, 184, 0.2) 4px)'
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: '16px' }}
                      transition={{ duration: 0.8, delay: index * 0.02 }}
                    />
                  ) : (
                    chartData.categories.map((category) => {
                      const value = day[category] || 0
                      const segmentHeight = maxTotal > 0 ? (value / maxTotal) * 240 : 0
                      
                      if (value === 0) return null
                      
                      return (
                        <motion.div
                          key={category}
                          className="w-full rounded-sm relative overflow-hidden hover:brightness-110 transition-all duration-200"
                          style={{ 
                            backgroundColor: finalColors[category] || '#64748b',
                            height: `${segmentHeight}px`,
                            minHeight: value > 0 ? '3px' : '0px'
                          }}
                          initial={{ height: 0 }}
                          animate={{ height: `${segmentHeight}px` }}
                          transition={{ duration: 1, delay: index * 0.02 + 0.2 }}
                        />
                      )
                    })
                  )}
                  
                  {/* Tooltip on hover */}
                  <motion.div 
                    className="absolute -top-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10"
                    whileHover={{ y: -2 }}
                  >
                    <div className="bg-black/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg border border-white/20 whitespace-nowrap shadow-lg">
                      <div className="font-semibold">{day.weekday}, {date.getDate()}</div>
                      {isNA ? (
                        <div className="text-gray-400">No data</div>
                      ) : (
                        <div className="text-emerald-300">{formatTime(day.total || 0)}</div>
                      )}
                    </div>
                  </motion.div>
                </div>
                
                {/* Date labels - show every 5th day */}
                {(index + 1) % 5 === 0 && (
                  <div className="mt-2 text-center">
                    <div className="text-xs text-white/60 font-medium">
                      {date.getDate()}
                    </div>
                    <div className="text-xs text-white/40">
                      {date.toLocaleDateString('en', { month: 'short' })}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-64 flex flex-col justify-between py-2 -ml-16">
          {[...Array(5)].map((_, i) => {
            const value = Math.round((maxTotal * (4 - i)) / 4)
            return (
              <div key={i} className="text-xs text-white/50 font-medium">
                {formatTime(value)}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center mt-6 pt-4 border-t border-white/10">
        {chartData.categories.map((category) => (
          <motion.div
            key={category}
            className="flex items-center gap-2 hover:scale-105 transition-transform duration-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <div 
              className="w-4 h-4 rounded-sm shadow-sm"
              style={{ backgroundColor: finalColors[category] || '#64748b' }}
            />
            <span className="text-sm text-white/80 font-medium">{category}</span>
          </motion.div>
        ))}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <div 
            className="w-4 h-4 rounded-sm border border-slate-500/40"
            style={{ 
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(148, 163, 184, 0.3) 2px, rgba(148, 163, 184, 0.3) 4px)'
            }}
          />
          <span className="text-sm text-white/60">No data</span>
        </motion.div>
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
              className="text-center bg-white/5 rounded-lg p-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              <div 
                className="w-3 h-3 rounded-sm mx-auto mb-2"
                style={{ backgroundColor: finalColors[category] || '#64748b' }}
              />
              <div className="text-sm font-bold text-white/90">{formatTime(total)}</div>
              <div className="text-xs text-white/60">{category}</div>
              <div className="text-xs text-white/40">avg: {formatTime(average)}</div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}