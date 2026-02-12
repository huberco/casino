'use client'

import React from 'react'
import { useAppLoad } from '@/contexts/AppLoadContext'
import Loader from '../ui/Loader'

const PageLoader: React.FC = () => {
  const { isPageReady } = useAppLoad()

  if (isPageReady) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <Loader />
      </div>
    </div>
  )
}

export default PageLoader

