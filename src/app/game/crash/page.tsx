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
import CrashHistory from '@/components/table/CrashHistory'
import { FaCashRegister, FaCircle, FaClock, FaInfo, FaPause, FaPlay, FaWifi } from 'react-icons/fa6'
import config from '@/lib/config'
import { useGameSettings } from '@/contexts/GameSettingsContext'
import { FaHistory, FaInfoCircle } from 'react-icons/fa'
import { gameApi } from '@/lib/api'
import CrashPixiChart from '@/components/Chart/CrashPixiChart'
import CrashHistoryModal from '@/components/modals/CrashHistoryModal'
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

interface PastResult {
  roundId: string;
  round: number;
  crashPoint: number;
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
  const [pastResults, setPastResults] = useState<PastResult[]>([])
  const [newestRoundId, setNewestRoundId] = useState<string | null>(null)
  const [removingRoundId, setRemovingRoundId] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const pastResultsRef = useRef<PastResult[]>([])
  const [multiplierHistory, setMultiplierHistory] = useState<number[]>([])
  const [chartPoints, setChartPoints] = useState<{ t: number; m: number }[]>([])

  // Time sync state
  const clockOffsetRef = useRef<number>(0) // Server time - local time offset
  const crashMultiplierRef = useRef<number | null>(null) // Store crash multiplier when crashed
  const lastTimeSyncRef = useRef<number | null>(null) // Last time sync received timestamp
  const [isConnectionLost, setIsConnectionLost] = useState(false) // Connection lost state

  // Betting state
  const [betAmount, setBetAmount] = useState(1.0)
  const [autoCashoutMultiplier, setAutoCashoutMultiplier] = useState(2.0)

  // Calculate winning chance percentage based on auto cashout multiplier
  // Formula: 99 / multiplier (chance of reaching that multiplier before crash)
  // Examples: 1.01 → 98.02%, 2 → 49.5%, 10 → 9.9%, 100 → 0.99%
  const winningChance = autoCashoutMultiplier > 0
    ? (99 / autoCashoutMultiplier).toFixed(2)
    : '0.00'
  const [userBet, setUserBet] = useState<PlayerBet | null>(null)

  // UI state
  const [isPlacingBet, setIsPlacingBet] = useState(false)
  const [isCashingOut, setIsCashingOut] = useState(false)
  const [showProvableFair, setShowProvableFair] = useState(false)
  const [bettingTimeLeft, setBettingTimeLeft] = useState(20000)
  const [bettingEndAt, setBettingEndAt] = useState<number | null>(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  // Chart canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

  const [isStarted, setIsStarted] = useState(false)
  const [stats, setStats] = useState<{ numberPoints: number; fps: number }>({ numberPoints: 0, fps: 0 })

  const { settings } = useGameSettings();

  // Load initial past results on mount
  useEffect(() => {
    const loadInitialHistory = async () => {
      try {
        const response = await gameApi.crash.getRecentHistory({ limit: 12 })
        if (response.success && response.data) {
          // Ensure oldest is on the left and newest is on the right
          const results = response.data.data as PastResult[]
          setPastResults(results.slice().reverse())
        }
      } catch (error) {
        console.error('Failed to load recent crash history:', error)
      }
    }
    loadInitialHistory()
  }, [])

  // Ensure autoCashoutMultiplier never goes below 1.01
  useEffect(() => {
    if (autoCashoutMultiplier < 1.01) {
      setAutoCashoutMultiplier(1.01)
    }
  }, [autoCashoutMultiplier])

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
      // Reset connection monitoring for new game
      lastTimeSyncRef.current = null
      setIsConnectionLost(false)
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
    }

