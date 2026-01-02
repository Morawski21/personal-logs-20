'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

interface SelfcareActivity {
  name: string
  type: 'daily' | 'occasional'
  current_streak?: number
  completed_today?: boolean
  days_since_last?: number | null
}

export function SelfcareBox() {
  const [activities, setActivities] = useState<SelfcareActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/api/analytics/selfcare-summary`)

      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching selfcare data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl p-5 backdrop-blur-sm animate-pulse" style={{ backgroundColor: '#2d1b0e', borderColor: '#5c3d2e', borderWidth: '1px' }}>
        <div className="h-6 w-32 rounded" style={{ backgroundColor: '#5c3d2e' }}></div>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-5 backdrop-blur-sm" style={{ backgroundColor: '#2d1b0e', borderColor: '#5c3d2e', borderWidth: '1px' }}>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5" style={{ color: '#ec4899' }} />
        <h3 className="text-base font-semibold" style={{ color: '#fef3c7' }}>
          Self-Care
        </h3>
      </div>

      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: 'rgba(92, 61, 46, 0.3)' }}
            >
              <span className="text-sm font-medium" style={{ color: '#fef3c7' }}>
                {activity.name}
              </span>

              {activity.type === 'daily' ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#d4a574' }}>
                    {activity.current_streak || 0} day{(activity.current_streak || 0) !== 1 ? 's' : ''}
                  </span>
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: activity.completed_today ? 'rgba(52, 211, 153, 0.3)' : 'rgba(107, 114, 128, 0.3)',
                      border: activity.completed_today ? '1px solid #34d399' : '1px solid #6b7280'
                    }}
                  >
                    {activity.completed_today && (
                      <span className="text-xs font-bold" style={{ color: '#34d399' }}>✓</span>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-xs" style={{ color: '#d4a574' }}>
                  {activity.days_since_last !== null && activity.days_since_last !== undefined
                    ? `${activity.days_since_last}d ago`
                    : 'Never'}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4" style={{ color: '#9ca3af' }}>
          <p className="text-sm">No activities tracked</p>
        </div>
      )}
    </div>
  )
}
