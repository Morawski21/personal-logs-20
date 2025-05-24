'use client'

import { useEffect, useState } from 'react'
import { HabitGrid } from '@/components/HabitGrid'
import { Header } from '@/components/Header'
import { Analytics } from '@/components/Analytics'
import { useHabitStore } from '@/stores/habitStore'
import type { Habit } from '@/types/habit'

export default function Home() {
  const { habits, loading, error, fetchHabits } = useHabitStore()
  const [showAnalytics, setShowAnalytics] = useState(false)

  useEffect(() => {
    fetchHabits()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading habits...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <div className="text-xl font-semibold text-foreground">Connection Error</div>
          <div className="text-sm text-muted-foreground bg-card p-4 rounded-lg border">
            {error}
          </div>
          <button 
            onClick={() => fetchHabits()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
          <div className="text-xs text-muted-foreground">
            Expected API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onToggleAnalytics={() => setShowAnalytics(!showAnalytics)} />
      
      {showAnalytics ? (
        <Analytics />
      ) : (
        <HabitGrid habits={habits} />
      )}
    </div>
  )
}