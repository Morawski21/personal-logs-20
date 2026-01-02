'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { HabitGrid } from '@/components/HabitGrid'
import { Header } from '@/components/Header'
import { Analytics } from '@/components/Analytics'
import { Settings } from '@/components/Settings'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { ProductivityKPIs } from '@/components/ProductivityKPIs'
import { DailyInsights } from '@/components/DailyInsights'
import { StreakNotifications } from '@/components/StreakNotifications'
import { ActivityChart30Days } from '@/components/ActivityChart30Days'
import { useHabitStore } from '@/stores/habitStore'
import type { Habit } from '@/types/habit'

export default function Home() {
  const { habits, loading, error, fetchHabits } = useHabitStore()
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

  useEffect(() => {
    fetchHabits()
  }, [])

  if (loading) {
    return <LoadingSkeleton />
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
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Simplified background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(71,85,105,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(51,65,85,0.1),transparent_60%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header
          onToggleAnalytics={() => {
            setShowAnalytics(!showAnalytics)
            setShowSettings(false)
          }}
          onToggleSettings={() => {
            setShowSettings(!showSettings)
            setShowAnalytics(false)
          }}
          onToggleDebug={() => setDebugMode(!debugMode)}
          debugMode={debugMode}
        />

        {showSettings ? (
          <Settings />
        ) : showAnalytics ? (
          <Analytics />
        ) : (
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* 30-day Activity Chart */}
            <ActivityChart30Days />

            {/* Productivity KPIs - More Compact */}
            <ProductivityKPIs debugMode={debugMode} />

            {/* Habit Cards Grid */}
            <HabitGrid habits={habits} />
          </div>
        )}

        {/* Streak Notifications */}
        <StreakNotifications habits={habits} />
      </div>
    </div>
  )
}