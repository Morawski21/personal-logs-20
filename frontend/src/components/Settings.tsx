'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Eye, EyeOff, Trash2, GripVertical, Save } from 'lucide-react'
import { useHabitStore } from '@/stores/habitStore'
import type { Habit } from '@/types/habit'

interface EditableHabit extends Habit {
  isEditing?: boolean
}

export function Settings() {
  const { habits, fetchHabits } = useHabitStore()
  const [editableHabits, setEditableHabits] = useState<EditableHabit[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setEditableHabits([...habits].sort((a, b) => a.order - b.order))
  }, [habits])

  const updateHabit = async (habitId: string, updates: Partial<Habit>) => {
    try {
      setSaving(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/habits/${habitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        // Update local state
        setEditableHabits(prev => 
          prev.map(h => h.id === habitId ? { ...h, ...updates } : h)
        )
        await fetchHabits() // Refresh from server
      } else {
        console.error('Failed to update habit')
      }
    } catch (error) {
      console.error('Error updating habit:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteHabit = async (habitId: string) => {
    try {
      setSaving(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/habits/${habitId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove from local state
        setEditableHabits(prev => prev.filter(h => h.id !== habitId))
        await fetchHabits() // Refresh from server
      } else {
        console.error('Failed to delete habit')
      }
    } catch (error) {
      console.error('Error deleting habit:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleEdit = (habitId: string) => {
    setEditableHabits(prev =>
      prev.map(h => 
        h.id === habitId ? { ...h, isEditing: !h.isEditing } : h
      )
    )
  }

  const saveChanges = async (habit: EditableHabit) => {
    await updateHabit(habit.id, {
      name: habit.name,
      emoji: habit.emoji,
      is_personal: habit.is_personal
    })
    toggleEdit(habit.id)
  }

  const handleInputChange = (habitId: string, field: keyof Habit, value: any) => {
    setEditableHabits(prev =>
      prev.map(h => 
        h.id === habitId ? { ...h, [field]: value } : h
      )
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-lg">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Habit Settings</h2>
            <p className="text-muted-foreground">Customize your habit cards without affecting Excel data</p>
          </div>
        </div>

        <div className="space-y-4">
          {editableHabits.map((habit, index) => (
            <motion.div
              key={habit.id}
              className="bg-card border border-border rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  
                  {habit.isEditing ? (
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="text"
                        value={habit.emoji}
                        onChange={(e) => handleInputChange(habit.id, 'emoji', e.target.value)}
                        className="w-12 text-center text-xl bg-background border border-border rounded px-2 py-1"
                        maxLength={2}
                      />
                      <input
                        type="text"
                        value={habit.name}
                        onChange={(e) => handleInputChange(habit.id, 'name', e.target.value)}
                        className="flex-1 bg-background border border-border rounded px-3 py-2"
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={habit.is_personal}
                          onChange={(e) => handleInputChange(habit.id, 'is_personal', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-muted-foreground">Personal</span>
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-2xl">{habit.emoji}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-card-foreground">{habit.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{habit.habit_type}</span>
                          {habit.is_personal && (
                            <div className="flex items-center gap-1">
                              <EyeOff className="h-3 w-3" />
                              <span>Personal</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-card-foreground">
                          {habit.current_streak}d streak
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Best: {habit.best_streak}d
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {habit.isEditing ? (
                    <>
                      <button
                        onClick={() => saveChanges(habit)}
                        disabled={saving}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </button>
                      <button
                        onClick={() => toggleEdit(habit.id)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleEdit(habit.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        disabled={saving}
                        className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Hide
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {editableHabits.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg">No habits to configure</p>
            <p className="text-sm mt-2">Add habits to your Excel file to see them here</p>
          </div>
        )}

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold text-card-foreground mb-2">💡 How it works</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Edit</strong>: Change names and emojis without affecting your Excel file</li>
            <li>• <strong>Hide</strong>: Remove habit cards from display (Excel data stays intact)</li>
            <li>• <strong>Personal</strong>: Enable blur mode for sensitive habits</li>
            <li>• <strong>Drag</strong>: Reorder habits by dragging the grip handle</li>
            <li>• Changes are saved automatically and persist between sessions</li>
          </ul>
        </div>
      </motion.div>
    </div>
  )
}