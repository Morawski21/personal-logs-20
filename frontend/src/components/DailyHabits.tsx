'use client'

import { Leaf, Scissors, Clock, CheckCircle2, Circle, type LucideIcon } from 'lucide-react'
import type { Habit } from '@/types/habit'

interface DailyHabitsProps {
  habits: Habit[]
}

const dailyHabitConfig: Record<string, { icon: LucideIcon; color: string }> = {
  'vegetables': { icon: Leaf, color: '#10b981' },
  'haircare': { icon: Scissors, color: '#8b5cf6' },
  'cronometer': { icon: Clock, color: '#ef4444' },
}

export function DailyHabits({ habits }: DailyHabitsProps) {
  // Filter for daily habits (vegetables, haircare, cronometer)
  const dailyHabits = habits.filter(habit =>
    Object.keys(dailyHabitConfig).some(key =>
      habit.name.toLowerCase().includes(key.toLowerCase())
    )
  )

  if (dailyHabits.length === 0) return null

  return (
    <div className="rounded-xl p-4 backdrop-blur-sm" style={{ backgroundColor: '#1a1f2e', borderColor: '#2a3441', borderWidth: '1px' }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: '#f9fafb' }}>
        Daily Habits
      </h3>

      <div className="flex gap-3">
        {dailyHabits.map((habit) => {
          const configKey = Object.keys(dailyHabitConfig).find(key =>
            habit.name.toLowerCase().includes(key.toLowerCase())
          )
          const config = configKey ? dailyHabitConfig[configKey] : null
          const IconComponent = config?.icon || Circle
          const iconColor = config?.color || '#6b7280'

          return (
            <div
              key={habit.id}
              className="flex-1 rounded-lg p-3 flex flex-col items-center justify-center transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: habit.completed_today ? `${iconColor}15` : 'rgba(42, 52, 65, 0.5)',
                border: `1px solid ${habit.completed_today ? iconColor : '#2a3441'}`,
              }}
            >
              {/* Icon and completion status */}
              <div className="flex items-center gap-2 mb-2">
                <IconComponent className="h-5 w-5" style={{ color: iconColor }} />
                {habit.completed_today ? (
                  <CheckCircle2 className="h-4 w-4" style={{ color: iconColor }} />
                ) : (
                  <Circle className="h-4 w-4" style={{ color: '#6b7280' }} />
                )}
              </div>

              {/* Name */}
              <div className="text-xs font-medium mb-1 text-center" style={{ color: '#f9fafb' }}>
                {habit.name}
              </div>

              {/* Streak */}
              <div className="flex items-center gap-1">
                <span className="text-xs" style={{ color: '#9ca3af' }}>Streak:</span>
                <span className="text-sm font-bold" style={{ color: iconColor }}>
                  {habit.current_streak}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
