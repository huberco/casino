'use client'
import '@pixi/canvas-renderer'
import React, { useEffect, useRef } from 'react'
import { Application, Container, Graphics, Text, TextStyle, Ticker } from 'pixi.js'

type Status = 'betting' | 'running' | 'crashed' | 'ended'

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
  startTime?: Date
  crashMultiplier?: number | null // Actual crash multiplier from backend
  playerBets?: Array<{
    username: string
    cashoutMultiplier?: number
    status: 'active' | 'cashed_out' | 'lost'
    isCurrentUser?: boolean
  }>
}

// Backend formula: M(t) = 1 + A * t^{B(t)}
// where B(t) = min(MAX_B, B0 + B_GROWTH * t)
const A = 0.02
const B0 = 1.5
const B_GROWTH = 0.01
const MAX_B = 3.0

// Reuse styles to avoid per-frame allocations (prevents long-session memory leaks)
const AXIS_LABEL_STYLE = new TextStyle({
  fontSize: 10,
  fill: 0x94A3B8,
  fontFamily: 'Inter, Arial, sans-serif'
})

// Calculate multiplier using backend formula: M(t) = 1 + A * t^{B(t)}
function calculateMultiplier(t: number): number {
  if (t <= 0) return 1
  const dynamicB = Math.min(MAX_B, B0 + B_GROWTH * t)
  const multiplier = 1 + A * Math.pow(t, dynamicB)
  // Safety limit: prevent unlimited growth (cap at reasonable max, e.g., 1000x)
  const MAX_SAFE_MULTIPLIER = 1000
  return Math.min(multiplier, MAX_SAFE_MULTIPLIER)
}

