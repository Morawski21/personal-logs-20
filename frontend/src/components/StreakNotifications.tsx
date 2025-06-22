'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Flame, Star, Sparkles, X } from 'lucide-react'
import type { Habit } from '@/types/habit'

interface Notification {
  id: string
  type: 'milestone' | 'record' | 'motivation'
  title: string
  message: string
  icon: any
  color: string
  duration: number
}

interface StreakNotificationsProps {
  habits: Habit[]
}

export function StreakNotifications({ habits }: StreakNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    checkForNotifications()
  }, [habits])

  const checkForNotifications = () => {
    const newNotifications: Notification[] = []

    // Check for milestone achievements
    habits.forEach(habit => {
      if (habit.current_streak > 0) {
        // Major milestones
        if (habit.current_streak === 100 && habit.current_streak >= habit.best_streak) {
          newNotifications.push({
            id: `milestone-${habit.id}-100`,
            type: 'milestone',
            title: '🏆 Centurion Achievement!',
            message: `${habit.emoji} ${habit.name}: 100-day streak! Legendary!`,
            icon: Trophy,
            color: 'from-yellow-500 to-orange-500',
            duration: 8000,
          })
        } else if (habit.current_streak === 50 && habit.current_streak >= habit.best_streak) {
          newNotifications.push({
            id: `milestone-${habit.id}-50`,
            type: 'milestone',
            title: '⭐ Champion Status!',
            message: `${habit.emoji} ${habit.name}: 50-day streak! Amazing consistency!`,
            icon: Star,
            color: 'from-purple-500 to-pink-500',
            duration: 6000,
          })
        } else if (habit.current_streak === 30 && habit.current_streak >= habit.best_streak) {
          newNotifications.push({
            id: `milestone-${habit.id}-30`,
            type: 'milestone',
            title: '🔥 Master Level!',
            message: `${habit.emoji} ${habit.name}: 30-day streak! You're on fire!`,
            icon: Flame,
            color: 'from-orange-500 to-red-500',
            duration: 5000,
          })
        } else if (habit.current_streak === 7 && habit.current_streak >= habit.best_streak) {
          newNotifications.push({
            id: `milestone-${habit.id}-7`,
            type: 'milestone',
            title: '✨ First Week!',
            message: `${habit.emoji} ${habit.name}: 7-day streak! Great start!`,
            icon: Sparkles,
            color: 'from-cyan-500 to-blue-500',
            duration: 4000,
          })
        }

        // Personal record notifications
        if (habit.current_streak > habit.best_streak && habit.current_streak > 1) {
          newNotifications.push({
            id: `record-${habit.id}-${habit.current_streak}`,
            type: 'record',
            title: '🚀 Personal Record!',
            message: `${habit.emoji} ${habit.name}: ${habit.current_streak} days! New best!`,
            icon: Trophy,
            color: 'from-emerald-500 to-teal-500',
            duration: 5000,
          })
        }
      }
    })

    // Add motivational notifications based on overall progress
    const activeStreaks = habits.filter(h => h.current_streak > 0).length
    const totalHabits = habits.filter(h => !h.is_personal).length
    const completedToday = habits.filter(h => h.completed_today && !h.is_personal).length

    // Perfect day celebration
    if (completedToday === totalHabits && totalHabits > 0) {
      const perfectDayId = `perfect-day-${new Date().toDateString()}`
      if (!notifications.some(n => n.id === perfectDayId)) {
        newNotifications.push({
          id: perfectDayId,
          type: 'motivation',
          title: '🎉 Perfect Day!',
          message: 'All habits completed! You\'re unstoppable!',
          icon: Trophy,
          color: 'from-purple-500 to-pink-500',
          duration: 6000,
        })
      }
    }

    // Show only new notifications
    const existingIds = notifications.map(n => n.id)
    const reallyNewNotifications = newNotifications.filter(n => !existingIds.includes(n.id))

    if (reallyNewNotifications.length > 0) {
      setNotifications(prev => [...prev, ...reallyNewNotifications])

      // Auto-remove notifications after their duration
      reallyNewNotifications.forEach(notification => {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id))
        }, notification.duration)
      })
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => {
          const IconComponent = notification.icon
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`bg-gradient-to-r ${notification.color} p-1 rounded-xl shadow-2xl backdrop-blur-sm`}
            >
              <div className="bg-black/90 backdrop-blur-sm rounded-lg p-4 relative">
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                
                <div className="flex items-start gap-3 pr-6">
                  <div className={`p-2 bg-gradient-to-r ${notification.color} rounded-lg`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-sm mb-1">
                      {notification.title}
                    </h4>
                    <p className="text-white/80 text-xs leading-relaxed">
                      {notification.message}
                    </p>
                  </div>
                </div>

                {/* Progress bar for duration */}
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: notification.duration / 1000, ease: "linear" }}
                />
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}