'use client'

import React from 'react'
import { Spinner } from '@heroui/react'

interface GlobalLoadingProps {
  isVisible: boolean
  message?: string
}

export default function GlobalLoading({ isVisible, message = "Connecting to server..." }: GlobalLoadingProps) {
  if (!isVisible) return null

  console.log('🔍 GlobalLoading state:', { isVisible, message })
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-6">
          <Spinner size="lg" color="primary" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Connecting...</h2>
        <p className="text-gray-400 text-lg">{message}</p>
        <div className="mt-6 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
    </div>
  )
}
