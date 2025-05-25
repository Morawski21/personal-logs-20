'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Clock, Target } from 'lucide-react'

interface ProductivityMetrics {
  avg_daily_productivity: number
  max_daily_productivity: number
  total_productive_hours: number
  avg_daily_productivity_change: number
  max_daily_productivity_change: number
  total_productive_hours_change: number
}


interface ProductivityKPIsProps {
  debugMode?: boolean
}

export function ProductivityKPIs({ debugMode = false }: ProductivityKPIsProps) {
  const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      if (debugMode) {
        console.log('Fetching productivity metrics from API URL:', apiUrl)
      }
      
      const metricsResponse = await fetch(`${apiUrl}/api/analytics/productivity-metrics`)

      if (debugMode) {
        console.log('Metrics response status:', metricsResponse.status)
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        if (debugMode) {
          console.log('Metrics data:', metricsData)
        }
        setMetrics(metricsData)
      }
    } catch (error) {
      console.error('Error fetching productivity data:', error)
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

  const formatChange = (change: number) => {
    const isPositive = change >= 0
    return {
      value: `${isPositive ? '+' : ''}${change.toFixed(1)}%`,
      color: isPositive ? 'text-emerald-400' : 'text-red-400',
      bgColor: isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'
    }
  }

  // Debug logging only in debug mode
  if (debugMode) {
    console.log('ProductivityKPIs render - loading:', loading, 'metrics:', metrics)
  }

  return (
    <motion.div
      className="container mx-auto px-4 py-8 relative z-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Debug Header - Only visible in debug mode */}
      {debugMode && (
        <div className="mb-4 p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg">
          <h2 className="text-white font-bold">🐛 Debug: ProductivityKPIs Component</h2>
          <p className="text-white/80 text-sm">Loading: {loading ? 'Yes' : 'No'} | Metrics: {metrics ? 'Loaded' : 'None'}</p>
          <p className="text-white/70 text-xs mt-1">API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</p>
        </div>
      )}

      {/* KPIs Section */}
      {loading ? (
        <div className="text-center text-white/60 py-8">Loading productivity insights...</div>
      ) : metrics ? (
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
      ) : (
        <div className="text-center text-white/60 py-8">
          No productivity metrics available
        </div>
      )}
    </motion.div>
  )
}