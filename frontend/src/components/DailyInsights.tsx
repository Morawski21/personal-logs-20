'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Flame, Target, Calendar } from 'lucide-react'
import type { Habit } from '@/types/habit'

interface DailyInsightsProps {
  habits: Habit[]
}

export function DailyInsights({ habits }: DailyInsightsProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Calculate stats
  const totalHabits = habits.filter(h => !h.is_personal).length
  const completedToday = habits.filter(h => h.completed_today && !h.is_personal).length
  const completionRate = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0
  
  const bestStreak = Math.max(...habits.map(h => h.best_streak), 0)
  const activeStreaks = habits.filter(h => h.current_streak > 0).length
  
  // Time-based habits total for today
  const timeHabitsToday = habits
    .filter(h => h.habit_type === 'time' && h.completed_today)
    .reduce((sum, h) => sum + (h.today_value || 0), 0)

  // Get motivational message based on progress
  const getMotivationalMessage = () => {
    const hour = currentTime.getHours()
    const isEvening = hour >= 18
    const isMorning = hour >= 5 && hour < 12
    
    if (completionRate === 100) {
      return "🎉 Perfect day! All habits completed!"
    } else if (completionRate >= 75) {
      return isEvening ? "🔥 Strong finish today!" : "💪 Great momentum going!"
    } else if (completionRate >= 50) {
      return isEvening ? "⚡ Still time to finish strong!" : "🎯 You're halfway there!"
    } else if (completionRate >= 25) {
      return isMorning ? "🌅 Early start! Keep building!" : "🚀 Ready to level up?"
    } else {
      return isMorning ? "☀️ Fresh start awaits!" : "💎 Every small step counts!"
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

  const getProgressColor = () => {
    if (completionRate >= 100) return "from-purple-500 to-pink-500"
    if (completionRate >= 75) return "from-green-500 to-emerald-500"
    if (completionRate >= 50) return "from-blue-500 to-cyan-500"
    if (completionRate >= 25) return "from-yellow-500 to-orange-500"
    return "from-gray-500 to-slate-500"
  }

  return (
    <motion.div
      className="container mx-auto px-4 pt-8 pb-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white/5 border border-white/20 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Daily Progress
            </h2>
            <p className="text-white/60 text-sm">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/60">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/80">
              {completedToday} of {totalHabits} habits completed
            </span>
            <span className="text-sm font-bold text-white">
              {completionRate.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 relative overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${getProgressColor()} relative`}
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {completionRate > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
              )}
            </motion.div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            className="bg-white/5 rounded-lg p-4 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center justify-center mb-2">
              <Flame className="h-5 w-5 text-orange-400" />
            </div>
            <div className="text-xl font-bold text-white">{activeStreaks}</div>
            <div className="text-xs text-white/60">Active Streaks</div>
          </motion.div>

          <motion.div
            className="bg-white/5 rounded-lg p-4 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-xl font-bold text-white">{bestStreak}</div>
            <div className="text-xs text-white/60">Best Streak</div>
          </motion.div>

          <motion.div
            className="bg-white/5 rounded-lg p-4 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {timeHabitsToday > 0 ? formatTime(timeHabitsToday) : '0m'}
            </div>
            <div className="text-xs text-white/60">Time Today</div>
          </motion.div>

          <motion.div
            className="bg-white/5 rounded-lg p-4 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-white">{totalHabits}</div>
            <div className="text-xs text-white/60">Total Habits</div>
          </motion.div>
        </div>

        {/* Motivational Message */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-lg font-medium bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            {getMotivationalMessage()}
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}