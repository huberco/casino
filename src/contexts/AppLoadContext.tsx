'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface AppLoadContextType {
  isPageReady: boolean
}

const AppLoadContext = createContext<AppLoadContextType>({ isPageReady: false })

export function AppLoadProvider({ children }: { children: React.ReactNode }) {
  const [isPageReady, setIsPageReady] = useState(false)

  useEffect(() => {
    const onLoad = () => setIsPageReady(true)

    if (typeof document === 'undefined') return

    if (document.readyState === 'complete') {
      // Already loaded (e.g. fast refresh or cached)
      onLoad()
      return
    }

    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  return (
    <AppLoadContext.Provider value={{ isPageReady }}>
      {children}
    </AppLoadContext.Provider>
  )
}

export function useAppLoad() {
  const context = useContext(AppLoadContext)
  if (context === undefined) {
    throw new Error('useAppLoad must be used within AppLoadProvider')
  }
  return context
}
