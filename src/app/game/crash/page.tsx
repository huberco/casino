'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWebSocket } from '@/contexts/socketContext'
import { useAuth } from '@/contexts/AuthContext'
import { useModalType } from '@/contexts/modalContext'
import { useGamePageTracking } from '@/hooks/useGamePageTracking'
import PrimaryButton from '@/components/ui/PrimaryButton'
import GameStatusWrapper from '@/components/GameStatusWrapper'
import { Button, Input, NumberInput, Switch, Card, CardBody, Badge, Chip, PopoverContent, PopoverTrigger, Popover, Snippet } from '@heroui/react'
import {
  MdAttachMoney,
  MdPeople,
  MdTimer,
  MdStop,
  MdVerifiedUser
} from 'react-icons/md'
import CrashPixiChart from '@/components/Chart/CrashPixiChart'
import CrashHistory from '@/components/table/CrashHistory'
import { FaCashRegister, FaClock, FaInfo, FaPause, FaPlay } from 'react-icons/fa6'
import config from '@/lib/config'
import { useGameSettings } from '@/contexts/GameSettingsContext'
import { FaInfoCircle } from 'react-icons/fa'
interface CrashGame {
  roundId: string;
  round: number;
  status: 'betting' | 'running' | 'crashed' | 'ended';
  currentMultiplier: number;
  totalBetAmount: number;
  playerCount: number;
  playerBets: PlayerBet[];
  serverSeedHash: string;
  publicSeed: string;
  startTime?: Date;
}

interface PlayerBet {
  username: string;
  avatar?: string;
  betAmount: number;
  autoCashoutMultiplier?: number;
  cashoutMultiplier?: number;
  payout: number;
  status: 'active' | 'cashed_out' | 'lost';
  isCurrentUser: boolean;
}

interface GameHistory {
  roundId: string;
  round: number;
  crashPoint: number;
  totalBetAmount: number;
  totalPayout: number;
  playerCount: number;
  startTime: Date;
  endTime: Date;
}

