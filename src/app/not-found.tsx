'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaHome, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1d29] text-white px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-[#ff5d00] to-[#ff8c42] bg-clip-text text-transparent">
            404
          </h1>
        </div>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="p-4 rounded-full bg-[rgba(255,93,0,0.1)] border border-[rgba(255,93,0,0.3)]">
            <FaExclamationTriangle className="text-6xl text-[#ff5d00]" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-4xl font-bold mb-4 text-[rgb(255,255,193)]">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-lg text-[#b1b6c6] mb-8 max-w-md mx-auto">
          Oops! The page you're looking for seems to have vanished into the void. 
          It might have been moved, deleted, or never existed.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ff5d00] to-[#ff8c42] text-white font-semibold rounded-lg hover:from-[#ff6d10] hover:to-[#ff9c52] transition-all duration-200 shadow-lg hover:shadow-[#ff5d00]/50"
          >
            <FaHome className="text-lg" />
            Go Home
          </Link>
          
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[rgba(203,215,255,0.03)] text-[#b1b6c6] font-semibold rounded-lg hover:bg-[rgba(203,215,255,0.055)] border border-[rgba(203,215,255,0.1)] transition-all duration-200"
          >
            <FaArrowLeft className="text-lg" />
            Go Back
          </button>
        </div>

        {/* Additional Help */}
        <div className="mt-12 pt-8 border-t border-[rgba(203,215,255,0.1)]">
          <p className="text-sm text-[#686d7b]">
            Need help?{' '}
            <Link href="/official/support" className="text-[#ff5d00] hover:text-[#ff8c42] transition-colors">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}





