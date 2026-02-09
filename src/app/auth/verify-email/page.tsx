'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ''

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Missing verification token')
      return
    }
    fetch(`${BACKEND_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('success')
          setMessage(data.message || 'Email verified. You can now sign in.')
          if (data.redirect) {
            setTimeout(() => router.push(data.redirect || '/?verified=1'), 2000)
          }
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Verification request failed')
      })
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-white mb-2">Verifying your email...</h1>
            <p className="text-gray-400">Please wait.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className="text-xl font-semibold text-green-400 mb-2">Email verified</h1>
            <p className="text-gray-400 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting...</p>
            <Link href="/" className="mt-4 inline-block text-primary hover:underline">
              Go to home
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-xl font-semibold text-red-400 mb-2">Verification failed</h1>
            <p className="text-gray-400 mb-4">{message}</p>
            <Link
              href="/"
              className="inline-block mt-4 px-4 py-2 bg-primary rounded-lg text-background hover:opacity-90"
            >
              Go to home
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
