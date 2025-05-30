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
  
  // Split into rows of 3
  const rows = []
  for (let i = 0; i < localHabits.length; i += 3) {
    rows.push(localHabits.slice(i, i + 3))
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="container mx-auto px-4 py-8">
        <SortableContext 
          items={localHabits.map(h => h.id)} 
          strategy={verticalListSortingStrategy}
        >
          {isPerfectDay && (
            <motion.div
              className="relative p-1 rounded-2xl mb-6 animate-move-border"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-background rounded-xl p-6">
                {rows.map((row, rowIndex) => (
                  <div 
                    key={rowIndex}
                    className={cn(
                      "grid gap-5 mb-5 last:mb-0",
                      row.length === 3 ? "grid-cols-1 md:grid-cols-3" : 
                      row.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto" :
                      "grid-cols-1 max-w-md mx-auto"
                    )}
                  >
                    {row.map((habit) => (
                      <HabitCard key={habit.id} habit={habit} />
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          
          {!isPerfectDay && (
            <div className="space-y-5">
              {rows.map((row, rowIndex) => (
                <motion.div 
                  key={rowIndex}
                  className={cn(
                    "grid gap-5",
                    row.length === 3 ? "grid-cols-1 md:grid-cols-3" : 
                    row.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto" :
                    "grid-cols-1 max-w-md mx-auto"
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: rowIndex * 0.1 }}
                >
                  {row.map((habit) => (
                    <HabitCard key={habit.id} habit={habit} />
                  ))}
                </motion.div>
              ))}
            </div>
          )}
        </SortableContext>
        
        {/* Perfect Day Message */}
        {isPerfectDay && (
          <motion.div 
            className="text-center mt-6 space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-center gap-2 text-xl font-bold text-purple-400">
              <Medal className="h-6 w-6" />
              <span>Perfect Day!</span>
              <Medal className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted-foreground italic">
              All habits completed. Rest & conquer the next day.
            </p>
          </motion.div>
        )}
        
        {localHabits.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg">No habits found</p>
            <p className="text-sm mt-2">Add Excel files to the data directory to get started</p>
          </div>
        )}
      </div>
    </DndContext>
  )
}