'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Lock, Star, Flame, Trophy, GripVertical } from 'lucide-react'
import type { Habit } from '@/types/habit'
import { cn } from '@/lib/utils'

interface HabitCardProps {
  habit: Habit
  className?: string
}

export function HabitCard({ habit, className }: HabitCardProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  
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
  
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger reveal when clicking drag handle
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      return
    }
    
    if (habit.is_personal) {
      setIsRevealed(!isRevealed)
    }
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative bg-card border border-border rounded-xl p-5 overflow-hidden cursor-pointer group",
        "h-40 flex flex-col justify-between transition-all duration-300",
        "shadow-lg hover:shadow-xl",
        isDragging && "opacity-50 z-50",
        className
      )}
      onClick={handleClick}
      whileHover={{ scale: isDragging ? 1 : 1.02 }}
      whileTap={{ scale: isDragging ? 1 : 0.98 }}
      layout
    >
      {/* Drag Handle */}
      <div 
        className="drag-handle absolute top-2 left-2 opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity p-1 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      {/* Background Effects */}
      {habit.completed_today && (
        <>
          {isRecordBreaking ? (
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-cyan-400/30 animate-move-gradient" />
          ) : isActive ? (
            <div className="absolute inset-0 bg-green-500/25" />
          ) : null}
        </>
      )}
      
      {/* Personal Habit Lock Icon */}
      {habit.is_personal && !isRevealed && (
        <Lock className="absolute top-4 right-4 h-4 w-4 text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity" />
      )}
      
      {/* Header */}
      <div className="flex items-center gap-4 z-10">
        <span className="text-2xl" role="img" aria-label={habit.name}>
          {habit.emoji}
        </span>
        <h3 className={cn(
          "text-lg font-semibold text-card-foreground",
          habit.is_personal && !isRevealed && "blur-sm select-none"
        )}>
          {habit.name}
        </h3>
      </div>
      
      {/* Content */}
      <div className="grid grid-cols-2 gap-4 z-10">
        {/* Current Streak */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Current streak</p>
          <p className="text-2xl font-bold text-card-foreground">
            {habit.current_streak}d
          </p>
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isRecordBreaking ? "text-purple-400" : isActive ? "text-green-400" : "text-muted-foreground"
          )}>
            <span>
              {isRecordBreaking ? "Record-breaking" : isActive ? "Active" : "Inactive"}
            </span>
            {isRecordBreaking && <Star className="h-3 w-3" />}
            {isActive && !isRecordBreaking && <Flame className="h-3 w-3" />}
          </div>
        </div>
        
        {/* Best Streak */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Best streak</p>
          <p className="text-2xl font-bold text-card-foreground">
            {habit.best_streak}d
          </p>
          <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
            <span>Best</span>
            <Trophy className="h-3 w-3" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}