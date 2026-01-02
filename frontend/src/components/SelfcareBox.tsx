'use client'

import { useEffect, useState } from 'react'
import { Scissors, Droplet, Leaf, Flame, User } from 'lucide-react'

interface SelfcareActivity {
  name: string
  type: 'daily' | 'occasional'
  current_streak?: number
  completed_today?: boolean
  days_since_last?: number | null
}

const getActivityIcon = (name: string) => {
  const nameLower = name.toLowerCase()
  if (nameLower.includes('hair')) return Scissors
  if (nameLower.includes('derma')) return Droplet
  if (nameLower.includes('veg')) return Leaf
  if (nameLower.includes('sauna')) return Flame
  if (nameLower.includes('yoga')) return User
  return Leaf
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
      <div className="rounded-xl p-5 backdrop-blur-sm animate-pulse" style={{ backgroundColor: '#1a1f2e', borderColor: '#2a3441', borderWidth: '1px' }}>
        <div className="h-6 w-32 rounded mb-4" style={{ backgroundColor: '#2a3441' }}></div>
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-20 rounded-lg" style={{ backgroundColor: '#2a3441' }}></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-5 backdrop-blur-sm" style={{ backgroundColor: '#1a1f2e', borderColor: '#2a3441', borderWidth: '1px' }}>
      <h3 className="text-base font-semibold mb-4" style={{ color: '#f9fafb' }}>
        Self-Care
      </h3>

      {activities.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.name)
            const isCompleted = activity.type === 'daily' && activity.completed_today

            return (
              <div
                key={index}
                className="relative rounded-lg p-3 flex flex-col items-center justify-center text-center transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(42, 52, 65, 0.5)',
                  border: isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(42, 52, 65, 0.7)',
                  minHeight: '85px'
                }}
              >
                {/* Icon */}
                <div
                  className="rounded-lg p-2 mb-2"
                  style={{
                    backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                    border: `1px solid ${isCompleted ? '#10b981' : '#475569'}`
                  }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ color: isCompleted ? '#10b981' : '#94a3b8' }}
                  />
                </div>

                {/* Name */}
                <div className="text-xs font-medium mb-1" style={{ color: '#f9fafb' }}>
                  {activity.name}
                </div>

                {/* Status */}
                {activity.type === 'daily' ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold" style={{ color: isCompleted ? '#10b981' : '#9ca3af' }}>
                      {activity.current_streak || 0}
                    </span>
                    {isCompleted && (
                      <span className="text-xs font-bold" style={{ color: '#10b981' }}>✓</span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs" style={{ color: '#9ca3af' }}>
                    {activity.days_since_last !== null && activity.days_since_last !== undefined
                      ? `${activity.days_since_last}d ago`
                      : 'Never'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8" style={{ color: '#9ca3af' }}>
          <p className="text-sm">No activities tracked</p>
        </div>
      )}
    </div>
  )
}
