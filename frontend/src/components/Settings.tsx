'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Eye, EyeOff, Trash2, GripVertical, Save, RotateCcw, Archive } from 'lucide-react'
import { useHabitStore } from '@/stores/habitStore'
import type { Habit } from '@/types/habit'

interface EditableHabit extends Habit {
  isEditing?: boolean
}

interface HiddenHabit {
  id: string
  name: string
  emoji: string
  is_personal: boolean
  order: number
}

export function Settings() {
  const { habits, fetchHabits } = useHabitStore()
  const [editableHabits, setEditableHabits] = useState<EditableHabit[]>([])
  const [hiddenHabits, setHiddenHabits] = useState<HiddenHabit[]>([])
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'hidden'>('active')

  useEffect(() => {
    setEditableHabits([...habits].sort((a, b) => a.order - b.order))
    fetchHiddenHabits()
  }, [habits])

  const fetchHiddenHabits = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/habits/hidden`)
      if (response.ok) {
        const hidden = await response.json()
        setHiddenHabits(hidden)
      }
    } catch (error) {
      console.error('Error fetching hidden habits:', error)
    }
  }

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
        setEditableHabits(prev => 
          prev.map(h => h.id === habitId ? { ...h, ...updates } : h)
        )
        await fetchHabits()
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
        setEditableHabits(prev => prev.filter(h => h.id !== habitId))
        await fetchHabits()
        await fetchHiddenHabits()
      } else {
        console.error('Failed to delete habit')
      }
    } catch (error) {
      console.error('Error deleting habit:', error)
    } finally {
      setSaving(false)
    }
  }

  const restoreHabit = async (habitId: string) => {
    try {
      setSaving(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/habits/${habitId}/restore`, {
        method: 'POST',
      })

      if (response.ok) {
        await fetchHabits()
        await fetchHiddenHabits()
      } else {
        console.error('Failed to restore habit')
      }
    } catch (error) {
      console.error('Error restoring habit:', error)
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
    <div className="container mx-auto px-4 py-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-purple-500/20 rounded-xl backdrop-blur-sm border border-purple-500/30">
            <SettingsIcon className="h-6 w-6 text-purple-300" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Habit Settings
            </h2>
            <p className="text-white/60">Customize your habit cards without affecting Excel data</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <motion.button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-purple-500/30 to-cyan-500/30 text-white border border-purple-400/50'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye className="h-4 w-4" />
            Active Habits ({editableHabits.length})
          </motion.button>
          
          <motion.button
            onClick={() => setActiveTab('hidden')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'hidden'
                ? 'bg-gradient-to-r from-purple-500/30 to-cyan-500/30 text-white border border-purple-400/50'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Archive className="h-4 w-4" />
            Hidden Habits ({hiddenHabits.length})
          </motion.button>
        </div>

        {/* Active Habits Tab */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {editableHabits.map((habit, index) => (
              <motion.div
                key={habit.id}
                className="bg-white/5 border border-white/20 rounded-xl p-6 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <GripVertical className="h-4 w-4 text-white/40 cursor-move" />
                    
                    {habit.isEditing ? (
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="text"
                          value={habit.emoji}
                          onChange={(e) => handleInputChange(habit.id, 'emoji', e.target.value)}
                          className="w-12 text-center text-xl bg-white/10 border border-white/30 rounded px-2 py-1 text-white"
                          maxLength={2}
                        />
                        <input
                          type="text"
                          value={habit.name}
                          onChange={(e) => handleInputChange(habit.id, 'name', e.target.value)}
                          className="flex-1 bg-white/10 border border-white/30 rounded px-3 py-2 text-white"
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={habit.is_personal}
                            onChange={(e) => handleInputChange(habit.id, 'is_personal', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm text-white/70">Personal</span>
                        </label>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-2xl">{habit.emoji}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white/90">{habit.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-white/60">
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
                          <div className="text-sm font-medium text-white/90">
                            {habit.current_streak}d streak
                          </div>
                          <div className="text-xs text-white/60">
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

            {editableHabits.length === 0 && (
              <div className="text-center text-white/60 py-12">
                <p className="text-lg">No active habits to configure</p>
                <p className="text-sm mt-2">Add habits to your Excel file to see them here</p>
              </div>
            )}
          </div>
        )}

        {/* Hidden Habits Tab */}
        {activeTab === 'hidden' && (
          <div className="space-y-4">
            {hiddenHabits.map((habit) => (
              <motion.div
                key={habit.id}
                className="bg-white/5 border border-white/20 rounded-xl p-6 backdrop-blur-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl opacity-50">{habit.emoji}</span>
                    <div>
                      <h3 className="text-lg font-medium text-white/80">
                        {habit.is_personal ? "🔒 Private Habit" : habit.name}
                      </h3>
                      <p className="text-sm text-white/50">Hidden from main view</p>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={() => restoreHabit(habit.id)}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 rounded-xl border border-emerald-400/30 hover:border-emerald-400/50 transition-all duration-300 disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restore
                  </motion.button>
                </div>
              </motion.div>
            ))}

            {hiddenHabits.length === 0 && (
              <div className="text-center text-white/60 py-12">
                <p className="text-lg">No hidden habits</p>
                <p className="text-sm mt-2">Hidden habits will appear here when you hide them from the main view</p>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 p-6 bg-white/5 border border-white/20 rounded-xl backdrop-blur-sm">
          <h3 className="font-semibold text-white/90 mb-3 flex items-center gap-2">
            💡 How it works
          </h3>
          <ul className="text-sm text-white/70 space-y-2">
            <li>• <strong className="text-white/90">Edit</strong>: Change names and emojis without affecting your Excel file</li>
            <li>• <strong className="text-white/90">Hide</strong>: Remove habit cards from display (Excel data stays intact)</li>
            <li>• <strong className="text-white/90">Restore</strong>: Bring back hidden habits to the main view</li>
            <li>• <strong className="text-white/90">Personal</strong>: Enable privacy mode for sensitive habits</li>
            <li>• <strong className="text-white/90">Drag</strong>: Reorder habits by dragging the grip handle</li>
            <li className="pt-2 border-t border-white/10">• Changes are saved automatically and persist between sessions</li>
          </ul>
        </div>
      </motion.div>
    </div>
  )
}