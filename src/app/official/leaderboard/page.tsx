'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, Avatar, Chip, Button, Tabs, Tab } from '@heroui/react'
import { gameApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { FaTrophy, FaMedal, FaAward, FaCrown, FaUser, FaSync } from 'react-icons/fa'
import LeaderboardCard from '@/components/cards/LeaderboardCard'

interface LeaderboardEntry {
    username: string
    displayName: string
    avatar?: string
    level: number
    totalXP: number
    totalWagered: number
    rank?: number
}

interface LeaderboardData {
    leaderboard: LeaderboardEntry[]
    currentUser?: LeaderboardEntry & { rank: number }
}

export default function LeaderboardPage() {
    const { user } = useAuth()
    const [data, setData] = useState<LeaderboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedTab, setSelectedTab] = useState<'level' | 'wagering' | 'weekly-wagering'>('weekly-wagering')

    useEffect(() => {
        loadLeaderboard()
    }, [selectedTab])

    const loadLeaderboard = async () => {
        setLoading(true)
        setError(null)
        try {
            const endpoint = selectedTab === 'level'
                ? '/xp/leaderboard/level'
                : '/xp/leaderboard/wagering'

            let response
            if (selectedTab === 'level') {
                response = await gameApi.xp.getLevelLeaderboard(10)
            } else if (selectedTab === 'wagering') {
                response = await gameApi.xp.getWageringLeaderboard(10)
            } else {
                response = await gameApi.xp.getWeeklyWageringLeaderboard(10)
            }

            if (response.success && response.data) {
                const leaderboard = response.data.data.map((entry: any, index: number) => ({
                    ...entry,
                    rank: index + 1
                }))

                // Find current user's rank
                let currentUser = null
                if (user?.profile?.username) {
                    const userIndex = leaderboard.findIndex(
                        (entry: LeaderboardEntry) => entry.username === user.profile?.username
                    )
                    if (userIndex !== -1) {
                        currentUser = { ...leaderboard[userIndex], rank: userIndex + 1 }
                    }
                }

                setData({
                    leaderboard: leaderboard.slice(0, 10), // Top 10
                    currentUser
                })
            } else {
                setError(response.error || 'Failed to load leaderboard')
            }
        } catch (err) {
            console.error('Error loading leaderboard:', err)
            setError('Failed to load leaderboard')
        } finally {
            setLoading(false)
        }
    }

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <FaCrown className="text-yellow-500" />
            case 2:
                return <FaMedal className="text-gray-400" />
            case 3:
                return <FaAward className="text-amber-600" />
            default:
                return <FaTrophy className="text-gray-600" />
        }
    }

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1:
                return 'text-yellow-500'
            case 2:
                return 'text-gray-400'
            case 3:
                return 'text-amber-600'
            default:
                return 'text-gray-400'
        }
    }

    const formatAmount = (amount: number) => {
        if (amount >= 1000000) {
            return `$${(amount / 1000000).toFixed(1)}M`
        } else if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(1)}K`
        } else {
            return `$${amount.toFixed(2)}`
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-white mb-2">Loading Leaderboard...</h2>
                    <p className="text-gray-400">Fetching the latest rankings</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-white mb-2">Error Loading Leaderboard</h2>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <Button
                        color="primary"
                        onClick={loadLeaderboard}
                        startContent={<FaSync />}
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto md:px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">🏆 Leaderboard</h1>
                    <div className='flex flex-col items-center justify-center mt-12 pt-8 gap-4'>
                        <LeaderboardCard className="block md:hidden" player={data?.leaderboard[0]} rank="gold" />
                        <div className="justify-center gap-4 flex">
                            <LeaderboardCard player={data?.leaderboard[1]} rank="silver" />
                            <LeaderboardCard className="-mt-10 md:block hidden" player={data?.leaderboard[0]} rank="gold" />
                            <LeaderboardCard player={data?.leaderboard[2]} rank="bronze" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-4xl mx-auto mb-8">
                    <Tabs
                        selectedKey={selectedTab}
                        onSelectionChange={(key) => setSelectedTab(key as 'level' | 'wagering' | 'weekly-wagering')}
                        className="w-full"
                        classNames={{
                            tabList: "bg-background-alt",
                            tab: "text-gray-300",
                            tabContent: "text-gray-300",
                            cursor: "bg-primary"
                        }}
                    >
                        <Tab key="weekly-wagering" title="Weekly Wagered">
                            <div className="mt-6">
                                <Card className="bg-background-alt">
                                    <CardHeader className="pb-0">
                                        <div className="flex items-center justify-between w-full">
                                            <div>
                                                <h3 className="text-xl font-semibold text-white">Top 10 Weekly Wagering Champions</h3>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    Current week: {new Date().toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })} - {new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="light"
                                                onClick={loadLeaderboard}
                                                startContent={<FaSync />}
                                                className="text-gray-400"
                                            >
                                                Refresh
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        {data?.leaderboard && data.leaderboard.length > 0 ? (
                                            <div className="space-y-4">
                                                {data.leaderboard.map((player, index) => (
                                                    <div
                                                        key={player.username}
                                                        className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${index < 3
                                                            ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30'
                                                            : 'bg-background hover:bg-background-alt'
                                                            }`}
                                                    >
                                                        <div className="flex items-center space-x-4">
                                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-background">
                                                                {getRankIcon(player.rank || index + 1)}
                                                            </div>
                                                            <div className="flex items-center space-x-3">
                                                                <Avatar
                                                                    src={player.avatar || '/assets/images/avatar/default.png'}
                                                                    size="md"
                                                                    className="border-2 border-primary/30"
                                                                />
                                                                <div>
                                                                    <h4 className="text-white font-semibold truncate max-w-[150px]" title={player.displayName || player.username}>
                                                                        {player.displayName || player.username}
                                                                    </h4>
                                                                    <div className="flex items-center space-x-2">
                                                                        <Chip size="sm" color="primary" variant="flat">
                                                                            Level {player.level}
                                                                        </Chip>
                                                                        <span className="text-gray-400 text-sm">
                                                                            {player.totalXP.toLocaleString()} XP
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`text-2xl font-bold ${getRankColor(player.rank || index + 1)}`}>
                                                                {formatAmount(player.totalWagered)}
                                                            </div>
                                                            <div className="text-gray-400 text-sm">Weekly Wagered</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
                                                <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
                                                <p className="text-gray-400">No wagering data found for this period</p>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>

                                {/* Current User Ranking */}
                                {data?.currentUser && (
                                    <Card className="bg-background-alt mt-6 border border-primary/30">
                                        <CardHeader>
                                            <h3 className="text-lg font-semibold text-white flex items-center">
                                                <FaUser className="mr-2" />
                                                Your Ranking
                                            </h3>
                                        </CardHeader>
                                        <CardBody>
                                            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10">
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
                                                        <span className="text-primary font-bold text-lg">
                                                            #{data.currentUser.rank}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <Avatar
                                                            src={data.currentUser.avatar || '/assets/images/avatar/default.png'}
                                                            size="md"
                                                            className="border-2 border-primary"
                                                        />
                                                        <div>
                                                            <h4 className="text-white font-semibold truncate max-w-[150px]" title={data.currentUser.displayName || data.currentUser.username}>
                                                                {data.currentUser.displayName || data.currentUser.username}
                                                            </h4>
                                                            <div className="flex items-center space-x-2">
                                                                <Chip size="sm" color="primary" variant="flat">
                                                                    Level {data.currentUser.level}
                                                                </Chip>
                                                                <span className="text-gray-400 text-sm">
                                                                    {data.currentUser.totalXP.toLocaleString()} XP
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-primary">
                                                        {formatAmount(data.currentUser.totalWagered)}
                                                    </div>
                                                    <div className="text-gray-400 text-sm">Weekly Wagered</div>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Card>
                                )}
                            </div>
                        </Tab>

                        <Tab key="wagering" title="Total Wagered">
                            <div className="mt-6">
                                <Card className="bg-background-alt">
                                    <CardHeader className="pb-0">
                                        <div className="flex items-center justify-between w-full">
                                            <h3 className="text-xl font-semibold text-white">Top 10 Total Wagering Champions</h3>
                                            <Button
                                                size="sm"
                                                variant="light"
                                                onClick={loadLeaderboard}
                                                startContent={<FaSync />}
                                                className="text-gray-400"
                                            >
                                                Refresh
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        {data?.leaderboard && data.leaderboard.length > 0 ? (
                                            <div className="space-y-4">
                                                {data.leaderboard.map((player, index) => (
                                                    <div
                                                        key={player.username}
                                                        className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${index < 3
                                                            ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30'
                                                            : 'bg-background hover:bg-background-alt'
                                                            }`}
                                                    >
                                                        <div className="flex items-center space-x-4">
                                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-background">
                                                                {getRankIcon(player.rank || index + 1)}
                                                            </div>
                                                            <div className="flex items-center space-x-3">
                                                                <Avatar
                                                                    src={player.avatar || '/assets/images/avatar/default.png'}
                                                                    size="md"
                                                                    className="border-2 border-primary/30"
                                                                />
                                                                <div>
                                                                    <h4 className="text-white font-semibold truncate max-w-[150px]" title={player.displayName || player.username}>
                                                                        {player.displayName || player.username}
                                                                    </h4>
                                                                    <div className="flex items-center space-x-2">
                                                                        <Chip size="sm" color="primary" variant="flat">
                                                                            Level {player.level}
                                                                        </Chip>
                                                                        <span className="text-gray-400 text-sm">
                                                                            {player.totalXP.toLocaleString()} XP
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`text-2xl font-bold ${getRankColor(player.rank || index + 1)}`}>
                                                                {formatAmount(player.totalWagered)}
                                                            </div>
                                                            <div className="text-gray-400 text-sm">Total Wagered</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
                                                <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
                                                <p className="text-gray-400">No wagering data found</p>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            </div>
                        </Tab>

                        <Tab key="level" title="Level Rankings">
                            <div className="mt-6">
                                <Card className="bg-background-alt">
                                    <CardHeader className="pb-0">
                                        <div className="flex items-center justify-between w-full">
                                            <h3 className="text-xl font-semibold text-white">Top 10 Level Champions</h3>
                                            <Button
                                                size="sm"
                                                variant="light"
                                                onClick={loadLeaderboard}
                                                startContent={<FaSync />}
                                                className="text-gray-400"
                                            >
                                                Refresh
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        {data?.leaderboard && data.leaderboard.length > 0 ? (
                                            <div className="space-y-4">
                                                {data.leaderboard.map((player, index) => (
                                                    <div
                                                        key={player.username}
                                                        className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${index < 3
                                                            ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30'
                                                            : 'bg-background hover:bg-background-alt'
                                                            }`}
                                                    >
                                                        <div className="flex items-center space-x-4">
                                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-background">
                                                                {getRankIcon(player.rank || index + 1)}
                                                            </div>
                                                            <div className="flex items-center space-x-3">
                                                                <Avatar
                                                                    src={player.avatar || '/assets/images/avatar/default.png'}
                                                                    size="md"
                                                                    className="border-2 border-primary/30"
                                                                />
                                                                <div>
                                                                    <h4 className="text-white font-semibold truncate max-w-[150px]" title={player.displayName || player.username}>
                                                                        {player.displayName || player.username}
                                                                    </h4>
                                                                    <div className="flex items-center space-x-2">
                                                                        <Chip size="sm" color="secondary" variant="flat">
                                                                            Level {player.level}
                                                                        </Chip>
                                                                        <span className="text-gray-400 text-sm">
                                                                            {formatAmount(player.totalWagered)} wagered
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`text-2xl font-bold ${getRankColor(player.rank || index + 1)}`}>
                                                                {player.totalXP.toLocaleString()}
                                                            </div>
                                                            <div className="text-gray-400 text-sm">Total XP</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <FaTrophy className="text-6xl text-gray-600 mx-auto mb-4" />
                                                <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
                                                <p className="text-gray-400">No level data found</p>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            </div>
                        </Tab>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
