'use client'

import { RefreshCw, BarChart3, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
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
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl relative z-20">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <motion.h1 
              className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              Personal Logs
            </motion.h1>
            <motion.p 
              className="text-sm text-white/60"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              ✨ Track your habits with Excel integration
            </motion.p>
          </div>
          
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.button
              onClick={onToggleAnalytics}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-all duration-300 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/30"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </motion.button>
            
            <motion.button
              onClick={onToggleSettings}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-all duration-300 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/30"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="h-4 w-4" />
              Settings
            </motion.button>
            
            <motion.button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-all duration-300 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 backdrop-blur-sm border border-purple-400/30 hover:border-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!loading ? { scale: 1.05, y: -2 } : {}}
              whileTap={!loading ? { scale: 0.95 } : {}}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
          </motion.div>
        </div>
      </div>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent opacity-50 pointer-events-none" />
    </header>
  )
}