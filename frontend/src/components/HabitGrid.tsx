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
import { Medal, ChevronDown, ChevronUp } from 'lucide-react'
import type { Habit } from '@/types/habit'
import { cn } from '@/lib/utils'

interface HabitGridProps {
  habits: Habit[]
}

// Core habits that should always be prioritized
const CORE_HABIT_NAMES = ['ynab', 'Anki']

export function HabitGrid({ habits }: HabitGridProps) {
  // State for drag & drop
  const [localHabits, setLocalHabits] = useState(habits)
  const [showInactive, setShowInactive] = useState(false)

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

  // Separate into core, active, and inactive habits
  // Core habits: predefined important habits + top streaks
  const coreHabits = localHabits.filter(h =>
    CORE_HABIT_NAMES.some(name => h.name.toLowerCase().includes(name.toLowerCase()))
  )

  // If less than 3 core habits, add top streaks
  if (coreHabits.length < 3) {
    const sortedByStreak = [...localHabits]
      .filter(h => !coreHabits.some(core => core.id === h.id))
      .sort((a, b) => b.current_streak - a.current_streak)
    const additionalCore = sortedByStreak.slice(0, 3 - coreHabits.length)
    coreHabits.push(...additionalCore)
  }

  const coreHabitIds = new Set(coreHabits.map(h => h.id))

  const remainingHabits = localHabits.filter(h => !coreHabitIds.has(h.id))
  const activeHabits = remainingHabits.filter(habit => habit.current_streak > 0)
  const inactiveHabits = remainingHabits.filter(habit => habit.current_streak === 0)

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
        <div className="rounded-xl p-5 backdrop-blur-sm" style={{ backgroundColor: '#1a1f2e', borderColor: '#2a3441', borderWidth: '1px' }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold" style={{ color: '#f9fafb' }}>Habits</h3>
              <p className="text-xs" style={{ color: '#9ca3af' }}>
                {mainHabitsCompleted} of {mainHabits.length} completed today • {coreHabits.length + activeHabits.length} active
              </p>
            </div>
            {isPerfectDay && (
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#f59e0b' }}>
                <Medal className="h-5 w-5" />
                <span>Perfect Day!</span>
              </div>
            )}
          </div>

          {localHabits.length > 0 ? (
            <div className="space-y-5">
              {/* Core Habits */}
              {coreHabits.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#10b981' }}>
                    Core Habits ({coreHabits.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {coreHabits.map((habit) => (
                      <HabitCard key={habit.id} habit={habit} />
                    ))}
                  </div>
                </div>
              )}

              {/* Active Habits */}
              {activeHabits.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#f59e0b' }}>
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
                  <button
                    onClick={() => setShowInactive(!showInactive)}
                    className="flex items-center gap-2 text-xs font-semibold mb-2 uppercase tracking-wider transition-colors hover:opacity-80"
                    style={{ color: '#6b7280' }}
                  >
                    {showInactive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    Inactive ({inactiveHabits.length})
                  </button>
                  {showInactive && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {inactiveHabits.map((habit) => (
                        <HabitCard key={habit.id} habit={habit} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: '#9ca3af' }}>
              <p className="text-sm">No habits found</p>
              <p className="text-xs mt-2" style={{ color: '#6b7280' }}>Add Excel files to the data directory</p>
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  )
}