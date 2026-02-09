'use client'

import { apiClient, gameApi, authUtils } from '@/lib/api'
import { UserProfile } from '@/types/user'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ''

// User types
interface User {
  id: string
  email: string
  username?: string
  isAuthenticated: boolean
  isLoading: boolean
  profile: UserProfile | null
  balance: number
}

interface AuthContextType {
  user: User
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: { name?: string }) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithTwitter: () => Promise<void>
  signInWithMetaMask: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateUser: (profile: Partial<UserProfile>) => void
  updateBalance: (newBalance: number) => void
  fetchUserProfile: () => Promise<void>
  loginWithOTP?: (email: string, code: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User>({
    id: '',
    email: '',
    username: '',
    isAuthenticated: false,
    isLoading: true,
    profile: null,
    balance: 0
  })
  
  // Flag to prevent multiple simultaneous auth checks
  const authCheckInProgress = React.useRef(false)

  // Fetch user profile (assumes user is already authenticated)
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await gameApi.user.getProfile()
      if (response.success && response.data) {
        const profile = response.data
        setUser(prev => ({
          ...prev,
          id: profile.id,
          email: profile.email,
          username: profile.username,
          isAuthenticated: true,
          isLoading: false,
          profile: profile,
          balance: profile.balance
        }))
        console.log('✅ User profile loaded:', profile.username)
      } else {
        throw new Error('Failed to fetch profile')
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      setUser(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        profile: null
      }))
    }
  }, [])

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    // Prevent multiple simultaneous auth checks
    if (authCheckInProgress.current) {
      console.log('🔄 Auth check already in progress, skipping')
      return
    }

    // Check if we're in a redirect loop - if so, don't attempt auth check
    if (typeof window !== 'undefined' && sessionStorage.getItem('auth_redirect_flag')) {
      console.log('🔄 Auth redirect flag detected, skipping auth status check')
      sessionStorage.removeItem('auth_redirect_flag')
      sessionStorage.removeItem('logout_in_progress') // Clear logout flag as well
      setUser(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        profile: null
      }))
      return
    }
    
    try {
      authCheckInProgress.current = true
      setIsLoading(true)
      
      console.log('🔐 Starting auth status check')
      const isAuth = await authUtils.isAuthenticated()
      
      if (isAuth) {
        // User is authenticated, fetch profile
        console.log('✅ User is authenticated, fetching profile')
        await fetchUserProfile()
      } else {
        // User is not authenticated
        console.log('❌ User is not authenticated')
        setUser(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          profile: null
        }))
      }
    } catch (error) {
      console.error('Auth status check failed:', error)
      setUser(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        profile: null
      }))
    } finally {
      setIsLoading(false)
      authCheckInProgress.current = false
    }
  }, [fetchUserProfile])

  // Sign in with email/password (backend POST /auth/login, sets platform-token cookie)
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      await fetchUserProfile()
    } catch (error: any) {
      console.error('Sign in error:', error)
      throw new Error(error.message || 'Sign in failed')
    } finally {
      setIsLoading(false)
    }
  }, [fetchUserProfile])

  // Sign up with email/password (backend POST /auth/register, sends verification email)
  const signUp = useCallback(async (email: string, password: string, metadata?: { name?: string }) => {
    try {
      setIsLoading(true)
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name: metadata?.name })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      // Do not log in; user must verify email first
    } catch (error: any) {
      console.error('Sign up error:', error)
      throw new Error(error.message || 'Sign up failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Login with OTP
  const loginWithOTP = useCallback(async (email: string, code: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: needed to receive cookies
        body: JSON.stringify({ email, code })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed')
      }

      // Store tokens
      if (data.token) {
        localStorage.setItem('auth_token', data.token)
      }
      if (data.platformToken) {
        localStorage.setItem('platform_token', data.platformToken)
      }

      // Update user state with the returned user data
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          isAuthenticated: true,
          isLoading: false,
          profile: data.user,
          balance: data.user.balance
        })
      }

      console.log('✅ OTP login successful')
    } catch (error: any) {
      console.error('OTP login error:', error)
      throw new Error(error.message || 'OTP verification failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Social login not available (use email or OTP)
  const signInWithGoogle = useCallback(async () => {
    throw new Error('Use email or OTP to sign in')
  }, [])

  const signInWithTwitter = useCallback(async () => {
    throw new Error('Use email or OTP to sign in')
  }, [])

  // Sign in with MetaMask
  const signInWithMetaMask = useCallback(async () => {
    try {
      setIsLoading(true)

      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask extension.')
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.')
      }

      const walletAddress = accounts[0]
      console.log('🔐 MetaMask wallet connected:', walletAddress)

      // Step 1: Get nonce from backend
      const nonceResponse = await apiClient.post('/auth/wallet/nonce', {
        walletAddress
      })

      if (!nonceResponse.data?.nonce || !nonceResponse.data?.message) {
        throw new Error('Failed to get authentication nonce')
      }

      const { message } = nonceResponse.data

      // Step 2: Sign the message with MetaMask
      console.log('📝 Requesting signature from MetaMask...')
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      })

      if (!signature) {
        throw new Error('Signature request was rejected')
      }

      console.log('✅ Message signed successfully')

      // Step 3: Verify signature and login
      const verifyResponse = await apiClient.post('/auth/wallet/verify', {
        walletAddress,
        signature
      })

      if (verifyResponse.data?.success && verifyResponse.data?.user) {
        // Update user state
        const userData = verifyResponse.data.user
        setUser({
          id: userData.id,
          email: userData.email || '',
          username: userData.username,
          isAuthenticated: true,
          isLoading: false,
          profile: userData,
          balance: userData.balance
        })

        console.log('✅ MetaMask authentication successful:', userData.username)
      } else {
        throw new Error('Verification failed')
      }
    } catch (error: any) {
      console.error('MetaMask sign in error:', error)
      
      // User-friendly error messages
      if (error.code === 4001) {
        throw new Error('MetaMask signature request was rejected')
      } else if (error.message?.includes('not installed')) {
        throw new Error('MetaMask is not installed. Please install the MetaMask extension.')
      } else {
        throw new Error(error.message || 'MetaMask authentication failed')
      }
    } finally {
      setIsLoading(false)
    }
  }, [fetchUserProfile])

  // Sign out (backend logout only, clear cookie)
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true)
      await authUtils.logout()
      setUser({
        id: '',
        email: '',
        username: '',
        isAuthenticated: false,
        isLoading: false,
        profile: null,
        balance: 0
      })
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh user profile
  const refreshProfile = useCallback(async () => {
    if (user.isAuthenticated) {
      await fetchUserProfile()
    }
  }, [user.isAuthenticated, fetchUserProfile])

  // Update user profile
  const updateUser = useCallback((profile: Partial<UserProfile>) => {
    setUser(prev => ({
      ...prev,
      profile: prev.profile ? { ...prev.profile, ...profile } : null
    }))
  }, [])

  // Update user balance
  const updateBalance = useCallback((newBalance: number) => {
    setUser(prev => ({
      ...prev,
      balance: newBalance,
      profile: prev.profile ? { ...prev.profile, balance: newBalance } : null
    }))
  }, [])

  // Check auth status on mount only
  useEffect(() => {
    checkAuthStatus()
  }, []) // Empty dependency array - only run once on mount

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithTwitter,
    signInWithMetaMask,
    signOut,
    refreshProfile,
    updateUser,
    updateBalance,
    fetchUserProfile,
    loginWithOTP
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}