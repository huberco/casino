'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ''

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      // Email verification callback: backend verify-email with token
      fetch(`${BACKEND_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setStatus('success')
            setMessage(data.message || 'Email verified. You can now sign in.')
            setTimeout(() => router.push('/?verified=1'), 2000)
          } else {
            setStatus('error')
            setMessage(data.error || 'Verification failed')
          }
        })
        .catch(() => {
          setStatus('error')
          setMessage('Verification request failed')
        })
    } else {
      setStatus('error')
      setMessage('Missing verification token')
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Verifying your email...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <h2 className="text-xl font-semibold text-green-400 mb-2">Email verified</h2>
            <p className="text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting to sign in...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 className="text-xl font-semibold text-red-400 mb-2">Verification failed</h2>
            <p className="text-gray-400">{message}</p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-primary rounded-lg text-background"
            >
              Go to home
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
