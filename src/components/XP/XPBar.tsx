'use client';

import React from 'react';
import { Progress } from '@heroui/react';
import { useXP } from '@/contexts/XPContext';

interface XPBarProps {
    showLevel?: boolean;
    showXP?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const XPBar: React.FC<XPBarProps> = ({ 
    showLevel = true, 
    showXP = true, 
    size = 'md',
    className = '' 
}) => {
    const { xpStats, loading } = useXP();

    if (loading || !xpStats) {
        return (
            <div className={`animate-pulse ${className}`}>
                <div className="h-2 bg-gray-700 rounded-full"></div>
            </div>
        );
    }

    const sizeClasses = {
        sm: 'h-1.5',
        md: 'h-2',
        lg: 'h-3'
    };

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };

    return (
        <div className={`space-y-1 ${className}`}>
            {showLevel && (
                <div className="flex items-center justify-between">
                    <span className={`text-gray-300 ${textSizeClasses[size]}`}>
                        Level {xpStats.currentLevel}
                    </span>
                    {showXP && (
                        <span className={`text-gray-400 ${textSizeClasses[size]}`}>
                            {xpStats?.currentXP?.toLocaleString()} / {xpStats?.nextLevelXP?.toLocaleString()} XP
                        </span>
                    )}
                </div>
            )}
            
            <Progress
                value={xpStats.levelProgress}
                color="primary"
                className={`${sizeClasses[size]} bg-gray-800`}
                classNames={{
                    track: "bg-gray-800",
                    indicator: "bg-gradient-to-r from-blue-500 to-purple-500"
                }}
            />
            
            {!showLevel && showXP && (
                <div className="flex justify-center">
                    <span className={`text-gray-400 ${textSizeClasses[size]}`}>
                        {xpStats?.currentXP?.toLocaleString()} / {xpStats?.nextLevelXP?.toLocaleString()} XP
                    </span>
                </div>
            )}
        </div>
    );
};

export default XPBar;
