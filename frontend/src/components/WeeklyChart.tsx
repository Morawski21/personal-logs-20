'use client'

import { motion } from 'framer-motion'

interface ChartData {
  date: string
  weekday: string
  total: number
  [key: string]: any
}

interface WeeklyChartData {
  chart_data: ChartData[]
  habits: string[]
}

interface WeeklyChartProps {
  data: WeeklyChartData
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#f97316', // orange
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#ec4899', // pink
  '#6366f1', // indigo
]

export function WeeklyChart({ data }: WeeklyChartProps) {
  const { chart_data, habits } = data
  
  if (!chart_data || chart_data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available for chart
      </div>
    )
  }
  
  // Find maximum total for scaling
  const maxTotal = Math.max(...chart_data.map(d => d.total), 1)
  
  // Convert minutes to hours for display
  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${minutes}m`
  }
  
  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div className="h-64 flex items-end justify-center gap-4 px-4">
        {chart_data.map((day, index) => (
          <motion.div
            key={day.date}
            className="flex flex-col items-center flex-1 max-w-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {/* Bar */}
            <div className="relative w-full mb-2 flex flex-col justify-end h-48">
              <motion.div
                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md flex flex-col justify-end relative group cursor-pointer"
                initial={{ height: 0 }}
                animate={{ height: `${(day.total / maxTotal) * 100}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="bg-popover border border-border rounded-lg p-3 shadow-lg min-w-48">
                    <div className="text-sm font-semibold text-popover-foreground mb-2">
                      {day.weekday} - {formatTime(day.total)}
                    </div>
                    <div className="space-y-1">
                      {habits.map((habit, habitIndex) => {
                        const value = day[habit] || 0
                        if (value > 0) {
                          return (
                            <div key={habit} className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{habit}:</span>
                              <span className="text-popover-foreground">{formatTime(value)}</span>
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Value on top of bar */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-foreground">
                  {day.total > 0 ? formatTime(day.total) : ''}
                </div>
              </motion.div>
            </div>
            
            {/* Day label */}
            <div className="text-xs text-center text-muted-foreground">
              <div className="font-medium">{day.weekday}</div>
              <div className="text-[10px] mt-1">
                {new Date(day.date).getDate()}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        {habits.map((habit, index) => (
          <div key={habit} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm text-muted-foreground">{habit}</span>
          </div>
        ))}
      </div>
      
      {/* Summary */}
      <div className="text-center text-sm text-muted-foreground">
        Total this week: {formatTime(chart_data.reduce((sum, day) => sum + day.total, 0))}
      </div>
    </div>
  )
}