export default function CrashPage() {
  const { isConnected, emit, on, off } = useWebSocket()
  const { user, updateBalance } = useAuth()
  const { showModal: showSuccessModal } = useModalType('success')
  const { showModal: showErrorModal } = useModalType('error')

  // Track when user visits this game page
  useGamePageTracking({ gameType: 'crash' })

  // Game state
  const [currentGame, setCurrentGame] = useState<CrashGame | null>(null)
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([])
  const [multiplierHistory, setMultiplierHistory] = useState<number[]>([])
  const [chartPoints, setChartPoints] = useState<{ t: number; m: number }[]>([])

  // Betting state
  const [betAmount, setBetAmount] = useState(1.0)
  const [autoCashout, setAutoCashout] = useState(false)
  const [autoCashoutMultiplier, setAutoCashoutMultiplier] = useState(2.0)
  const [userBet, setUserBet] = useState<PlayerBet | null>(null)

  // UI state
  const [isPlacingBet, setIsPlacingBet] = useState(false)
  const [isCashingOut, setIsCashingOut] = useState(false)
  const [showProvableFair, setShowProvableFair] = useState(false)
  const [bettingTimeLeft, setBettingTimeLeft] = useState(20000)
  const [bettingEndAt, setBettingEndAt] = useState<number | null>(null)

  // Chart canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

  const [isStarted, setIsStarted] = useState(false)
  const [stats, setStats] = useState<{ numberPoints: number; fps: number }>({ numberPoints: 0, fps: 0 })

  const { settings } = useGameSettings();

  // Load current game on mount
  useEffect(() => {
    if (isConnected) {
      emit('crash_get_current_game', {})
      emit('crash_get_history', { limit: 10 })
    }
  }, [isConnected, emit])

  // WebSocket event handlers
  useEffect(() => {
    if (!isConnected) return

    const handleGameStarted = (data: any) => {
      console.log('🎮 Crash game started:', data)
      setCurrentGame({
        roundId: data.roundId,
        round: data.round,
        status: 'betting',
        currentMultiplier: 1.00,
        totalBetAmount: 0,
        playerCount: 0,
        playerBets: [],
        serverSeedHash: data.serverSeedHash,
        publicSeed: data.publicSeed
      })
      setUserBet(null)
      // Sync countdown to server-provided betting end time to avoid drift
      const endAt = data.bettingEndTime ? new Date(data.bettingEndTime).getTime() : Date.now() + (data.bettingPhaseMs || 20000)
      setBettingEndAt(endAt)
      setBettingTimeLeft(Math.max(0, endAt - Date.now()))
      setMultiplierHistory([1.00])
      setChartPoints([{ t: 0, m: 1 }])
    }

    const handleBettingEnded = (data: any) => {
      console.log('🚀 Betting ended:', data)
      setBettingTimeLeft(0)
      setBettingEndAt(null)
      if (currentGame) {
        setCurrentGame(prev => prev ? {
          ...prev,
          status: 'running',
          playerCount: data.playerCount,
          totalBetAmount: data.totalBetAmount,
          startTime: new Date() // Set the actual game start time
        } : null)
      }
      // Ensure chart starts at baseline when run begins
      setChartPoints(prev => prev.length ? prev : [{ t: 0, m: 1 }])
    }

    const handleMultiplierUpdate = (data: any) => {
      if (currentGame?.roundId === data.roundId) {
        setCurrentGame(prev => prev ? {
          ...prev,
          currentMultiplier: data.multiplier
        } : null)

        // Add to multiplier history for chart (avoid duplicates)
        setMultiplierHistory(prev => {
          const lastMultiplier = prev[prev.length - 1]
          if (lastMultiplier !== data.multiplier) {
            return [...prev, data.multiplier]
          }
          return prev
        })

        // Accumulate backend time+multiplier points for Pixi chart
        setChartPoints(prev => {
          const t = Number(data.elapsedSeconds ?? 0)
          const m = Number(data.multiplier ?? 1)
          if (!isFinite(t) || !isFinite(m)) return prev
          if (prev.length === 0) return [{ t, m }]
          const last = prev[prev.length - 1]
          if (t <= last.t && m === last.m) return prev
          return [...prev, { t, m }]
        })
      }
    }

    const handlePlayerJoined = (data: any) => {
      console.log('👤 Player joined:', data)
      if (currentGame?.roundId === data.roundId) {
        setCurrentGame(prev => prev ? {
          ...prev,
          totalBetAmount: data.totalBetAmount,
          playerCount: data.playerCount,
          playerBets: [...prev.playerBets, data.player]
        } : null)
      }
    }

    const handlePlayerCashedOut = (data: any) => {
      console.log('💰 Player cashed out:', data)
      if (currentGame?.roundId === data.roundId) {
        setCurrentGame(prev => {
          if (!prev) return null
          const updatedBets = prev.playerBets.map(bet =>
            bet.username === data.player.username ? {
              ...bet,
              status: 'cashed_out' as const,
              cashoutMultiplier: data.player.cashoutMultiplier,
              payout: data.player.payout
            } : bet
          )
          return { ...prev, playerBets: updatedBets }
        })
      }
    }

    const handleGameCrashed = (data: any) => {
      console.log('💥 Game crashed:', data)
      if (currentGame?.roundId === data.roundId) {
        setCurrentGame(prev => prev ? {
          ...prev,
          status: 'crashed',
          currentMultiplier: data.crashPoint
        } : null)

        // Mark remaining active bets as lost
        setCurrentGame(prev => {
          if (!prev) return null
          const updatedBets = prev.playerBets.map(bet =>
            bet.status === 'active' ? { ...bet, status: 'lost' as const } : bet
          )
          return { ...prev, playerBets: updatedBets }
        })

        // Ensure final crash point captured in chart points
        setChartPoints(prev => {
          if (prev.length === 0) return prev
          const last = prev[prev.length - 1]
          if (Math.abs((data.crashPoint ?? last.m) - last.m) < 1e-6) return prev
          return [...prev, { t: last.t, m: Number(data.crashPoint) }]
        })
      }
    }

    const handleGameEnded = (data: any) => {
      // Refresh history
      emit('crash_get_history', { limit: 10 })
    }

    const handleCurrentGame = (data: any) => {
      
      setCurrentGame({
        roundId: data.roundId,
        round: data.round,
        status: data.status,
        currentMultiplier: data.currentMultiplier,
        totalBetAmount: data.totalBetAmount,
        playerCount: data.playerCount,
        playerBets: data.playerBets,
        serverSeedHash: data.serverSeedHash,
        publicSeed: data.publicSeed,
        startTime: data.startTime ? new Date(data.startTime) : undefined
      })

      // Find user's bet
      const myBet = data.playerBets.find((bet: PlayerBet) => bet.isCurrentUser)
      setUserBet(myBet || null)

      // Initialize countdown timer if game is in betting phase
      if (data.status === 'betting' && data.bettingEndTime) {
        const endAt = new Date(data.bettingEndTime).getTime()
        const now = Date.now()
        const remaining = Math.max(0, endAt - now)
        
        console.log('⏱️ Countdown initialized:', {
          bettingEndTime: data.bettingEndTime,
          endAt,
          now,
          remaining,
          remainingSeconds: (remaining / 1000).toFixed(1)
        })
        
        setBettingEndAt(endAt)
        setBettingTimeLeft(remaining)
      } else {
        console.log('⚠️ Not in betting phase or no bettingEndTime:', { status: data.status, hasBettingEndTime: !!data.bettingEndTime })
        setBettingEndAt(null)
        setBettingTimeLeft(0)
      }
    }

    const handleNoActiveGame = () => {
      console.log('❌ No active game')
      setCurrentGame(null)
      setUserBet(null)
      setChartPoints([])
      setBettingEndAt(null)
      setBettingTimeLeft(0)
    }

    const handleHistory = (data: any) => {
      setGameHistory(data.games.map((game: any) => ({
        ...game,
        startTime: new Date(game.startTime),
        endTime: new Date(game.endTime)
      })))
    }

    const handleBetPlaced = (data: any) => {
      setIsPlacingBet(false)
      if (data.success) {
        // showSuccessModal({
        //   title: 'Bet Placed!',
        //   message: `Your bet of ${data.betAmount} has been placed successfully.`
        // })

        // Update user bet
        setUserBet({
          username: user.profile?.username || 'You',
          betAmount: data.betAmount,
          autoCashoutMultiplier: data.autoCashoutMultiplier,
          status: 'active',
          payout: 0,
          isCurrentUser: true
        })
      }
    }

    const handleCashedOut = (data: any) => {
      setIsCashingOut(false)
      if (data.success) {
        showSuccessModal({
          title: 'Cashed Out!',
          message: `You successfully cashed out for ${data.payout?.toFixed(3).replace(/\.?0+$/, '')} tokens!`
        })

        // Update user bet
        setUserBet(prev => prev ? {
          ...prev,
          status: 'cashed_out',
          payout: data.payout,
          cashoutMultiplier: currentGame?.currentMultiplier
        } : null)

        // Also update the player list entry for current user
        setCurrentGame(prev => {
          if (!prev) return null
          const currentUsername = user.profile?.username || 'You'
          const updatedBets = prev.playerBets.map(bet =>
            bet.username === currentUsername ? {
              ...bet,
              status: 'cashed_out' as const,
              cashoutMultiplier: prev.currentMultiplier,
              payout: data.payout
            } : bet
          )
          return { ...prev, playerBets: updatedBets }
        })
      }
    }

    const handleError = (data: any) => {
      setIsPlacingBet(false)
      setIsCashingOut(false)
      showErrorModal({
        title: 'Error',
        message: data.message || 'An error occurred'
      })
    }

    const handleBalanceUpdate = (data: any) => {
      if (data.userId === user.profile?.id) {
        updateBalance(data.newBalance)
      }
    }

    // Register event listeners
    on('crash_game_started', handleGameStarted)
    on('crash_betting_ended', handleBettingEnded)
    on('crash_multiplier_update', handleMultiplierUpdate)
    on('crash_player_joined', handlePlayerJoined)
    on('crash_player_cashed_out', handlePlayerCashedOut)
    on('crash_game_crashed', handleGameCrashed)
    on('crash_game_ended', handleGameEnded)
    on('crash_current_game', handleCurrentGame)
    on('crash_no_active_game', handleNoActiveGame)
    on('crash_history', handleHistory)
    on('crash_bet_placed', handleBetPlaced)
    on('crash_cashed_out', handleCashedOut)
    on('crash_error', handleError)
    on('user_balance_update', handleBalanceUpdate)

    return () => {
      off('crash_game_started', handleGameStarted)
      off('crash_betting_ended', handleBettingEnded)
      off('crash_multiplier_update', handleMultiplierUpdate)
      off('crash_player_joined', handlePlayerJoined)
      off('crash_player_cashed_out', handlePlayerCashedOut)
      off('crash_game_crashed', handleGameCrashed)
      off('crash_game_ended', handleGameEnded)
      off('crash_current_game', handleCurrentGame)
      off('crash_no_active_game', handleNoActiveGame)
      off('crash_history', handleHistory)
      off('crash_bet_placed', handleBetPlaced)
      off('crash_cashed_out', handleCashedOut)
      off('crash_error', handleError)
      off('user_balance_update', handleBalanceUpdate)
    }
  }, [isConnected, on, off, currentGame, user.profile?.id, updateBalance, showSuccessModal, showErrorModal])

  // Betting countdown timer synced to server bettingEndTime
  useEffect(() => {
    if (!bettingEndAt) return
    const timer = setInterval(() => {
      const remaining = Math.max(0, bettingEndAt - Date.now())
      setBettingTimeLeft(remaining)
      if (remaining === 0) {
        clearInterval(timer)
      }
    }, 100)
    return () => clearInterval(timer)
  }, [bettingEndAt])

  // Draw BC.game style crash visualization
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // High-DPI canvas setup for crisp rendering
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    // Set the actual canvas size in memory (scaled for high-DPI)
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    // Scale the canvas back down using CSS
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'

    // Scale the drawing context so everything draws at the correct size
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Clear canvas with dark background
    ctx.fillStyle = '#0F172A'
    ctx.fillRect(0, 0, width, height)

    // Draw subtle grid with crisp lines
    ctx.strokeStyle = '#1E293B'
    ctx.lineWidth = 0.5

    // Horizontal grid lines (pixel-perfect positioning)
    for (let i = 1; i < 5; i++) {
      const y = Math.floor((height / 5) * i) + 0.5 // +0.5 for crisp 1px lines
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Vertical grid lines (pixel-perfect positioning)
    for (let i = 1; i < 8; i++) {
      const x = Math.floor((width / 8) * i) + 0.5 // +0.5 for crisp 1px lines
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    if (!currentGame) return

    const multiplier = currentGame.currentMultiplier
    const isRunning = currentGame.status === 'running'
    const isCrashed = currentGame.status === 'crashed'

    // Calculate elapsed time since game started
    let elapsedTime = 0;
    if (currentGame?.startTime) {
      elapsedTime = Math.max(0, (Date.now() - new Date(currentGame.startTime).getTime()) / 1000);
    } else {
      // Fallback: estimate based on multiplier history
      elapsedTime = Math.max(0, multiplierHistory.length * 0.1); // Assume 100ms per update
    }

    // Dynamic time scale that expands when curve reaches right edge
    // Start with 10s, then expand smoothly when needed
    let maxTime = 10; // Initial scale

    // If elapsed time is getting close to right edge (80%), expand the scale
    if (elapsedTime > maxTime * 0.8) {
      if (elapsedTime <= 15) {
        maxTime = 20;
      } else if (elapsedTime <= 25) {
        maxTime = 30;
      } else if (elapsedTime <= 45) {
        maxTime = 60;
      } else if (elapsedTime <= 90) {
        maxTime = 120;
      } else {
        maxTime = Math.ceil(elapsedTime / 60) * 60; // Round to minutes for very long games
      }
    }

    // Calculate curve points for realistic exponential growth
    const points: { x: number; y: number }[] = []
    const segments = 300 // Increased for smoother curve

    for (let i = 0; i <= segments; i++) {
      const progress = i / segments
      const timeAtPoint = maxTime * progress // Use maxTime for full scale

      // Calculate multiplier using exponential formula: M(t) = e^(kt)
      const k = 0.06; // Growth constant (should match backend)
      let currentMult;

      if (timeAtPoint <= elapsedTime) {
        // For points up to current elapsed time, use exponential formula
        currentMult = Math.exp(k * timeAtPoint);
      } else {
        // Don't draw points beyond current time - break here
        break;
      }

      // Position on canvas
      const x = progress * width * 0.9 // Leave some margin

      // Convert multiplier to y position with better scaling
      const maxDisplayMult = Math.max(multiplier * 1.2, 5) // Show a bit more than current
      const minMult = 1
      const multRange = maxDisplayMult - minMult
      const yProgress = Math.min(1, (currentMult - minMult) / multRange)
      const y = height * 0.9 - (yProgress * height * 0.7) // Use 70% of height, leave margins

      points.push({ x: x + width * 0.05, y: y + height * 0.05 }) // Add margins
    }

    // Draw the main curve with gradient
    if (points.length > 1) {
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, width, 0)

      if (isCrashed) {
        gradient.addColorStop(0, '#10B981') // Green start
        gradient.addColorStop(0.8, '#F59E0B') // Yellow middle  
        gradient.addColorStop(1, '#EF4444') // Red end (crashed)
      } else {
        gradient.addColorStop(0, '#10B981') // Green
        gradient.addColorStop(1, '#06B6D4') // Cyan
      }

      // Draw main line with high quality
      ctx.strokeStyle = gradient
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      // Enable anti-aliasing for smooth lines
      ctx.globalCompositeOperation = 'source-over'

      // Add glow effect
      ctx.shadowColor = isRunning ? '#10B981' : '#EF4444'
      ctx.shadowBlur = 15
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)

      // Use quadratic curves for smooth line
      for (let i = 1; i < points.length - 1; i++) {
        const current = points[i]
        const next = points[i + 1]
        const controlX = (current.x + next.x) / 2
        const controlY = (current.y + next.y) / 2
        ctx.quadraticCurveTo(current.x, current.y, controlX, controlY)
      }

      // Final point
      if (points.length > 1) {
        const lastPoint = points[points.length - 1]
        ctx.lineTo(lastPoint.x, lastPoint.y)
      }

      ctx.stroke()
      ctx.shadowBlur = 0 // Reset shadow

      // Draw current position indicator at the end of the curve
      if (isRunning && points.length > 0) {
        const lastPoint = points[points.length - 1];

        // Pulsing dot at current position
        ctx.fillStyle = '#10B981';
        ctx.shadowColor = '#10B981';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Add area fill under curve
      ctx.globalAlpha = 0.1
      ctx.fillStyle = gradient
      ctx.lineTo(points[points.length - 1].x, height)
      ctx.lineTo(0, height)
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1.0

      // Draw crash point indicator if crashed
      if (isCrashed && points.length > 0) {
        const crashPoint = points[points.length - 1]

        // Explosion effect
        ctx.fillStyle = '#EF4444'
        ctx.beginPath()
        ctx.arc(crashPoint.x, crashPoint.y, 8, 0, Math.PI * 2)
        ctx.fill()

        // Crash text
        ctx.fillStyle = '#EF4444'
        ctx.font = 'bold 16px Inter'
        ctx.textAlign = 'center'
        ctx.fillText('CRASHED!', crashPoint.x, crashPoint.y - 20)
      }
    }

    // Draw current multiplier display with high quality
    ctx.fillStyle = isCrashed ? '#EF4444' : isRunning ? '#10B981' : '#64748B'
    ctx.font = 'bold 52px Inter, system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Add enhanced glow effect
    ctx.shadowColor = isCrashed ? '#EF4444' : isRunning ? '#10B981' : '#64748B'
    ctx.shadowBlur = 25
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    ctx.fillText(
      `${multiplier.toFixed(2)}x`,
      width / 2,
      height / 2
    )

    // Reset shadow
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Draw player cashout indicators
    if (currentGame.playerBets && currentGame.playerBets.length > 0) {
      currentGame.playerBets
        .filter(bet => bet.status === 'cashed_out' && bet.cashoutMultiplier)
        .forEach((bet, index) => {
          if (!bet.cashoutMultiplier) return

          const cashoutProgress = (bet.cashoutMultiplier - 1) / (multiplier - 1)
          const x = cashoutProgress * width
          const maxMult = Math.max(multiplier, 3)
          const y = height - ((bet.cashoutMultiplier - 1) / (maxMult - 1)) * (height * 0.8)

          // Draw cashout point
          ctx.fillStyle = '#F59E0B'
          ctx.beginPath()
          ctx.arc(x, y, 4, 0, Math.PI * 2)
          ctx.fill()

          // Draw username
          ctx.fillStyle = '#F59E0B'
          ctx.font = '12px Inter'
          ctx.textAlign = 'center'
          ctx.fillText(
            `${bet.username} ${bet.cashoutMultiplier.toFixed(2)}x`,
            x,
            y - 15
          )
        })
    }

    // Draw axis labels with high quality text
    ctx.fillStyle = '#64748B'
    ctx.font = '12px Inter, system-ui, -apple-system, sans-serif'

    // Time labels (bottom) - use the maxTime calculated earlier
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    for (let i = 0; i <= 6; i++) {
      const x = width * 0.05 + (width * 0.9 * i / 6)
      const timeValue = (maxTime * i / 6)
      ctx.fillText(`${timeValue.toFixed(1)}s`, x, height - 20)
    }

    // Multiplier labels (left side)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    const maxDisplayMult = Math.max(multiplier * 1.2, 5)
    for (let i = 0; i <= 5; i++) {
      const y = height * 0.95 - (height * 0.7 * i / 5)
      const multValue = 1 + (maxDisplayMult - 1) * i / 5
      ctx.fillText(`${multValue.toFixed(1)}x`, width * 0.04, y)
    }

  }, [currentGame, multiplierHistory])

  const placeBet = async () => {
    if (!user.isAuthenticated) {
      showErrorModal({
        title: 'Authentication Required',
        message: 'Please log in to place bets'
      })
      return
    }

    if (betAmount <= 0) {
      showErrorModal({
        title: 'Invalid Bet',
        message: 'Bet amount must be greater than 0'
      })
      return
    }

    if (user.profile?.balance !== undefined && user.profile.balance < betAmount) {
      showErrorModal({
        title: 'Insufficient Balance',
        message: `You need ${betAmount} but only have ${user.profile.balance.toFixed(2).replace(/\.?0+$/, '')}`
      })
      return
    }

    setIsPlacingBet(true)
    emit('crash_place_bet', {
      betAmount: betAmount,
      autoCashoutMultiplier: autoCashout ? autoCashoutMultiplier : undefined
    })
  }

  const handleBetAmountChange = (value: number) => {
    if (settings?.games?.crash?.minBet && value < settings?.games?.crash?.minBet || settings?.games?.crash?.maxBet && value > settings?.games?.crash?.maxBet) {
      showErrorModal({
        title: 'Invalid Bet',
        message: `Bet amount must be between ${settings?.games?.crash?.minBet || 0.001} and ${settings?.games?.crash?.maxBet || 1000}`
      })
      return
    }
    setBetAmount(value)
  }

  const cashOut = async () => {
    if (!userBet || userBet.status !== 'active') return

    setIsCashingOut(true)
    emit('crash_cashout', {})
  }

  const canPlaceBet = currentGame?.status === 'betting' && !userBet && bettingTimeLeft > 0
  const canCashOut = currentGame?.status === 'running' && userBet?.status === 'active'

  return (
    <GameStatusWrapper gameName="crash" fallbackTitle="Crash Game Unavailable">
      <div className="min-h-screen text-white">
        <div className="relative z-10 p-2 sm:p-6">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <div className="lg:grid grid-cols-1 flex-col-reverse flex lg:grid-cols-16 gap-4 lg:gap-8">

              {/* Left Panel - Betting Controls */}
              <div className="col-span-1 lg:col-span-6 xl:col-span-4 space-y-6 flex">
                <Card className="bg-background-alt w-full">
                  <CardBody className="p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <MdAttachMoney className="text-primary" />
                      Place Bet
                    </h3>

                    <div className="space-y-4">
                      <NumberInput
                        label="Bet Amount"
                        value={betAmount}
                        onValueChange={handleBetAmountChange}
                        max={settings?.games?.crash?.maxBet || 1000}
                        step={0.001}
                        placeholder="0.000"
                        endContent={config.token}
                        isDisabled={!canPlaceBet}
                        classNames={{
                          inputWrapper: "bg-background! rounded-lg"
                        }}
                      />
                      <div className='flex gap-2 justify-between text-xs text-white/50'>
                        <span>Min Bet: {settings?.games?.crash?.minBet || 0.001}</span>
                        <span>Max Bet: {settings?.games?.crash?.maxBet || 1000} </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto Cashout</span>
                        <Switch
                          isSelected={autoCashout}
                          onValueChange={setAutoCashout}
                          size="sm"
                          isDisabled={!canPlaceBet}
                        />
                      </div>

                      {autoCashout && (
                        <NumberInput
                          label="Auto Cashout at"
                          value={autoCashoutMultiplier}
                          onValueChange={setAutoCashoutMultiplier}
                          min={1.01}
                          max={1000}
                          step={0.01}
                          placeholder="2.00"
                          endContent="x"
                          isDisabled={!canPlaceBet}
                        />
                      )}

                      {/* Dynamic Action Button */}
                      {(() => {
                        // User has active bet and can cash out
                        if (canCashOut) {
                          return (
                            <Button
                              onPress={cashOut}
                              variant="solid"
                              className="w-full font-semibold rounded-full bg-primary text-background"
                              isLoading={isCashingOut}
                              startContent={<FaCashRegister />}
                            >
                              {isCashingOut ? 'Cashing Out...' : `Cash Out ${(userBet.betAmount * currentGame.currentMultiplier).toFixed(2)}`}
                            </Button>
                          );
                        }

                        // User can place bet (betting phase, no active bet)
                        if (canPlaceBet) {
                          return (
                            <PrimaryButton
                              onClick={placeBet}
                              disabled={isPlacingBet}
                              className="w-full bg-primary text-background font-semibold"
                              isLoading={isPlacingBet}
                            >
                              <FaPlay />
                              {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
                            </PrimaryButton>
                          );
                        }

                        // User has bet but game is not running yet (waiting for game to start)
                        if (userBet && currentGame?.status === 'betting') {
                          return (
                            <PrimaryButton
                              className="w-full font-bold rounded-full"
                              disabled={true}
                            >
                              <MdTimer />
                              Waiting...
                            </PrimaryButton>
                          );
                        }

                        // User has bet but already cashed out or lost
                        if (userBet && (userBet.status === 'cashed_out' || userBet.status === 'lost')) {
                          return (
                            <Button
                              variant="flat"
                              className={`w-full text-background font-bold ${userBet.status === 'cashed_out' ? 'bg-primary' : 'bg-danger'} rounded-full`}
                              isDisabled={true}
                            >
                              {userBet.status === 'cashed_out' ? (
                                <>
                                  <MdVerifiedUser />
                                  Cahsed out
                                </>
                              ) : (
                                <>
                                  <MdStop />
                                  Crashed
                                </>
                              )}
                            </Button>
                          );
                        }

                        // Game is running but user didn't join
                        if (currentGame?.status === 'running') {
                          return (
                            <Button
                              variant="flat"
                              className="w-full font-bold rounded-full"
                              isDisabled={true}
                            >
                              <MdTimer />
                              Join next Round
                            </Button>
                          );
                        }

                        // Default fallback
                        return (
                          <Button
                            color="default"
                            variant="flat"
                            className="w-full font-bold rounded-full"
                            isDisabled={true}
                          >
                            <MdTimer />
                            Waiting...
                          </Button>
                        );
                      })()}
                    </div>
                  </CardBody>
                </Card>

                {/* Game Status */}
                {/* <Card className="bg-background-alt">
                  <CardBody className="p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <MdTimer className="text-primary" />
                      Game Status
                    </h3>

                    {currentGame ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Round:</span>
                          <span className="font-mono">#{currentGame.round}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Chip
                            size="sm"
                            color={
                              currentGame.status === 'betting' ? 'warning' :
                                currentGame.status === 'running' ? 'success' :
                                  'danger'
                            }
                          >
                            {currentGame.status.toUpperCase()}
                          </Chip>
                        </div>
                        <div className="flex justify-between">
                          <span>Players:</span>
                          <span>{currentGame.playerCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Bets:</span>
                          <span>{currentGame.totalBetAmount.toFixed(4)} USDT</span>
                        </div>
                        {bettingTimeLeft > 0 && (
                          <div className="flex justify-between">
                            <span>Betting Time:</span>
                            <span className="font-mono text-warning">
                              {Math.ceil(bettingTimeLeft / 1000)}s
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-400">Waiting for next game...</p>
                    )}
                  </CardBody>
                </Card> */}
              </div>

              {/* Center Panel - Game Chart */}
              <div className="col-span-1 lg:col-span-10 xl:col-span-12 2xl:col-span-8">
                <Card className="bg-background-alt border-slate-700 overflow-hidden">
                  <CardBody className="p-0 relative">
                    {/* Game Status Overlay */}
                    {currentGame && (
                      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-[90%]">


                        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-12">
                          <div className='flex flex-col'>
                            <div className="text-xs text-gray-400">Round #{currentGame.round}</div>
                          </div>

                          {(currentGame.serverSeedHash && currentGame.publicSeed) && (
                            <Popover showArrow offset={10} placement="top">
                              <PopoverTrigger>
                                <FaInfoCircle className='cursor-pointer'/>
                              </PopoverTrigger>
                              <PopoverContent className="w-[400px] bg-background-alt">
                                <div className="flex flex-col gap-1 w-full ">
                                  <div className="flex items-center justify-between w-full gap-1">
                                    <span className="text-gray-400 min-w-[150px]">Server Seed Hash:</span>
                                    <Snippet
                                      symbol=''
                                      className="w-full text-xs"
                                      classNames={{
                                        pre: "max-w-[150px]! sm:max-w-full truncate",
                                      }}
                                    >
                                      {currentGame.serverSeedHash}
                                    </Snippet>
                                  </div>
                                  <div className="flex items-center justify-between w-full gap-1">
                                    <span className="text-gray-400 min-w-[150px]">Public Seed:</span>
                                    <Snippet
                                      symbol=''
                                      className="w-full text-xs"
                                      classNames={{
                                        pre: "max-w-[150px]! sm:max-w-full truncate",
                                      }}
                                    >
                                      {currentGame.publicSeed}
                                    </Snippet>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Waiting for Game Overlay  */}
                    {!currentGame && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-20">
                        <div className="text-center pb-20">
                          <div className="text-2xl font-bold text-white mb-2">Waiting for next round...</div>
                          <div className="text-gray-400">Get ready to place your bets!</div>
                        </div>
                      </div>
                    )}

                    <div className="w-full h-[450px] block relative  rounded-lg overflow-hidden">
                      {/* Game Status Overlay */}
                      <div className="absolute top-4 right-4 z-10 flex items-center gap-4">
                        <div className="backdrop-blur-sm rounded-lg px-3 py-2">
                          <Chip
                            size="sm"
                            color={
                              currentGame?.status === 'betting' ? 'warning' :
                                currentGame?.status === 'running' ? 'success' :
                                  'danger'
                            }
                          >
                            {currentGame?.status.toUpperCase()}
                          </Chip>
                        </div>
                      </div>
                      {currentGame && currentGame.status === 'betting' ?
                        <div className='absolute flex gap-2 items-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10'>
                          <FaClock className='text-primary text-3xl' />
                          <div className='relative flex gap-2 text-primary text-4xl'>
                            <p className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-4xl font-bold animate-ping'>{Math.ceil(bettingTimeLeft / 1000)}</p>
                            <p>{Math.ceil(bettingTimeLeft / 1000)}</p>
                          </div>
                        </div>
                        :
                        <div className={`flex gap-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-4xl font-bold ${currentGame?.status === 'running' ? 'text-green-400' :
                          currentGame?.status === 'crashed' ? 'text-red-400' :
                            'text-gray-400'
                          }`}>
                          {/* {currentGame?.currentMultiplier?.toFixed(2) || '1.00'}x */}
                        </div>
                      }
                      {/* <LiveLineChartNoSnap
                        multiplierHistory={multiplierHistory}
                        elapsedTime={(() => {
                          if (!currentGame || currentGame.status === 'betting') return 0;
                          if (currentGame.startTime) {
                            return Math.max(0, (Date.now() - new Date(currentGame.startTime).getTime()) / 1000);
                          }
                          return Math.max(0, multiplierHistory.length * 0.1);
                        })()}
                        gameStatus={currentGame?.status || 'betting'}
                        /> */}
                      <CrashPixiChart
                        status={(currentGame?.status as any) || 'betting'}
                        currentMultiplier={currentGame?.currentMultiplier || 1}
                        startTime={currentGame?.startTime ? new Date(currentGame.startTime) : undefined}
                        points={chartPoints}
                        playerBets={currentGame?.playerBets || []}
                      />
                    </div>
                  </CardBody>
                </Card>

                {/* User's Bet Status */}
                {userBet && (
                  <Card className="bg-background-alt mt-6">
                    <CardBody className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm text-gray-400">Your Bet:</span>
                          <div className="font-bold">{userBet.betAmount.toFixed(3).replace(/\.?0+$/, '')} USDT</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Status:</span>
                          <div>
                            <Chip
                              size="sm"
                              color={
                                userBet.status === 'active' ? 'warning' :
                                  userBet.status === 'cashed_out' ? 'success' :
                                    'danger'
                              }
                            >
                              {userBet.status.replace('_', ' ').toUpperCase()}
                            </Chip>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Payout:</span>
                          <div className="font-bold text-success">
                            {userBet.payout.toFixed(3).replace(/\.?0+$/, '')} USDT
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>

              <div className='hidden 2xl:flex col-span-4'>
                <Card className="bg-background-alt w-full">
                  <CardBody className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <MdPeople className="text-primary" />
                        {currentGame?.playerCount || 0} Playing
                      </h3>
                      <div className="text-right">
                        <div className="font-bold text-primary text-sm">
                          {config.token} {(currentGame?.totalBetAmount || 0).toFixed(3)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-hide">
                      {currentGame?.playerBets.map((bet, index) => (
                        <div
                          key={index}
                          className={`flex justify-between items-center p-1 rounded-lg border ${bet.isCurrentUser
                            ? 'bg-primary/10 border-primary/30'
                            : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                              {bet.avatar ? (
                                <img
                                  src={bet.avatar}
                                  alt={bet.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-white">
                                  {bet.username[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-white">{bet.username}</span>
                              <span className="text-xs text-gray-400 font-mono">
                                {config.token} {bet.betAmount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            {bet.status === 'cashed_out' && bet.cashoutMultiplier ? (
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-green-400">CASHED OUT</span>
                                <span className="text-xs text-green-300 font-mono">
                                  {config.token} {(bet.payout || bet.betAmount * (bet.cashoutMultiplier || 0)).toFixed(2)}
                                </span>
                              </div>
                            ) : bet.status === 'active' && currentGame?.status === 'running' ? (
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-yellow-400">PLAYING</span>
                                <span className="text-xs text-gray-400">
                                  Active
                                </span>
                              </div>
                            ) : bet.status === 'active' && currentGame?.status === 'betting' ? (
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-blue-400">JOINED</span>
                                <span className="text-xs text-gray-400">
                                  Waiting
                                </span>
                              </div>
                            ) : bet.status === 'lost' ? (
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-red-400">CRASHED</span>
                                <span className="text-xs text-red-300">
                                  Lost
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-blue-400">JOINED</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </div>

            </div>
            {/* Right Panel - Players & History */}
            <div className="lg:col-span-3 space-y-6">
              {/* Current Players */}
              <Card className="bg-background-alt flex 2xl:hidden">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <MdPeople className="text-primary" />
                      {currentGame?.playerCount || 0} Playing
                    </h3>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Total Bet</div>
                      <div className="text-lg font-bold text-primary">
                        {config.token} {(currentGame?.totalBetAmount || 0).toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-hide">
                    {currentGame?.playerBets.map((bet, index) => (
                      <div
                        key={index}
                        className={`flex justify-between items-center p-3 rounded-lg border ${bet.isCurrentUser
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            {bet.avatar ? (
                              <img
                                src={bet.avatar}
                                alt={bet.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-white">
                                {bet.username[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">{bet.username}</span>
                            <span className="text-xs text-gray-400 font-mono">
                              {config.token} {bet.betAmount.toFixed(4)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {bet.status === 'cashed_out' && bet.cashoutMultiplier ? (
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-green-400">CASHED OUT</span>
                              <span className="text-xs text-green-300 font-mono">
                                {config.token} {(bet.payout || bet.betAmount * (bet.cashoutMultiplier || 0)).toFixed(2)}
                              </span>
                            </div>
                          ) : bet.status === 'active' && currentGame?.status === 'running' ? (
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-yellow-400">PLAYING</span>
                              <span className="text-xs text-gray-400">
                                Active
                              </span>
                            </div>
                          ) : bet.status === 'active' && currentGame?.status === 'betting' ? (
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-blue-400">JOINED</span>
                              <span className="text-xs text-gray-400">
                                Waiting
                              </span>
                            </div>
                          ) : bet.status === 'lost' ? (
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-red-400">CRASHED</span>
                              <span className="text-xs text-red-300">
                                Lost
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end">
                              <span className="text-sm font-bold text-blue-400">JOINED</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Bottom Section - Crash History */}
            <div className="bg-background-alt backdrop-blur-sm rounded-2xl p-2 sm:p-6 border border-gray-700/50 my-8">
              <h3 className="text-white/20 font-bold text-xl mb-6">CRASH GAME HISTORY</h3>
              {user.isAuthenticated ? <CrashHistory />
                :
                <div className='flex flex-col gap-2'>
                  <p className="text-white/20 mb-8 max-w-2xl mx-auto">
                    Please login to view your crash game history.
                  </p>
                </div>
              }
            </div>

            {/* Call to Action */}
            <div className="text-center bg-gradient-to-r from-primary/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-12 border border-gray-700/50">
              <h2 className="text-3xl font-bold text-green-400 mb-4">READY TO START CRASHING?</h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of players already earning rewards. Place your bets today and start earning.
              </p>
              <PrimaryButton
                className="bg-primary  text-background font-bold py-4 px-8 rounded-full"
                onClick={() => {
                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                  })
                }}
              >
                Place Bet Now
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </GameStatusWrapper >
  )
}