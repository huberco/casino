'use client'

import React, { useEffect, useRef } from 'react'
import { Application, Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js'

type Status = 'betting' | 'running' | 'crashed'

interface CashoutAnimation {
  id: string
  username: string
  multiplier: number
  startX: number
  startY: number
  endX: number
  endY: number
  startTime: number
  duration: number
}

interface CrashPixiChartProps {
  status: Status
  currentMultiplier: number
  startTime?: Date
  width?: number
  height?: number
  points?: { t: number; m: number }[]
  playerBets?: Array<{
    username: string
    cashoutMultiplier?: number
    status: 'active' | 'cashed_out' | 'lost'
    isCurrentUser?: boolean
  }>
}

export default function CrashPixiChart({
  status,
  currentMultiplier,
  startTime,
  width = 400,
  height = 200,
  points,
  playerBets = []
}: CrashPixiChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<Application | null>(null)
  const stageRef = useRef<Container | null>(null)
  const graphRef = useRef<Graphics | null>(null)
  const areaRef = useRef<Graphics | null>(null)
  const axesRef = useRef<Graphics | null>(null)
  const xLabelsRef = useRef<Container | null>(null)
  const yLabelsRef = useRef<Container | null>(null)
  const multiplierTextRef = useRef<Text | null>(null)
  const widthRef = useRef<number>(width || 0)
  const heightRef = useRef<number>(height || 0)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const animationsRef = useRef<CashoutAnimation[]>([])
  const animationContainerRef = useRef<Container | null>(null)
  const previousPlayerBetsRef = useRef<typeof playerBets>([])

  // Simple responsive axes/padding
  const PADDING = 40
  const AXIS_GAP = 20 // Half of PADDING for axes gaps only

  useEffect(() => {
    if (!containerRef.current) return
    if (appRef.current) return

    const parentW = containerRef.current.clientWidth || 0
    const parentH = containerRef.current.clientHeight || 0
    const initW = parentW || width || 400
    const initH = parentH || height || 200
    widthRef.current = initW
    heightRef.current = initH

    const app = new Application({ width: initW, height: initH, antialias: true, backgroundColor: 0x04141C })
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''
    // Prefer app.view for broader Pixi compatibility
    const canvasEl: any = (app as any).view || (app as any).canvas
    if (canvasEl) containerRef.current.appendChild(canvasEl)

    appRef.current = app

    const stage = new Container()
    app.stage.addChild(stage)
    stageRef.current = stage

    const axes = new Graphics()
    stage.addChild(axes)
    axesRef.current = axes

    const area = new Graphics()
    // Add area behind the line
    stage.addChild(area)
    areaRef.current = area

    const graph = new Graphics()
    stage.addChild(graph)
    graphRef.current = graph

    const xLabels = new Container()
    const yLabels = new Container()
    const animationContainer = new Container()
    stage.addChild(xLabels)
    stage.addChild(yLabels)
    stage.addChild(animationContainer)
    xLabelsRef.current = xLabels
    yLabelsRef.current = yLabels
    animationContainerRef.current = animationContainer

    const multiplierText = new Text('1.00x', new TextStyle({
      fontSize: 52,
      fill: 0x10B981,
      fontFamily: 'Inter, Arial, sans-serif',
      fontWeight: 'bold'
    }))
      multiplierText.anchor.set(0.5)
      multiplierText.position.set(initW / 2, initH / 2)
      stage.addChild(multiplierText)
      multiplierTextRef.current = multiplierText

      drawScene()

    // Observe parent size changes
    if (containerRef.current) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (!entry || !appRef.current) return
        const newW = Math.max(1, Math.floor(entry.contentRect.width))
        const newH = Math.max(1, Math.floor(entry.contentRect.height || heightRef.current))
        if (newW !== widthRef.current || newH !== heightRef.current) {
          widthRef.current = newW
          heightRef.current = newH
          appRef.current.renderer.resize(newW, newH)
          if (multiplierTextRef.current) {
            multiplierTextRef.current.position.set(newW / 2, newH / 2)
          }
          drawScene()
        }
      })
      resizeObserverRef.current.observe(containerRef.current)
    }
    

    return () => {
      if (appRef.current) {
        try {
          appRef.current.destroy(true, { children: true, texture: true, baseTexture: true } as any)
        } catch (_) {}
        appRef.current = null
      }
      if (resizeObserverRef.current && containerRef.current) {
        try { resizeObserverRef.current.unobserve(containerRef.current) } catch (_) {}
        try { resizeObserverRef.current.disconnect() } catch (_) {}
        resizeObserverRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    drawScene()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, currentMultiplier, startTime])

  function drawAxes(maxTime: number, maxMult: number) {
    if (!axesRef.current) return
    const g = axesRef.current
    const width = widthRef.current
    const height = heightRef.current
    g.clear()
    // Axes
    g.lineStyle({ width: 2, color: 0x334155 })
    g.moveTo(PADDING, height - PADDING)
    g.lineTo(width - AXIS_GAP, height - PADDING) // Add smaller gap at the end
    g.moveTo(PADDING, AXIS_GAP) // Start from top with smaller gap
    g.lineTo(PADDING, height - PADDING)

    // Clear labels
    xLabelsRef.current?.removeChildren()
    yLabelsRef.current?.removeChildren()

    // Ticks and labels (nice ticks)
    const yTicks = getNiceTicks(1, maxMult, 5)
    for (const v of yTicks) {
      const y = mapMultToY(v, maxMult)
      g.moveTo(PADDING - 5, y).lineTo(PADDING + 5, y)
      const lbl = new Text(`${v.toFixed(1)}x`, new TextStyle({ fontSize: 10, fill: 0x94A3B8, fontFamily: 'Inter, Arial, sans-serif' }))
      lbl.anchor.set(1, 0.5)
      lbl.position.set(PADDING - 8, y)
      yLabelsRef.current?.addChild(lbl)
    }

    const xTicks = getNiceTicks(0, maxTime, 6)
    for (const v of xTicks) {
      if (v === 0) continue
      const x = mapTimeToX(v, maxTime)
      g.moveTo(x, height - PADDING - 5).lineTo(x, height - PADDING + 5)
      const lbl = new Text(`${Math.round(v)}s`, new TextStyle({ fontSize: 10, fill: 0x94A3B8, fontFamily: 'Inter, Arial, sans-serif' }))
      lbl.anchor.set(0.5, 0)
      lbl.position.set(x, height - PADDING + 8)
      xLabelsRef.current?.addChild(lbl)
    }
  }

  function drawScene() {
    if (!graphRef.current || !multiplierTextRef.current || !areaRef.current) return

    const g = graphRef.current
    const fill = areaRef.current
    const mText = multiplierTextRef.current
    g.clear()
    fill.clear()


    if (status === 'betting') {
      // Hide multiplier text during betting phase
      mText.visible = false
      return
    }

    // Calculate elapsed time with proper date handling for Vercel/production compatibility
    let elapsed = 0
    if (startTime) {
      try {
        const startTimeMs = typeof startTime === 'string' 
          ? new Date(startTime).getTime() 
          : startTime instanceof Date 
            ? startTime.getTime() 
            : new Date(startTime).getTime()
        
        
        if (!isNaN(startTimeMs) && startTimeMs > 0) {
          elapsed = Math.max(0, (Date.now() - startTimeMs) / 1000)
        } else {
          console.warn('⚠️ [CrashChart] Invalid startTimeMs:', startTimeMs)
        }
      } catch (error) {
        elapsed = 0
      }
    } else {
      console.warn('⚠️ [CrashChart] No startTime provided')
    }

    const curve = ((): { t: number; m: number }[] => {
      if (Array.isArray(points) && points.length > 0) {
        return points
      }
      // fallback simple interpolation between 0..elapsed
      // Use minimum elapsed time to prevent vertical lines when elapsed is 0
      const actualElapsed = Math.max(0.1, elapsed)
      const segs = 120
      const arr: { t: number; m: number }[] = []
      for (let i = 0; i <= segs; i++) {
        const t = (actualElapsed / segs) * i
        const m = i === segs ? currentMultiplier : 1 + (currentMultiplier - 1) * (t / actualElapsed)
        arr.push({ t, m })
      }
      return arr
    })()


    const maxTime = Math.max(10, Math.max(...curve.map(p => p.t), 0) * 1.2)
    const maxMult = Math.max(3, Math.max(...curve.map(p => p.m), currentMultiplier, 1) * 1.2)
    

    // Filled area ("cube") under the curve
    const baseY = mapMultToY(1, maxMult)
    if (curve.length > 0) {
      fill.beginFill(0x10B981, 0.12)
      fill.moveTo(mapTimeToX(0, maxTime), baseY)
      for (const p of curve) {
        fill.lineTo(mapTimeToX(p.t, maxTime), mapMultToY(p.m, maxMult))
      }
      const last = curve[curve.length - 1]
      fill.lineTo(mapTimeToX(last.t, maxTime), baseY)
      fill.closePath()
      fill.endFill()
    }

    // Main curve line (thicker + smoother caps/joins)
    g.lineStyle({ width: 5, color: 0x10B981, cap: 'round' as any, join: 'round' as any })
    g.moveTo(mapTimeToX(0, maxTime), mapMultToY(1, maxMult))
    for (const p of curve) {
      g.lineTo(mapTimeToX(p.t, maxTime), mapMultToY(p.m, maxMult))
    }

    // Multiplier text
    mText.visible = true
    mText.text = `${currentMultiplier.toFixed(2)}x`
    mText.style.fill = status === 'running' ? 0x10B981 : 0xEF4444

    // Axes + ticks per frame (to follow scaling)
    drawAxes(maxTime, maxMult)
  }

  function mapTimeToX(t: number, maxTime: number): number {
    const graphWidth = widthRef.current - PADDING - AXIS_GAP // Account for left padding and right gap
    return PADDING + (t / Math.max(1e-3, maxTime)) * graphWidth
  }

  function mapMultToY(m: number, maxMult: number): number {
    const graphHeight = heightRef.current - PADDING - AXIS_GAP // Account for bottom padding and top gap
    const clamped = Math.max(1, Math.min(maxMult, m))
    return (heightRef.current - PADDING) - ((clamped - 1) / (Math.max(1.0001, maxMult) - 1)) * graphHeight
  }

  function getNiceTicks(min: number, max: number, count: number): number[] {
    if (max <= min) return [min]
    const range = max - min
    const roughStep = range / Math.max(1, (count - 1))
    const goodSteps = [0.1, 0.2, 0.25, 0.5, 1, 1.5, 2, 2.5, 5, 7.5, 10, 15, 20, 25, 30, 50, 100]
    const pow = Math.pow(10, -Math.floor(Math.log10(roughStep)))
    const normalized = roughStep * pow
    const chosen = goodSteps.find(s => s >= normalized) || roughStep
    const step = chosen / pow
    const start = Math.ceil(min / step) * step
    const ticks: number[] = []
    for (let v = start; v <= max + 1e-9; v += step) ticks.push(Number(v.toPrecision(6)))
    return ticks
  }

  // Detect new cashouts and create animations
  useEffect(() => {
    if (!playerBets || playerBets.length === 0) return

    const previousBets = previousPlayerBetsRef.current
    const currentTime = Date.now()

    // Find newly cashed out players
    const newCashouts = playerBets.filter(currentBet => {
      if (currentBet.status !== 'cashed_out' || !currentBet.cashoutMultiplier) return false
      
      const previousBet = previousBets.find(pb => pb.username === currentBet.username)
      return !previousBet || previousBet.status !== 'cashed_out'
    })

    // Create animations for new cashouts
    newCashouts.forEach(cashout => {
      if (!cashout.cashoutMultiplier) return

      // Use current graph state for positioning
      let elapsed = 0
      if (startTime) {
        try {
          const startTimeMs = typeof startTime === 'string' 
            ? new Date(startTime).getTime() 
            : startTime instanceof Date 
              ? startTime.getTime() 
              : new Date(startTime).getTime()
          
          if (!isNaN(startTimeMs) && startTimeMs > 0) {
            elapsed = Math.max(0, (Date.now() - startTimeMs) / 1000)
          }
        } catch (error) {
          elapsed = 0
        }
      }

      const curve = ((): { t: number; m: number }[] => {
        if (Array.isArray(points) && points.length > 0) {
          return points
        }
        // fallback simple interpolation between 0..elapsed
        const actualElapsed = Math.max(0.1, elapsed)
        const segs = 120
        const arr: { t: number; m: number }[] = []
        for (let i = 0; i <= segs; i++) {
          const t = (actualElapsed / segs) * i
          const m = i === segs ? currentMultiplier : 1 + (currentMultiplier - 1) * (t / actualElapsed)
          arr.push({ t, m })
        }
        return arr
      })()

      const maxTime = Math.max(10, Math.max(...curve.map(p => p.t), 0) * 1.2)
      const maxMult = Math.max(3, Math.max(...curve.map(p => p.m), currentMultiplier, 1) * 1.2)
      
      // Find the position on the current graph curve where the user cashed out
      // This should be at the current time and current multiplier position
      const startX = mapTimeToX(elapsed, maxTime)
      const startY = mapMultToY(currentMultiplier, maxMult)
      
      // Diagonal drop to bottom left
      const endX = startX - 80 // Move left by 80 pixels
      const endY = heightRef.current - PADDING + 50 // Drop to bottom + some offset

      const animation: CashoutAnimation = {
        id: `${cashout.username}_${currentTime}`,
        username: cashout.username,
        multiplier: cashout.cashoutMultiplier,
        startX,
        startY,
        endX,
        endY,
        startTime: currentTime,
        duration: 5000 // 5 seconds - slower dropping
      }

      animationsRef.current.push(animation)
    })

    previousPlayerBetsRef.current = [...playerBets]
  }, [playerBets, currentMultiplier, startTime, points])

  // Animation ticker
  useEffect(() => {
    if (!appRef.current || !animationContainerRef.current) return

    const ticker = new Ticker()
    ticker.add(() => {
      const currentTime = Date.now()
      const container = animationContainerRef.current
      if (!container) return

      // Update existing animations
      animationsRef.current = animationsRef.current.filter(animation => {
        const elapsed = currentTime - animation.startTime
        const progress = Math.min(elapsed / animation.duration, 1)
        
        if (progress >= 1) {
          // Animation finished, remove the text
          const existingText = container.getChildByName(animation.id)
          if (existingText) {
            container.removeChild(existingText)
          }
          return false
        }

        // Create or update animation text
        let textElement = container.getChildByName(animation.id) as Text
        if (!textElement) {
          textElement = new Text(`${animation.username} @${animation.multiplier.toFixed(2)}`, new TextStyle({
            fontSize: 14,
            fill: 0xFFFFFF,
            fontFamily: 'Inter, Arial, sans-serif',
            fontWeight: 'bold'
          }))
          textElement.name = animation.id
          textElement.anchor.set(0.5, 0.5)
          container.addChild(textElement)
        }

        // Animate position with easing - diagonal movement
        const easeOut = 1 - Math.pow(1 - progress, 3) // Ease out cubic
        const currentX = animation.startX + (animation.endX - animation.startX) * easeOut
        const currentY = animation.startY + (animation.endY - animation.startY) * easeOut
        
        textElement.position.set(currentX, currentY)
        
        // Gradual transparency effect - starts fading immediately but slowly
        const alpha = Math.max(0, 1 - (progress * 0.8)) // Fade from 1 to 0.2 over the duration
        textElement.alpha = alpha

        return true
      })
    })
    
    ticker.start()

    return () => {
      ticker.destroy()
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}


