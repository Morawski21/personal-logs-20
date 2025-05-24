'use client'

import { RefreshCw, BarChart3, Settings } from 'lucide-react'
import { useHabitStore } from '@/stores/habitStore'

interface HeaderProps {
  onToggleAnalytics: () => void
  onToggleSettings: () => void
}

export function Header({ onToggleAnalytics, onToggleSettings }: HeaderProps) {
  const { refreshHabits, loading } = useHabitStore()
  
  const handleRefresh = async () => {
    await refreshHabits()
  }

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Modern Habit Tracker</h1>
            <p className="text-sm text-muted-foreground">Track your habits with Excel integration</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleAnalytics}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </button>
            
            <button
              onClick={onToggleSettings}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}