'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Clock, Target, Zap } from 'lucide-react'

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


  // Debug logging only in debug mode
  if (debugMode) {
    console.log('ProductivityKPIs render - loading:', loading, 'metrics:', metrics)
  }

  return (
    <div>
      {/* Debug Header - Only visible in debug mode */}
      {debugMode && (
        <div className="mb-3 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
          <h2 className="text-white font-bold text-sm">Debug: ProductivityKPIs Component</h2>
          <p className="text-white/80 text-xs">Loading: {loading ? 'Yes' : 'No'} | Metrics: {metrics ? 'Loaded' : 'None'}</p>
          <p className="text-white/70 text-xs">API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</p>
        </div>
      )}

      {/* KPIs Section */}
      {loading ? (
        <div className="text-center text-white/60 py-2 text-sm">Loading...</div>
      ) : metrics ? (
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg px-4 py-2 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60">7-Day Metrics:</span>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Target className="h-3 w-3 text-blue-400" />
                <span className="text-sm text-white/90">
                  Avg: <span className="font-semibold text-blue-400">{formatTime(metrics.avg_daily_productivity)}</span>
                </span>
                <div className={`flex items-center gap-0.5 text-xs ${formatChange(metrics.avg_daily_productivity_change).color}`}>
                  {React.createElement(formatChange(metrics.avg_daily_productivity_change).icon, { className: "h-3 w-3" })}
                  <span className="font-medium">{formatChange(metrics.avg_daily_productivity_change).value}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-purple-400" />
                <span className="text-sm text-white/90">
                  Peak: <span className="font-semibold text-purple-400">{formatTime(metrics.max_daily_productivity)}</span>
                </span>
                <div className={`flex items-center gap-0.5 text-xs ${formatChange(metrics.max_daily_productivity_change).color}`}>
                  {React.createElement(formatChange(metrics.max_daily_productivity_change).icon, { className: "h-3 w-3" })}
                  <span className="font-medium">{formatChange(metrics.max_daily_productivity_change).value}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-emerald-400" />
                <span className="text-sm text-white/90">
                  Total: <span className="font-semibold text-emerald-400">{metrics.total_productive_hours.toFixed(1)}h</span>
                </span>
                <div className={`flex items-center gap-0.5 text-xs ${formatChange(metrics.total_productive_hours_change).color}`}>
                  {React.createElement(formatChange(metrics.total_productive_hours_change).icon, { className: "h-3 w-3" })}
                  <span className="font-medium">{formatChange(metrics.total_productive_hours_change).value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}