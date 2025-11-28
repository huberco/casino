'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  fallback = null 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !user.isAuthenticated) {
        // Redirect to home page if authentication is required but user is not authenticated
        router.push('/')
      }
    }
  }, [user.isAuthenticated, isLoading, requireAuth, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show fallback if authentication is required but user is not authenticated
  if (requireAuth && !user.isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-gray-400 mb-6">Please sign in to access this page.</p>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  // Show children if authentication requirements are met
  return <>{children}</>
}

// Hook for checking authentication status
export function useRequireAuth() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const requireAuth = () => {
    if (!isLoading && !user.isAuthenticated) {
      router.push('/')
      return false
    }
    return user.isAuthenticated
  }

  return { requireAuth, isAuthenticated: user.isAuthenticated, isLoading }
}
