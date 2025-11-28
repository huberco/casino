'use client';

import React, { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, Button, Progress } from '@heroui/react';
import { FaTrophy, FaStar, FaFire } from 'react-icons/fa';
import { useXP } from '@/contexts/XPContext';

const LevelUpNotification: React.FC = () => {
    const { showLevelUpNotification, levelUpData, hideLevelUpNotification } = useXP();
    const [animationProgress, setAnimationProgress] = useState(0);

    useEffect(() => {
        if (showLevelUpNotification) {
            setAnimationProgress(0);
            const interval = setInterval(() => {
                setAnimationProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 2;
                });
            }, 50);

            return () => clearInterval(interval);
        }
    }, [showLevelUpNotification]);

    if (!showLevelUpNotification || !levelUpData) {
        return null;
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

    return (
        <Modal
            isOpen={showLevelUpNotification}
            onOpenChange={hideLevelUpNotification}
            size="md"
            backdrop="blur"
            hideCloseButton
            isDismissable={false}
            classNames={{
                base: "bg-gradient-to-br from-purple-900/90 to-blue-900/90 border border-purple-500/30",
                backdrop: "bg-black/60"
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                                <FaTrophy className="text-3xl text-white" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                                <FaFire className="text-sm text-white" />
                            </div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Level Up!</h2>
                    <p className="text-gray-300">Congratulations on reaching a new level!</p>
                </ModalHeader>
                
                <ModalBody className="text-center space-y-4">
                    <div className="space-y-2">
                        <div className="text-4xl font-bold text-white">
                            Level {levelUpData.newLevel}
                        </div>
                        <div className={`text-lg font-semibold ${getLevelColor(levelUpData.newLevel)}`}>
                            {getLevelTitle(levelUpData.newLevel)}
                        </div>
                        {levelUpData.levelsGained > 1 && (
                            <div className="text-sm text-gray-400">
                                +{levelUpData.levelsGained} levels gained!
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="text-sm text-gray-300">Total Experience</div>
                        <div className="text-xl font-bold text-white">
                            {levelUpData.totalXP.toLocaleString()} XP
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-sm text-gray-300">Progress to Next Level</div>
                        <Progress
                            value={animationProgress}
                            color="primary"
                            className="h-2"
                            classNames={{
                                track: "bg-gray-800",
                                indicator: "bg-gradient-to-r from-blue-500 to-purple-500"
                            }}
                        />
                    </div>

                    <div className="flex justify-center space-x-2 pt-4">
                        <div className="flex items-center space-x-1 text-yellow-400">
                            <FaStar />
                            <span className="text-sm">Keep playing to level up more!</span>
                        </div>
                    </div>

                    <Button
                        color="primary"
                        variant="flat"
                        onClick={hideLevelUpNotification}
                        className="mt-4"
                    >
                        Awesome!
                    </Button>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default LevelUpNotification;
