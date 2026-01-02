'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { HabitGrid } from '@/components/HabitGrid'
import { Header } from '@/components/Header'
import { Settings } from '@/components/Settings'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { ProductivityKPIs } from '@/components/ProductivityKPIs'
import { DailyInsights } from '@/components/DailyInsights'
import { StreakNotifications } from '@/components/StreakNotifications'
import { ActivityChart30Days } from '@/components/ActivityChart30Days'
import { ExerciseActivity } from '@/components/ExerciseActivity'
import { SelfcareBox } from '@/components/SelfcareBox'
import { DailyHabits } from '@/components/DailyHabits'
import { useHabitStore } from '@/stores/habitStore'
import type { Habit } from '@/types/habit'

export default function Home() {
  const { habits, loading, error, fetchHabits } = useHabitStore()
  const [showSettings, setShowSettings] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

  useEffect(() => {
    fetchHabits()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#0f1419' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#0f1419]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(6,182,212,0.08),transparent_70%)]" />
        </div>
        <div className="relative z-10">
          <Header
            onToggleSettings={() => setShowSettings(!showSettings)}
            onToggleDebug={() => setDebugMode(!debugMode)}
            debugMode={debugMode}
          />
          <div className="container mx-auto px-4 py-4">
            <div className="rounded-xl p-6 backdrop-blur-sm animate-pulse" style={{ backgroundColor: '#1a1f2e', borderColor: '#2a3441', borderWidth: '1px' }}>
              <div className="h-8 w-48 rounded" style={{ backgroundColor: '#2a3441' }}></div>
              <div className="h-4 w-64 rounded mt-2" style={{ backgroundColor: '#2a3441' }}></div>
              <div className="h-64 rounded mt-4" style={{ backgroundColor: '#2a3441' }}></div>
            </div>
          </div>
        </div>
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
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#0f1419' }}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#0f1419]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(6,182,212,0.08),transparent_70%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header
          onToggleSettings={() => setShowSettings(!showSettings)}
          onToggleDebug={() => setDebugMode(!debugMode)}
          debugMode={debugMode}
        />

        {showSettings ? (
          <Settings />
        ) : (
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* 1. Productivity - 30-day Activity Chart with metrics */}
            <ActivityChart30Days />

            {/* 2. Habits - Habit Cards Grid */}
            <HabitGrid habits={habits} />

            {/* 3. Daily Habits - Minimal daily trackers */}
            <DailyHabits habits={habits} />

            {/* 4. Self-care & Training Row */}
            <div className="grid grid-cols-4 gap-4">
              {/* Selfcare Box - 1/4 width */}
              <div className="col-span-1">
                <SelfcareBox />
              </div>

              {/* Exercise Activity Table - 3/4 width */}
              <div className="col-span-3">
                <ExerciseActivity />
              </div>
            </div>
          </div>
        )}

        {/* Streak Notifications */}
        <StreakNotifications habits={habits} />
      </div>
    </div>
  )
}