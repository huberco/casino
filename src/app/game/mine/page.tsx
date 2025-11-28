'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWebSocket } from '@/contexts/socketContext'
import { useAuth } from '@/contexts/AuthContext'
import { useModalType } from '@/contexts/modalContext'
import { useGamePageTracking } from '@/hooks/useGamePageTracking'
import PrimaryButton from '@/components/ui/PrimaryButton'
import GameStatusWrapper from '@/components/GameStatusWrapper'
import ErrorModal from '@/components/modals/ErrorModal'
import { gameApi } from '@/lib/api'
import {
  FaPlay,
  FaGem,
  FaBomb,
  FaArrowUp,
  FaArrowDown,
  FaCoins,
  FaCashRegister,
  FaRegGem,
  FaGift,
  FaSketch,
  FaO,
  FaScreenpal
} from 'react-icons/fa6'
import { Button, Input, NumberInput, Select, SelectItem, Slider, Snippet } from '@heroui/react'
import TokenSelector from '@/components/ui/TokenSelector'
import MineHistory from '@/components/table/MineHistory'
import MineResumeModal from '@/components/modals/MineResumeModal'


interface MineGame {
  betAmount: number
  currentMultiplier: number
  nextMultiplier: number
  gridSize: number
  id: string
  numMines: number
  revealedTiles: number[]
  mineTiles?: number[]
  serverSeedHash: string
  status: string
  type?: 'win' | 'lose'
  amount?: number
  createdAt: Date
  updatedAt: Date
}
interface GameHistory {
  id: string
  multiplier: number
  isWin: boolean
  timestamp: string
  gridSize: string
  mineCount: number
  amount: number
  gemsFound: number
  totalGems: number
}

interface LeaderboardEntry {
  rank: number
  username: string
  avatar: string
  miningPower: string
  reward: string
  trade: string
}

type GameState = 'not_started' | 'playing' | 'game_over'
type CellState = 'hidden' | 'revealed' | 'mine' | 'gem'

interface Cell {
  id: number
  state: CellState
  isMine: boolean
  isGem: boolean
}

