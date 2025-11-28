'use client';

import React from 'react';
import { Card, CardBody, CardHeader, Progress, Chip, Avatar } from '@heroui/react';
import { FaTrophy, FaMedal, FaCoins, FaChartLine, FaCrown } from 'react-icons/fa';
import { useXP } from '@/contexts/XPContext';

const XPStats: React.FC = () => {
    const { xpStats, achievements, loading } = useXP();

    if (loading || !xpStats) {
        return (
            <div className="space-y-4">
                <div className="animate-pulse">
                    <div className="h-32 bg-gray-700 rounded-lg"></div>
                </div>
                <div className="animate-pulse">
                    <div className="h-24 bg-gray-700 rounded-lg"></div>
                </div>
            </div>
        );
    }

    const getLevelTitle = (level: number) => {
        if (level >= 100) return 'Legend';
        if (level >= 50) return 'Elite';
        if (level >= 25) return 'Veteran';
        if (level >= 10) return 'Experienced';
        if (level >= 5) return 'Rising Star';
        return 'Beginner';
    };

    const getLevelColor = (level: number) => {
        if (level >= 100) return 'text-yellow-400';
        if (level >= 50) return 'text-purple-400';
        if (level >= 25) return 'text-blue-400';
        if (level >= 10) return 'text-green-400';
        if (level >= 5) return 'text-orange-400';
        return 'text-gray-400';
    };

    const unlockedAchievements = achievements ? 
        Object.values(achievements).filter(achievement => achievement.unlocked).length : 0;
    const totalAchievements = achievements ? Object.keys(achievements).length : 0;

    return (
        <div className="space-y-6">
            {/* Level and Progress */}
            <Card className="bg-background-light border border-gray-700">
                <CardHeader className="flex flex-col items-center space-y-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <FaTrophy className="text-2xl text-white" />
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">
                                Level {xpStats?.currentLevel}
                            </div>
                            <div className={`text-lg font-semibold ${getLevelColor(xpStats?.currentLevel)}`}>
                                {getLevelTitle(xpStats.currentLevel)}
                            </div>
                        </div>
                    </div>
                    
                    <div className="w-full space-y-2">
                        <div className="flex justify-between text-sm text-gray-300">
                            <span>Progress to Level {xpStats?.currentLevel + 1}</span>
                            <span>{xpStats?.levelProgress?.toFixed(1)}%</span>
                        </div>
                        <Progress
                            value={xpStats?.levelProgress}
                            color="primary"
                            className="h-3"
                            classNames={{
                                track: "bg-gray-800",
                                indicator: "bg-gradient-to-r from-blue-500 to-purple-500"
                            }}
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>{xpStats?.currentXP?.toLocaleString()} XP</span>
                            <span>{xpStats?.nextLevelXP?.toLocaleString()} XP needed</span>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-background-light border border-gray-700">
                    <CardBody className="text-center space-y-2">
                        <FaCoins className="text-2xl text-yellow-500 mx-auto" />
                        <div className="text-lg font-bold text-white">
                            {xpStats?.totalXP?.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-400">Total XP</div>
                    </CardBody>
                </Card>

                <Card className="bg-background-light border border-gray-700">
                    <CardBody className="text-center space-y-2">
                        <FaChartLine className="text-2xl text-green-500 mx-auto" />
                        <div className="text-lg font-bold text-white">
                            {xpStats?.totalWagered?.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-400">Wagered</div>
                    </CardBody>
                </Card>

                <Card className="bg-background-light border border-gray-700">
                    <CardBody className="text-center space-y-2">
                        <FaMedal className="text-2xl text-purple-500 mx-auto" />
                        <div className="text-lg font-bold text-white">
                            {unlockedAchievements}/{totalAchievements}
                        </div>
                        <div className="text-sm text-gray-400">Achievements</div>
                    </CardBody>
                </Card>

                <Card className="bg-background-light border border-gray-700">
                    <CardBody className="text-center space-y-2">
                        <FaCrown className="text-2xl text-orange-500 mx-auto" />
                        <div className="text-lg font-bold text-white">
                            #{xpStats?.rank}
                        </div>
                        <div className="text-sm text-gray-400">Global Rank</div>
                    </CardBody>
                </Card>
            </div>

            {/* Recent Achievements */}
            {achievements && (
                <Card className="bg-background-light border border-gray-700">
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-white">Recent Achievements</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-2">
                            {Object.entries(achievements)
                                .filter(([_, achievement]) => achievement.unlocked)
                                .slice(0, 3)
                                .map(([key, achievement]) => (
                                    <div key={key} className="flex items-center space-x-3 p-2 bg-background/50 rounded-lg">
                                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                            <FaTrophy className="text-sm text-white" />
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{achievement.name}</div>
                                            <div className="text-gray-400 text-sm">{achievement.description}</div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
};

export default XPStats;