    const handleBettingEnded = (data: any) => {
      console.log('🚀 Betting ended:', data)
      setBettingTimeLeft(0)
      setBettingEndAt(null)
      // Reset connection monitoring when game starts running
      lastTimeSyncRef.current = Date.now()
      setIsConnectionLost(false)
      if (currentGame) {
        setCurrentGame(prev => prev ? {
          ...prev,
          status: 'running',
          playerCount: data.playerCount,
          totalBetAmount: data.totalBetAmount,
          startTime: new Date() // Set the actual game start time
        } : null)
      }
      // Chart will start automatically when status changes to 'running'
    }

    // Calculate multiplier locally using formula: M(t) = 1 + A * t^{B(t)}
    const calculateMultiplier = (elapsedSeconds: number): number => {
      if (elapsedSeconds <= 0) return 1
      const A = 0.02
      const B0 = 1.5
      const B_GROWTH = 0.01
      const MAX_B = 3.0
      const dynamicB = Math.min(MAX_B, B0 + B_GROWTH * elapsedSeconds)
      const multiplier = 1 + A * Math.pow(elapsedSeconds, dynamicB)
      // Safety limit: prevent unlimited growth (cap at reasonable max, e.g., 1000x)
      const MAX_SAFE_MULTIPLIER = 1000
      return Math.min(multiplier, MAX_SAFE_MULTIPLIER)
    }

    // Handle round state (includes startTime, serverTime, status, crashMultiplier)
    const handleRoundState = (data: any) => {
      console.log('📊 Round state:', data)
      if (!data.roundId || !currentGame || String(currentGame.roundId) !== String(data.roundId)) {
        return
      }

      // Update clock offset: serverTime - localTime
      if (data.serverTime) {
        const serverTime = typeof data.serverTime === 'number' ? data.serverTime : new Date(data.serverTime).getTime()
        const localTime = Date.now()
        const drift = serverTime - localTime
        // Smooth correction: 10% adjustment
        clockOffsetRef.current = clockOffsetRef.current * 0.9 + drift * 0.1
      }

      // Update game state - only update status if it's a valid transition
      if (data.status) {
        setCurrentGame(prev => {
          if (!prev) return null

          // Don't update status if current status is 'running' and new status is 'crashed' without crashMultiplier
          // This prevents stale 'crashed' events from overwriting a running game
          if (prev.status === 'running' && data.status === 'crashed' && !data.crashMultiplier) {
            console.warn('⚠️ Ignoring crashed status without crashMultiplier while game is running')
            return prev
          }

          // If server flips to 'ended' after crash, keep showing last crash multiplier until next round resets in 'betting'
          if (data.status === 'ended' && crashMultiplierRef.current !== null) {
            return { ...prev, status: 'ended', currentMultiplier: crashMultiplierRef.current }
          }

          // Only update status if it's different (prevents unnecessary updates)
          if (prev.status !== data.status) {
            console.log(`📊 Status update: ${prev.status} -> ${data.status}`)
            return { ...prev, status: data.status }
          }

          return prev
        })
      }

      // Store crash multiplier when crashed - this should always update when crashed
      if (data.status === 'crashed' && data.crashMultiplier !== undefined) {
        crashMultiplierRef.current = data.crashMultiplier
        setCurrentGame(prev => prev ? {
          ...prev,
          status: 'crashed',
          currentMultiplier: data.crashMultiplier
        } : null)
      }

      // Update startTime if provided
      if (data.startTime) {
        setCurrentGame(prev => prev ? {
          ...prev,
          startTime: new Date(data.startTime)
        } : null)
      }
    }

    // Handle time sync (minimal packet: just serverTime as number)
    const handleTimeSync = (serverTime: number) => {
      // Only process if we have an active running game
      if (!currentGame || currentGame.status !== 'running') {
        return
      }

      // Update last sync time for connection monitoring
      lastTimeSyncRef.current = Date.now()
      setIsConnectionLost(false)

      // Update clock offset for time synchronization
      const localTime = Date.now()
      const drift = serverTime - localTime
      // Smooth correction: 10% adjustment to prevent sudden jumps
      clockOffsetRef.current = clockOffsetRef.current * 0.9 + drift * 0.1
    }

