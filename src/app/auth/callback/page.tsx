'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { authUtils } from '@/lib/api'

export default function AuthCallback() {
  const router = useRouter()
  const { updateUser, fetchUserProfile } = useAuth()
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession()

        console.log('🔄 Auth callback data:', data)
        console.log('🔄 Auth callback error:', error)

        if (error) {
          console.error('Auth callback error:', error)
          router.push('/?error=auth_callback_failed')
          return
        }
        if (data.session) {
          console.log('🔄 Supabase session found, AuthContext will handle token exchange...')
          
          // AuthContext will automatically handle token exchange via onAuthStateChange
          // Just redirect to home page - the AuthContext will complete the authentication
          console.log('✅ OAuth authentication successful, redirecting...')
          router.push('/')
        } else {
          console.log('❌ No session found in callback')
          router.push('/?error=no_session')
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error)
        router.push('/?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [router])

  

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-white mb-2">Completing sign in...</h2>
        <p className="text-gray-400">Please wait while we finish setting up your account.</p>
      </div>
    </div>
  )
}