export default function MinePage() {
  const { isConnected, emit, on, off } = useWebSocket()
  const { user, updateBalance } = useAuth()
  const { showModal: showSuccessModal } = useModalType('success')
  const { showModal: showErrorModal } = useModalType('error')

  // Track when user visits this game page
  useGamePageTracking({ gameType: 'mine' })

  // Game state
  const [gameState, setGameState] = useState<GameState>('not_started')
  const [mineCount, setMineCount] = useState(3)
  const [wagerAmount, setWagerAmount] = useState(10)
  const [currentMultiplier, setCurrentMultiplier] = useState(1.00)
  const [gemsFound, setGemsFound] = useState(0)
  const [totalGems, setTotalGems] = useState(22) // 25 - mineCount
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [grid, setGrid] = useState<Cell[]>([])
  const [gameResult, setGameResult] = useState<MineGame | null>(null)
  const [gameId, setGameId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showResult, setShowResult] = useState(true)
  const [loading, setLoading] = useState(false)
  const [isStartingGame, setIsStartingGame] = useState(false)
  const [isCashingOut, setIsCashingOut] = useState(false)
  const [isRevealingTile, setIsRevealingTile] = useState(false)
  const [showResumeModal, setShowResumeModal] = useState(false)



  // Generate game grid
  const generateGrid = useCallback((mines: number) => {
    const totalCells = 25 // 5x5 grid
    const gems = totalCells - mines

    // Create array of all cell indices
    const cellIndices = Array.from({ length: totalCells }, (_, i) => i)

    // Randomly select mine positions
    const minePositions = cellIndices.sort(() => 0.5 - Math.random()).slice(0, mines)

    // Create grid
    const newGrid: Cell[] = cellIndices.map((index) => ({
      id: index,
      state: 'hidden',
      isMine: minePositions.includes(index),
      isGem: !minePositions.includes(index)
    }))

    return newGrid
  }, [])





  // Resume a game
  const resumeGame = async (gameId: string) => {
    try {
      setIsLoading(true)
      setLoading(true)

      // Emit resume game event
      emit('mine_resume_game', { gameId })

      setShowResumeModal(false)
    } catch (error) {
      console.error('Failed to resume game:', error)
      setIsLoading(false)
      setLoading(false)
    }
  }



  const startGame = async () => {
    if (!user.isAuthenticated) {
      showErrorModal({
        title: 'Authentication Required',
        message: 'Please login to play',
        onClose: () => {
          setIsStartingGame(false)
          setIsLoading(false)
          setLoading(false)
        }
      })
      return
    }

    // Check if user has enough balance
    if (user.profile?.balance !== undefined && user.profile.balance < wagerAmount) {
      showErrorModal({
        title: 'Insufficient Balance',
        message: `You need ${wagerAmount} but only have ${user.profile.balance.toFixed(2).replace(/\.?0+$/, '')}`,
        onClose: () => {
          setIsStartingGame(false)
          setIsLoading(false)
          setLoading(false)
        }
      })
      return
    }

    // Prevent multiple clicks
    if (isStartingGame) return

    setIsStartingGame(true)
    setIsLoading(true)
    setLoading(true)

    try {
      // Use WebSocket to create mine game instead of HTTP API
      emit('mine_start_game', {
        numMines: mineCount,
        betAmount: wagerAmount
      })
    } catch (error) {
      console.error('Failed to start game:', error)
      setIsStartingGame(false)
      setIsLoading(false)
      setLoading(false)
    }
  }

  // Cash out
  const cashOut = async () => {
    if (!gameId || gameState !== 'playing') return

    // Prevent cash out if no gems found
    if (gemsFound === 0) {
      showErrorModal({
        title: 'No Gems Found',
        message: 'You must find at least one gem before cashing out!',
        onClose: () => {
          setIsCashingOut(false)
          setIsLoading(false)
          setLoading(false)
        }
      })
      return
    }

    // Prevent multiple clicks
    if (isCashingOut) return

    setIsCashingOut(true)
    setIsLoading(true)
    setLoading(true)

    try {
      const winAmount = wagerAmount * currentMultiplier

      setGameState('playing')

      // Emit cash out event
      if (isConnected) {
        console.log('💰 Cashing out with gameId:', gameId)
        emit('mine_cash_out', {
          gameId,
          multiplier: currentMultiplier,
          amount: winAmount,
          gemsFound
        })
      }

      setGameState('game_over')
    } catch (error) {
      console.error('Failed to cash out:', error)
      setIsCashingOut(false)
      setIsLoading(false)
      setLoading(false)
    }
  }

  // Handle cell click
  const handleCellClick = async (cellId: number) => {
    // Prevent multiple tile selections
    if (isRevealingTile) return

    setIsRevealingTile(true)
    setIsLoading(true)

    try {
      console.log('🎯 Revealing cell with gameId:', gameId)
      emit('mine_reveal_cell', {
        gameId,
        cellId
      })
    } catch (error) {
      console.error('Failed to handle cell click:', error)
      setIsRevealingTile(false)
      setIsLoading(false)
    }
    // Note: Don't reset loading state here - wait for server response
  }

  const resetGame = () => {
    setGameState('not_started')
    setGameResult(null)
    setGameId(null)
    setCurrentMultiplier(1.0)
    setGemsFound(0)
    setIsRevealingTile(false)
  }

  // WebSocket event listeners
  useEffect(() => {
    if (!isConnected) return

    const handleMineGameStarted = (data: any) => {
      console.log('Mine game started:', data)
      if (data.gameState) {
        setGameResult(data.gameState)
        setGameId(data.gameId)
        setGameState('playing')
        setIsLoading(false)
        setLoading(false)
        setIsStartingGame(false) // Reset start game loading state
      }
      // Request balance update after game starts (bet is placed)
      console.log('💰 Requesting balance update after game start')
      emit('request_balance_update', {})
    }

    const handleMineGemFound = (data: any) => {
      console.log('Gem found:', data)
      if (data.success && data.gameState) {
        // Update game state with revealed tiles and multiplier
        setGameResult(data.gameState)
        setCurrentMultiplier(data.multiplier)
        setGemsFound(data.revealedTiles.length)
        setIsLoading(false)
        setIsRevealingTile(false) // Reset tile selection state
      }
    }

    const handleMineHit = (data: any) => {
      console.log('Mine hit:', data)
      if (!data.success && data.gameState) {
        // Game lost - show error modal with full result
        setGameResult({
          ...data.gameState,
          type: 'lose',
          amount: wagerAmount
        })
        setGameState('game_over')
        setShowResult(true)
        setIsLoading(false)
        setIsRevealingTile(false) // Reset tile selection state

        // Request balance update after hitting a mine (game lost)
        console.log('💰 Requesting balance update after mine hit')
        emit('request_balance_update', {})

        // showErrorModal({
        //   title: 'BOOM!',
        //   message: `You hit a mine! Lost ${wagerAmount.toFixed(2)} NEXUS`,
        //   onClose: () => {
        //     setGameState('not_started')
        //     setGameResult(null)
        //     setGameId(null)
        //     setCurrentMultiplier(1.0)
        //     setGemsFound(0)
        //   }
        // })
      }
    }

    const handleMineGameResumed = (data: any) => {
      console.log('🔄 Mine game resumed:', data)
      console.log('🔄 Setting gameId to:', data.gameId)
      if (data.gameState) {
        setGameResult(data.gameState)
        setGameId(data.gameId)
        setGameState('playing')
        setIsLoading(false)
        setLoading(false)

        // Update game state with revealed tiles
        if (data.gameState.revealedTiles) {
          setGemsFound(data.gameState.revealedTiles.length)
          setCurrentMultiplier(data.gameState.currentMultiplier || 1.0)
        }
      }
    }

    const handleMineCashedOut = (data: any) => {
      console.log('Cashed out:', data)
      if (data.success && data.gameState) {
        // Game won - show success modal with full result
        setGameResult({
          ...data.gameState,
          type: 'win',
          amount: data.payout
        })
        setGameState('game_over')
        setShowResult(true)
        setIsLoading(false)
        setLoading(false)
        setIsCashingOut(false) // Reset cash out loading state
        // Add to game history
        setGameHistory(prev => [{
          id: data.gameId,
          multiplier: data.multiplier,
          isWin: true,
          timestamp: new Date().toISOString(),
          gridSize: '5x5',
          mineCount: mineCount,
          amount: data.payout,
          gemsFound: data.gameState.revealedTiles.length,
          totalGems: 25 - mineCount
        }, ...prev])

        // Request balance update after successful cash out
        console.log('💰 Requesting balance update after cash out')
        emit('request_balance_update', {})

        // showSuccessModal({
        //   title: 'CONGRATULATIONS!',
        //   message: `You cashed out successfully! Won ${data.payout.toFixed(2)} NEXUS`,
        //   onClose: () => {
        //     resetGame()
        //   }
        // })
      }
    }

    const handleMineError = (data: any) => {
      console.error('Mine game error:', data)
      setIsLoading(false)
      setLoading(false)
      setIsStartingGame(false) // Reset start game loading state
      setIsCashingOut(false) // Reset cash out loading state
      setIsRevealingTile(false) // Reset tile selection state

      showErrorModal({
        title: 'Game Error',
        message: data.message || 'An error occurred during the game',
        onClose: () => {
          // Reset game state on error
          resetGame()
        }
      })
    }

    const handleBalanceUpdate = (data: any) => {
      // Only update if this balance update is for the current user
      if (data.userId === user.profile?.id) {
        console.log('💰 Mine game balance update received:', data)
        // Update the user's balance in the auth context
        updateBalance(data.newBalance)
      }
    }

    // Register event listeners
    on('mine_game_started', handleMineGameStarted)
    on('mine_gem_found', handleMineGemFound)
    on('mine_hit', handleMineHit)
    on('mine_cashed_out', handleMineCashedOut)
    on('mine_game_resumed', handleMineGameResumed)
    on('mine_error', handleMineError)
    on('user_balance_update', handleBalanceUpdate)

    return () => {
      off('mine_game_started', handleMineGameStarted)
      off('mine_gem_found', handleMineGemFound)
      off('mine_hit', handleMineHit)
      off('mine_cashed_out', handleMineCashedOut)
      off('mine_game_resumed', handleMineGameResumed)
      off('mine_error', handleMineError)
      off('user_balance_update', handleBalanceUpdate)
    }
  }, [isConnected, on, off, wagerAmount, mineCount, updateBalance, user.profile?.id])

  // Check for incomplete games when component mounts


  // Sample leaderboard data
  useEffect(() => {
    setLeaderboard([
      { rank: 1, username: 'CryptoKing', avatar: '/assets/images/avatar/default.png', miningPower: '0.15 ETH', reward: '2.50x', trade: '3.2%' },
      { rank: 2, username: 'RocketQueen', avatar: '/assets/images/avatar/default.png', miningPower: '0.15 ETH', reward: '2.50x', trade: '1.8%' },
      { rank: 3, username: 'MoonWolf', avatar: '/assets/images/avatar/default.png', miningPower: '0.15 ETH', reward: '2.50x', trade: '2.1%' },
      { rank: 4, username: 'DiamondHands', avatar: '/assets/images/avatar/default.png', miningPower: '0.15 ETH', reward: '2.50x', trade: '1.5%' },
      { rank: 5, username: 'TechNinja', avatar: '/assets/images/avatar/default.png', miningPower: '0.15 ETH', reward: '2.50x', trade: '2.8%' },
      { rank: 6, username: 'PixelPirate', avatar: '/assets/images/avatar/default.png', miningPower: '0.15 ETH', reward: '2.50x', trade: '1.2%' },
      { rank: 7, username: 'BlockChain', avatar: '/assets/images/avatar/default.png', miningPower: '0.15 ETH', reward: '2.50x', trade: '2.3%' }
    ])
  }, [])



  const renderCell = (cell: number) => {
    const isRevealed = gameResult?.revealedTiles?.includes(cell) || false
    const isMine = gameResult?.mineTiles?.includes(cell) || false
    const isGameOver = gameState === 'game_over'

    let cellContent
    let cellClass = 'bg-gray-700 h-full rounded-lg flex items-center justify-center text-gray-400 transition-all duration-200 text-lg sm:text-xl font-bold'

    if (isGameOver) {
      // Show final state
      if (isMine) {
        cellContent =
          <div className='relative'>
            <FaBomb className="text-red-500 text-3xl md:text-xl xl:text-4xl" />
            <FaBomb className="text-red-500 text-3xl md:text-xl xl:text-4xl absolute top-0 left-0 animate-ping opacity-30" />
          </div>
        cellClass += ' bg-red-900/50'
      } else if (isRevealed) {
        cellContent = <div className='relative'>
          <FaSketch className='text-primary text-3xl md:text-xl xl:text-4xl' />
          <FaSketch className='text-primary text-3xl md:text-xl xl:text-4xl absolute top-0 left-0 animate-ping opacity-30' />
        </div>
        cellClass += ' bg-green-900/50'
      } else {
        cellContent = <FaSketch className="text-gray-500 text-3xl md:text-xl xl:text-4xl" />
        cellClass += ' bg-gray-700/50'
      }
    } else if (isRevealed) {
      // Show revealed gem
      cellContent = <div className='relative'>
        <FaSketch className='text-primary text-3xl md:text-xl xl:text-4xl' />
        <FaSketch className='text-primary text-3xl md:text-xl xl:text-4xl absolute top-0 left-0 animate-ping opacity-30' />
      </div>
      cellClass += ' bg-green-900/50'
    } else {
      // Show hidden tile
      cellContent = (
        <div className='relative'>
          <FaO className='text-gray-500 text-3xl md:text-xl xl:text-4xl' />
        </div>
      )
      cellClass += ' hover:bg-gray-600 hover:scale-105 active:scale-95'
    }

    return (
      <Button
        key={cell}
        onPress={() => !isGameOver && !isRevealed && !isRevealingTile && handleCellClick(cell)}
        disabled={isLoading || isGameOver || isRevealed || isRevealingTile}
        className={`${cellClass} disabled:opacity-50 disabled:cursor-not-allowed min-w-0 ${isRevealingTile ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {cellContent}
      </Button>
    )
  }

  return (
    <GameStatusWrapper gameName="mine" fallbackTitle="Mine Game Unavailable">
      <div className="min-h-screen text-white">
        <div className="relative z-10 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="lg:grid grid-cols-1 flex-col-reverse flex lg:grid-cols-16 gap-4 lg:gap-8">
              {/* Left Panel - Game Settings & Stats */}
              <div className="col-span-1 lg:col-span-6 xl:col-span-4 bg-background-alt backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-gray-700/50">
                {/* Game Settings */}
                <div className="mb-6">
                  <h3 className="text-cyan-400 font-bold text-lg mb-4 uppercase">GAME SETTINGS</h3>

                  <div className="space-y-4 flex flex-col gap-4">

                    <div className='flex flex-col gap-2'>
                      <div className='flex gap-2 items-end'>
                        <NumberInput
                          value={wagerAmount}
                          onValueChange={setWagerAmount}
                          label="Wager Amount"
                          labelPlacement='outside'
                          minValue={0.01}
                          maxValue={1000}
                          placeholder="0.00"
                          className='rounded-lg'
                          size='lg'
                          hideStepper
                          classNames={{
                            inputWrapper: 'rounded-lg bg-background border border-gray-700/50'
                          }}
                          endContent={
                            <div className='flex gap-2'>
                              <Button className='min-w-0 rounded-lg bg-background-alt h-10' onPress={() => setWagerAmount(Math.max(0.01, wagerAmount / 2))}>
                                1/2
                              </Button>
                              <Button className='min-w-0 rounded-lg bg-background-alt h-10' onPress={() => setWagerAmount(Math.min(1000, wagerAmount * 2))}>
                                2x
                              </Button>
                            </div>
                          }
                        />

                      </div>
                      <div className='grid grid-cols-4 gap-2'>
                        <Button className='min-w-0 bg-background rounded-md h-8' onPress={() => setWagerAmount(1)}>1</Button>
                        <Button className='min-w-0 bg-background rounded-md h-8' onPress={() => setWagerAmount(10)}>10</Button>
                        <Button className='min-w-0 bg-background rounded-md h-8' onPress={() => setWagerAmount(100)}>100</Button>
                        <Button className='min-w-0 bg-background rounded-md h-8' onPress={() => setWagerAmount(1000)}>1K</Button>
                      </div>
                    </div>

                    <div>
                      <Slider
                        className="max-w-md"
                        color="primary"
                        value={mineCount}
                        onChange={(value: number | number[]) => {
                          const newValue = Array.isArray(value) ? value[0] : value
                          setMineCount(newValue)
                          setTotalGems(25 - newValue)
                        }}
                        label="Mine Count"
                        maxValue={24}
                        minValue={1}
                        showSteps={true}
                        size="lg"
                        step={1}
                        renderThumb={(props) => (
                          <div
                            {...props}
                            className="group p-1 top-1/2 bg-background border-2 border-primary shadow-medium rounded-full cursor-grab data-[dragging=true]:cursor-grabbing"
                          >
                            <FaBomb />
                          </div>
                        )}
                      />
                      <div className="text-sm text-gray-400 mt-2">
                        {mineCount} mines • {25 - mineCount} gems
                      </div>
                    </div>

                    <PrimaryButton
                      onClick={gameState === 'playing' ? cashOut : startGame}
                      disabled={isLoading || isStartingGame || isCashingOut || (gameState === 'playing' && gemsFound === 0)}
                      className={`w-full font-bold py-3 flex items-center justify-center space-x-2 ${gameState === 'playing'
                        ? 'bg-primary hover:bg-primary/80 text-background'
                        : 'bg-primary hover:bg-primary/80 text-background'
                        }`}
                    >
                      {gameState === 'playing' ? (
                        <>
                          {isCashingOut ? (
                            <>
                              <FaScreenpal className="animate-spin" />
                              <span>CASHING OUT...</span>
                            </>
                          ) : (
                            <>
                              <FaCashRegister />
                              <span>CASH OUT</span>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {isStartingGame ? (
                            <>
                              <FaScreenpal className="animate-spin" />
                              <span>STARTING...</span>
                            </>
                          ) : (
                            <>
                              <FaPlay />
                              <span>PLAY</span>
                            </>
                          )}
                        </>
                      )}
                    </PrimaryButton>
                  </div>
                </div>

                {/* Game Stats */}
                <div className="mb-6">
                  <h3 className="text-white/20 font-bold text-lg mb-4 uppercase">GAME STATS</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Current Multiplier:</span>
                      <span className="text-white font-bold flex items-center">
                        <FaArrowUp className="text-background mr-1" />
                        {currentMultiplier.toFixed(2)}x
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Potential Payout:</span>
                      <span className="text-white font-bold flex items-center">
                        {(wagerAmount * currentMultiplier).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Gems Found:</span>
                      <span className="text-white font-bold flex items-center">
                        <FaSketch className="text-primary mr-1" />
                        {gemsFound} / {totalGems}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Panel - Game Area */}
              <div className=" relative col-span-1 lg:col-span-10 xl:col-span-12 bg-background-alt backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-gray-700/50">
                {gameState === 'not_started' && (
                  <div className="text-center flex items-center flex-col pt-20">
                    <div className='flex items-center gap-4'>
                      <div className="mb-4">
                        <div className="relative">
                          <FaBomb className="text-red-500 text-3xl md:text-xl xl:text-4xl" />
                          <FaBomb className="text-red-500 text-3xl md:text-xl xl:text-4xl absolute top-0 left-0 animate-ping opacity-30" />
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="relative">
                          <FaSketch className="text-primary text-3xl md:text-xl xl:text-4xl" />
                          <FaSketch className="text-primary text-3xl md:text-xl xl:text-4xl absolute top-0 left-0 animate-ping opacity-30" />
                        </div>
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">How To Play Mines?</h2>
                    <div className="text-white mb-2">
                      <ol className="list-decimal list-inside text-left space-y-2">
                        <li>Select the number of mines you wish to place for the round.</li>
                        <li>Press <span className='font-bold text-primary'>PLAY</span> button to start the round.</li>
                        <li>Each gem revealed will increase the payout multiplier.</li>
                        <li>Cash out any point to win at the last multiplier displayed.</li>
                        <li>If a mine is revealed, the game is ended and your wager is lost.</li>
                        <li>You may set more mines to increase multipliers on each gem revealed.</li>
                      </ol>
                    </div>
                  </div>
                )}
                {gameState === 'playing' && (
                  <div className="text-center h-full py-6">
                    <div className="flex justify-center w-full">
                      <div
                        className="grid gap-1 sm:gap-2 p-2 sm:p-4 lg:p-6 bg-gray-800 rounded-lg w-full max-w-xl aspect-square"
                        style={{
                          gridTemplateColumns: 'repeat(5, 1fr)'
                        }}
                      >
                        {Array(25).fill(0).map((_, index) => renderCell(index))}
                      </div>
                      <div className='absolute bottom-1 right-1 flex items-center gap-2'>
                        <span>Server Seed : </span>
                        <Snippet
                          symbol=""
                          size='sm'
                          className="text-xs"
                          classNames={{
                            pre: "max-w-[250px]! truncate",
                          }}>
                          {gameResult?.serverSeedHash}
                        </Snippet>
                      </div>
                    </div>
                  </div>
                )}
                {gameState === 'game_over' && gameResult && (
                  <div className="text-center h-full py-6">
                    <div className="flex justify-center mb-8">
                      <div
                        className="grid gap-1 sm:gap-2 p-2 sm:p-4 lg:p-6 bg-gray-800 rounded-lg w-full max-w-xl aspect-square"
                        style={{
                          gridTemplateColumns: 'repeat(5, 1fr)'
                        }}
                      >
                        {Array(25).fill(0).map((_, index) => renderCell(index))}
                      </div>
                    </div>
                    {gameResult.status === "win" && showResult && <div onClick={() => resetGame()} className='absolute flex items-center justify-center bottom-0 left-0 w-full h-full '>
                      <div className='flex flex-col gap-2 p-4 backdrop-blur-sm rounded-lg border border-primary/50 w-xs'>
                        <h2 className="text-4xl font-bold text-primary mb-2">{currentMultiplier.toFixed(2)}x!</h2>
                        <div className="flex items-center justify-center space-x-2 text-primary mb-2">
                          <FaGem />
                          <span>Won {((gameResult.amount || 0) - (gameResult.betAmount || 0)).toFixed(2)} (Profit)</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 text-gray-400 text-sm">
                          <span>Total Payout: {gameResult.amount?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>}
                    {gameResult.status === "lose" && showResult && <div onClick={() => resetGame()} className='absolute flex items-center justify-center bottom-0 left-0 w-full h-full '>
                      <div className='flex flex-col gap-2 p-4 backdrop-blur-sm rounded-lg border border-red-400/50'>
                        <h2 className="text-4xl font-bold text-red-400 mb-2">GAME OVER</h2>
                        <div className="flex items-center justify-center space-x-2 text-red-400 mb-2">
                          <FaGem />
                          <span>Lost {gameResult.amount?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>}
                  </div>
                )}
                {loading && <div className='absolute flex items-center backdrop-blur-sm justify-center bottom-0 left-0 w-full h-full '>
                  <FaScreenpal className='animate-spin text-primary text-4xl' />
                </div>}

              </div>
            </div>

            {/* Bottom Section - Mine History */}
            <div className="bg-background-alt backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 my-8">
              <h3 className="text-white/20 font-bold text-xl mb-6">MINE GAME HISTORY</h3>
              {user.isAuthenticated ? <MineHistory />
                :
                <div className='flex flex-col gap-2'>
                  <p className="text-white/20 mb-8 max-w-2xl mx-auto">
                    Please login to view your mine game history.
                  </p>
                </div>
              }
            </div>

            {/* Call to Action */}
            <div className="mt-8 text-center bg-gradient-to-r from-primary/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-12 border border-gray-700/50">
              <h2 className="text-3xl font-bold text-green-400 mb-4">READY TO START MINING?</h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of miners already earning rewards. Deploy your virtual mining rigs today and start earning.
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
                Mine Now
              </PrimaryButton>
            </div>
          </div>
        </div>



        <MineResumeModal resumeGame={resumeGame} />
      </div>
    </GameStatusWrapper>
  )
}