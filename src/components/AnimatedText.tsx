'use client'

import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface AnimatedTextProps {
  text: string
  className?: string
  duration?: number
  delay?: number
  stagger?: number
  type?: 'typewriter' | 'fade' | 'slide' | 'rotate'
}

export default function AnimatedText({
  text,
  className = '',
  duration = 0.8,
  delay = 0,
  stagger = 0.1,
  type = 'slide'
}: AnimatedTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chars = containerRef.current.querySelectorAll('.char')
    const tl = gsap.timeline({ delay })

    // Set initial state based on animation type
    switch (type) {
      case 'typewriter':
        gsap.set(chars, {
          opacity: 0,
          width: 0,
          overflow: 'hidden'
        })
        tl.to(chars, {
          opacity: 1,
          width: 'auto',
          duration: duration,
          stagger: stagger,
          ease: 'power2.out'
        })
        break

      case 'fade':
        gsap.set(chars, { opacity: 0 })
        tl.to(chars, {
          opacity: 1,
          duration: duration,
          stagger: stagger,
          ease: 'power2.out'
        })
        break

      case 'slide':
        gsap.set(chars, {
          opacity: 0,
          y: 50,
          rotationX: -90,
          transformOrigin: '0% 50% -50px'
        })
        tl.to(chars, {
          opacity: 1,
          y: 0,
          rotationX: 0,
          duration: duration,
          stagger: stagger,
          ease: 'back.out(1.7)'
        })
        break

      case 'rotate':
        gsap.set(chars, {
          opacity: 0,
          rotation: 180,
          scale: 0
        })
        tl.to(chars, {
          opacity: 1,
          rotation: 0,
          scale: 1,
          duration: duration,
          stagger: stagger,
          ease: 'back.out(1.7)'
        })
        break

      default:
        gsap.set(chars, {
          opacity: 0,
          y: 50,
          rotationX: -90,
          transformOrigin: '0% 50% -50px'
        })
        tl.to(chars, {
          opacity: 1,
          y: 0,
          rotationX: 0,
          duration: duration,
          stagger: stagger,
          ease: 'back.out(1.7)'
        })
    }

    return () => {
      tl.kill()
    }
  }, [text, duration, delay, stagger, type])

  // Split text into characters and wrap each in a span
  const renderText = () => {
    return text.split('').map((char, index) => (
      <span
        key={index}
        className="char inline-block"
        style={{ 
          display: char === ' ' ? 'inline' : 'inline-block',
          minWidth: char === ' ' ? '0.25em' : 'auto'
        }}
      >
        {char}
      </span>
    ))
  }

  return (
    <div
      ref={containerRef}
      className={`${className}`}
      style={{ perspective: '1000px' }}
    >
      {renderText()}
    </div>
  )
}