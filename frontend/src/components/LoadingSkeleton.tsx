'use client'

import { motion } from 'framer-motion'

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.1),transparent_50%)]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100, -20],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Header skeleton */}
      <div className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <motion.div 
                className="h-8 w-64 bg-gradient-to-r from-white/20 to-white/10 rounded-lg"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div 
                className="h-4 w-48 bg-gradient-to-r from-white/10 to-white/5 rounded-lg"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              />
            </div>
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="h-10 w-24 bg-gradient-to-r from-white/10 to-white/5 rounded-lg"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="relative h-48 rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {/* Glassmorphism card skeleton */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
                <div className="p-6 h-full flex flex-col justify-between">
                  {/* Header skeleton */}
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="w-12 h-12 bg-gradient-to-r from-white/20 to-white/10 rounded-xl"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 1, 0.5] 
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        delay: i * 0.2 
                      }}
                    />
                    <div className="flex-1 space-y-2">
                      <motion.div 
                        className="h-5 bg-gradient-to-r from-white/20 to-white/10 rounded-lg w-3/4"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
                      />
                      <motion.div 
                        className="h-3 bg-gradient-to-r from-white/10 to-white/5 rounded-lg w-1/2"
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Stats skeleton */}
                  <div className="grid grid-cols-3 gap-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="space-y-2">
                        <motion.div 
                          className="h-3 bg-gradient-to-r from-white/10 to-white/5 rounded w-full"
                          animate={{ opacity: [0.3, 0.7, 0.3] }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            delay: (i * 0.1) + (j * 0.1) 
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <motion.div 
                            className="w-8 h-8 bg-gradient-to-r from-white/20 to-white/10 rounded-full"
                            animate={{ 
                              rotate: [0, 360],
                              opacity: [0.5, 1, 0.5] 
                            }}
                            transition={{ 
                              duration: 3, 
                              repeat: Infinity, 
                              delay: j * 0.3 
                            }}
                          />
                          <div className="space-y-1">
                            <motion.div 
                              className="h-4 w-8 bg-gradient-to-r from-white/15 to-white/10 rounded"
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                            />
                            <motion.div 
                              className="h-2 w-6 bg-gradient-to-r from-white/10 to-white/5 rounded"
                              animate={{ opacity: [0.3, 0.7, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Animated shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  style={{ transform: 'skewX(-20deg)' }}
                  animate={{ x: [-200, 300] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Central loading indicator */}
        <motion.div 
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="relative">
            <motion.div
              className="w-16 h-16 border-4 border-white/20 border-t-purple-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 w-12 h-12 border-4 border-white/10 border-t-cyan-400 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-4 w-8 h-8 border-4 border-white/5 border-t-emerald-400 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}