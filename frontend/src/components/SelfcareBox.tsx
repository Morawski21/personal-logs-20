'use client'

import { useEffect, useState } from 'react'
import { Droplet, Flame, Scissors, Leaf, Clock, Activity, type LucideIcon } from 'lucide-react'

interface SelfcareActivity {
  name: string
  days_since_last: number | null
  icon: string
}

const iconMap: Record<string, LucideIcon> = {
  'Droplet': Droplet,
  'Flame': Flame,
  'Scissors': Scissors,
  'Leaf': Leaf,
  'Clock': Clock,
  'Stretch': Activity, // Lucide doesn't have Stretch, using Activity instead
}

const getActivityIcon = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Droplet
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
      <div className="rounded-xl p-3 backdrop-blur-sm animate-pulse" style={{ backgroundColor: '#1a1f2e', borderColor: '#2a3441', borderWidth: '1px' }}>
        <div className="h-5 w-24 rounded mb-3" style={{ backgroundColor: '#2a3441' }}></div>
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-14 rounded" style={{ backgroundColor: '#2a3441' }}></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-3 backdrop-blur-sm" style={{ backgroundColor: '#1a1f2e', borderColor: '#2a3441', borderWidth: '1px' }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: '#f9fafb' }}>
        Self-Care
      </h3>

      {activities.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {activities.map((activity, index) => {
            const IconComponent = getActivityIcon(activity.icon)

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
                className="relative rounded p-2 flex flex-col items-center justify-center text-center transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: 'rgba(42, 52, 65, 0.5)',
                  border: `1px solid ${daysColor}40`,
                }}
              >
                {/* Icon */}
                <IconComponent className="h-4 w-4 mb-1" style={{ color: daysColor }} />

                {/* Name */}
                <div className="text-[10px] font-medium mb-0.5 leading-tight" style={{ color: '#f9fafb' }}>
                  {activity.name}
                </div>

                {/* Days since last */}
                <div className="text-[10px] font-semibold" style={{ color: daysColor }}>
                  {activity.days_since_last !== null && activity.days_since_last !== undefined
                    ? activity.days_since_last === 0
                      ? 'Today'
                      : `${activity.days_since_last}d`
                    : 'Never'}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-4" style={{ color: '#9ca3af' }}>
          <p className="text-xs">No activities tracked</p>
        </div>
      )}
    </div>
  )
}