    // Legacy handler - can be removed after migration
    const handleMultiplierUpdate = (data: any) => {
      // No longer used - multiplier is calculated locally
      if (currentGame?.roundId === data.roundId) {
        // Only update multiplier text (chart draws locally)
        setCurrentGame(prev => prev ? {
          ...prev,
          currentMultiplier: data.multiplier
        } : null)
      }
    }

    const handlePlayerJoined = (data: any) => {
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

      // Compare roundId as strings to handle ObjectId vs string mismatch
      const roundIdMatches = String(currentGame?.roundId) === String(data.roundId)

      if (roundIdMatches) {
        const currentUsername = user.profile?.username || user.profile?.displayName || 'You'
        const eventUsername = data.player.username
        const isCurrentUser = eventUsername === currentUsername ||
          eventUsername === user.profile?.displayName ||
          eventUsername === user.profile?.username

        // Update player list
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

        // If it's the current user (auto cashout), update userBet state and show success modal
        if (isCurrentUser) {
          // Get bet amount from userBet, player list, or from player data
          const betAmount = userBet?.betAmount ||
            currentGame?.playerBets.find(b => b.username === eventUsername)?.betAmount ||
            data.player.betAmount

          // Calculate earnings: (multiplier - 1.0) * betAmount
          const earnings = ((data.player.cashoutMultiplier - 1.0) * betAmount)


          // Show success modal
          showSuccessModal({
            title: 'Auto Cashed Out!',
            message: `You automatically cashed out at ${data.player.cashoutMultiplier.toFixed(2)}x for +${earnings.toFixed(3).replace(/\.?0+$/, '')} tokens!`
          })

          // Update user bet state - always update if it's the current user
          setUserBet(prev => {
            // If we have an active bet, update it
            if (prev && (prev.status === 'active' || prev.status === 'cashed_out')) {
              return {
                ...prev,
                status: 'cashed_out',
                payout: data.player.payout,
                cashoutMultiplier: data.player.cashoutMultiplier
              }
            } else {
              // If userBet was null or doesn't exist, create it from player data
              return {
                username: currentUsername,
                betAmount: betAmount,
                status: 'cashed_out',
                payout: data.player.payout,
                cashoutMultiplier: data.player.cashoutMultiplier,
                isCurrentUser: true
              } as PlayerBet
            }
          })
        } else {
          console.log('💰 Not current user, skipping userBet update')
        }
      } else {
        console.log('💰 RoundId mismatch, ignoring event')
      }
    }

    const handleGameCrashed = (data: any) => {
      // Compare roundId as strings to handle ObjectId vs string mismatch
      const roundIdMatches = String(currentGame?.roundId) === String(data.roundId)
      if (roundIdMatches) {
        // Persist crash multiplier so UI/chart can keep showing it during the 3s clear delay
        if (typeof data.crashPoint === 'number') {
          crashMultiplierRef.current = data.crashPoint
        }

        setCurrentGame(prev => prev ? {
          ...prev,
          status: 'crashed',
          currentMultiplier: typeof data.crashPoint === 'number' ? data.crashPoint : prev.currentMultiplier
        } : null)

        // Mark remaining active bets as lost
        setCurrentGame(prev => {
          if (!prev) return null
          const updatedBets = prev.playerBets.map(bet =>
            bet.status === 'active' ? { ...bet, status: 'lost' as const } : bet
          )
          return { ...prev, playerBets: updatedBets }
        })

        // Chart will handle crash point automatically
      }
    }

    const handleGameEnded = (data: any) => {
      // Refresh history
      emit('crash_get_history', { limit: 10 })
    }

