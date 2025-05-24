export interface Habit {
  id: string
  name: string
  emoji: string
  habit_type: 'time' | 'binary' | 'description'
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