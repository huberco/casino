'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AnonymousOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AnonymousOnly({ children, fallback = null }: AnonymousOnlyProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user.isAuthenticated) {
      // Redirect authenticated users away from anonymous-only content
      router.push('/account')
    }
  }, [user.isAuthenticated, isLoading, router])

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

  // Show fallback if user is authenticated
  if (user.isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Already Signed In</h2>
          <p className="text-gray-400 mb-6">You are already authenticated.</p>
          <button 
            onClick={() => router.push('/account')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            Go to Account
          </button>
        </div>
      </div>
    )
  }

  // Show children for anonymous users
  return <>{children}</>
}