    const handleCurrentGame = (data: any) => {
      // Update clock offset if serverTime is provided
      if (data.serverTime) {
        const serverTime = typeof data.serverTime === 'number' ? data.serverTime : new Date(data.serverTime).getTime()
        const localTime = Date.now()
        clockOffsetRef.current = serverTime - localTime
      }

      setCurrentGame({
        roundId: data.roundId,
        round: data.round,
        status: data.status,
        currentMultiplier: data.currentMultiplier || 1, // Keep for backward compatibility
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
      // Reset connection monitoring
      lastTimeSyncRef.current = null
      setIsConnectionLost(false)
      setCurrentGame(null)
      setUserBet(null)
      // Chart will reset automatically when new game starts
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

    const handleRoundResult = (data: any) => {
      // Add new round result to past results (prepend, keep max 6 items)
      setPastResults(prev => {
        const newResult: PastResult = {
          roundId: data.roundId,
          round: data.round,
          crashPoint: data.crashPoint
        }
        // Track which item will be removed (if we have 6 items, the first one will be removed)
        const itemToRemove = prev.length >= 12 ? prev[0] : null
        if (itemToRemove) {
          setRemovingRoundId(itemToRemove.roundId)
          // Clear removing state after animation
          setTimeout(() => setRemovingRoundId(null), 500)
        }
        // Mark new item for animation
        setNewestRoundId(data.roundId)
        setIsAnimating(true)
        // Clear animation states after animation completes
        setTimeout(() => {
          setNewestRoundId(null)
          setIsAnimating(false)
        }, 500)
        // Store previous state for comparison
        pastResultsRef.current = prev
        // Append new result and keep only last 6 (oldest on left, newest on right)
        const updated = [...prev, newResult]
        return updated.length > 12 ? updated.slice(updated.length - 12) : updated
      })
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
    on('crash_round_result', handleRoundResult)
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
      off('crash_round_state', handleRoundState)
      off('crash_time_sync', handleTimeSync)
      off('crash_multiplier_update', handleMultiplierUpdate)
      off('crash_player_joined', handlePlayerJoined)
      off('crash_player_cashed_out', handlePlayerCashedOut)
      off('crash_game_crashed', handleGameCrashed)
      off('crash_game_ended', handleGameEnded)
      off('crash_round_result', handleRoundResult)
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

  // Connection monitoring - check if time sync is still coming
  useEffect(() => {
    // Only monitor during running game
    if (currentGame?.status !== 'running') {
      setIsConnectionLost(false)
      return
    }

    const checkInterval = setInterval(() => {
      if (!lastTimeSyncRef.current) {
        // No sync received yet, wait a bit longer (but not forever)
        // If game is running and no sync received after 5 seconds, show connection lost
        if (currentGame?.status === 'running') {
          const timeSinceGameStart = currentGame.startTime ? Date.now() - new Date(currentGame.startTime).getTime() : 0
          if (timeSinceGameStart > 5000) {
            setIsConnectionLost(true)
          }
        }
        return
      }

      const timeSinceLastSync = Date.now() - lastTimeSyncRef.current
      // If no sync received for 3 seconds, consider connection lost
      if (timeSinceLastSync > 3000) {
        setIsConnectionLost(true)
        console.warn('⚠️ Connection lost: No time sync received for', timeSinceLastSync, 'ms')
      }
    }, 500) // Check every 500ms

    return () => clearInterval(checkInterval)
  }, [currentGame?.status, currentGame?.roundId])

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
    const segments = 80 // Increased for smoother curve

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
      autoCashoutMultiplier: autoCashoutMultiplier
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

  const handleAutoCashoutMultiplierChange = (value: number) => {
    // Ensure value never goes below 1.01
    const clampedValue = Math.max(1.01, value)
    if (clampedValue !== value) {
      // Value was below minimum, set to 1.01
      setAutoCashoutMultiplier(1.01)
    } else {
      setAutoCashoutMultiplier(clampedValue)
    }
  }

  // Helper function to clamp bet amount within min/max limits
  const clampBetAmount = (value: number): number => {
    const minBet = settings?.games?.crash?.minBet || 0.001
    const maxBet = settings?.games?.crash?.maxBet || 1000
    return Math.max(minBet, Math.min(maxBet, value))
  }

  // Bet amount control handlers
  const handleAddAmount = (amount: number) => {
    const newAmount = clampBetAmount(betAmount + amount)
    setBetAmount(newAmount)
  }

  const handleMultiplyAmount = (multiplier: number) => {
    const newAmount = clampBetAmount(betAmount * multiplier)
    setBetAmount(newAmount)
  }

  const handleSetMaxBet = () => {
    const maxBet = settings?.games?.crash?.maxBet || 1000
    setBetAmount(maxBet)
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
              {/* Center Panel - Game Chart */}
              <div className="col-span-16 xl:col-span-12">
                <div className='flex flex-col gap-4'>
                  <Card className='bg-background-alt'>
                    <CardBody>
                      {/* Past Results Display */}
                      {pastResults.length > 0 && (
                        <div className="px-4 pt-4 pb-2 flex gap-2 items-center">
                          <div className="flex items-center justify-end flex-1 gap-2 overflow-hidden relative">
                            {pastResults.map((result, index) => {
                              const isHigh = result.crashPoint >= 10.0
                              const isMedium = result.crashPoint >= 2.0
                              const isNew = result.roundId === newestRoundId
                              const isRemoving = result.roundId === removingRoundId
                              const wasInPrevious = pastResultsRef.current.some(r => r.roundId === result.roundId)
                              const isShifting = !isNew && !isRemoving && wasInPrevious && isAnimating
                              return (
                                <div
                                  key={result.roundId}
                                  className={`w-20 flex items-center gap-2 px-2 py-1 rounded-lg text-xs whitespace-nowrap flex-shrink-0
                                    ${isHigh ? 'bg-yellow-500/10' : isMedium ? 'bg-green-500/10' : 'bg-red-500/10'}
                                    ${isHigh ? 'text-yellow-500' : isMedium ? 'text-green-500' : 'text-red-500'}
                                    ${isNew ? 'animate-[slideInRight_0.5s_ease-out]' : ''}
                                    ${isRemoving ? 'animate-[slideOutLeft_0.5s_ease-out]' : ''}
                                    ${isShifting ? 'animate-[shiftLeft_0.5s_ease-out]' : ''}
                                  `}
                                >
                                  <FaCircle className={`text-[10px] ${isHigh ? 'text-yellow-500' : isMedium ? 'text-green-500' : 'text-red-500'}`} />
                                  <div className='flex flex-col'>
                                    <span className="text-gray-400">{result.round}</span>
                                    <span className="text-sm font-semibold">{result.crashPoint.toFixed(2)}x</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          <div className='shrink-0'>
                            <Button
                              className='h-[45px] min-w-[45px] bg-background-alt border-primary/10 border text-primary'
                              onPress={() => setIsHistoryModalOpen(true)}
                            >
                              <FaHistory />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardBody>
                  </Card>
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
                                  <FaInfoCircle className='cursor-pointer' />
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
                        {/* Connection Lost Overlay */}
                        {isConnectionLost && currentGame?.status === 'running' && currentGame.currentMultiplier > 100 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-30">
                            <div className="text-center">
                              <FaWifi className="text-6xl text-red-500 mx-auto mb-4 animate-pulse" />
                              <div className="text-2xl font-bold text-white mb-2">Connection Lost</div>
                              <div className="text-gray-400">Reconnecting to server...</div>
                              <div className="text-sm text-gray-500 mt-2">The chart will resume when connection is restored</div>
                            </div>
                          </div>
                        )}
                        
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
                        {currentGame && currentGame.status === 'betting' && (
                          <div className='absolute flex gap-2 items-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10'>
                            <FaClock className='text-primary text-3xl' />
                            <div className='relative flex gap-2 text-primary text-4xl'>
                              <p className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-4xl font-bold animate-ping'>{Math.ceil(bettingTimeLeft / 1000)}</p>
                              <p>{Math.ceil(bettingTimeLeft / 1000)}</p>
                            </div>
                          </div>
                        ) }
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
                          startTime={currentGame?.startTime ? new Date(currentGame.startTime) : undefined}
                          crashMultiplier={crashMultiplierRef.current}
                          playerBets={currentGame?.playerBets || []}
                        />
                      </div>
                    </CardBody>
                  </Card>
                  <Card className="bg-background-alt w-full">
                    <CardBody className="p-6">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <MdAttachMoney className="text-primary" />
                        Place Bet
                      </h3>

                      <div className="space-y-4 flex flex-col md:flex-col-reverse gap-4">
                        <div className='flex flex-col md:flex-row gap-4'>
                          <div className='flex flex-col gap-2 w-full'>
                            <div className='flex gap-2 justify-between text-xs text-white/50'>
                              <span>Min Bet: {settings?.games?.crash?.minBet || 0.001}</span>
                              <span>Max Bet: {settings?.games?.crash?.maxBet || 1000} </span>
                            </div>
                            <NumberInput
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
                            {/* Bet Amount Control Buttons */}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="flat"
                                className="flex-1 min-w-[60px] bg-background hover:bg-background/80 text-white"
                                onPress={() => handleAddAmount(0.01)}
                                isDisabled={!canPlaceBet}
                              >
                                +0.01
                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                className="flex-1 min-w-[60px] bg-background hover:bg-background/80 text-white"
                                onPress={() => handleAddAmount(0.1)}
                                isDisabled={!canPlaceBet}
                              >
                                +0.1
                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                className="flex-1 min-w-[60px] bg-background hover:bg-background/80 text-white"
                                onPress={() => handleMultiplyAmount(0.5)}
                                isDisabled={!canPlaceBet}
                              >
                                1/2
                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                className="flex-1 min-w-[60px] bg-background hover:bg-background/80 text-white"
                                onPress={() => handleMultiplyAmount(2)}
                                isDisabled={!canPlaceBet}
                              >
                                ×2
                              </Button>
                              {/* <Button
                                size="sm"
                                variant="flat"
                                className="flex-1 min-w-[60px] bg-background hover:bg-background/80 text-white"
                                onPress={handleSetMaxBet}
                                isDisabled={!canPlaceBet}
                              >
                                MAX
                              </Button> */}
                            </div>

                          </div>
                          <div className="flex flex-col gap-2 w-full">
                            <div className='flex justify-between w-full text-xs text-white/50'>
                              <p>Auto cash out</p>
                              <p>Chance {winningChance}%</p>
                            </div>
                            <NumberInput
                              value={autoCashoutMultiplier}
                              onValueChange={handleAutoCashoutMultiplierChange}
                              min={1.01}
                              max={1000}
                              step={0.01}
                              placeholder="2.00"
                              endContent="x"
                              classNames={{
                                inputWrapper: "bg-background! rounded-lg"
                              }}
                              isDisabled={!canPlaceBet}
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="flat"
                                className="flex-1 min-w-[60px] bg-background hover:bg-background/80 text-white"
                                onPress={() => handleAutoCashoutMultiplierChange(1.01)}
                                isDisabled={!canPlaceBet}
                              >
                                1.01
                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                className="flex-1 min-w-[60px] bg-background hover:bg-background/80 text-white"
                                onPress={() => handleAutoCashoutMultiplierChange(2)}
                                isDisabled={!canPlaceBet}
                              >
                                2
                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                className="flex-1 min-w-[60px] bg-background hover:bg-background/80 text-white"
                                onPress={() => handleAutoCashoutMultiplierChange(10)}
                                isDisabled={!canPlaceBet}
                              >
                                10
                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                className="flex-1 min-w-[60px] bg-background hover:bg-background/80 text-white"
                                onPress={() => handleAutoCashoutMultiplierChange(100)}
                                isDisabled={!canPlaceBet}
                              >
                                100
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Dynamic Action Button */}
                        <div className='flex items-center justify-center'>
                          {(() => {
                            // User has active bet and can cash out
                            if (canCashOut) {
                              return (
                                <Button
                                  onPress={cashOut}
                                  variant="solid"
                                  className="w-full max-w-xs mx-auto font-semibold rounded-full bg-primary text-background"
                                  isLoading={isCashingOut}
                                  startContent={<FaCashRegister />}
                                >
                                  {isCashingOut ? 'Cashing Out...' : (() => {
                                    // Calculate current multiplier locally for accurate display
                                    let currentMult = 1
                                    if (currentGame?.startTime && currentGame.status === 'running') {
                                      const elapsed = Math.max(0, (Date.now() - new Date(currentGame.startTime).getTime() + (clockOffsetRef.current || 0)) / 1000)
                                      // Use same formula as calculateMultiplier function
                                      if (elapsed > 0) {
                                        const A = 0.02
                                        const B0 = 1.5
                                        const B_GROWTH = 0.01
                                        const MAX_B = 3.0
                                        const dynamicB = Math.min(MAX_B, B0 + B_GROWTH * elapsed)
                                        const multiplier = 1 + A * Math.pow(elapsed, dynamicB)
                                        const MAX_SAFE_MULTIPLIER = 1000
                                        currentMult = Math.min(multiplier, MAX_SAFE_MULTIPLIER)
                                      }
                                    } else {
                                      currentMult = currentGame?.currentMultiplier || 1
                                    }
                                    const expectedPayout = (currentMult - 1.0) * userBet.betAmount
                                    return `Cash Out +${expectedPayout.toFixed(2)}`
                                  })()}
                                </Button>
                              );
                            }

                            // User can place bet (betting phase, no active bet)
                            if (canPlaceBet) {
                              return (
                                <PrimaryButton
                                  onClick={placeBet}
                                  disabled={isPlacingBet}
                                  className="w-full max-w-xs mx-auto bg-primary text-background font-semibold"
                                  isLoading={isPlacingBet}
                                >
                                  <FaPlay />
                                  {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
                                </PrimaryButton>
                              );
                            }

                            // User has bet but already cashed out or lost (check this before other statuses)
                            if (userBet && (userBet.status === 'cashed_out' || userBet.status === 'lost')) {
                              return (
                                <Button
                                  variant="flat"
                                  className={`w-full max-w-xs mx-auto text-background font-bold ${userBet.status === 'cashed_out' ? 'bg-primary' : 'bg-danger'} rounded-full`}
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

                            // User has bet but game is not running yet (waiting for game to start)
                            if (userBet && currentGame?.status === 'betting') {
                              return (
                                <PrimaryButton
                                  className="w-full max-w-xs mx-auto font-bold rounded-full"
                                  disabled={true}
                                >
                                  <MdTimer />
                                  Waiting...
                                </PrimaryButton>
                              );
                            }

                            // Game is running but user didn't join
                            if (currentGame?.status === 'running') {
                              return (
                                <Button
                                  variant="flat"
                                  className="w-full max-w-xs mx-auto font-bold rounded-full"
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
                                className="w-full max-w-xs mx-auto font-bold rounded-full"
                                isDisabled={true}
                              >
                                <MdTimer />
                                Waiting...
                              </Button>
                            );
                          })()}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                  {/* User's Bet Status */}
                  {userBet && (
                    <Card className="bg-background-alt mt-6 hidden">
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
              </div>

              <div className='hidden xl:flex col-span-4'>
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

                    <div className="space-y-1 max-h-100 overflow-y-auto scrollbar-hide">
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
                                  +{config.token} {((bet.cashoutMultiplier - 1.0) * bet.betAmount).toFixed(2)}
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

      {/* Crash History Modal */}
      <CrashHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </GameStatusWrapper >
  )
}