'use client'

import { useEffect, useState } from 'react'
import { Activity, TrendingUp } from 'lucide-react'

interface WorkoutEntry {
  date: string
  type: string
  duration: number
  grade: string
}

export function ExerciseActivity() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkouts()
  }, [])

  const fetchWorkouts = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/analytics/recent-workouts`)

      if (response.ok) {
        const data = await response.json()
        setWorkouts(data.workouts || [])
      }
    } catch (error) {
      console.error('Error fetching workouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.toLocaleDateString('en-US', { weekday: 'short' })
    const dayNum = date.getDate()
    const month = date.getMonth() + 1
    return `${day} ${dayNum}/${month}`
  }

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return '#10b981'
    if (grade.startsWith('B')) return '#3b82f6'
    if (grade.startsWith('C')) return '#f59e0b'
    if (grade.startsWith('D')) return '#ff4d6b'
    return '#6b7280'
  }

  if (loading) {
    return (
      <div className="rounded-xl p-5 backdrop-blur-sm animate-pulse" style={{ backgroundColor: '#1a1f2e', borderColor: '#2a3441', borderWidth: '1px' }}>
        <div className="h-6 w-32 rounded" style={{ backgroundColor: '#2a3441' }}></div>
        <div className="h-4 w-48 rounded mt-2" style={{ backgroundColor: '#2a3441' }}></div>
      </div>
    )
  }

  const thisWeekWorkouts = workouts.slice(0, 3)
  const totalMinutes = thisWeekWorkouts.reduce((sum, w) => sum + w.duration, 0)

  return (
    <div className="rounded-xl p-5 backdrop-blur-sm" style={{ backgroundColor: '#1a1f2e', borderColor: '#2a3441', borderWidth: '1px' }}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: '#f9fafb' }}>
            <Activity className="h-4 w-4" style={{ color: '#10b981' }} />
            Recent Training
          </h3>
          <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
            This week: {thisWeekWorkouts.length}/3 sessions • {totalMinutes}min total
          </p>
        </div>
      </div>

      {workouts.length > 0 ? (
        <div className="space-y-2">
          {workouts.slice(0, 5).map((workout, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 rounded-lg"
              style={{ backgroundColor: 'rgba(42, 52, 65, 0.4)' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>
                  {formatDate(workout.date)}
                </span>
                <span className="text-sm" style={{ color: '#f9fafb' }}>
                  {workout.type}
                </span>
                {workout.duration > 0 && (
                  <span className="text-xs" style={{ color: '#9ca3af' }}>
                    {workout.duration}min
                  </span>
                )}
              </div>
              {workout.grade && workout.grade !== 'NA' && (
                <span
                  className="text-sm font-bold px-2 py-1 rounded"
                  style={{
                    color: getGradeColor(workout.grade),
                    backgroundColor: `${getGradeColor(workout.grade)}15`
                  }}
                >
                  Grade: {workout.grade}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4" style={{ color: '#6b7280' }}>
          <p className="text-sm">No recent workouts</p>
        </div>
      )}
    </div>
  )
}
