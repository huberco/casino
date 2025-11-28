'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner, Tabs, Tab } from '@heroui/react';
import { FaTrophy, FaMedal, FaCrown, FaSync } from 'react-icons/fa';
import { useXP } from '@/contexts/XPContext';
import XPStats from '@/components/XP/XPStats';
import { gameApi } from '@/lib/api';
import { LeaderboardEntry } from '@/types/xp';

const XPPage: React.FC = () => {
    const { xpStats, achievements, loading, fetchXPStats, fetchAchievements } = useXP();
    const [levelLeaderboard, setLevelLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [wageringLeaderboard, setWageringLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);
    const [selectedTab, setSelectedTab] = useState('stats');

    const fetchLeaderboards = async () => {
        setLeaderboardLoading(true);
        try {
            const [levelResponse, wageringResponse] = await Promise.all([
                gameApi.xp.getLevelLeaderboard(10),
                gameApi.xp.getWageringLeaderboard(10)
            ]);

            console.log('Level leaderboard response:', levelResponse);
            console.log('Wagering leaderboard response:', wageringResponse);

            if (levelResponse.success) {
                setLevelLeaderboard(levelResponse.data.data);
                console.log('Level leaderboard data:', levelResponse.data.data);
            } else {
                console.error('Level leaderboard failed:', levelResponse.error);
            }

            if (wageringResponse.success) {
                setWageringLeaderboard(wageringResponse.data.data);
                console.log('Wagering leaderboard data:', wageringResponse.data.data);
            } else {
                console.error('Wagering leaderboard failed:', wageringResponse.error);
            }
        } catch (error) {
            console.error('Error fetching leaderboards:', error);
        } finally {
            setLeaderboardLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboards();
    }, []);

    const handleRefresh = async () => {
        await Promise.all([
            fetchXPStats(),
            fetchAchievements(),
            fetchLeaderboards()
        ]);
    };

    const renderLeaderboard = (entries: LeaderboardEntry[], title: string, isLevelLeaderboard: boolean = true) => {
        const currentUserInTop10 = entries?.some(entry => entry.username === xpStats?.username);
        const currentUserRank = xpStats?.rank || 0;

        return (
            <Card className="bg-background-light border border-gray-700">
                <CardHeader>
                    <h3 className="text-lg font-semibold text-white/50 uppercase w-full text-center">{title}</h3>
                </CardHeader>
                <CardBody>
                    {leaderboardLoading ? (
                        <div className="flex justify-center py-8">
                            <Spinner size="lg" />
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            No leaderboard data available
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {/* Top 10 Players */}
                            {entries.map((entry, index) => (
                                <div key={index} className="bg-background-alt hover:bg-background-light transition-all duration-300 shadow-sm shadow-white/10 my-1 flex items-center justify-between p-2  rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        {index < 3 ?
                                            <div className="relative">
                                                <FaCrown className={`text-xl ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-white' : 'text-amber-700'}`} />
                                            </div>
                                            :
                                            <div className="relative">
                                                <FaMedal className={`text-2xl text-white/15`} />
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold">
                                                    {index + 1}
                                                </div>
                                            </div>
                                        }
                                        <div className="flex items-center space-x-3">
                                            {entry.avatar ? (
                                                <img
                                                    src={entry.avatar}
                                                    alt={entry.displayName}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                                    <span className="text-white text-sm font-medium">
                                                        {entry.displayName.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-white font-medium">{entry.displayName}</div>
                                                <div className="text-gray-400 text-sm">Level {entry.level}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-medium">
                                            {isLevelLeaderboard ? entry.totalXP.toLocaleString() : entry.totalWagered.toFixed(2)}
                                        </div>
                                        <div className="text-gray-400 text-sm">
                                            {isLevelLeaderboard ? 'XP' : 'Wagered'}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Current User Ranking (if not in top 10) */}
                            {!currentUserInTop10 && xpStats && currentUserRank > 10 && (
                                <>
                                    <div className="border-t border-gray-600 my-4"></div>
                                    <div className="bg-background-alt hover:bg-background-light transition-all duration-300 shadow-sm shadow-white/10 my-1 flex items-center justify-between p-2 border border-gray-700 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br border border-gray-700 font-bold text-sm">
                                                {currentUserRank}
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                {xpStats.avatar ? (
                                                    <img
                                                        src={xpStats.avatar}
                                                        alt={xpStats.displayName}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                                        <span className="text-white text-sm font-medium">
                                                            {xpStats.displayName.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-white font-medium">{xpStats.displayName}</div>
                                                    <div className="text-gray-400 text-sm">Level {xpStats.currentLevel}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-white font-medium">
                                                {isLevelLeaderboard ? xpStats.totalXP.toLocaleString() : xpStats.totalWagered.toFixed(2)}
                                            </div>
                                            <div className="text-gray-400 text-sm">
                                                {isLevelLeaderboard ? 'XP' : 'Wagered'}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </CardBody>
            </Card>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center h-64">
                        <Spinner size="lg" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
                                <FaTrophy className="text-yellow-500" />
                                <span>Experience & Levels</span>
                            </h1>
                            <p className="text-gray-400 mt-2">
                                Track your progress, achievements, and compete with other players
                            </p>
                        </div>
                        <Button
                            className='bg-transparent'
                            color="primary"
                            variant="flat"
                            onPress={handleRefresh}
                            startContent={<FaSync className='hover:text-primary hover:scale-110 transition-all duration-300 text-xl text-primary/50' />}
                        >
                        </Button>
                    </div>

                    {/* Tabs */}
                    <Tabs
                        selectedKey={selectedTab}
                        onSelectionChange={(key) => setSelectedTab(key as string)}
                        color="primary"
                        variant="underlined"
                        classNames={{
                            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                            cursor: "w-full bg-primary",
                            tab: "max-w-fit px-0 h-12",
                            tabContent: "group-data-[selected=true]:text-primary"
                        }}
                    >
                        <Tab key="stats" title="Your Stats">
                            <XPStats />
                        </Tab>

                        <Tab key="achievements" title="Achievements">
                            <Card className="bg-background-light border border-gray-700">
                                <CardHeader>
                                    <h3 className="text-lg font-semibold text-white">Achievements</h3>
                                </CardHeader>
                                <CardBody>
                                    {achievements ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {Object.entries(achievements).map(([key, achievement]) => (
                                                <div
                                                    key={key}
                                                    className={`p-4 rounded-lg border-2 transition-all ${achievement.unlocked
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-gray-700 bg-background/50'
                                                        }`}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${achievement.unlocked
                                                            ? 'bg-primary'
                                                            : 'bg-gray-700'
                                                            }`}>
                                                            <FaMedal className={`text-lg ${achievement.unlocked
                                                                ? 'text-background'
                                                                : 'text-gray-500'
                                                                }`} />
                                                        </div>
                                                        <div>
                                                            <div className={`font-medium ${achievement.unlocked
                                                                ? 'text-white'
                                                                : 'text-gray-400'
                                                                }`}>
                                                                {achievement.name}
                                                            </div>
                                                            <div className="text-sm text-gray-400">
                                                                {achievement.description}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            No achievements available
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Tab>

                        <Tab key="leaderboards" title="Leaderboards">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {renderLeaderboard(levelLeaderboard, 'Level Leaderboard', true)}
                                {renderLeaderboard(wageringLeaderboard, 'Wagering Leaderboard', false)}
                            </div>
                        </Tab>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default XPPage;
