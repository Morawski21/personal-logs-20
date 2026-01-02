export type HabitType = 'time' | 'binary' | 'description' | 'grade'

export interface Habit {
  id: string
  name: string
  emoji: string
  icon?: string
  habit_type: HabitType
  category?: string
  color?: string
  active: boolean
  order: number
  is_personal: boolean
  current_streak: number
  best_streak: number
  completed_today: boolean
  last_completion_date?: string
}

export interface HabitEntry {
  habit_id: string
  date: string
  value?: string
  completed: boolean
}

export interface Analytics {
  total_habits: number
  active_streaks: number
  longest_streak: number
  completed_today: number
  completion_rate: number
}

export interface CalendarDay {
  date: string
  completed_habits: number
  total_habits: number
  productivity_minutes: number
  perfect_day: boolean
  workout_grade?: string
}

export interface ExternalLink {
  name: string
  url: string
  icon: string
}