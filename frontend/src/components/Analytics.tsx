'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Target, TrendingUp, Calendar, Award, BarChart3 } from 'lucide-react'
import { useHabitStore } from '@/stores/habitStore'
import { WeeklyChart } from './WeeklyChart'

interface ChartData {
  date: string
  weekday: string
  total: number
  [key: string]: any
}

interface WeeklyChartData {
  chart_data: ChartData[]
  habits: string[]
}

export function Analytics() {
  const { analytics, fetchAnalytics } = useHabitStore()
  const [weeklyData, setWeeklyData] = useState<WeeklyChartData | null>(null)
  const [loadingChart, setLoadingChart] = useState(true)
  
  useEffect(() => {
    fetchAnalytics()
    fetchWeeklyChart()
  }, [])
  
  const fetchWeeklyChart = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/weekly-chart`)
      if (response.ok) {
        const data = await response.json()
        setWeeklyData(data)
      }
    } catch (error) {
      console.error('Error fetching weekly chart:', error)
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
      title: 'Longest Streak',
      value: analytics.longest_streak,
      icon: Award,
      description: 'Best streak across all habits'
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-foreground mb-2">Analytics</h2>
        <p className="text-muted-foreground mb-8">Your habit tracking insights</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.title}
                className="bg-card border border-border rounded-xl p-6 space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-card-foreground">{stat.title}</h3>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-card-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
        
        {/* Completion Rate */}
        <motion.div
          className="bg-card border border-border rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className="text-xl font-semibold text-card-foreground mb-4">Today's Completion Rate</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-secondary rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${analytics.completion_rate}%` }}
                transition={{ duration: 1, delay: 0.7 }}
              />
            </div>
            <span className="text-lg font-semibold text-card-foreground">
              {Math.round(analytics.completion_rate)}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {analytics.completed_today} of {analytics.total_habits} habits completed today
          </p>
        </motion.div>
        
        {/* Weekly Chart */}
        <motion.div
          className="bg-card border border-border rounded-xl p-6 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground">Weekly Time Distribution</h3>
          </div>
          
          {loadingChart ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-muted-foreground">Loading chart...</div>
            </div>
          ) : weeklyData && weeklyData.chart_data.length > 0 ? (
            <WeeklyChart data={weeklyData} />
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-muted-foreground">No chart data available</div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}