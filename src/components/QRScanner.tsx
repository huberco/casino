'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react'
import { FaCamera, FaTimes } from 'react-icons/fa'

interface QRScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (result: string) => void
  title?: string
}

export default function QRScanner({ isOpen, onClose, onScan, title = "Scan QR Code" }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      startScanning()
    } else {
      stopScanning()
    }
  }, [isOpen])

  const startScanning = async () => {
    try {
      setError(null)
      setIsScanning(true)

      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported')
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      // Start scanning loop
      scanLoop()
    } catch (err) {
      console.error('Camera access failed:', err)
      setError('Camera access denied or not available')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    setIsScanning(false)
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  const scanLoop = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data for QR code detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    
    // Simple QR code detection (this is a basic implementation)
    // In a real app, you'd use a library like jsQR or quagga
    try {
      // For now, we'll simulate QR code detection
      // You can integrate with jsQR library for actual QR code scanning
      const detectedText = detectQRCode(imageData)
      
      if (detectedText) {
        onScan(detectedText)
        stopScanning()
        onClose()
        return
      }
    } catch (err) {
      console.error('QR detection error:', err)
    }

    // Continue scanning
    if (isScanning) {
      requestAnimationFrame(scanLoop)
    }
  }

  // Placeholder QR code detection function
  // In a real implementation, you'd use a proper QR code library
  const detectQRCode = (imageData: ImageData): string | null => {
    // This is a placeholder - you would implement actual QR code detection here
    // For now, return null to continue scanning
    return null
  }

  const handleClose = () => {
    stopScanning()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FaCamera className="text-primary" />
            {title}
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col items-center gap-4">
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <p className="text-sm text-gray-500">
                  Please ensure camera access is allowed and try again.
                </p>
              </div>
            ) : (
              <>
                <div className="relative w-full max-w-md">
                  <video
                    ref={videoRef}
                    className="w-full h-64 bg-gray-100 rounded-lg object-cover"
                    playsInline
                    muted
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-primary border-dashed rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <FaCamera className="text-primary text-2xl mx-auto mb-2" />
                          <p className="text-sm text-primary">Position QR code here</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Position the QR code within the frame to scan
                </p>
              </>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={handleClose}>
            <FaTimes className="mr-2" />
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

// Alternative: Simple QR code input with manual entry
export function QRCodeInput({ value, onChange, placeholder = "Enter address or scan QR code" }: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [showScanner, setShowScanner] = useState(false)

  const handleScan = (result: string) => {
    onChange(result)
    setShowScanner(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button
          color="primary"
          variant="flat"
          onPress={() => setShowScanner(true)}
          className="px-3"
        >
          <FaCamera />
        </Button>
      </div>
      
      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
        title="Scan Wallet Address"
      />
    </div>
  )
}
