'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWebSocket, useSocketEvents } from '@/contexts/socketContext'
import { useAuth } from '@/contexts/AuthContext'
import { useGamePageTracking } from '@/hooks/useGamePageTracking'
import PrimaryButton from '@/components/ui/PrimaryButton'
import GameStatusWrapper from '@/components/GameStatusWrapper'
import { gameApi } from '@/lib/api'
import {
  FaSort,
  FaCalendar
} from 'react-icons/fa6'
import { Badge, Button, Image, NumberInput, Skeleton, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react'
import Link from 'next/link'
import { useModalType } from '@/contexts/modalContext'
import CoinflipCard from '@/components/cards/CoinflipCard'
interface RecentFlip {
  id: string
  player1: string
  player2: string
  betAmount: number
  side: 'heads' | 'tails'
  winner: string
  profit: number
  timestamp: string
}

interface Player {
  _id: string;
  username: string;
  displayName?: string;
  avatar: string;
  level: number;
  coin: string;
}

interface CoinflipGame {
  gameId: string;
  creator: Player;
  joiner?: Player;
  betAmount: number;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  coinSide?: 'heads' | 'tails';
  coinResult?: 'heads' | 'tails'; // The actual coin result after flipping
  winner?: Player;
  serverSeedHash?: string;
  creatorSeed?: string;
  winnerPayout: number;
  createdAt?: string; // For sorting purposes
}

interface UserStats {
  wins: number
  losses: number
  profit: number
}

export default function CoinflipPage() {
  const { isConnected, emit, debugSocketState } = useWebSocket()

  const { user, updateBalance } = useAuth()
  const [ready, setReady] = useState(false)
  const [wagerAmount, setWagerAmount] = useState(0.01)

  // Track when user visits this game page
  useGamePageTracking({ gameType: 'coinflip' })
  const [selectedSide, setSelectedSide] = useState('heads')
  const [isCreatingGame, setIsCreatingGame] = useState(false)

  const [games, setGames] = useState<CoinflipGame[]>([])

  // Sorting state
  const [sortBy, setSortBy] = useState<'latest' | 'betting'>('latest')

  // Join modal state
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<CoinflipGame | null>(null)
  const [joinSide, setJoinSide] = useState<'heads' | 'tails'>('heads')
  const [isJoining, setIsJoining] = useState(false)

  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<"heads" | "tails" | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<{ winner: string, result: string } | null>(null);
  const { showModal: showErrorModal } = useModalType('error')
  const [liveGames, setLiveGames] = useState<CoinflipGame[]>([]);



  // Helper function to sort games: open games first, then closed games
  const sortGames = useCallback((games: CoinflipGame[]) => {
    return games.sort((a: CoinflipGame, b: CoinflipGame) => {
      // Open games (waiting, active) come first
      const aIsOpen = a.status === 'waiting' || a.status === 'active'
      const bIsOpen = b.status === 'waiting' || b.status === 'active'

      if (aIsOpen && !bIsOpen) return -1
      if (!aIsOpen && bIsOpen) return 1

      // Within same category (both open or both closed), sort by selected criteria
      if (sortBy === 'latest') {
        // Sort by creation date (newest first)
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      } else if (sortBy === 'betting') {
        // Sort by betting amount (highest first)
        return b.betAmount - a.betAmount
      }

      // Default fallback
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })
  }, [sortBy])

  // Helper function to clean up old completed games when list gets too long
  const cleanupOldCompletedGames = useCallback((games: CoinflipGame[]) => {
    if (games.length <= 30) {
      return games; // No cleanup needed
    }

    // Separate waiting and completed games
    const waitingGames = games.filter(game => game.status === 'waiting');
    const completedGames = games.filter(game => game.status === 'completed' || game.status === 'cancelled');
    
    // If all games are waiting, don't remove any
    if (waitingGames.length === games.length) {
      return games;
    }

    // Sort completed games by creation time (oldest first)
    const sortedCompletedGames = completedGames.sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return aTime - bTime;
    });

    // Remove oldest 5 completed games
    const remainingCompletedGames = sortedCompletedGames.slice(5);
    
    // Combine waiting games with remaining completed games
    const cleanedGames = [...waitingGames, ...remainingCompletedGames];
    
    console.log(`🧹 Cleaned up ${sortedCompletedGames.length - remainingCompletedGames.length} old completed games. Remaining: ${cleanedGames.length}`);
    
    return cleanedGames;
  }, []);

  const selfRemove = (gameId: string) => {
    setLiveGames(prev => prev.filter(game => game.gameId !== gameId))
  }

  const requestBalanceUpdate = () => {
    emit('request_balance_update', {})
  }

  const handleCreateGame = () => {
    if (isCreatingGame) {
      console.log('🎮 Game creation already in progress, skipping...')
      return
    }

    if (!user.isAuthenticated) {
      showErrorModal({
        title: 'Authentication Required',
        message: 'You must be logged in to create a game.',
        onClose: () => { }
      })
      return
    }

    if (!user.profile?.seed) {
      // User doesn't have a seed, they need to generate one first
      console.warn('User does not have a seed. Please generate one in profile settings.')
      showErrorModal({
        title: 'No Seed',
        message: 'You don\'t have a seed. Please generate one in profile settings.',
        onClose: () => { }
      })
      return
    }

    setIsCreatingGame(true)
    console.log('🎮 Creating game with bet amount:', wagerAmount, 'and side:', selectedSide)

    emit('coinflip_create_game', {
      betAmount: wagerAmount,
      coinSide: selectedSide,
      creatorSeed: user.profile.seed // Include creator's seed
    })
  }

  const handleOpenJoinModal = (game: CoinflipGame) => {

    if (!user.isAuthenticated) {
      showErrorModal({
        title: 'Authentication Required',
        message: 'Please login to join a game.',
        onClose: () => { }
      })
      return
    }

    if (!user.profile?.seed) {
      // User doesn't have a seed, they need to generate one first
      console.warn('User does not have a seed. Please generate one in profile settings.')
      showErrorModal({
        title: 'No Seed',
        message: 'You don\'t have a seed. Please generate one in profile settings.',
        onClose: () => { }
      })
      return
    }

    setSelectedGame(game)
    // Set the opposite side of what the creator chose
    setJoinSide(game.coinSide === 'heads' ? 'tails' : 'heads')
    setJoinModalOpen(true)
  }

  const handleJoinGame = async () => {
    if (!selectedGame || !user.profile?.seed) {
      showErrorModal({
        title: 'No Seed',
        message: 'You don\'t have a seed. Please generate one in profile settings.',
        onClose: () => { }
      })
      return
    }

    setIsJoining(true)
    try {
      // Server will get the user's seed from database and hash it
      emit('coinflip_join_game', {
        gameId: selectedGame.gameId
      })
    } catch (error) {
      console.error('Failed to join game:', error)
    }
  }

  const handleCloseJoinModal = () => {
    setJoinModalOpen(false)
    setSelectedGame(null)
    setIsJoining(false)
  }

  // Set ready when connected
  useEffect(() => {
    if (isConnected && games.length === 0) {
      emit('coinflip_get_games', {})
    }
  }, [isConnected])

  // Re-sort games when sortBy changes
  useEffect(() => {
    if (games.length > 0) {
      setGames(prevGames => sortGames([...prevGames]))
    }
  }, [sortBy, sortGames])




  // Use centralized event system - no need to manage room joins or manual listeners
  // Memoize event handlers to prevent re-registration on every render
  const handleConnectionSuccess = useCallback((data: any) => {
    console.log('🎮 Connection success received, requesting current coinflip games...')
    emit('coinflip_get_games', {})
  }, [emit])

  const handleGameInit = useCallback((data: any) => {
    console.log('🎮 Coinflip game init received:', data)
    if (data.games && Array.isArray(data.games)) {
      setGames(data.games)
    }
  }, [])

  const handleGamesList = useCallback((data: any) => {
    console.log('🎮 Coinflip games list received:', data)
    setReady(true)
    if (data.games && Array.isArray(data.games)) {
      const cleanedGames = cleanupOldCompletedGames(data.games)
      setGames(sortGames(cleanedGames))
    }
  }, [sortGames, cleanupOldCompletedGames])

  const handleGameCreated = useCallback((data: any) => {
    console.log('🎮 New coinflip game created:', data)
    if (data.game) {
      console.log("data.game", data.game)

      setGames(prev => {
        // Check if game already exists
        const existingGameIndex = prev.findIndex(game => game.gameId === data.game.gameId)

        if (existingGameIndex !== -1) {
          console.log('🎮 Game already exists, updating instead of adding:', data.game.gameId)
          // Merge partial update data with existing game data
          const updatedGames = [...prev]
          updatedGames[existingGameIndex] = {
            ...updatedGames[existingGameIndex],
            ...data.game
          }
          return sortGames(updatedGames)
        } else {
          console.log('🎮 Adding new game to list:', data.game.gameId)
          // Add new game to the beginning of the list and cleanup if needed
          const newGames = [data.game, ...prev]
          const cleanedGames = cleanupOldCompletedGames(newGames)
          return sortGames(cleanedGames)
        }
      })

      // Request balance update if current user created the game
      if (data.game.creator._id === user.profile?.id) {
        console.log('💰 Requesting balance update after game creation')
        // Reset creating state since game was successfully created
        setIsCreatingGame(false)

        // Add variety to coin side selection - randomly choose next side
        // This prevents always creating games with the same side
        const randomSide = Math.random() < 0.5 ? 'heads' : 'tails'
        setSelectedSide(randomSide)
        console.log('🎲 Randomly selected coin side for next game:', randomSide)
      }
    }
  }, [sortGames, user.profile?.id, emit, selectedSide])

  const handleGameCompleted = useCallback((data: any) => {
    console.log('🎮 Coinflip game completed:', data)
    if (data.game) {
      setGames(prev => {
        const updatedGames = prev.map(game =>
          game.gameId === data.game.gameId ? { ...game, ...data.game } : game
        )
        const cleanedGames = cleanupOldCompletedGames(updatedGames)
        return sortGames(cleanedGames)
      })
    }
  }, [sortGames, cleanupOldCompletedGames, user.profile?.id, emit])

  const handleGameCancelled = useCallback((data: any) => {
    console.log('🎮 Coinflip game cancelled :', data)
    if (data.gameId) {
      setGames(prev => prev.filter(game => game.gameId !== data.gameId))
    }
  }, [])

  const handleGameUpdate = useCallback((data: any) => {
    setJoinModalOpen(false)
    setIsJoining(false)
    if (data.game) {
      if (data.game.status === 'completed') {
        setLiveGames(prev => [data.game, ...prev.filter(game => game.gameId !== data.game.gameId)])
      }
      else {
        setGames(prev => {
          const existingGameIndex = prev.findIndex(game => game.gameId === data.game.gameId)
          let updatedGames

          if (existingGameIndex !== -1) {
            // Merge partial update data with existing game data
            updatedGames = [...prev]
            updatedGames[existingGameIndex] = {
              ...updatedGames[existingGameIndex],
              ...data.game
            }

          } else {
            // Add new game to the beginning of the list
            console.log("nothing", data.game)
            updatedGames = [data.game, ...prev]
          }
          console.log("updatedGames", updatedGames)
          const cleanedGames = cleanupOldCompletedGames(updatedGames)
          return sortGames(cleanedGames)
        })
      }
    }
  }, [sortGames, cleanupOldCompletedGames])

  const handleError = useCallback((data: any) => {
    console.error('🎮 Coinflip error:', data)
    // Reset creating state on any error
    setIsCreatingGame(false)
    setIsJoining(false)
    
    showErrorModal({
      title: 'Can not join game',
      message: data.message,
      onClose: () => { handleCloseJoinModal ()}
    })
  }, [])

  const handleCountdownTick = useCallback((data: any) => {
    console.log('⏰ Countdown tick:', data)
    if (data.gameId && data.countdown !== undefined) {
      setCountdown(data.countdown)

      // If countdown reaches 0, start result animation
      if (data.countdown === 0) {
        setCountdown(null)
        // The server should send the result shortly after countdown ends
      }
    }
  }, [])

  const handleGameResult = useCallback((data: any) => {
    console.log('🏆 Game result received:', data)
    if (data.gameId && data.winner && data.result) {
      setGameResult({
        winner: data.winner,
        result: data.result
      })

      // Start the coin flip animation
      setFlipping(true)
      setResult(data.result as "heads" | "tails")

      // Stop animation after 2 seconds and clear result
      setTimeout(() => {
        setFlipping(false)
        setGameResult(null)
        setResult(null)
      }, 2000)
    }
  }, [])


  const handleBalanceUpdate = useCallback((data: any) => {
    // Only update if this balance update is for the current user
    if (data.userId === user.profile?.id) {
      // Update the user's balance in the auth context
      updateBalance(data.newBalance)
    }
  }, [user.profile?.id, updateBalance])

  useSocketEvents({
    'connection_success': handleConnectionSuccess,
    'user_balance_update': handleBalanceUpdate,
    'coinflip_game_init': handleGameInit,
    'coinflip_games_list': handleGamesList,
    'coinflip_game_created_success': handleGameCreated,
    'coinflip_game_completed': handleGameCompleted,
    'coinflip_game_cancelled': handleGameCancelled,
    'coinflip_game_update': handleGameUpdate,
    'coinflip_countdown_tick': handleCountdownTick,
    'coinflip_game_result': handleGameResult,
    'coinflip_error': handleError
  }, 'coinflip-page')

  // No cleanup needed - centralized system handles everything


  return (
    <GameStatusWrapper gameName="coinflip" fallbackTitle="Coinflip Game Unavailable">
      <div className="min-h-screen  text-white">
        <div className="relative z-10 p-6">
          {/* Main Game Section */}

          <div className="max-w-7xl mx-auto flex flex-col gap-8">

            {/* Active games Section */}

            <div className='grid grid-cols-1 2xl:grid-cols-2 gap-4 pb-8'>
              {liveGames.length > 0 && liveGames.map((game) => <CoinflipCard game={game} result={"heads"} key={game.gameId} selfRemove={selfRemove} requestBalanceUpdate={requestBalanceUpdate} />)}
            </div>

            <div className='flex justify-between items-end gap-8 bg-background-alt backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50'>

              <div className="items-center justify-center hidden xl:flex">
                <div className="relative w-24 h-24 perspective-1000">
                  <div className="relative w-full h-full transform-style-preserve-3d animate-coin-flip">
                    {/* Heads side */}
                    <div className="absolute w-full h-full backface-hidden">
                      <Image
                        src="/assets/images/tokens/heads.svg"
                        alt="heads"
                        width={96}
                        height={96}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {/* Tails side */}
                    <div className="absolute w-full h-full backface-hidden rotate-y-180">
                      <Image
                        src="/assets/images/tokens/tails.svg"
                        alt="tails"
                        width={96}
                        height={96}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className='flex gap-8 items-end sm:flex-row flex-col w-full md:w-auto'>
                <NumberInput
                  value={wagerAmount}
                  onValueChange={setWagerAmount}
                  label="Wager Amount"
                  labelPlacement='outside'
                  minValue={0.01}
                  maxValue={1000}
                  placeholder="0.00"
                  className='rounded-lg max-w-sm'
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
                <div className='flex-col lg:flex-row flex gap-2 w-full md:w-auto'>
                  {/* Flip Button */}
                  <div className='flex gap-2 items-center justify-center'>
                    <Button className={`h-12 py-1 bg-transparent ${selectedSide === 'heads' ? 'bg-primary/30' : 'opacity-20'}`} onPress={() => setSelectedSide('heads')}>
                      <Image src={'/assets/images/tokens/heads.svg'} alt='head' width={40} height={40} className={` ${selectedSide === 'heads' ? 'opacity-100' : 'opacity-30'}`} />
                    </Button>
                    <Button className={`h-12 py-1 bg-transparent ${selectedSide === 'tails' ? 'bg-primary/30' : 'opacity-20'}`} onPress={() => setSelectedSide('tails')}>
                      <Image src={'/assets/images/tokens/tails.svg'} alt='tail' width={40} height={40} className={`${selectedSide === 'tails' ? 'opacity-100' : ''}`} />
                    </Button>
                  </div>
                  <PrimaryButton
                    disabled={!user.isAuthenticated}
                    onClick={handleCreateGame}
                    isLoading={isCreatingGame}
                    className="rounded-full text-background bg-primary hover:bg-primary/80 font-bold py-4 h-12 w-full md:w-auto"
                  >
                    {isCreatingGame ? 'Creating Game...' : 'Create Game'}
                  </PrimaryButton>
                </div>
              </div>
            </div>


            {/* Sorting Options */}
            <div className="justify-between items-center mb-4 flex">
              <h2 className="text-2xl font-bold text-white">Active Games</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${sortBy === 'latest'
                    ? 'bg-primary text-background'
                    : 'bg-background-alt text-gray-300 hover:bg-background-alt/80'
                    }`}
                  onPress={() => setSortBy('latest')}
                >
                  <FaCalendar className="w-4 h-4" />
                  Latest Created
                </Button>
                <Button
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${sortBy === 'betting'
                    ? 'bg-primary text-background'
                    : 'bg-background-alt text-gray-300 hover:bg-background-alt/80'
                    }`}
                  onPress={() => setSortBy('betting')}
                >
                  <FaSort className="w-4 h-4" />
                  Betting Amount
                </Button>
              </div>
            </div>

            <div className='flex flex-col gap-4'>
              {games.map((game) => (
                <div key={game.gameId} className={`${game.status === 'completed' ? 'opacity-30 hover:!opacity-100' : ''} group transition duration-500 bg-background-alt w-full cursor-pointer backdrop-blur-sm relative rounded-2xl p-[2px] border border-gray-700/50`}>
                  <div
                    className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-sky-600 rounded-xl blur opacity-5 group-hover:opacity-50 transition duration-500"
                  ></div>
                  <div className='bg-gradient-to-b from-white/10 to-transparent w-full relative p-1 rounded-xl'>
                    <div className='bg-background-alt/80 w-full relative p-4 rounded-lg'>
                      <div className="text-center flex lg:flex-row flex-col gap-4 justify-between items-center">
                        <div className='flex items-center gap-4'>
                          <div className='flex gap-2 justify-start items-center flex-col sm:flex-row'>
                            <div>
                              <Badge isOneChar color="success" content={<Image src={`/assets/images/tokens/${game.coinSide || 'heads'}.svg`} alt={game.creator?.coin || 'heads'} width={20} height={20} />} placement="bottom-right">
                                <Image
                                  src={game.creator?.avatar}
                                  alt={game.creator?.displayName || game.creator?.username}
                                  className="w-14 h-14 rounded-full"
                                />
                              </Badge>
                            </div>

                            <div className='flex flex-col items-center sm:items-start justify-center'>
                              <h4 className="text-white font-bold ">{game.creator?.displayName || game.creator?.username}</h4>
                              <p className="text-gray-400 text-sm ">Level {game.creator?.level}</p>
                            </div>
                          </div>

                          <Image src={`/assets/images/vs.png`} alt='vs' width={60} />
                          {game.joiner ? <div className='flex gap-2 justify-start items-center flex-col sm:flex-row'>
                            <Badge isOneChar color="success" content={<Image src={`/assets/images/tokens/${game.coinSide === 'heads' ? 'tails' : 'heads'}.svg`} alt={game.creator?.coin || 'heads'} width={20} height={20} />} placement="bottom-right">
                              <Image
                                src={game.joiner.avatar}
                                alt={game.joiner?.displayName || game.joiner?.username}
                                className="w-14 h-14 rounded-full"
                              />
                            </Badge>


                            <div className='flex flex-col items-center sm:items-start justify-center'>
                              <h4 className="text-white font-bold ">{game.joiner?.displayName || game.joiner?.username}</h4>
                              <p className="text-gray-400 text-sm ">Level {game.joiner?.level}</p>
                            </div>
                          </div> :
                            <div className='flex gap-2 justify-start items-center flex-col sm:flex-row'>
                              <div className='relative w-14 h-14 rounded-full bg-background flex items-center justify-center flex-col'>
                                <Image src={`/assets/images/tokens/${game.coinSide === 'heads' ? 'tails' : 'heads'}.svg`} alt={game.creator.coin || 'heads'} width={40} height={40} />
                                <Skeleton className="flex rounded-full w-14 h-14 absolute left-0 top-0 bottom-0 right-0" />
                              </div>
                              <div className='flex flex-col items-center sm:items-start justify-center gap-3'>
                                <Skeleton className="h-3 w-20 rounded-lg" />
                                <Skeleton className="h-3 w-16 rounded-lg" />
                              </div>
                            </div>
                          }
                        </div>
                        <div className='flex items-center gap-4'>
                          <div className="flex flex-col rounded-lg bg-back bg-background px-8 py-2 border border-gray-700/50">
                            <span className="text-white font-bold">{game.betAmount.toFixed(2)} USDT</span>
                          </div>
                          <div className="space-y-1 text-sm text-end flex flex-col">
                            <div className="flex items-center gap-1 justify-center flex-col">
                              {(
                                <PrimaryButton
                                  disabled={(game.status !== 'waiting' && game.status !== 'completed') || game.creator._id === user.profile?.id && game.status === 'waiting'}
                                  onClick={() => handleOpenJoinModal(game)}
                                  className='delay-150 bg-primary/80 hover:bg-primary text-background font-bold shadow-md hover:shadow-primary'
                                >
                                  {game.status === 'waiting' ? 'Join' : game.status === 'active' ? 'In Progress' : 'View'}
                                </PrimaryButton>
                              )}
                              {game.creator._id === user.id && (
                                <div className="text-center">
                                  <div className="text-primary font-semibold text-sm">Your Game</div>
                                  <div className="text-gray-400 text-xs">Waiting for opponent</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>



            {/* Call to Action Section */}
            <div className="text-center bg-gradient-to-r from-primary/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-12 border border-gray-700/50">
              <h2 className="text-4xl font-bold text-white mb-4">READY TO TEST YOUR LUCK?</h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Heads or tails? The choice is yours. Place your bet and flip the coin for a chance to double your money instantly.
              </p>
              <PrimaryButton className="bg-primary  text-background font-bold py-4 px-8 rounded-full"
                onClick={() => {
                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                  })
                }}
              >
                Start Playing Now
              </PrimaryButton>
            </div>
          </div>
        </div>

        {/* Join Game Modal */}
        <Modal
          isOpen={joinModalOpen}
          onClose={handleCloseJoinModal}
          placement="auto"
          backdrop="blur"
          size="2xl"
          classNames={{
            base: "bg-background-alt border border-gray-700/50",
            header: "border-b border-gray-700/50",
            body: "py-6",
            footer: "border-t border-gray-700/50"
          }}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <h3 className="text-2xl font-bold text-white">{selectedGame?.status === 'waiting' ? 'Join Coinflip Game' : 'View Coinflip Game'}</h3>
                  <p className="text-gray-400 text-sm">Choose your side and join the game</p>
                </ModalHeader>

                <ModalBody>
                  {selectedGame && (
                    <div className="space-y-6">
                      {/* Countdown Display */}
                      {countdown !== null && (
                        <div className="text-center py-8">
                          <div className="text-6xl font-bold text-primary mb-4">
                            {countdown}
                          </div>
                          <p className="text-white text-lg">Game starting...</p>
                        </div>
                      )}

                      {/* Result Animation */}
                      {/* {(flipping || gameResult) && (
                        <div className="text-center py-8">
                          <div className="mb-6">
                            
                          </div>
                          {gameResult && (
                            <div className="mb-4">
                              <h3 className="text-2xl font-bold text-primary mb-2">
                                {gameResult.winner === user.profile?.username ? 'You Won!' : `${gameResult.winner} Won!`}
                              </h3>
                              <p className="text-white">Result: {gameResult.result}</p>
                            </div>
                          )}
                        </div>
                      )} */}

                      {/* Game Info */}
                      <div className="bg-background/50 rounded-lg p-4 border border-gray-700/30">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-3">
                              <Badge isOneChar color="success" content={<Image src={`/assets/images/tokens/${selectedGame.coinSide || 'heads'}.svg`} alt={selectedGame.creator.coin || 'heads'} width={20} height={20} />} placement="bottom-right">
                                <Image
                                  src={selectedGame.creator.avatar}
                                  alt={selectedGame.creator?.displayName || selectedGame.creator?.username}
                                  className="w-12 h-12 rounded-full"
                                />
                              </Badge>
                              <div>
                                <h4 className="text-white font-semibold">{selectedGame.creator?.displayName || selectedGame.creator?.username}</h4>
                                <p className="text-gray-400 text-sm">Level {selectedGame.creator.level}</p>
                              </div>
                            </div>
                            {selectedGame.joiner && <Image src={`/assets/images/vs.png`} alt='vs' width={60} />}
                            {selectedGame.joiner && <div className="flex items-center gap-3">
                              <Badge isOneChar color="success" content={<Image src={`/assets/images/tokens/${selectedGame.coinSide === 'heads' ? 'tails' : 'heads'}.svg`} alt={selectedGame.creator.coin || 'heads'} width={20} height={20} />} placement="bottom-right">
                                <Image
                                  src={selectedGame.joiner?.avatar}
                                  alt={selectedGame.joiner?.displayName || selectedGame.joiner?.username}
                                  className="w-12 h-12 rounded-full"
                                />
                              </Badge>
                              <div>
                                <h4 className="text-white font-semibold">{selectedGame.joiner?.displayName || selectedGame.joiner?.username}</h4>
                                <p className="text-gray-400 text-sm">Level {selectedGame.joiner?.level}</p>
                              </div>
                            </div>}
                          </div>

                          <div className="text-right">
                            <p className="text-white font-bold text-lg">{(2 * selectedGame.betAmount).toFixed(2)} USDT</p>
                            <p className="text-gray-400 text-sm">Wager Amount</p>
                          </div>
                        </div>
                        {!isJoining && (selectedGame.status === 'completed' ?
                          <div className="flex items-center flex-col">
                            <h5 className="text-white font-semibold">Winner</h5>
                            <div className="flex items-center gap-2 flex-col relative">
                              <div className="flex items-center gap-2">
                                <Image
                                  src={selectedGame.winner?.avatar}
                                  alt={selectedGame.winner?.displayName || selectedGame.winner?.username}
                                  width={100}
                                  height={100}
                                  className='rounded-full'
                                />
                                <Image src={`/assets/images/tokens/${selectedGame.winner?._id === selectedGame.creator._id ? (selectedGame.coinSide || 'heads') : (selectedGame.coinSide === 'heads' ? 'tails' : 'heads')}.svg`} alt={selectedGame.winner?._id === selectedGame.creator._id ? (selectedGame.coinSide || 'heads') : (selectedGame.coinSide === 'heads' ? 'tails' : 'heads')} width={100} height={100} />
                              </div>
                              <p className="text-gray-400 text-sm mt-1">{selectedGame.winner?.displayName || selectedGame.winner?.username}</p>
                            </div>
                          </div> :

                          <div className="flex items-center justify-center gap-4">
                            <div className="flex flex-col items-center">
                              <Image
                                src={`/assets/images/tokens/${selectedGame.coinSide || 'heads'}.svg`}
                                alt={selectedGame.coinSide || 'heads'}
                                width={80}
                                height={80}
                              />
                              <p className="text-gray-400 text-sm mt-1">{selectedGame.coinSide || 'heads'}</p>
                              <p className="text-xs text-gray-500">Creator&apos;s choice</p>
                            </div>

                            <div className="text-gray-400 animate-blink"><Image src={'/assets/images/vs.png'} alt='vs' width={60} /></div>

                            <div className="flex flex-col items-center">
                              <Image
                                src={`/assets/images/tokens/${joinSide}.svg`}
                                alt={joinSide}
                                width={80}
                                height={80}
                              />
                              <p className="text-gray-400 text-sm mt-1">{joinSide}</p>
                              <p className="text-xs text-gray-500">Your choice</p>
                            </div>
                          </div>)}
                        {isJoining && <div className="w-20 h-20 perspective mx-auto">
                          <div
                            className={`relative w-full h-full transition-transform duration-1000 transform-style-preserve-3d ${flipping ? "animate-flip" : result === "tails" ? "rotate-y-180" : ""
                              }`}
                          >
                            {/* Heads */}
                            <div className="absolute w-full h-full backface-hidden">
                              <Image
                                src={`/assets/images/tokens/heads.svg`}
                                alt="heads"
                                width={80}
                                height={80}
                              />
                            </div>
                            {/* Tails */}
                            <div className="absolute w-full h-full rotate-y-180 backface-hidden">
                              <Image
                                src={`/assets/images/tokens/tails.svg`}
                                alt="tails"
                                width={80}
                                height={80}
                              />
                            </div>
                          </div>
                        </div>}
                      </div>

                      {user.isAuthenticated && !user.profile?.seed &&
                        <div className='bg-danger/10 px-4 py-2 rounded-lg border border-danger'>
                          <p className='text-danger text-sm'>You don&apos;t have a seed. Please generate one in
                            <Link href="/account/settings" className='text-blue-400 underline'>&nbsp;profile settings</Link>.</p>
                        </div>}
                    </div>
                  )}
                </ModalBody>

                <ModalFooter className="gap-3">
                  <Button
                    variant="light"
                    onPress={handleCloseJoinModal}
                    className="text-gray-400 rounded-full border-primary border"
                    disabled={isJoining || countdown !== null || flipping}
                  >
                    {selectedGame?.status === 'waiting' ? 'Cancel' : 'Close'}
                  </Button>
                  {selectedGame?.status === 'waiting' && user.profile?.seed && countdown === null && !flipping && !gameResult && <PrimaryButton
                    onClick={handleJoinGame}
                    isLoading={isJoining}
                    disabled={!selectedGame}
                    className="bg-primary hover:bg-primary/80 text-background font-bold"
                  >
                    {isJoining ? 'Joining...' : `Join Game (${selectedGame?.betAmount.toFixed(2)} USDT)`}
                  </PrimaryButton>
                  }
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div >
    </GameStatusWrapper>
  )
}
