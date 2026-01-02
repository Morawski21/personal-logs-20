'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Lock, Star, Flame, Trophy, GripVertical, Sparkles } from 'lucide-react'
import type { Habit } from '@/types/habit'
import { cn } from '@/lib/utils'

interface HabitCardProps {
  habit: Habit
  className?: string
}

// Compact Progress Bar Component
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  )
}

export function HabitCard({ habit, className }: HabitCardProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  
  const isRecordBreaking = habit.current_streak >= habit.best_streak && habit.current_streak > 0
  const isActive = habit.current_streak > 0
  const streakProgress = Math.min((habit.current_streak / Math.max(habit.best_streak, 1)) * 100, 100)
  
  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      return
    }
    
    if (habit.is_personal) {
      setIsRevealed(!isRevealed)
    }
  }

  // Get achievement badge
  const getAchievementBadge = () => {
    if (habit.current_streak >= 100) return { icon: Trophy, text: "Centurion", color: "text-yellow-400" }
    if (habit.current_streak >= 50) return { icon: Star, text: "Champion", color: "text-purple-400" }
    if (habit.current_streak >= 30) return { icon: Flame, text: "Master", color: "text-orange-400" }
    if (habit.current_streak >= 7) return { icon: Sparkles, text: "Streak", color: "text-cyan-400" }
    return null
  }

  const achievement = getAchievementBadge()

  // Simplified card styles
  const getCardBackground = () => {
    if (isRecordBreaking) {
      return "bg-slate-800/60"
    }
    if (isActive) {
      return "bg-slate-800/50"
    }
    return "bg-slate-900/50"
  }

  const getBorderColor = () => {
    if (isRecordBreaking) {
      return "border-amber-500/40"
    }
    if (isActive) {
      return "border-emerald-500/40"
    }
    return "border-slate-700/40"
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative rounded-lg p-4 overflow-hidden cursor-pointer group",
        "h-24 flex items-center gap-3 transition-all duration-300",
        "backdrop-blur-sm border",
        getCardBackground(),
        getBorderColor(),
        isDragging && "opacity-50 z-50 scale-105",
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: isDragging ? 1 : 1.02 }}
      whileTap={{ scale: isDragging ? 1 : 0.98 }}
      layout
    >
      {/* Drag Handle */}
      <div
        className="drag-handle absolute top-2 left-2 opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity p-1 cursor-grab active:cursor-grabbing z-20"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3 text-white/60" />
      </div>

      {/* Personal Habit Lock */}
      {habit.is_personal && !isRevealed && (
        <Lock className="absolute top-2 right-2 h-4 w-4 text-slate-400 opacity-60 z-10" />
      )}

      {/* Name and Progress */}
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          "text-sm font-semibold text-white/90 truncate mb-1",
          habit.is_personal && !isRevealed && "select-none"
        )}>
          {habit.is_personal && !isRevealed ? (
            <span className="text-slate-400">PRIVATE</span>
          ) : (
            habit.name
          )}
        </h3>
        <ProgressBar progress={streakProgress} />
      </div>

      {/* Streaks */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-center">
          <p className="text-xs text-white/50">Current</p>
          <p className={cn(
            "text-lg font-bold",
            isRecordBreaking ? "text-amber-400" : "text-white/90"
          )}>
            {habit.current_streak}
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs text-white/50">Best</p>
          <p className="text-lg font-bold text-amber-500/80">
            {habit.best_streak}
          </p>
        </div>

        {/* Today Status */}
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-300",
            habit.completed_today
              ? "bg-emerald-500/20 border-emerald-500/50"
              : "bg-slate-800/30 border-slate-600/40"
          )}
        >
          {habit.completed_today ? (
            <span className="text-emerald-400 text-lg font-bold">✓</span>
          ) : (
            <span className="text-slate-500 text-lg">◯</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}