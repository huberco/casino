'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSocketEvents, useWebSocket } from '@/contexts/socketContext'
import { useAuth } from '@/contexts/AuthContext'
import { useGamePageTracking } from '@/hooks/useGamePageTracking'
import { gameApi } from '@/lib/api'
import PrimaryButton from '@/components/ui/PrimaryButton'
import GameStatusWrapper from '@/components/GameStatusWrapper'
import JackpotSlot from '@/components/JackpotSlot'
import { Button, CircularProgress, Image, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Popover, PopoverTrigger, PopoverContent, Snippet } from "@heroui/react";
import {
  FaTrophy,
  FaClock,
  FaArrowRight,
  FaCoins,
  FaUser,
  FaCircleInfo,
  FaSpinner,
} from 'react-icons/fa6'
import TokenSelector from '@/components/ui/TokenSelector'
import RouletteHistory from '@/components/table/RouletteHistory'
import { useModalType } from '@/contexts/modalContext'
import { useGameSettings } from '@/contexts/GameSettingsContext'
import { config } from '@/lib/config'
import { FaInfoCircle } from 'react-icons/fa'

interface RoulettePlayer {
  userId: string
  username: string
  avatar?: string
  betAmount: number
  betType: 'heads' | 'tails' | 'crown'
}

interface RouletteGame {
  gameId: string
  status: 'waiting' | 'betting' | 'drawing' | 'completed' | 'cancelled'
  totalBetAmount: number
  playerCount: number
  timeRemaining: number
  bettingDurationMs: number
  bettingStartTime: string
  minBetAmount: number
  maxBetAmount: number
  serverSeedHash: string
  publicSeed: string
  players: RoulettePlayer[]
  winningType?: 'heads' | 'tails' | 'crown'
  winners?: Array<{
    userId: string
    username: string
    avatar?: string
    betAmount: number
    betType: 'heads' | 'tails' | 'crown'
    payout: number
  }>
}

