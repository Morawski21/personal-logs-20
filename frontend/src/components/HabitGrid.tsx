'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { HabitCard } from './HabitCard'
import { Medal } from 'lucide-react'
import type { Habit } from '@/types/habit'
import { cn } from '@/lib/utils'

interface HabitGridProps {
  habits: Habit[]
}

export function HabitGrid({ habits }: HabitGridProps) {
  // State for drag & drop
  const [localHabits, setLocalHabits] = useState(habits)
  
  // Update local state when habits prop changes
  useState(() => {
    setLocalHabits([...habits].sort((a, b) => a.order - b.order))
  }, [habits])
  
  // Sensors for drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      setLocalHabits((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }
  
  // Check if all main habits (non-personal) are completed today
  const mainHabits = localHabits.filter(habit => !habit.is_personal)
  const mainHabitsCompleted = mainHabits.filter(habit => habit.completed_today).length
  const isPerfectDay = mainHabitsCompleted === mainHabits.length && mainHabits.length > 0

  // Separate active and inactive habits
  const activeHabits = localHabits.filter(habit => habit.current_streak > 0)
  const inactiveHabits = localHabits.filter(habit => habit.current_streak === 0)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localHabits.map(h => h.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white/90">Habits</h3>
              <p className="text-xs text-white/60">
                {mainHabitsCompleted} of {mainHabits.length} completed today • {activeHabits.length} active
              </p>
            </div>
            {isPerfectDay && (
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                <Medal className="h-5 w-5" />
                <span>Perfect Day!</span>
              </div>
            )}
          </div>

          {localHabits.length > 0 ? (
            <div className="space-y-4">
              {/* Active Habits */}
              {activeHabits.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-emerald-400/80 mb-2 uppercase tracking-wider">
                    Active Streaks ({activeHabits.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {activeHabits.map((habit) => (
                      <HabitCard key={habit.id} habit={habit} />
                    ))}
                  </div>
                </div>
              )}

              {/* Inactive Habits */}
              {inactiveHabits.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500/80 mb-2 uppercase tracking-wider">
                    Inactive ({inactiveHabits.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {inactiveHabits.map((habit) => (
                      <HabitCard key={habit.id} habit={habit} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-white/60 py-8">
              <p className="text-sm">No habits found</p>
              <p className="text-xs mt-2 text-white/40">Add Excel files to the data directory</p>
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  )
}