export default function CrashPixiChart({
  status,
  startTime,
  crashMultiplier = null,
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
  const widthRef = useRef<number>(0)
  const heightRef = useRef<number>(0)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const animationsRef = useRef<CashoutAnimation[]>([])
  const animationContainerRef = useRef<Container | null>(null)
  const previousPlayerBetsRef = useRef<typeof playerBets>([])
  
  // Animation frame refs for smooth multiplier calculation
  const animationFrameRef = useRef<number | null>(null)
  const gameStartTimeRef = useRef<number | null>(null) // Store server start time in ms
  const crashMultiplierRef = useRef<number | null>(null) // Store crash multiplier (calculated locally) when crashed
  const crashTimeRef = useRef<number | null>(null) // Store elapsed seconds at crash time (freeze)

  // Simple responsive axes/padding
  const PADDING = 40
  const AXIS_GAP = 20 // Half of PADDING for axes gaps only

  // Check WebGL support with better error handling for Mac Chrome
  const webglSupported = (() => {
    try {
      const canvas = document.createElement('canvas')
      const gl =
        (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
        (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
      if (!gl) return false
      
      // Test if context is actually usable (Mac Chrome sometimes returns null context)
      const testTexture = gl.createTexture()
      if (!testTexture) return false
      gl.deleteTexture(testTexture)
      
      return true
    } catch {
      return false
    }
  })()
  
  // Track WebGL context loss/restore for Mac Chrome compatibility
  const contextLostRef = useRef<boolean>(false)
  const retryInitRef = useRef<number>(0)

  useEffect(() => {
    if (!containerRef.current) return
    if (appRef.current && !contextLostRef.current) return

    // Wait for container to have proper dimensions (Mac Chrome issue)
    const checkDimensions = () => {
      const parentW = containerRef.current?.clientWidth || 0
      const parentH = containerRef.current?.clientHeight || 0
      
      // Mac Chrome sometimes initializes with 0 dimensions
      if (parentW === 0 || parentH === 0) {
        if (retryInitRef.current < 10) {
          retryInitRef.current++
          setTimeout(checkDimensions, 100)
          return
        }
        // Fallback to default dimensions if still 0 after retries
        console.warn('⚠️ [CrashChart] Container has zero dimensions, using defaults')
      }
      
      const initW = parentW || 400
      const initH = parentH || 200
      widthRef.current = initW
      heightRef.current = initH
      
      initApp(initW, initH)
    }
    
    // Initialize Application asynchronously to ensure renderer is ready
    const initApp = async (initW: number, initH: number) => {
      try {
        // Reset retry counter on successful init attempt
        retryInitRef.current = 0
        
        // Create Application with proper renderer options
        const appOptions: any = {
          width: initW,
          height: initH,
          antialias: true,
          backgroundColor: 0x04141C,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          // Add preference for canvas fallback on Mac Chrome issues
          preferWebGL: webglSupported && !contextLostRef.current
        }
        
        // Force canvas renderer if WebGL is not supported or context was lost
        if (!webglSupported || contextLostRef.current) {
          appOptions.forceCanvas = true
          console.log('📊 [CrashChart] Using Canvas renderer (WebGL unavailable or lost)')
        }
        
        const app = new Application(appOptions)
        
        // Wait for Application to be ready (some versions return Promise)
        const readyApp = app instanceof Promise ? await app : app
        
        if (!containerRef.current) {
          if (readyApp instanceof Application) {
            try {
              readyApp.destroy(true)
            } catch (e) {
              // Ignore destroy errors
            }
          }
          return
        }
        
        // Ensure renderer is initialized and has required methods
        if (!readyApp.renderer) {
          console.warn('⚠️ [CrashChart] Renderer not initialized, retrying...')
          await new Promise(resolve => setTimeout(resolve, 100))
          if (!readyApp.renderer) {
            console.error('❌ [CrashChart] Failed to initialize renderer')
            return
          }
        }
        
        // Verify renderer has the required methods
        const renderer = readyApp.renderer as any
        if (!renderer || (typeof renderer.render !== 'function' && typeof renderer.renderCanvas !== 'function')) {
          console.error('❌ [CrashChart] Renderer missing required methods')
          return
        }
        
        containerRef.current.innerHTML = ''
        // Prefer app.view for broader Pixi compatibility
        const canvasEl: any = (readyApp as any).view || (readyApp as any).canvas
        if (canvasEl) {
          // Add WebGL context loss handlers for Mac Chrome compatibility
          const gl = canvasEl.getContext('webgl') || canvasEl.getContext('experimental-webgl')
          if (gl) {
            canvasEl.addEventListener('webglcontextlost', (e: Event) => {
              e.preventDefault()
              console.warn('⚠️ [CrashChart] WebGL context lost, will switch to canvas renderer')
              contextLostRef.current = true
              // Destroy current app and reinitialize with canvas renderer
              if (appRef.current) {
                try {
                  appRef.current.destroy(true)
                } catch (_) {}
                appRef.current = null
              }
              // Retry initialization with canvas renderer
              setTimeout(() => {
                if (containerRef.current) {
                  checkDimensions()
                }
              }, 100)
            })
            
            canvasEl.addEventListener('webglcontextrestored', () => {
              console.log('✅ [CrashChart] WebGL context restored')
              contextLostRef.current = false
            })
          }
          
          containerRef.current.appendChild(canvasEl)
        } else {
          console.error('❌ [CrashChart] No canvas element available from Application')
          return
        }

        appRef.current = readyApp
        contextLostRef.current = false // Reset context lost flag on successful init

        const stage = new Container()
        readyApp.stage.addChild(stage)
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

        // Only draw scene after everything is initialized
        if (readyApp.renderer) {
          // Small delay to ensure renderer is fully ready (Mac Chrome timing issue)
          setTimeout(() => {
            if (appRef.current && appRef.current.renderer) {
              drawScene()
            }
          }, 50)
        }
      } catch (error) {
        console.error('❌ [CrashChart] Error initializing Application:', error)
        
        // If WebGL fails and we haven't tried canvas yet, retry with canvas
        if (webglSupported && !contextLostRef.current && retryInitRef.current < 3) {
          console.log('🔄 [CrashChart] Retrying with canvas renderer...')
          contextLostRef.current = true
          retryInitRef.current++
          setTimeout(() => {
            if (containerRef.current) {
              checkDimensions()
            }
          }, 200)
        } else {
          // Show error state to user
          if (containerRef.current) {
            containerRef.current.innerHTML = `
              <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94A3B8; font-family: Inter, Arial, sans-serif;">
                <div style="text-align: center;">
                  <div style="font-size: 14px; margin-bottom: 8px;">Chart initialization failed</div>
                  <div style="font-size: 12px; opacity: 0.7;">Please refresh the page</div>
                </div>
              </div>
            `
          }
        }
      }
    }

    // Start initialization with dimension check
    checkDimensions()

    // Observe parent size changes
    if (containerRef.current) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (!entry || !appRef.current || !appRef.current.renderer || contextLostRef.current) return
        
        const newW = Math.max(1, Math.floor(entry.contentRect.width))
        const newH = Math.max(1, Math.floor(entry.contentRect.height || heightRef.current))
        
        // Mac Chrome sometimes sends resize events with 0 dimensions
        if (newW === 0 || newH === 0) {
          return
        }
        
        if (newW !== widthRef.current || newH !== heightRef.current) {
          widthRef.current = newW
          heightRef.current = newH
          try {
            appRef.current.renderer.resize(newW, newH)
            if (multiplierTextRef.current) {
              multiplierTextRef.current.position.set(newW / 2, newH / 2)
            }
            // Small delay before redraw (Mac Chrome timing)
            setTimeout(() => {
              if (appRef.current && appRef.current.renderer && !contextLostRef.current) {
                drawScene()
              }
            }, 10)
          } catch (error) {
            console.warn('⚠️ [CrashChart] Error resizing renderer:', error)
            
            // Check if it's a context lost error
            if (error instanceof Error && error.message.includes('context')) {
              contextLostRef.current = true
            }
          }
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

  // Initialize game start time and capture crash point locally (no extra props needed)
  useEffect(() => {
    if (startTime) {
      try {
        const startTimeMs =
          startTime instanceof Date ? startTime.getTime() : new Date(startTime as any).getTime()
        
        if (!isNaN(startTimeMs) && startTimeMs > 0) {
          gameStartTimeRef.current = startTimeMs
        }
      } catch (error) {
        console.warn('⚠️ [CrashChart] Error initializing game start time:', error)
      }
    }

    if (status === 'crashed' || status === 'ended') {
      // Capture crash point once (so we keep last multiplier point until graph clears)
      if (crashTimeRef.current === null) {
        // Use crashMultiplier from props if provided (from backend), otherwise calculate locally
        if (crashMultiplier !== null && crashMultiplier !== undefined && crashMultiplier > 1) {
          // Use the actual crash multiplier from backend
          crashMultiplierRef.current = crashMultiplier
          // Calculate crash time from multiplier (inverse function)
          // Binary search to find time that gives this multiplier
          let low = 0
          let high = 1000 // Search up to 1000 seconds
          const tolerance = 0.001
          for (let i = 0; i < 50; i++) {
            const mid = (low + high) / 2
            const calculatedMult = calculateMultiplier(mid)
            const diff = calculatedMult - crashMultiplier
            if (Math.abs(diff) < tolerance) {
              crashTimeRef.current = mid
              break
            }
            if (diff > 0) {
              high = mid
            } else {
              low = mid
            }
          }
          // Fallback: use calculated time or estimate
          if (crashTimeRef.current === null) {
            crashTimeRef.current = (low + high) / 2
          }
        } else if (gameStartTimeRef.current) {
          // Fallback: calculate from elapsed time if no crashMultiplier provided
          const elapsed = Math.max(0, (Date.now() - gameStartTimeRef.current) / 1000)
          crashTimeRef.current = elapsed
          crashMultiplierRef.current = calculateMultiplier(elapsed)
        }
      }

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      // Keep crash multiplier visible - don't reset until betting phase
    } else if (status === 'betting') {
      // Reset values for new game
      gameStartTimeRef.current = null
      crashMultiplierRef.current = null
      crashTimeRef.current = null
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [status, startTime, crashMultiplier])

  // Start animation loop when game is running
  useEffect(() => {
    if (status !== 'running' || !startTime) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    const animate = () => {
      // Only animate if app and renderer are still valid and not context lost
      if (appRef.current && appRef.current.renderer && !contextLostRef.current) {
        try {
          // Check if container is still visible (Mac Chrome optimization)
          if (containerRef.current && containerRef.current.offsetParent === null) {
            // Container is hidden, skip rendering but continue animation
            animationFrameRef.current = requestAnimationFrame(animate)
            return
          }
          
          drawScene()
        } catch (error) {
          console.warn('⚠️ [CrashChart] Error in animation loop:', error)
          
          // Check if it's a context lost error
          if (error instanceof Error && error.message.includes('context')) {
            contextLostRef.current = true
            console.warn('⚠️ [CrashChart] Context error detected, will reinitialize')
          }
          
          // Stop animation on error
          if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
          }
          return
        }
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        // Stop animation if app is destroyed or context lost
        animationFrameRef.current = null
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [status, startTime])

  // Also redraw when status changes or when crashed
  useEffect(() => {
    // Only redraw if app and renderer are ready and not context lost
    if (appRef.current && appRef.current.renderer && !contextLostRef.current) {
      try {
        // Small delay to ensure state is fully updated (Mac Chrome timing)
        setTimeout(() => {
          if (appRef.current && appRef.current.renderer && !contextLostRef.current) {
            drawScene()
          }
        }, 10)
      } catch (error) {
        console.warn('⚠️ [CrashChart] Error redrawing on status change:', error)
        
        // Check if it's a context lost error
        if (error instanceof Error && error.message.includes('context')) {
          contextLostRef.current = true
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

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
    // IMPORTANT: removeChildren() does NOT destroy Text objects. If we redraw per-frame,
    // we must destroy removed children or memory will grow until the renderer blanks out.
    const removedX = xLabelsRef.current?.removeChildren()
    if (removedX && removedX.length) {
      for (const child of removedX) child.destroy({ children: true })
    }
    const removedY = yLabelsRef.current?.removeChildren()
    if (removedY && removedY.length) {
      for (const child of removedY) child.destroy({ children: true })
    }

    // Ticks and labels (nice ticks)
    const yTicks = getNiceTicks(1, maxMult, 5)
    for (const v of yTicks) {
      const y = mapMultToY(v, maxMult)
      g.moveTo(PADDING - 5, y).lineTo(PADDING + 5, y)
      const lbl = new Text(`${v.toFixed(1)}x`, AXIS_LABEL_STYLE)
      lbl.anchor.set(1, 0.5)
      lbl.position.set(PADDING - 8, y)
      yLabelsRef.current?.addChild(lbl)
    }

    const xTicks = getNiceTicks(0, maxTime, 6)
    for (const v of xTicks) {
      if (v === 0) continue
      const x = mapTimeToX(v, maxTime)
      g.moveTo(x, height - PADDING - 5).lineTo(x, height - PADDING + 5)
      const lbl = new Text(`${Math.round(v)}s`, AXIS_LABEL_STYLE)
      lbl.anchor.set(0.5, 0)
      lbl.position.set(x, height - PADDING + 8)
      xLabelsRef.current?.addChild(lbl)
    }
  }

  function drawScene() {
    // Ensure app and renderer are ready before drawing
    if (!appRef.current || !appRef.current.renderer) {
      return
    }
    
    if (!graphRef.current || !multiplierTextRef.current || !areaRef.current) return

    const g = graphRef.current
    const fill = areaRef.current
    const mText = multiplierTextRef.current
    
    try {
      g.clear()
      fill.clear()
    } catch (error) {
      console.warn('⚠️ [CrashChart] Error clearing graphics:', error)
      return
    }

    if (status === 'betting') {
      // Hide multiplier text during betting phase
      mText.visible = false
      return
    }

    // Calculate elapsed time from startTime (client local clock)
    let elapsed = 0
    if (startTime && gameStartTimeRef.current) {
      try {
        if ((status === 'crashed' || status === 'ended') && crashTimeRef.current !== null) {
          // When crashed or ended, use the crash time (frozen at crash point)
          elapsed = crashTimeRef.current
        } else {
          elapsed = Math.max(0, (Date.now() - gameStartTimeRef.current) / 1000)
        }
      } catch (error) {
        elapsed = 0
      }
    }

    // Determine current multiplier and max time using backend formula
    let currentMult: number
    let maxTime: number
    
    if ((status === 'crashed' || status === 'ended') && crashMultiplierRef.current !== null) {
      // Use crash multiplier (frozen at crash point) - keep it until graph clears
      currentMult = crashMultiplierRef.current
      // Use crash time for maxTime calculation
      const crashTime = crashTimeRef.current || elapsed
      maxTime = Math.max(10, crashTime * 1.2)
    } else if (status === 'running' && elapsed > 0) {
      // Calculate multiplier using backend formula: M(t) = 1 + A * t^{B(t)}
      currentMult = calculateMultiplier(elapsed)
      // Safety limit: prevent unlimited growth (cap at reasonable max, e.g., 1000x)
      const MAX_SAFE_MULTIPLIER = 1000
      if (currentMult > MAX_SAFE_MULTIPLIER) {
        console.warn(`⚠️ [CrashChart] Multiplier exceeded safe limit: ${currentMult.toFixed(2)}x, capping at ${MAX_SAFE_MULTIPLIER}x`)
        currentMult = MAX_SAFE_MULTIPLIER
      }
      maxTime = Math.max(10, Math.max(elapsed * 1.2, 10))
    } else {
      // Fallback (only for betting or when no crash multiplier)
      currentMult = 1
      maxTime = 10
    }

    // Generate smooth curve using backend formula: M(t) = 1 + A * t^{B(t)}
    const curve: { t: number; m: number }[] = []
    const segments = 80 // High resolution for smooth curve
    
    // Determine the actual time range to generate curve for
    const curveEndTime =
      (status === 'crashed' || status === 'ended') && crashTimeRef.current !== null
        ? crashTimeRef.current
        : elapsed
    
    for (let i = 0; i <= segments; i++) {
      const t = (curveEndTime / segments) * i
      
      if ((status === 'crashed' || status === 'ended') && crashMultiplierRef.current !== null) {
        // For crashed/ended state, show curve up to crash point using backend formula
        const m = calculateMultiplier(t)
        // Only add point if it doesn't exceed crash multiplier
        if (m <= crashMultiplierRef.current) {
          curve.push({ t, m })
        } else {
          // Once we exceed crash multiplier, stop generating points
          break
        }
      } else if (status === 'running') {
        // Calculate multiplier at time t using backend formula: M(t) = 1 + A * t^{B(t)}
        const m = calculateMultiplier(t)
        curve.push({ t, m })
      } else {
        // Fallback: linear interpolation
        const m = 1 + (currentMult - 1) * (t / Math.max(0.1, curveEndTime))
        curve.push({ t, m })
      }
    }
    
    // Ensure we have at least one point
    if (curve.length === 0) {
      curve.push({ t: 0, m: 1 })
    }


    const maxMult = Math.max(3, Math.max(...curve.map(p => p.m), currentMult, 1) * 1.2)

    // Filled area ("cube") under the curve
    const baseY = mapMultToY(1, maxMult)
    if (curve.length > 0) {
      const fillColor = status === 'crashed' ? 0xEF4444 : 0x10B981
      fill.beginFill(fillColor, 0.12)
      fill.moveTo(mapTimeToX(0, maxTime), baseY)
      for (const p of curve) {
        fill.lineTo(mapTimeToX(p.t, maxTime), mapMultToY(p.m, maxMult))
      }
      const last = curve[curve.length - 1]
      fill.lineTo(mapTimeToX(last.t, maxTime), baseY)
      fill.closePath()
      fill.endFill()
    }

    // Main curve line with gradient color (white to green/red)
    if (curve.length === 0) return
    
    // Convert curve points to screen coordinates
    const screenPoints = curve.map(p => ({
      x: mapTimeToX(p.t, maxTime),
      y: mapMultToY(p.m, maxMult)
    }))
    
    // Draw curve with gradient: white (start) to green (running) or red (crashed)
    const startColor = 0xFFFFFF // White
    const endColor = status === 'crashed' ? 0xEF4444 : 0x10B981 // Red or Green
    
    // Draw curve as segments with interpolated colors for gradient effect
    if (screenPoints.length === 1) {
      // Single point - just draw a dot
      g.lineStyle({ width: 5, color: endColor, cap: 'round' as any })
      g.moveTo(screenPoints[0].x, screenPoints[0].y)
      g.lineTo(screenPoints[0].x, screenPoints[0].y)
    } else if (screenPoints.length === 2) {
      // Two points - draw with gradient
      const p0 = screenPoints[0]
      const p1 = screenPoints[1]
      
      // Start white
      g.lineStyle({ width: 5, color: startColor, cap: 'round' as any })
      g.moveTo(p0.x, p0.y)
      
      // End with final color
      g.lineStyle({ width: 5, color: endColor, cap: 'round' as any })
      const controlX = p0.x + (p1.x - p0.x) * 0.5
      const controlY = p0.y + (p1.y - p0.y) * 0.5
      g.quadraticCurveTo(controlX, controlY, p1.x, p1.y)
    } else {
      // Multiple points - draw with gradient using segments
      const tension = 0.15
      const segmentCount = screenPoints.length - 1
      
      // Start from first point with white color
      g.lineStyle({ width: 5, color: startColor, cap: 'round' as any, join: 'round' as any })
      g.moveTo(screenPoints[0].x, screenPoints[0].y)
      
      // Draw segments with interpolated colors for smooth gradient
      for (let i = 0; i < segmentCount; i++) {
        // Calculate progress along the curve (0 = start/white, 1 = end/colored)
        const progress = (i + 1) / segmentCount
        
        // Interpolate color from white to end color
        const r1 = (startColor >> 16) & 0xFF
        const g1 = (startColor >> 8) & 0xFF
        const b1 = startColor & 0xFF
        const r2 = (endColor >> 16) & 0xFF
        const g2 = (endColor >> 8) & 0xFF
        const b2 = endColor & 0xFF
        
        const r = Math.round(r1 + (r2 - r1) * progress)
        const green = Math.round(g1 + (g2 - g1) * progress)
        const b = Math.round(b1 + (b2 - b1) * progress)
        const color = (r << 16) | (green << 8) | b
        
        // Set line style for this segment (this continues the path)
        g.lineStyle({ width: 5, color, cap: 'round' as any, join: 'round' as any })
        
        const p0 = i > 0 ? screenPoints[i - 1] : screenPoints[i]
        const p1 = screenPoints[i]
        const p2 = screenPoints[i + 1]
        const p3 = i < screenPoints.length - 2 ? screenPoints[i + 2] : screenPoints[i + 1]
        
        // Calculate control points for cubic Bezier
        const t = tension
        const cp1x = p1.x + (p2.x - p0.x) * t
        const cp1y = p1.y + (p2.y - p0.y) * t
        const cp2x = p2.x - (p3.x - p1.x) * t
        const cp2y = p2.y - (p3.y - p1.y) * t
        
        // Draw cubic Bezier curve segment (continues from previous point)
        g.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
      }
    }
    
    // Draw white thumb/circle at current point (last point of curve)
    if (screenPoints.length > 0 && (status === 'running' || status === 'crashed' || status === 'ended')) {
      const lastPoint = screenPoints[screenPoints.length - 1]
      
      // Outer glow circle (larger, semi-transparent)
      g.beginFill(0xFFFFFF, 0.3)
      g.drawCircle(lastPoint.x, lastPoint.y, 5)
      g.endFill()
      
      // // Main white circle
      // g.beginFill(0xFFFFFF, 1)
      // g.drawCircle(lastPoint.x, lastPoint.y, 6)
      // g.endFill()
      
      // Inner highlight
      // g.beginFill(0xFFFFFF, 0.8)
      // g.drawCircle(lastPoint.x - 2, lastPoint.y - 2, 2)
      // g.endFill()
    }

    // Multiplier text - keep crash multiplier visible until graph clears
    mText.visible = true
    const displayMultiplier = (status === 'crashed' || status === 'ended') && crashMultiplierRef.current !== null 
      ? crashMultiplierRef.current 
      : currentMult // Use calculated multiplier
    mText.text = `${displayMultiplier.toFixed(2)}x`
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

      // Use cashout multiplier if available, otherwise calculate from elapsed
      const cashoutMult = cashout.cashoutMultiplier || (elapsed > 0 ? calculateMultiplier(elapsed) : 1)

      const maxTime = Math.max(10, elapsed * 1.2 || 10)
      const maxMult = Math.max(3, Math.max(cashoutMult, 1) * 1.2)
      
      // Find the position on the current graph curve where the user cashed out
      const startX = mapTimeToX(elapsed, maxTime)
      const startY = mapMultToY(cashoutMult, maxMult)
      
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
  }, [playerBets, startTime])

  // Animation ticker
  useEffect(() => {
    if (!appRef.current || !appRef.current.renderer || !animationContainerRef.current) return

    const ticker = new Ticker()
    ticker.add(() => {
      // Ensure renderer is still available
      if (!appRef.current || !appRef.current.renderer) return
      
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


