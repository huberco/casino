'use client'

import React from 'react'
import { useGameSettings } from '@/contexts/GameSettingsContext'
import { useWebSocket } from '@/contexts/socketContext'

const PageLoader: React.FC = () => {
  const { loading: gameSettingsLoading } = useGameSettings()
  const { isConnected } = useWebSocket()
  
  // Show loading if game settings are loading or websocket is not connected
  const isLoading = gameSettingsLoading || !isConnected

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1a1d29]">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[rgba(203,215,255,0.1)] border-t-[#ff5d00] rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-[#ff8c42] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        
        {/* Loading Text */}
        <div className="text-center">
          <p className="text-[#b1b6c6] text-sm font-medium">
            {!isConnected ? 'Connecting...' : 'Loading...'}
          </p>
        </div>
        
        {/* Loading Dots Animation */}
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-[#ff5d00] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-[#ff5d00] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-[#ff5d00] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}

export default PageLoader

