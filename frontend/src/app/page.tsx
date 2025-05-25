'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { HabitGrid } from '@/components/HabitGrid'
import { Header } from '@/components/Header'
import { Analytics } from '@/components/Analytics'
import { Settings } from '@/components/Settings'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { ProductivityKPIs } from '@/components/ProductivityKPIs'
import { useHabitStore } from '@/stores/habitStore'
import type { Habit } from '@/types/habit'

export default function Home() {
  const { habits, loading, error, fetchHabits } = useHabitStore()
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated cosmic background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(139,92,246,0.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(6,182,212,0.04),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.03),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(236,72,153,0.05),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.03),transparent_80%)]" />
      </div>

      {/* Floating cosmic particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -80, -20],
              x: [0, 30, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
      
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
        />
        
        {showSettings ? (
          <Settings />
        ) : showAnalytics ? (
          <Analytics />
        ) : (
          <>
            <HabitGrid habits={habits} />
            <ProductivityKPIs />
          </>
        )}
      </div>
    </div>
  )
}