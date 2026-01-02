'use client'

import { RefreshCw, Settings, Bug } from 'lucide-react'
import { motion } from 'framer-motion'
import { useHabitStore } from '@/stores/habitStore'

interface HeaderProps {
  onToggleSettings: () => void
  onToggleDebug: () => void
  debugMode: boolean
}

export function Header({ onToggleSettings, onToggleDebug, debugMode }: HeaderProps) {
  const { refreshHabits, loading } = useHabitStore()
  
  const handleRefresh = async () => {
    await refreshHabits()
  }

  return (
    <header className="border-b backdrop-blur-xl relative z-20" style={{ borderColor: '#5c3d2e', backgroundColor: 'rgba(45, 27, 14, 0.9)' }}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold" style={{ color: '#fef3c7' }}>
              Personal Logs
            </h1>
            <p className="text-xs" style={{ color: '#d4a574' }}>
              Track your habits with Excel integration
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Debug Toggle */}
            <motion.button
              onClick={onToggleDebug}
              className={`p-2 text-sm font-medium transition-all duration-300 rounded-lg border ${
                debugMode
                  ? 'bg-orange-500/30 text-orange-200 border-orange-400/50'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-300 border-slate-700/50 hover:border-slate-600/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Toggle Debug Mode"
            >
              <Bug className="h-3 w-3" />
            </motion.button>

            <motion.button
              onClick={onToggleSettings}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white transition-all duration-300 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700/50 hover:border-slate-600/50"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Settings className="h-4 w-4" />
              Settings
            </motion.button>

            <motion.button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white/80 hover:text-white transition-all duration-300 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 hover:border-blue-500/60 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!loading ? { scale: 1.03 } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  )
}