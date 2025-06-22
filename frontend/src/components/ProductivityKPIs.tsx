'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Clock, Target, Zap, Sparkles, Star } from 'lucide-react'

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
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
      
      const metricsResponse = await fetch(`${apiUrl}/api/analytics/productivity-metrics`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (debugMode) {
        console.log('Metrics response status:', metricsResponse.status)
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        if (debugMode) {
          console.log('Metrics data:', metricsData)
        }
        
        // Validate required fields
        const requiredFields = ['avg_daily_productivity', 'max_daily_productivity', 'total_productive_hours']
        const isValid = requiredFields.every(field => typeof metricsData[field] === 'number')
        
        if (isValid) {
          setMetrics(metricsData)
        } else {
          console.warn('Invalid metrics data structure:', metricsData)
        }
      } else {
        console.error('Failed to fetch productivity metrics:', metricsResponse.status, metricsResponse.statusText)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request timeout: Productivity metrics took too long to load')
      } else {
        console.error('Error fetching productivity data:', error)
      }
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
      bgColor: isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10',
      icon: isPositive ? TrendingUp : TrendingDown
    }
  }

  const getMotivationalMessage = (metrics: ProductivityMetrics) => {
    const totalHours = metrics.total_productive_hours
    const avgChange = metrics.avg_daily_productivity_change
    
    if (totalHours >= 20 && avgChange >= 10) {
      return { message: "🔥 Absolutely crushing it! You're in the zone!", color: "text-yellow-400", icon: Star }
    } else if (totalHours >= 15 && avgChange >= 5) {
      return { message: "⚡ Great momentum! Keep pushing forward!", color: "text-emerald-400", icon: Zap }
    } else if (totalHours >= 10) {
      return { message: "💪 Solid progress! You're building great habits!", color: "text-blue-400", icon: Target }
    } else if (avgChange >= 0) {
      return { message: "🌱 Growing steadily! Every step counts!", color: "text-green-400", icon: TrendingUp }
    } else {
      return { message: "🚀 Ready for a comeback! Let's get started!", color: "text-purple-400", icon: Sparkles }
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Average Daily KPI */}
            <motion.div
              className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 ${formatChange(metrics.avg_daily_productivity_change).color}`}>
                  {React.createElement(formatChange(metrics.avg_daily_productivity_change).icon, { className: "h-4 w-4" })}
                  <span className="text-sm font-bold">{formatChange(metrics.avg_daily_productivity_change).value}</span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-white/90">Daily Average</h4>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                  {formatTime(metrics.avg_daily_productivity)}
                </p>
                <p className="text-sm text-white/60">Consistent progress builds success</p>
              </div>
            </motion.div>

            {/* Peak Day KPI */}
            <motion.div
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-sm hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 ${formatChange(metrics.max_daily_productivity_change).color}`}>
                  {React.createElement(formatChange(metrics.max_daily_productivity_change).icon, { className: "h-4 w-4" })}
                  <span className="text-sm font-bold">{formatChange(metrics.max_daily_productivity_change).value}</span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-white/90">Peak Performance</h4>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  {formatTime(metrics.max_daily_productivity)}
                </p>
                <p className="text-sm text-white/60">Your potential in action</p>
              </div>
            </motion.div>

            {/* Total Hours KPI */}
            <motion.div
              className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-sm hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 ${formatChange(metrics.total_productive_hours_change).color}`}>
                  {React.createElement(formatChange(metrics.total_productive_hours_change).icon, { className: "h-4 w-4" })}
                  <span className="text-sm font-bold">{formatChange(metrics.total_productive_hours_change).value}</span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-white/90">Total Investment</h4>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                  {metrics.total_productive_hours.toFixed(1)}h
                </p>
                <p className="text-sm text-white/60">Time invested in growth</p>
              </div>
            </motion.div>
          </div>

          {/* Motivational Message */}
          <motion.div
            className="mt-6 p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {(() => {
              const motivation = getMotivationalMessage(metrics)
              const MotivationIcon = motivation.icon
              return (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl">
                    <MotivationIcon className={`h-6 w-6 ${motivation.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-lg font-semibold ${motivation.color}`}>
                      {motivation.message}
                    </p>
                    <p className="text-sm text-white/60 mt-1">
                      Keep up the momentum and watch your productivity soar! 🚀
                    </p>
                  </div>
                </div>
              )
            })()}
          </motion.div>
        </div>
      ) : (
        <div className="text-center text-white/60 py-8">
          No productivity metrics available
        </div>
      )}
    </motion.div>
  )
}