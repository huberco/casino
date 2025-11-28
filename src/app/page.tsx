'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { FaCoins, FaBomb, FaDice } from 'react-icons/fa'
import { FaChartLine as FaChartLineSolid } from 'react-icons/fa'
import AnimatedText from '@/components/AnimatedText'
import { useGameStatus } from '@/hooks/useGameStatus'
import GameCard from '@/components/cards/GameCard'
import { FaChartLine } from 'react-icons/fa6'
export default function Home() {
  const router = useRouter()
  const { gameStatuses, loading, error, refetch } = useGameStatus();
  const games = [
    {
      id: 'roulette',
      name: 'Roulette',
      description: 'Bet on heads, tails, or crown. Simple yet exciting!',
      icon: <FaDice className="text-4xl" />,
      color: 'from-purple-500 to-pink-500',
      hoverColor: 'from-purple-600 to-pink-600',
      videoSrc: '/videos/roulette-preview.mp4',
      fallbackImage: '/assets/images/games/roulette-preview.jpg',
      route: '/game/roulette',
      features: ['2X Payout', 'Crown 10X', 'Provably Fair']
    },
    {
      id: 'crash',
      name: 'Crash',
      description: 'Watch the multiplier rise and cash out before it crashes!',
      icon: <FaChartLine className="text-4xl" />,
      color: 'from-red-500 to-orange-500',
      hoverColor: 'from-red-600 to-orange-600',
      videoSrc: '/videos/crash-preview.mp4',
      fallbackImage: '/assets/images/games/crash-preview.jpg',
      route: '/game/crash',
      features: ['High Multipliers', 'Quick Rounds', 'Real-time']
    },
    {
      id: 'mine',
      name: 'Mine',
      description: 'Navigate the minefield and collect treasures safely!',
      icon: <FaBomb className="text-4xl" />,
      color: 'from-yellow-500 to-amber-500',
      hoverColor: 'from-yellow-600 to-amber-600',
      videoSrc: '/videos/mine-preview.mp4',
      fallbackImage: '/assets/images/games/mine-preview.jpg',
      route: '/game/mine',
      features: ['Strategic Play', 'Risk vs Reward', 'Multiple Mines']
    },
    {
      id: 'coinflip',
      name: 'Coinflip',
      description: 'Simple 50/50 chance game. Double or nothing!',
      icon: <FaCoins className="text-4xl" />,
      color: 'from-blue-500 to-cyan-500',
      hoverColor: 'from-blue-600 to-cyan-600',
      videoSrc: '/videos/coinflip-preview.mp4',
      fallbackImage: '/assets/images/games/coinflip-preview.jpg',
      route: '/game/coinflip',
      features: ['50/50 Odds', 'Instant Results', 'Easy to Play']
    },
    // {
    //   id: 'feature-trading',
    //   name: 'Feature Trading',
    //   description: 'Trade cryptocurrencies with leverage in real-time!',
    //   icon: <FaChartLineSolid className="text-4xl" />,
    //   color: 'from-emerald-500 to-teal-500',
    //   hoverColor: 'from-emerald-600 to-teal-600',
    //   videoSrc: '/videos/feature-trading-preview.mp4',
    //   fallbackImage: '/assets/images/games/feature-trading-preview.jpg',
    //   route: '/game/feature-trading',
    //   features: ['Leverage Trading', 'Real-time Charts', 'Multiple Pairs']
    // }
  ]


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-alt to-background">
      {/* Hero Section */}
      <div className="container mx-auto py-16 px-8">
        <div className="text-center mb-16">
          <AnimatedText
            text="SpinX Games"
            className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-b from-primary to-primary/40 bg-clip-text text-transparent"
            type="typewriter"
            duration={0.1}
            delay={0.5}
            stagger={0.1}
          />
          <AnimatedText
            text="Experience the thrill of provably fair gaming with our collection of exciting games. Play, win, and enjoy transparent gameplay."
            className="md:text-xl text-white/50 max-w-2xl mx-auto mb-8"
            type="fade"
            duration={0.3}
            delay={2.0}
            stagger={0.01}
          />
          <div className="flex justify-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Provably Fair
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Instant Withdrawals
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              24/7 Support
            </span>
          </div>
        </div>
        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto px-8">
          {games.map((game) => (
            <GameCard key={game.id} game={game} online={gameStatuses?.gameStatuses?.find((status: any) => status.gameType === game.id)?.activePlayers || 0} />
          ))}
        </div>
      </div>
    </div>
  )
}