export default function JackpotPage() {
  const { isConnected, emit, on, off } = useWebSocket()
  const { user, updateBalance } = useAuth()
  const [betAmount, setBetAmount] = useState<number>(0)
  const [betType, setBetType] = useState<'heads' | 'tails' | 'crown'>('heads')

  // Track when user visits this game page
  useGamePageTracking({ gameType: 'roulette' })

  // Game state
  const [currentGame, setCurrentGame] = useState<RouletteGame | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('--')
  const [userBet, setUserBet] = useState<RoulettePlayer | null>(null)
  const [isPlacingBet, setIsPlacingBet] = useState(false)
  const [isSlotSpinning, setIsSlotSpinning] = useState(false)
  const [gamePhase, setGamePhase] = useState<'waiting' | 'betting' | 'drawing' | 'completed'>('waiting')
  const [winningSymbol, setWinningSymbol] = useState<string | undefined>()
  const [showWinnerModal, setShowWinnerModal] = useState(false)
  const [winnerData, setWinnerData] = useState<any>(null)
  const { showModal: showErrorModal } = useModalType('error')
  const [showLoading, setShowLoading] = useState(false)
  const pendingBalance = useRef<number | undefined>(undefined)
  const { settings } = useGameSettings();
  const [showRoundBanner, setShowRoundBanner] = useState(false)

  // Get current game on component mount
  useEffect(() => {
    if (isConnected) {
      emit('roulette_get_current_game', {});
    }
  }, [isConnected, emit]);

  // Set initial time display based on game status
  useEffect(() => {
    if (!currentGame) {
      setTimeLeft('--');
      return;
    }
  }, [currentGame]);

  // Roulette has no ticket-based percentage UI

  // Helper functions to calculate bet statistics
  const getBetStats = () => {
    if (!currentGame?.players) {
      return {
        tails: { players: 0, amount: 0 },
        heads: { players: 0, amount: 0 },
        crown: { players: 0, amount: 0 }
      };
    }

    const stats = {
      tails: { players: 0, amount: 0 },
      heads: { players: 0, amount: 0 },
      crown: { players: 0, amount: 0 }
    };

    currentGame.players.forEach(player => {
      if (player.betType === 'tails') {
        stats.tails.players++;
        stats.tails.amount += player.betAmount;
      } else if (player.betType === 'heads') {
        stats.heads.players++;
        stats.heads.amount += player.betAmount;
      } else if (player.betType === 'crown') {
        stats.crown.players++;
        stats.crown.amount += player.betAmount;
      }
    });

    return stats;
  };

  const betStats = getBetStats();

  const handleGameReset = () => {
    console.log('🔄 Roulette game reset:');
    setCurrentGame(prev => prev ? {
      ...prev,
      status: 'waiting',
      totalBetAmount: 0,
      playerCount: 0,
      players: [],
      winningType: undefined,
      winners: [],
    } : null);

    // Reset user bet
    setUserBet(null);
    setIsSlotSpinning(false);
    setWinningSymbol("1");
    setGamePhase('waiting');
  };

  // Socket event handlers
  // useEffect(() => {
  //   if (!isConnected) return;



  //   // Register event listeners
  //   on('roulette_current_game', handleCurrentGame);
  //   on('roulette_game_started', handleGameStarted);
  //   on('roulette_player_joined', handlePlayerJoined);
  //   on('roulette_countdown_update', handleCountdownUpdate);
  //   on('roulette_betting_ended', handleBettingEnded);
  //   on('roulette_spin_start', handleSpinStart);
  //   // on('roulette_game_reset', handleGameReset);
  //   on('roulette_bet_placed', handleBetPlaced);
  //   on('roulette_error', handleError);
  //   on('user_balance_update', handleBalanceUpdate);
  //   on('roulette_game_completed', handleGameCompleted);

  //   return () => {
  //     off('roulette_current_game', handleCurrentGame);
  //     off('roulette_game_started', handleGameStarted);
  //     off('roulette_player_joined', handlePlayerJoined);
  //     off('roulette_countdown_update', handleCountdownUpdate);
  //     off('roulette_betting_ended', handleBettingEnded);
  //     off('roulette_spin_start', handleSpinStart);
  //     // off('roulette_game_reset', handleGameReset);
  //     off('roulette_bet_placed', handleBetPlaced);
  //     off('roulette_error', handleError);
  //     off('user_balance_update', handleBalanceUpdate);
  //     off('roulette_game_completed', handleGameCompleted);
  //   };
  // }, [isConnected, on, off, emit, user.profile?.id, updateBalance]);

  const handleCurrentGame = (data: any) => {
    console.log('🎰 Current Roulette game:', data);
    setCurrentGame(data);
    setGamePhase(data.status || 'waiting');

    // Find user's bet if exists
    const myBet = data.players?.find((player: RoulettePlayer) => player.userId === user.profile?.id);
    setUserBet(myBet || null);

    // If game is completed and has winner, ensure slot shows winner
    if (data.status === 'completed' && data.winner) {
      setIsSlotSpinning(false);
    }
  };

  const handleGameStarted = (data: any) => {
    console.log('🎰 New Roulette game started:', data);
    // Reset state for new game
    setUserBet(null);
    setIsSlotSpinning(false);
    setWinningSymbol("0");
    setGamePhase('betting');
    pendingBalance.current = undefined; // Clear any pending balance

    // Show round banner briefly
    setShowRoundBanner(true);
    setTimeout(() => setShowRoundBanner(false), 2000);

    // Request current game to get full state
    emit('roulette_get_current_game', {});
  };

  const handlePlayerJoined = (data: any) => {
    console.log('👤 Player joined roulette:', data);
    setCurrentGame(prev => {
      const updatedGame = prev ? {
        ...prev,
        totalBetAmount: data.totalBetAmount,
        playerCount: data.playerCount,
        players: data.allPlayers || prev.players
      } : null;

      // Update user's bet if it's them
      if (data.player.userId === user.profile?.id) {
        setUserBet(data.player);
      }

      return updatedGame;
    });
  };

  // No player update event for roulette (single bet per player)



  const handleBettingEnded = (data: any) => {
    console.log('⏰ Roulette betting ended:', data);
    pendingBalance.current = 0
    setTimeLeft("0")
    setGamePhase('drawing');
    setCurrentGame(prev => prev ? {
      ...prev,
      status: 'drawing'
    } : null);

    // Start slot machine spinning animation
    console.log('🎰 Starting slot machine spinning animation...');
    setShowLoading(true)
    // setIsSlotSpinning(true);
  };

  const handleCountdownUpdate = (data: any) => {
    console.log('⏰ Roulette countdown update:', data);

    // Update current game with latest data
    setCurrentGame(prev => prev ? {
      ...prev,
      totalBetAmount: data.totalBetAmount,
      playerCount: data.playerCount,
      timeRemaining: data.timeRemaining
    } : null);

    // Update countdown display
    if (data.countdownSeconds !== undefined) {
      const minutes = Math.floor(data.countdownSeconds / 60);
      const seconds = data.countdownSeconds % 60;
      setTimeLeft(`${data?.countdownSeconds}`);
    } else if (data.timeRemaining !== undefined) {
      const countdownSeconds = Math.ceil(data.timeRemaining / 1000);
      const minutes = Math.floor(countdownSeconds / 60);
      const seconds = countdownSeconds % 60;
      setTimeLeft(`${data?.countdownSeconds}`);
    }

    // No ticket-based percentages in roulette
  };

  const handleSpinStart = (data: any) => {
    console.log('🎰 Roulette spin start:', data);
    // ready for getting result balance - set flag to wait for balance updates
    setGamePhase('drawing');
    pendingBalance.current = 0; // Set flag to wait for balance updates

    // Update game state with winner
    setCurrentGame(prev => prev ? {
      ...prev,
      status: 'drawing',
      winningType: data.winningType,
      winners: data.winners
    } : null);
    setTimeLeft("0");
    setWinningSymbol(data.winningType);
    setShowLoading(false)
    setIsSlotSpinning(true);
  };

  const handleWinnerSelected = (data: any) => {
    console.log('🏆 Roulette winner selected:', data);

    setGamePhase('completed');

    // Update game state with winner
    setCurrentGame(prev => prev ? {
      ...prev,
      status: 'completed'
    } : null);

    // Slot machine should already be spinning from spin start
    // The slot will automatically stop on the winner when it receives the winner data
    console.log('🎯 Slot machine will stop on winner:', data.winner.username);
  };

  const handleBetPlaced = (data: any) => {
    console.log('✅ Roulette bet placed:', data);
    if (data.success) {
      // Bet was successful, reset placing bet state
      setIsPlacingBet(false);
      // Wait for player_joined or player_updated event for full update
    } else {
      // Bet failed, reset placing bet state
      setIsPlacingBet(false);
    }
  };

  const handleError = (data: any) => {
    console.error('❌ Roulette error:', data);
    setIsPlacingBet(false);
    // Show error to user (could add toast notification)
    showErrorModal({
      title: 'Error',
      message: data.message,
      onClose: () => {
      }
    })
  };

  const handleBalanceUpdate = (data: any) => {
    // Only update if this balance update is for the current user
    if (data.userId === user.profile?.id) {
      console.log('💰 Roulette balance update received:', data)
      console.log('💰 Pending balance:', pendingBalance.current)
      // Check if we're in the middle of a game (betting phase)
      if (pendingBalance.current === 0) {
        // Store the pending balance to update after animation
        console.log('🎯 Storing pending balance for after animation:', data.newBalance)
        pendingBalance.current = data.newBalance
      } else {
        // Update balance immediately if not in game
        updateBalance(data.newBalance)
      }
    }
  };

  const handleGameCompleted = (data: any) => {
    console.log('🎉 Roulette game completed:', data);

    // Update game state
    setCurrentGame(prev => prev ? {
      ...prev,
      status: 'completed',
      winningType: data.winningType,
      winners: data.winners
    } : null);

    // Check if current user won
    const currentUserWon = data.winners?.some((winner: any) => winner.userId === user.profile?.id);

    // Always show result modal
    setWinnerData({
      winningType: data.winningType,
      winners: data.winners,
      totalPot: data.totalBetAmount,
      userWon: currentUserWon,
      userPayout: currentUserWon ? data.winners.find((w: any) => w.userId === user.profile?.id)?.payout : 0
    });
    setTimeLeft("--")
  };
  useSocketEvents({
    'roulette_current_game': handleCurrentGame,
    'roulette_game_started': handleGameStarted,
    'roulette_player_joined': handlePlayerJoined,
    'roulette_countdown_update': handleCountdownUpdate,
    'roulette_betting_ended': handleBettingEnded,
    'roulette_spin_start': handleSpinStart,
    // 'roulette_game_reset':handleGameReset,
    'roulette_bet_placed': handleBetPlaced,
    'roulette_error': handleError,
    'user_balance_update': handleBalanceUpdate,
    'roulette_game_completed': handleGameCompleted,
  }, 'roulette-page')

  const handleCloseWinnerModal = () => {
    setShowWinnerModal(false);
    setWinnerData(null);
    // Clear any pending balance
    pendingBalance.current = undefined;
    // Request backend to reset the game
    // emit('roulette_reset_game', {});
    handleGameReset()
  };

  const handlePlayNow = async () => {
    // Allow betting if no current game, or if game is in 'waiting' or 'betting' status
    if (currentGame && currentGame.status !== 'betting' && currentGame.status !== 'waiting') {
      return;
    }

    if (!user.isAuthenticated) {
      showErrorModal({
        title: 'Authentication Required',
        message: 'Please log in to place bets.',
      })
      return;
    }

    // In roulette, each player can only bet once
    if (userBet) {
      return;
    }

    if (isPlacingBet) {
      return;
    }

    if (betAmount <= 0) {
      console.error('Invalid bet amount');
      return;
    }

    setIsPlacingBet(true);

    try {
      // Place bet via socket - this will create a new game if none exists or add more tickets
      emit('roulette_place_bet', { betAmount, betType });
    } catch (error) {
      console.error('Error placing Roulette bet:', error);
      setIsPlacingBet(false);
    }
  }

  const handleViewAllPlayers = () => {
    // Navigate to full players list
    console.log('Viewing all players...')
  }

  const handleBetAmountChange = (value: number) => {

    if (settings?.games?.roulette?.minBet && value < settings?.games?.roulette?.minBet || settings?.games?.roulette?.maxBet && value > settings?.games?.roulette?.maxBet) {
      showErrorModal({
        title: 'Invalid Bet',
        message: `Bet amount must be between ${settings?.games?.roulette?.minBet || 0.001} and ${settings?.games?.roulette?.maxBet || 1000}`
      })
      return
    }
    setBetAmount(value)
  }

  return (
    <GameStatusWrapper gameName="roulette" fallbackTitle="Roulette Game Unavailable">
      <div className="min-h-screen text-white">
        <div className="relative z-10 sm:p-6 p-2">
          <div className="max-w-7xl mx-auto">

            <div className="flex flex-col gap-8 my-8 itms-center ">
              {/* Betting Control Panel */}
              <div className="bg-background-alt justify-center flex gap-4 items-center backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                {/* Bet Amount */}
                <div className='flex flex-col gap-2'>
                  <Input
                    value={betAmount.toString()}
                    onValueChange={(value) => handleBetAmountChange(Number(value))}
                    type="number"
                    label="Bet Amount"
                    labelPlacement='outside'
                    startContent={<FaCoins />}
                    placeholder="0.00"
                    size='lg'
                    className="w-full  text-white min-w-[250px]"
                    classNames={{
                      inputWrapper: "bg-background border border-gray-700/50 rounded-lg",
                    }}
                  />
                  <div className='flex gap-2 justify-between text-xs text-white/50'>
                    <span>Min Bet: {settings?.games?.roulette?.minBet || 0.001} {config.token}</span>
                    <span>Max Bet: {settings?.games?.roulette?.maxBet || 1000} {config.token}</span>
                  </div>
                </div>
                {/* Place Roulette Bet */}
                <PrimaryButton
                  onClick={() => {
                    console.log('🎰 Button clicked - Game status:', currentGame?.status, 'User bet:', !!userBet, 'Is placing bet:', isPlacingBet);
                    handlePlayNow();
                  }}
                  disabled={
                    (currentGame && currentGame.status !== 'betting' && currentGame.status !== 'waiting') ||
                    isPlacingBet ||
                    betAmount <= 0 ||
                    betAmount < (settings?.games?.roulette?.minBet || 0.01) ||
                    betAmount > (settings?.games?.roulette?.maxBet || 1000) ||
                    !user.isAuthenticated
                  }
                  isLoading={isPlacingBet}
                  className="bg-primary hover:bg-primary/80 text-background font-bold py-3 rounded-full"
                >
                  {isPlacingBet ? 'PLACING BET...' :
                    userBet ? 'BET PLACED' :
                      currentGame?.status === 'drawing' ? 'DRAWING...' :
                        currentGame?.status === 'betting' || currentGame?.status === 'waiting' ? `BET ${betType.toUpperCase()}` :
                          !currentGame ? 'JOIN GAME' :
                            'WAITING FOR GAME'}
                </PrimaryButton>
                <div className='flex gap-2 items-center justify-center'>
                  <div className='flex flex-col gap-2  items-center'>
                    <Button className={`px-2 rounded-full min-h-0 min-w-0 aspect-square h-auto w-20 ${betType === "heads" ? "bg-primary/30 shadow-md shadow-primary" : "scale-90 bg-transparent border border-primary/20"}`} onPress={() => setBetType('heads')}>
                      <Image src="/assets/images/tokens/heads.svg" alt="Heads" className='w-full h-full' />
                    </Button>
                    <p>X2</p>
                  </div>
                  <div className='flex flex-col gap-2  items-center'>
                    <Button className={`px-2 rounded-full min-h-0 min-w-0 aspect-square h-auto w-20 ${betType === "crown" ? "bg-primary/30 shadow-md shadow-primary" : "scale-90 bg-transparent border border-primary/20"}`} onPress={() => setBetType('crown')}>
                      <Image src="/assets/images/tokens/crown.png" alt="Crown" className='w-full h-full' />
                    </Button>
                    <p>X10</p>
                  </div>
                  <div className='flex flex-col gap-2  items-center'>
                    <Button className={`px-2 rounded-full min-h-0 min-w-0 aspect-square h-auto w-20 ${betType === "tails" ? "bg-primary/30 shadow-md shadow-primary" : "scale-90 bg-transparent border border-primary/20"}`} onPress={() => setBetType('tails')}>
                      <Image src="/assets/images/tokens/tails.svg" alt="Tails" className='w-full h-full' />
                    </Button>
                    <p>X2</p>
                  </div>
                </div>

                {/* Current Stats */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-300 whitespace-nowrap">Your Stake:</span>
                    <span className="text-white font-bold whitespace-nowrap">
                      {userBet ? `${userBet.betAmount.toFixed(2)} USDT` : '0.00 USDT'}
                    </span>
                  </div>
                  {/* <div className="flex items-center justify-between">
                    <span className="text-gray-300 whitespace-nowrap">Your Bet Type:</span>
                    <span className="text-white font-bold">{userBet ? userBet.betType.toUpperCase() : '-'}</span>
                  </div> */}
                </div>


              </div>

              {/* Main Game Panel */}
              <div className="relative col-span-16 lg:col-span-10 xl:col-span-12 bg-background-alt backdrop-blur-sm rounded-2xl sm:p-6 p-1 border border-gray-700/50">
                {/* Stats Cards */}
                <div className="mb-6 text-center">
                  <div className="flex justify-between gap-4 max-w-3xl mx-auto items-center">
                    <div className={`bg-gray-800/50 rounded-xl p-4 flex ${userBet ? '' : 'invisible'}`}>
                      {userBet && <div className="text-2xl font-bold text-white">
                        <Image src={`/assets/images/tokens/${userBet.betType === "heads" ? "heads.svg" : userBet.betType === "tails" ? "tails.svg" : "crown.png"}`} alt={userBet.betType} width={40} height={40} className='animate-pulse' />
                      </div>}
                    </div>
                    {currentGame && (currentGame.status === 'drawing' || currentGame.status === 'completed') && (
                      <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-12">
                        <div className='flex flex-col'>
                          <div className="text-xs text-gray-400">Round #{currentGame.gameId}</div>
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
                    )}


                    <div className={`flex items-center justify-center space-x-2  px-4 py-1 rounded-full text-white ${Number(timeLeft) < 10 ? Number(timeLeft) > 3 ? 'bg-warning-500/30' : 'bg-danger-500/30' : 'bg-primary/30'}`}>
                      <FaClock className="" />
                      <div className="text-2xl font-bold">{timeLeft}</div>
                    </div>
                  </div>
                </div>
                {/* Provably Fair Seeds */}

                {/* Main Roulette Display */}
                <div className="text-center mb-8">
                  {showRoundBanner && currentGame && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-2xl font-bold">
                        Round #{currentGame.gameId}
                      </div>
                    </div>
                  )}
                  <div className='flex items-center justify-center mb-6 w-full'>
                    <JackpotSlot
                      isSpinning={isSlotSpinning}
                      targetSymbol={winningSymbol}
                      jackpotAmount={100}
                      onSpinStart={(symbol) => {
                        console.log('🎰 Slot spin started, target:', symbol);
                        setIsSlotSpinning(true);
                        setTimeLeft("--")

                      }}
                      onSpinEnd={(symbol) => {
                        console.log('🎰 Slot spin ended, result:', symbol);
                        setIsSlotSpinning(false);
                        setGamePhase('completed');
                        setShowWinnerModal(true)

                        // Update balance with pending balance if available
                        if (pendingBalance.current !== undefined && pendingBalance.current !== 0) {
                          console.log('💰 Updating balance after animation:', pendingBalance.current)
                          updateBalance(pendingBalance.current)
                          pendingBalance.current = undefined // Reset it
                        }
                        // Game completion is now handled by roulette_game_completed event
                        // which will show the result modal and update balances
                      }}
                      disabled={false}
                    />
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <FaTrophy className="text-primary text-2xl" />
                      <span className="text-white text-lg font-semibold">Current Pot</span>
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">
                      {(currentGame?.totalBetAmount || 0).toLocaleString()} USDT
                    </div>
                  </div>

                  <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
                    <div className='bg-gray-800/50 rounded-xl p-4'>
                      <div className='flex items-center justify-center space-x-2 mb-2'>
                        <Image src="/assets/images/tokens/heads.svg" alt="Heads" width={40} height={40} />
                        <span className="text-gray-300 text-sm">{betStats.heads.players} players bet on heads</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{betStats.heads.amount.toFixed(2)} USDT</div>
                    </div>
                    <div className='bg-gray-800/50 rounded-xl p-4'>
                      <div className='flex items-center justify-center space-x-2 mb-2'>
                        <Image src="/assets/images/tokens/crown.png" alt="Crown" width={40} height={40} />
                        <span className="text-gray-300 text-sm">{betStats.crown.players} players bet on crown</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{betStats.crown.amount.toFixed(2)} USDT</div>
                    </div>
                    <div className='bg-gray-800/50 rounded-xl p-4'>
                      <div className='flex items-center justify-center space-x-2 mb-2'>
                        <Image src="/assets/images/tokens/tails.svg" alt="Tails" width={40} height={40} />
                        <span className="text-gray-300 text-sm">{betStats.tails.players} players bet on tails</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{betStats.tails.amount.toFixed(2)} USDT</div>
                    </div>
                  </div>
                </div>

                {showLoading && <div>
                  <div className="absolute inset-0 flex items-center justify-center bg-background-alt/50 backdrop-blur-sm rounded-2xl z-10">
                    <FaSpinner className="text-primary text-4xl animate-spin" />
                  </div>
                </div>
                }
              </div>
            </div>

            {/* Current Players Section */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-white text-center mb-8">CURRENT PLAYERS</h2>

              <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
                {/* Winner Card */}
                {/* <div className="bg-primary rounded-2xl p-6 border-2 border-green-400 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-400 text-black px-4 py-1 rounded-full text-sm font-bold">
                    Winner
                  </span>
                </div>

                <div className="text-center">
                  <img
                    src={currentPlayers[0].avatar}
                    alt={currentPlayers[0].username}
                    className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-white"
                  />
                  <h3 className="text-xl font-bold text-black mb-1">{currentPlayers[0].username}</h3>
                  <p className="text-black/80 mb-4">Level {currentPlayers[0].level}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-black/80">Stake</span>
                      <span className="text-black font-bold">{currentPlayers[0].stake.toLocaleString()} BNB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-black/80">Chance</span>
                      <span className="text-black font-bold">{currentPlayers[0].chance}%</span>
                    </div>
                  </div>
                </div>
              </div> */}

                {/* Current Players */}
                <div className="flex flex-col gap-4 w-full">
                  {(currentGame?.players || []).map((player) => (
                    <div key={player.userId} className="group bg-background-alt w-full cursor-pointer backdrop-blur-sm relative rounded-2xl p-[2px] border border-gray-700/50">
                      <div
                        className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-sky-600 rounded-xl blur opacity-5 group-hover:opacity-50 transition duration-500"
                      ></div>
                      <div className='bg-gradient-to-b from-white/10 to-transparent w-full relative p-1 rounded-xl'>
                        <div className='bg-background-alt/80 w-full relative p-4 rounded-lg'>
                          <div className="text-center grid grid-cols-3 bg-">
                            <div className='flex gap-2 justify-start items-center'>
                              <img
                                src={player.avatar || '/assets/images/avatar/default.png'}
                                alt={player.username}
                                className="w-14 h-14 rounded-full"
                              />
                              <div className='flex flex-col items-start justify-center'>
                                <h4 className="text-white font-bold ">{player.username}</h4>
                                <p className="text-gray-400 text-sm">Bet on {player.betType.toUpperCase()}</p>
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-400">Stake</span>
                              <span className="text-white font-bold">{player.betAmount.toFixed(2)} USDT</span>
                            </div>
                            <div className="space-y-1 text-sm text-end flex flex-col">
                              <div className="flex  flex-col">
                                <span className="text-gray-400">Type</span>
                                <span className="text-white font-bold">{player.betType.toUpperCase()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center mt-8">
                <button
                  onClick={handleViewAllPlayers}
                  className="text-white hover:text-primary transition-colors flex items-center space-x-2 mx-auto"
                >
                  <span>View All Players</span>
                  <FaArrowRight />
                </button>
              </div>
            </div>



            {/* Bottom Section - Roulette History */}
            <div className=" bg-background-alt backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 my-8 lg:block hidden">
              <h3 className="text-white/20 font-bold text-xl mb-6">Roulette GAME HISTORY</h3>
              {user.isAuthenticated ? <RouletteHistory />
                :
                <div className='flex flex-col gap-2'>
                  <p className="text-white/20 mb-8 max-w-2xl mx-auto">
                    Please login to view your roulette game history.
                  </p>
                </div>
              }
            </div>

            {/* Call to Action */}
            <div className="text-center bg-gradient-to-r from-primary/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-12 border border-gray-700/50">
              <h2 className="text-4xl font-bold text-primary mb-6">READY TO WIN BIG?</h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-lg">
                Don&lsquo;t miss your chance to win the Roulette. Join now and stake your tokens for a chance to take it all.
              </p>
              <PrimaryButton
                onClick={() => {
                  handlePlayNow()
                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                  })
                }}
                className="bg-primary  text-background font-bold py-4 px-8 rounded-full"
              >
                Play Now
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div >

      {/* Game Result Modal */}
      <Modal
        isOpen={showWinnerModal}
        onClose={handleCloseWinnerModal}
        size="2xl"
        classNames={{
          base: "bg-background border border-gray-700",
          header: "border-b border-gray-700",
          body: "py-6",
          footer: "border-t border-gray-700"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              {winnerData?.userWon ? (
                <>
                  <FaTrophy className="text-yellow-500 text-3xl" />
                  <h2 className="text-2xl font-bold text-white">Congratulations!</h2>
                </>
              ) : (
                <>
                  <FaCircleInfo className="text-blue-500 text-3xl" />
                  <h2 className="text-2xl font-bold text-white">Game Result</h2>
                </>
              )}
            </div>
          </ModalHeader>
          <ModalBody>
            {winnerData && (
              <div className="space-y-6">
                {/* Winning Type Display */}
                <div className="text-center">
                  <div className="flex flex-col items-center justify-center gap-2 space-x-2 mb-2">
                    <Image src={`/assets/images/tokens/${winnerData.winningType === 'crown' ? "crown.png" : winnerData.winningType === 'heads' ? "heads.svg" : winnerData.winningType === 'tails' ? "tails.svg" : ""}`} alt={winnerData.winningType} width={80} height={80} />
                    <span className="text-xl font-bold text-white">
                      {winnerData.winningType?.toUpperCase()} WINS!
                    </span>
                  </div>
                  <p className="text-gray-300">Total Pot: {winnerData.totalPot.toLocaleString()} USDT</p>
                </div>

                {/* User Result */}
                <div className="text-center">
                  {winnerData.userWon ? (
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <FaTrophy className="text-green-400 text-xl" />
                        <span className="text-lg font-bold text-green-400">You Won!</span>
                      </div>
                      <p className="text-green-300 font-semibold">
                        +{winnerData.userPayout.toLocaleString()} USDT
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <FaCircleInfo className="text-red-400 text-xl" />
                        <span className="text-lg font-bold text-red-400">Game Result</span>
                      </div>
                      <p className="text-red-300">Better luck next time!</p>
                    </div>
                  )}
                </div>

                {/* Winners List */}
                {winnerData.winners && winnerData.winners.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 text-center">
                      🏆 Winners ({winnerData.winners.length})
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {winnerData.winners.map((winner: any, index: number) => (
                        <div key={index} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {winner.avatar ? (
                                <img
                                  src={winner.avatar}
                                  alt={winner.username}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                  <FaUser className="text-white text-sm" />
                                </div>
                              )}
                              <span className="text-white font-medium">{winner.username}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 font-bold">
                              +{winner.payout.toLocaleString()} USDT
                            </div>
                            <div className="text-gray-400 text-sm">
                              Bet: {winner.betAmount.toLocaleString()} USDT ({winner.betType})
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter className="justify-end">
            <Button
              color="primary"
              size="lg"
              onPress={handleCloseWinnerModal}
              className="px-8 py-2 text-background rounded-full font-semibold"
            >
              Continue Playing
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </GameStatusWrapper>
  )
}