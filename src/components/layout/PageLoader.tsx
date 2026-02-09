'use client'

import React from 'react'
import { useAppLoad } from '@/contexts/AppLoadContext'

const PageLoader: React.FC = () => {
  const { isPageReady } = useAppLoad()

  if (isPageReady) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/10 border-t-primary rounded-full animate-spin" />
          <div
            className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-primary/60 rounded-full animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
          />
        </div>
        <p className="text-default-400 text-sm font-medium">Loading...</p>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

export default PageLoader

