import { useModalStore } from "@/store/modalStore";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  Input,
  Form,
  Tabs,
  Tab,
  InputOtp,
} from "@heroui/react";
import { reconnectWebSocket } from "@/lib/websocket";

export const MailIcon = (props: any) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M17 3.5H7C4 3.5 2 5 2 8.5V15.5C2 19 4 20.5 7 20.5H17C20 20.5 22 19 22 15.5V8.5C22 5 20 3.5 17 3.5ZM17.47 9.59L14.34 12.09C13.68 12.62 12.84 12.88 12 12.88C11.16 12.88 10.31 12.62 9.66 12.09L6.53 9.59C6.21 9.33 6.16 8.85 6.41 8.53C6.67 8.21 7.14 8.15 7.46 8.41L10.59 10.91C11.35 11.52 12.64 11.52 13.4 10.91L16.53 8.41C16.85 8.15 17.33 8.2 17.58 8.53C17.84 8.85 17.79 9.33 17.47 9.59Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const LockIcon = (props: any) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M12.0011 17.3498C12.9013 17.3498 13.6311 16.6201 13.6311 15.7198C13.6311 14.8196 12.9013 14.0898 12.0011 14.0898C11.1009 14.0898 10.3711 14.8196 10.3711 15.7198C10.3711 16.6201 11.1009 17.3498 12.0011 17.3498Z"
        fill="currentColor"
      />
      <path
        d="M18.28 9.53V8.28C18.28 5.58 17.63 2 12 2C6.37 2 5.72 5.58 5.72 8.28V9.53C2.92 9.88 2 11.3 2 14.79V16.65C2 20.75 3.25 22 7.35 22H16.65C20.75 22 22 20.75 22 16.65V14.79C22 11.3 21.08 9.88 18.28 9.53ZM12 18.74C10.33 18.74 8.98 17.38 8.98 15.72C8.98 14.05 10.34 12.7 12 12.7C13.66 12.7 15.02 14.06 15.02 15.72C15.02 17.39 13.67 18.74 12 18.74ZM7.35 9.44C7.27 9.44 7.2 9.44 7.12 9.44V8.28C7.12 5.35 7.95 3.4 12 3.4C16.05 3.4 16.88 5.35 16.88 8.28V9.45C16.8 9.45 16.73 9.45 16.65 9.45H7.35V9.44Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const UserIcon = (props: any) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
        fill="currentColor"
      />
      <path
        d="M12.0002 14.5C6.99016 14.5 2.91016 17.86 2.91016 22C2.91016 22.28 3.13016 22.5 3.41016 22.5H20.5902C20.8702 22.5 21.0902 22.28 21.0902 22C21.0902 17.86 17.0102 14.5 12.0002 14.5Z"
        fill="currentColor"
      />
    </svg>
  );
};

interface AuthModalProps {
  onClose?: () => void
}

