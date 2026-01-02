'use client'

import { useEffect, useState } from 'react'
import { Droplet, Flame, User } from 'lucide-react'

interface SelfcareActivity {
  name: string
  type: 'occasional'
  days_since_last: number | null
  icon?: string
}

const getActivityIcon = (name: string, iconFromApi?: string) => {
  // Use icon from API if available
  if (iconFromApi) {
    return iconFromApi
  }

  // Fallback to lucide-react icons
  const nameLower = name.toLowerCase()
  if (nameLower.includes('derma')) return Droplet
  if (nameLower.includes('sauna')) return Flame
  if (nameLower.includes('yoga')) return User
  return Droplet
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
        <div className="grid grid-cols-3 gap-3">
          {activities.map((activity, index) => {
            const iconElement = getActivityIcon(activity.name, activity.icon)
            const isEmoji = typeof iconElement === 'string'

            // Determine color based on days since last
            const getDaysColor = (days: number | null) => {
              if (days === null) return '#6b7280' // Gray for never
              if (days === 0) return '#10b981' // Green for today
              if (days <= 3) return '#3b82f6' // Blue for recent
              if (days <= 7) return '#eab308' // Yellow for warning
              return '#ef4444' // Red for too long
            }

            const daysColor = getDaysColor(activity.days_since_last)

            return (
              <div
                key={index}
                className="relative rounded-lg p-3 flex flex-col items-center justify-center text-center transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: 'rgba(42, 52, 65, 0.5)',
                  border: `1px solid ${daysColor}40`,
                  minHeight: '90px'
                }}
              >
                {/* Icon */}
                <div
                  className="rounded-lg p-2 mb-2"
                  style={{
                    backgroundColor: `${daysColor}20`,
                    border: `1px solid ${daysColor}60`
                  }}
                >
                  {isEmoji ? (
                    <span className="text-2xl">{iconElement}</span>
                  ) : (
                    (() => {
                      const IconComponent = iconElement as React.ComponentType<{ className: string; style: { color: string } }>
                      return <IconComponent className="h-5 w-5" style={{ color: daysColor }} />
                    })()
                  )}
                </div>

                {/* Name */}
                <div className="text-xs font-medium mb-1" style={{ color: '#f9fafb' }}>
                  {activity.name}
                </div>

                {/* Days since last */}
                <div className="text-xs font-semibold" style={{ color: daysColor }}>
                  {activity.days_since_last !== null && activity.days_since_last !== undefined
                    ? activity.days_since_last === 0
                      ? 'Today'
                      : `${activity.days_since_last}d ago`
                    : 'Never'}
                </div>
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
