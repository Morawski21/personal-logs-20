'use client'

import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'

interface WorkoutEntry {
  date: string
  activity: string
  time: number
  grade: string | null
  avg_hr: number | null
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
    const g = grade.toUpperCase()
    if (g.startsWith('A')) return { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', border: '#34d399' }
    if (g.startsWith('B')) return { bg: 'rgba(96, 165, 250, 0.15)', text: '#60a5fa', border: '#60a5fa' }
    if (g.startsWith('C')) return { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', border: '#fbbf24' }
    if (g.startsWith('D')) return { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171', border: '#f87171' }
    return { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280', border: '#6b7280' }
  }

  if (loading) {
    return (
      <div className="rounded-xl p-5 backdrop-blur-sm animate-pulse" style={{ backgroundColor: '#1a1f2e', borderColor: '#2a3441', borderWidth: '1px' }}>
        <div className="h-6 w-32 rounded" style={{ backgroundColor: '#2a3441' }}></div>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-5 backdrop-blur-sm" style={{ backgroundColor: '#1a1f2e', borderColor: '#2a3441', borderWidth: '1px' }}>
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5" style={{ color: '#06b6d4' }} />
        <h3 className="text-base font-semibold" style={{ color: '#f9fafb' }}>
          Training Log
        </h3>
      </div>

      {workouts.length > 0 ? (
        <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0" style={{ backgroundColor: '#1a1f2e' }}>
              <tr style={{ borderBottom: '1px solid #2a3441' }}>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: '#9ca3af' }}>Date</th>
                <th className="text-left py-2 px-3 font-semibold" style={{ color: '#9ca3af' }}>Activity</th>
                <th className="text-center py-2 px-3 font-semibold" style={{ color: '#9ca3af' }}>Time</th>
                <th className="text-center py-2 px-3 font-semibold" style={{ color: '#9ca3af' }}>Grade</th>
                <th className="text-center py-2 px-3 font-semibold" style={{ color: '#9ca3af' }}>Avg HR</th>
              </tr>
            </thead>
            <tbody>
              {workouts.map((workout, index) => {
                const gradeColors = workout.grade ? getGradeColor(workout.grade) : null

                return (
                  <tr
                    key={index}
                    className="hover:bg-opacity-50 transition-colors"
                    style={{
                      borderBottom: index < workouts.length - 1 ? '1px solid rgba(42, 52, 65, 0.5)' : 'none',
                      backgroundColor: index % 2 === 0 ? 'rgba(42, 52, 65, 0.3)' : 'transparent'
                    }}
                  >
                    <td className="py-2 px-3" style={{ color: '#9ca3af' }}>
                      {formatDate(workout.date)}
                    </td>
                    <td className="py-2 px-3" style={{ color: '#f9fafb' }}>
                      {workout.activity}
                    </td>
                    <td className="py-2 px-3 text-center" style={{ color: '#9ca3af' }}>
                      {workout.time > 0 ? `${workout.time}m` : '-'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {workout.grade && gradeColors ? (
                        <span
                          className="inline-block px-2 py-1 rounded font-bold text-sm"
                          style={{
                            backgroundColor: gradeColors.bg,
                            color: gradeColors.text,
                            border: `1px solid ${gradeColors.border}`
                          }}
                        >
                          {workout.grade}
                        </span>
                      ) : (
                        <span style={{ color: '#6b7280' }}>-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center" style={{ color: '#9ca3af' }}>
                      {workout.avg_hr || '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8" style={{ color: '#9ca3af' }}>
          <p className="text-sm">No workouts logged</p>
        </div>
      )}
    </div>
  )
}