export default function AuthModal({ onClose }: AuthModalProps = {}) {
  const { modal, closeModal } = useModalStore()
  const isAuthOpen = modal === 'auth'
  const hideModal = onClose || closeModal
  const { signIn, signUp, signInWithGoogle, signInWithTwitter, signInWithMetaMask, loginWithOTP } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  // OTP state
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCountdown, setOtpCountdown] = useState(0)

  // Resend verification email
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
    agreeToTerms: false
  })

  const showResendVerification = !!pendingVerificationEmail && !!formData.email && (
    success?.includes('check your email') ||
    success?.includes('check your inbox') ||
    success?.includes('verification link') ||
    success?.includes('Verification email sent')
  )

  const onOpenChange = (state: boolean) => {
    if (!state) {
      hideModal()
      // Reset to signin mode when closing
      setIsSignUp(false)
      setLoginMethod('password')
      setOtpSent(false)
      setOtpCountdown(0)
      resetForm()
    }
  }

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      rememberMe: false,
      agreeToTerms: false
    })
    setOtpEmail('')
    setOtpCode('')
    setError(null)
    setSuccess(null)
    setResendCooldown(0)
    setPendingVerificationEmail(null)
  }

  // Resend verification email
  const handleResendVerification = async () => {
    if (!formData.email?.trim() || resendCooldown > 0 || resendLoading) return
    setResendLoading(true)
    setError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: formData.email.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resend')
      setSuccess('Verification email sent again. Please check your inbox.')
      setResendCooldown(30)
      setPendingVerificationEmail(formData.email.trim())
    } catch (e: any) {
      setError(e.message || 'Failed to resend verification email')
    } finally {
      setResendLoading(false)
    }
  }

  // Cooldown timer for resend verification
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setLoginMethod('password')
    setOtpSent(false)
    setError(null)
    setSuccess(null)
    setPendingVerificationEmail(null)
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const validateForm = (): boolean => {
    if (isSignUp) {
      if (formData.username.trim() && formData.username.length < 3) {
        setError('Username must be at least 3 characters if provided')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return false
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters')
        return false
      }
      if (!formData.agreeToTerms) {
        setError('You must agree to the Terms of Service and Privacy Policy')
        return false
      }
    } else {
      if (!formData.email.trim() || !formData.password.trim()) {
        setError('Email and password are required')
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password, { name: formData.username.trim() || undefined })
        setPendingVerificationEmail(formData.email.trim())
        setSuccess('Account created successfully! Please check your email for confirmation.')
        // Don't close modal immediately for email confirmation flow
      } else {
        await signIn(formData.email, formData.password)
        setSuccess('Signed in successfully!')
        // Close modal after successful sign in
        setTimeout(() => {
          hideModal()
          reconnectWebSocket()
          resetForm()
        }, 1500)
      }
    } catch (error: any) {
      const msg = error.message || ''
      const isUnverified = msg.toLowerCase().includes('verify your email') || msg.toLowerCase().includes('verification link')
      if (!isSignUp && isUnverified && formData.email) {
        setPendingVerificationEmail(formData.email.trim())
        setSuccess('A new verification link has been sent to your email. You can resend again in 30 seconds.')
        setError(null)
        setResendCooldown(30)
      } else {
        setError(msg || 'Authentication failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Send OTP
  const handleSendOTP = async (e: any) => {
    e.preventDefault()
    if (!otpEmail.trim()) {
      setError('Email is required')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(otpEmail)) {
      setError('Invalid email format')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Backend handles both OTP generation and email sending (secure method)
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies in request
        body: JSON.stringify({ email: otpEmail })
      })

      const data = await response.json()

      if (response.ok) {
        setOtpSent(true)
        setSuccess(data.message || 'Verification code sent to your email!')
        // Set countdown based on expiry time from backend
        const countdownSeconds = data.expiresIn || 120
        setOtpCountdown(countdownSeconds)

        // Start countdown
        const interval = setInterval(() => {
          setOtpCountdown(prev => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch (error: any) {
      console.error('Send OTP error:', error)
      setError('Failed to send OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) {
      setError('Please enter the verification code')
      return
    }

    if (otpCode.length !== 6) {
      setError('Code must be 6 digits')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (loginWithOTP) {
        await loginWithOTP(otpEmail, otpCode)
        setSuccess('Logged in successfully!')
        setTimeout(() => {
          hideModal()
          reconnectWebSocket()
          resetForm()
        }, 1500)
      } else {
        throw new Error('OTP login not available')
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error)
      setError(error.message || 'Invalid or expired code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await signInWithGoogle()
      // OAuth will redirect, so we don't need to handle success here
    } catch (error: any) {
      console.error('Google sign in error:', error)
      setError(error.message || 'Google sign in failed. Please try again.')
      setIsLoading(false)
    }
  }

  const handleTwitterSignIn = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await signInWithTwitter()
      // OAuth will redirect, so we don't need to handle success here
    } catch (error: any) {
      console.error('Twitter sign in error:', error)
      setError(error.message || 'Twitter sign in failed. Please try again.')
      setIsLoading(false)
    }
  }

  const handleMetaMaskSignIn = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await signInWithMetaMask()
      setSuccess('Signed in successfully with MetaMask!')
      // Close modal after successful sign in
      setTimeout(() => {
        hideModal()
        reconnectWebSocket()
        resetForm()
      }, 1500)
    } catch (error: any) {
      console.error('MetaMask sign in error:', error)
      setError(error.message || 'MetaMask sign in failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isAuthOpen} placement="auto" backdrop="blur" onOpenChange={onOpenChange}>
      <ModalContent className="bg-background-alt">
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {isSignUp ? 'Create Account' : 'Log in'}
            </ModalHeader>
            <ModalBody className="w-full">
              {!isSignUp && (
                <Tabs
                  selectedKey={loginMethod}
                  onSelectionChange={(key) => {
                    setLoginMethod(key as 'password' | 'otp')
                    setError(null)
                    setSuccess(null)
                    setOtpSent(false)
                  }}
                  variant="solid"
                  classNames={{
                    tabList: "w-full bg-background scrollbar-hide overflow-hidden",
                    cursor: "w-full bg-primary",
                    tab: "data-[selected=true]:bg-background-alt",
                    tabContent: "group-data-[selected=true]:text-primary"
                  }}
                >
                  <Tab key="password" title="Password Login">
                    <Form
                      onSubmit={handleSubmit}
                      className="w-full flex flex-col gap-4"
                    >
                      {/* Error/Success Messages */}
                      {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <p className="text-red-400 text-sm">{error}</p>
                        </div>
                      )}
                      {success && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                          <p className="text-green-400 text-sm">{success}</p>
                          {showResendVerification && (
                            <Button
                              size="sm"
                              variant="flat"
                              className="mt-2 text-primary border border-primary/30"
                              onPress={handleResendVerification}
                              isDisabled={resendCooldown > 0 || resendLoading}
                              isLoading={resendLoading}
                            >
                              {resendCooldown > 0
                                ? `Resend verification email (${resendCooldown}s)`
                                : 'Resend verification email'}
                            </Button>
                          )}
                        </div>
                      )}

                      <Input
                        endContent={
                          <MailIcon className="text-2xl text-default-400 pointer-events-none shrink-0" />
                        }
                        label="Email"
                        placeholder="Enter your email"
                        variant="bordered"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                      <Input
                        endContent={
                          <LockIcon className="text-2xl text-default-400 pointer-events-none shrink-0" />
                        }
                        label="Password"
                        placeholder="Enter your password"
                        type="password"
                        variant="bordered"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                      />
                      <div className="flex py-2 px-1 justify-between">
                        <Checkbox
                          classNames={{
                            label: "text-small",
                          }}
                          isSelected={formData.rememberMe}
                          onValueChange={(checked) => handleInputChange('rememberMe', checked)}
                        >
                          Remember me
                        </Checkbox>
                      </div>

                      <Button
                        className="w-full bg-primary text-background font-semibold"
                        type="submit"
                        isLoading={isLoading}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processing...' : 'Sign in'}
                      </Button>
                    </Form>
                  </Tab>

                  <Tab key="otp" title="One-Time Password">
                    <div className="flex flex-col gap-4">
                      {/* Error/Success Messages */}
                      {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <p className="text-red-400 text-sm">{error}</p>
                        </div>
                      )}
                      {success && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                          <p className="text-green-400 text-sm">{success}</p>
                        </div>
                      )}

                      {!otpSent ? (
                        <>
                          <p className="text-sm text-gray-400">
                            Enter your email to receive a 6-digit verification code
                          </p>
                          <Form onSubmit={handleSendOTP}>

                            <Input
                              endContent={
                                <MailIcon className="text-2xl text-default-400 pointer-events-none shrink-0" />
                              }
                              label="Email"
                              placeholder="Enter your email"
                              variant="bordered"
                              type="email"
                              value={otpEmail}
                              onChange={(e) => setOtpEmail(e.target.value)}
                              required
                            />
                            <Button
                              type="submit"
                              className="w-full bg-primary text-background font-semibold"
                              isLoading={isLoading}
                              disabled={isLoading}
                            >
                              {isLoading ? 'Sending...' : 'Send Verification Code'}
                            </Button>
                          </Form>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-400">
                            Enter the 6-digit code sent to {otpEmail}
                          </p>
                          <InputOtp length={6} value={otpCode} onValueChange={setOtpCode} className="mx-auto" />
                          {otpCountdown > 0 && (
                            <p className="text-xs text-center text-gray-500">
                              Code expires in {Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                          <Button
                            className="w-full bg-primary text-background font-semibold"
                            onClick={handleVerifyOTP}
                            isLoading={isLoading}
                            disabled={isLoading || otpCode.length !== 6}
                          >
                            {isLoading ? 'Verifying...' : 'Verify & Log in'}
                          </Button>
                          <Button
                            variant="light"
                            size="sm"
                            onClick={() => {
                              setOtpSent(false)
                              setOtpCode('')
                              setOtpCountdown(0)
                              setError(null)
                              setSuccess(null)
                            }}
                            disabled={isLoading}
                          >
                            Use different email
                          </Button>
                        </>
                      )}
                    </div>
                  </Tab>
                </Tabs>
              )}

              {isSignUp && (
                <Form
                  onSubmit={handleSubmit}
                  className="w-full flex flex-col gap-4"
                >
                  {/* Error/Success Messages */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <p className="text-green-400 text-sm">{success}</p>
                      {showResendVerification && (
                        <Button
                          size="sm"
                          variant="flat"
                          className="mt-2 text-primary border border-primary/30"
                          onPress={handleResendVerification}
                          isDisabled={resendCooldown > 0 || resendLoading}
                          isLoading={resendLoading}
                        >
                          {resendCooldown > 0
                            ? `Resend verification email (${resendCooldown}s)`
                            : 'Resend verification email'}
                        </Button>
                      )}
                    </div>
                  )}

                  <Input
                    endContent={
                      <UserIcon className="text-2xl text-default-400 pointer-events-none shrink-0" />
                    }
                    label="Username"
                    placeholder="Enter your username"
                    variant="bordered"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    required
                  />
                  <Input
                    endContent={
                      <MailIcon className="text-2xl text-default-400 pointer-events-none shrink-0" />
                    }
                    label="Email"
                    placeholder="Enter your email"
                    variant="bordered"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                  <Input
                    endContent={
                      <LockIcon className="text-2xl text-default-400 pointer-events-none shrink-0" />
                    }
                    label="Password"
                    placeholder="Enter your password"
                    type="password"
                    variant="bordered"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                  />
                  <Input
                    endContent={
                      <LockIcon className="text-2xl text-default-400 pointer-events-none shrink-0" />
                    }
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    type="password"
                    variant="bordered"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                  />
                  <div className="flex py-2 px-1">
                    <Checkbox
                      classNames={{
                        label: "text-small",
                      }}
                      isSelected={formData.agreeToTerms}
                      onValueChange={(checked) => handleInputChange('agreeToTerms', checked)}
                      required
                    >
                      I agree to the Terms of Service and Privacy Policy
                    </Checkbox>
                  </div>

                  <Button
                    className="w-full bg-primary text-background font-semibold"
                    type="submit"
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Sign up'}
                  </Button>
                </Form>
              )}
            </ModalBody>
            <ModalFooter className="flex flex-col gap-3 w-full">
              {/* Social Login Buttons */}
              <div className="w-full space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-background-alt text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {/* MetaMask Sign In - Google/Twitter removed; use email or OTP */}
                  <Button
                    variant="bordered"
                    className="w-full border-gray-600 hover:border-gray-500"
                    onClick={handleMetaMaskSignIn}
                    disabled={isLoading}
                    startContent={
                      <svg className="w-5 h-5" viewBox="0 0 40 40" fill="none">
                        <path d="M36.1 5.4L22.9 15.3L25.3 9.3L36.1 5.4Z" fill="#E17726" stroke="#E17726" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3.9 5.4L16.9 15.4L14.7 9.3L3.9 5.4Z" fill="#E27625" stroke="#E27625" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M30.8 27.7L27.3 33.5L35.4 35.7L37.7 27.9L30.8 27.7Z" fill="#E27625" stroke="#E27625" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2.3 27.9L4.6 35.7L12.7 33.5L9.2 27.7L2.3 27.9Z" fill="#E27625" stroke="#E27625" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12.2 18.1L10.3 21L18.3 21.4L18 12.8L12.2 18.1Z" fill="#E27625" stroke="#E27625" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M27.8 18.1L22 12.7L21.7 21.4L29.7 21L27.8 18.1Z" fill="#E27625" stroke="#E27625" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12.7 33.5L17.3 31.2L13.3 28L12.7 33.5Z" fill="#E27625" stroke="#E27625" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22.7 31.2L27.3 33.5L26.7 28L22.7 31.2Z" fill="#E27625" stroke="#E27625" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    }
                  >
                    MetaMask
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <Button
                  color="primary"
                  variant="light"
                  size="sm"
                  onClick={toggleMode}
                  className="text-sm"
                  disabled={isLoading}
                >
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
