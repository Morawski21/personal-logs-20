import { create } from 'zustand'
import type { Habit, Analytics } from '@/types/habit'

interface HabitStore {
  habits: Habit[]
  analytics: Analytics | null
  loading: boolean
  error: string | null
  fetchHabits: () => Promise<void>
  fetchAnalytics: () => Promise<void>
  refreshHabits: () => Promise<void>
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  analytics: null,
  loading: false,
  error: null,

  fetchHabits: async () => {
    set({ loading: true, error: null })
    try {
      const response = await fetch(`${API_BASE_URL}/api/habits/`)
      if (!response.ok) {
        const errorMessage = `Backend API error (${response.status}): ${response.statusText}`
        throw new Error(errorMessage)
      }
      const habits = await response.json()
      set({ habits, loading: false })
    } catch (error) {
      let errorMessage = 'Unknown error occurred'
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = `Cannot connect to backend API at ${API_BASE_URL}. Check if backend is running and accessible.`
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      console.error('Fetch habits error:', error)
      set({ error: errorMessage, loading: false })
    }
  },

  fetchAnalytics: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const analytics = await response.json()
      set({ analytics })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  },

  refreshHabits: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/habits/refresh`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      await get().fetchHabits()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  },
}))