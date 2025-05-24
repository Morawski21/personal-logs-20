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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-destructive">Error: {error}</div>
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