'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Target, TrendingUp, Calendar, Award, BarChart3 } from 'lucide-react'
import { useHabitStore } from '@/stores/habitStore'
import { ProductivityChart } from './ProductivityChart'
import { ProductivityChart30Days } from './ProductivityChart30Days'

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

export function Analytics() {
  const { analytics, fetchAnalytics } = useHabitStore()
  const [productivityData, setProductivityData] = useState<ProductivityChartData | null>(null)
  const [loadingChart, setLoadingChart] = useState(true)
  
  useEffect(() => {
    fetchAnalytics()
    fetchProductivityChart()
  }, [])
  
  const fetchProductivityChart = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/productivity-chart`)
      if (response.ok) {
        const data = await response.json()
        setProductivityData(data)
      }
    } catch (error) {
      console.error('Error fetching productivity chart:', error)
    } finally {
      setLoadingChart(false)
    }
  }
  
  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-muted-foreground">Loading analytics...</div>
      </div>
    )
  }
  
  const stats = [
    {
      title: 'Total Habits',
      value: analytics.total_habits,
      icon: Target,
      description: 'Habits being tracked'
    },
    {
      title: 'Active Streaks',
      value: analytics.active_streaks,
      icon: TrendingUp,
      description: 'Habits with ongoing streaks'
    },
    {
      title: 'Completed Today',
      value: analytics.completed_today,
      icon: Calendar,
      description: 'Habits done today'
    },
    {
      title: 'Perfect Days',
      value: analytics.perfect_days_streak,
      icon: Award,
      description: 'Consecutive days with all habits completed'
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-2">Analytics</h2>
          <p className="text-white/60">Your habit tracking insights and productivity breakdown</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.title}
                className="bg-white/5 border border-white/20 rounded-xl p-6 space-y-3 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Icon className="h-5 w-5 text-purple-300" />
                  </div>
                  <h3 className="font-semibold text-white/90">{stat.title}</h3>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">{stat.value}</p>
                  <p className="text-sm text-white/60">{stat.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
        
        {/* Completion Rate */}
        <motion.div
          className="bg-white/5 border border-white/20 rounded-xl p-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className="text-xl font-semibold text-white/90 mb-4">Today's Completion Rate</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                initial={{ width: 0 }}
                animate={{ width: `${analytics.completion_rate}%` }}
                transition={{ duration: 1, delay: 0.7 }}
              />
            </div>
            <span className="text-lg font-semibold text-white/90">
              {Math.round(analytics.completion_rate)}%
            </span>
          </div>
          <p className="text-sm text-white/60 mt-2">
            {analytics.completed_today} of {analytics.total_habits} habits completed today
          </p>
        </motion.div>
        
        {/* Weekly Productivity Chart */}
        <motion.div
          className="bg-white/5 border border-white/20 rounded-xl p-6 mt-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <BarChart3 className="h-5 w-5 text-purple-300" />
            </div>
            <h3 className="text-xl font-semibold text-white/90">Weekly Productivity by Category</h3>
          </div>
          
          {loadingChart ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-white/60">Loading chart...</div>
            </div>
          ) : productivityData && productivityData.chart_data.length > 0 ? (
            <ProductivityChart data={productivityData} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-white/60">No productivity data available</div>
            </div>
          )}
        </motion.div>

        {/* 30-Day Productivity Chart */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <ProductivityChart30Days />
        </motion.div>
      </motion.div>
    </div>
  )
}