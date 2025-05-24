'use client'

import { motion } from 'framer-motion'

interface ChartData {
  date: string
  weekday: string
  total: number
  [key: string]: any
}

interface ProductivityChartData {
  chart_data: ChartData[]
  categories: string[]
  category_colors: { [key: string]: string }
}

interface ProductivityChartProps {
  data: ProductivityChartData
}

export function ProductivityChart({ data }: ProductivityChartProps) {
  const { chart_data, categories, category_colors } = data
  
  // Find the maximum total to scale bars
  const maxTotal = Math.max(...chart_data.map(d => d.total))
  const maxBarHeight = 200 // pixels
  
  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        {categories.map((category) => (
          <div key={category} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: category_colors[category] }}
            />
            <span className="text-sm text-white/80">{category}</span>
          </div>
        ))}
      </div>
      
      {/* Chart */}
      <div className="relative">
        <div className="flex items-end justify-between gap-3 h-64 px-4">
          {chart_data.map((day, index) => (
            <motion.div
              key={day.date}
              className="flex-1 flex flex-col items-center group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Bar */}
              <div className="relative flex flex-col-reverse w-full max-w-16">
                {/* Stacked segments */}
                {categories.map((category) => {
                  const value = day[category] || 0
                  const height = maxTotal > 0 ? (value / maxTotal) * maxBarHeight : 0
                  
                  if (value === 0) return null
                  
                  return (
                    <motion.div
                      key={category}
                      className="w-full rounded-sm relative overflow-hidden group-hover:shadow-lg transition-all duration-300"
                      style={{ 
                        backgroundColor: category_colors[category],
                        height: `${height}px`,
                        minHeight: value > 0 ? '4px' : '0px'
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}px` }}
                      transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                      whileHover={{ 
                        scale: 1.05,
                        zIndex: 10,
                        boxShadow: `0 0 20px ${category_colors[category]}40`
                      }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                          {category}: {Math.round(value)}min
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
                
                {/* Total time label on hover */}
                <motion.div 
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  whileHover={{ y: -2 }}
                >
                  <div className="bg-white/10 backdrop-blur-sm text-white text-xs px-2 py-1 rounded border border-white/20">
                    {Math.round(day.total)}min
                  </div>
                </motion.div>
              </div>
              
              {/* Day label */}
              <motion.div 
                className="mt-3 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.5 }}
              >
                <div className="text-sm font-medium text-white/90">{day.weekday}</div>
                <div className="text-xs text-white/60">
                  {new Date(day.date).getDate()}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-64 flex flex-col justify-between py-2">
          {[...Array(5)].map((_, i) => {
            const value = Math.round((maxTotal * (4 - i)) / 4)
            return (
              <div key={i} className="text-xs text-white/50">
                {value}min
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-white/10">
        {categories.map((category) => {
          const total = chart_data.reduce((sum, day) => sum + (day[category] || 0), 0)
          return (
            <motion.div
              key={category}
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div 
                className="w-3 h-3 rounded-sm mx-auto mb-1"
                style={{ backgroundColor: category_colors[category] }}
              />
              <div className="text-lg font-bold text-white/90">{Math.round(total)}min</div>
              <div className="text-xs text-white/60">{category}</div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}