'use client'

import React, { useEffect, useRef } from 'react'
import QRCodeLib from 'qrcode'

interface QRCodeProps {
  value: string
  size?: number
  className?: string
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
}

export default function QRCode({
  value,
  size = 200,
  className = '',
  errorCorrectionLevel = 'M',
  margin = 1,
  color = {
    dark: '#000000',
    light: '#FFFFFF'
  }
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!value || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Generate QR code
    QRCodeLib.toCanvas(canvas, value, {
      width: size,
      margin: margin,
      color: color,
      errorCorrectionLevel: errorCorrectionLevel
    }).catch((error) => {
      console.error('QR Code generation failed:', error)
    })
  }, [value, size, margin, color, errorCorrectionLevel])

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="border border-gray-300 rounded-lg bg-white"
      />
    </div>
  )
}

// Hook for generating QR code as data URL
export function useQRCode(value: string, options?: {
  size?: number
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
}) {
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  useEffect(() => {
    if (!value) {
      setQrCodeUrl('')
      return
    }

    setIsLoading(true)
    setError(null)

    QRCodeLib.toDataURL(value, {
      width: options?.size || 200,
      margin: options?.margin || 1,
      color: options?.color || {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M'
    })
      .then((url) => {
        setQrCodeUrl(url)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('QR Code generation failed:', err)
        setError(err.message)
        setIsLoading(false)
      })
  }, [value, options])

  return { qrCodeUrl, isLoading, error }
}
