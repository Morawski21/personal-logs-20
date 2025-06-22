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

// Animated Progress Ring Component
function ProgressRing({ progress, size = 60, strokeWidth = 4 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-white/10"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white/90">{Math.round(progress)}%</span>
      </div>
    </div>
  )
}

// Particle Effect Component
function ParticleEffect({ isActive }: { isActive: boolean }) {
  if (!isActive) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + (i % 2) * 40}%`,
          }}
          animate={{
            y: [-10, -30, -10],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}
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

  // Dynamic card styles based on state
  const getCardBackground = () => {
    if (isRecordBreaking) {
      return "bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-cyan-900/40"
    }
    if (isActive) {
      return "bg-gradient-to-br from-emerald-900/30 via-teal-900/20 to-blue-900/30"
    }
    return "bg-gradient-to-br from-slate-900/50 via-gray-900/30 to-slate-800/40"
  }

  const getBorderGlow = () => {
    if (isRecordBreaking) {
      return "border-purple-500/50 shadow-purple-500/25"
    }
    if (isActive) {
      return "border-emerald-500/50 shadow-emerald-500/25"
    }
    return "border-slate-600/30 shadow-slate-500/10"
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative rounded-2xl p-6 overflow-hidden cursor-pointer group",
        "h-48 flex flex-col justify-between transition-all duration-500",
        "backdrop-blur-xl border shadow-2xl",
        getCardBackground(),
        getBorderGlow(),
        isDragging && "opacity-50 z-50 scale-110",
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ 
        scale: isDragging ? 1 : 1.05, 
        rotateY: isDragging ? 0 : 5,
        rotateX: isDragging ? 0 : 2,
      }}
      whileTap={{ scale: isDragging ? 1 : 0.95 }}
      layout
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {/* Animated background mesh */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-full group-hover:-translate-x-full transition-transform duration-1000" />
      </div>

      {/* Particle effects for active habits */}
      <ParticleEffect isActive={isRecordBreaking} />

      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-sm" />
      
      {/* Drag Handle */}
      <div 
        className="drag-handle absolute top-3 left-3 opacity-0 group-hover:opacity-70 hover:opacity-100 transition-all duration-300 p-2 cursor-grab active:cursor-grabbing z-20"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-white/60" />
      </div>

      {/* Personal Habit Effects */}
      {habit.is_personal && !isRevealed && (
        <Lock className="absolute top-4 right-4 h-5 w-5 text-purple-400 opacity-70 group-hover:opacity-100 transition-all duration-300 z-10" />
      )}
      
      {/* Header with enhanced emoji */}
      <div className="flex items-center gap-4 z-10 relative">
        <motion.div
          className="relative"
          animate={isRecordBreaking ? { 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0] 
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-3xl drop-shadow-lg" role="img" aria-label={habit.name}>
            {habit.emoji}
          </span>
          {isRecordBreaking && (
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Sparkles className="h-4 w-4 text-yellow-400" />
            </motion.div>
          )}
        </motion.div>
        
        <div className="flex-1">
          <h3 className={cn(
            "text-lg font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent relative inline-block",
            habit.is_personal && !isRevealed && "select-none"
          )}>
            {habit.is_personal && !isRevealed ? (
              <span className="relative">
                <span className="opacity-0">{habit.name}</span>
                <span className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text blur-sm">
                  ██████████
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded text-xs flex items-center justify-center">
                  🔒 PRIVATE
                </span>
              </span>
            ) : (
              habit.name
            )}
          </h3>
          
          {/* Status indicator */}
          <motion.div 
            className={cn(
              "flex items-center gap-2 text-sm font-medium mt-1",
              isRecordBreaking ? "text-purple-300" : isActive ? "text-emerald-300" : "text-slate-400"
            )}
            animate={isRecordBreaking ? { opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span>
              {isRecordBreaking ? "🔥 Record Breaking!" : isActive ? "✨ Active" : "💤 Inactive"}
            </span>
            {isRecordBreaking && <Star className="h-4 w-4 text-yellow-400" />}
            {isActive && !isRecordBreaking && <Flame className="h-4 w-4 text-orange-400" />}
          </motion.div>
        </div>
      </div>
      
      {/* Enhanced Stats Section */}
      <div className="grid grid-cols-3 gap-4 z-10 relative">
        {/* Current Streak with Progress Ring */}
        <div className="space-y-2">
          <p className="text-xs text-white/60 uppercase tracking-wider">Current</p>
          <div className="flex items-center gap-3">
            <ProgressRing progress={streakProgress} size={50} />
            <div>
              <p className="text-xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                {habit.current_streak}
              </p>
              <p className="text-xs text-white/50">days</p>
            </div>
          </div>
        </div>
        
        {/* Best Streak */}
        <div className="space-y-2">
          <p className="text-xs text-white/60 uppercase tracking-wider">Best</p>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-400/80" />
            <div>
              <p className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
                {habit.best_streak}
              </p>
              <p className="text-xs text-white/50">days</p>
            </div>
          </div>
        </div>

        {/* Completion Status */}
        <div className="space-y-2">
          <p className="text-xs text-white/60 uppercase tracking-wider">Today</p>
          <motion.div 
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
              habit.completed_today 
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400 shadow-emerald-400/50 shadow-lg" 
                : "bg-slate-800/50 border-slate-600 backdrop-blur-sm"
            )}
            animate={habit.completed_today ? {
              scale: [1, 1.1, 1],
              boxShadow: [
                "0 0 20px rgba(16, 185, 129, 0.5)",
                "0 0 30px rgba(16, 185, 129, 0.8)",
                "0 0 20px rgba(16, 185, 129, 0.5)"
              ]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {habit.completed_today ? (
              <motion.span 
                className="text-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 8 }}
              >
                ✓
              </motion.span>
            ) : (
              <span className="text-slate-500 text-lg">◯</span>
            )}
          </motion.div>
        </div>
      </div>

      {/* Hover glow effect */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-emerald-500/10 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  )
}