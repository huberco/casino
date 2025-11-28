'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './socketContext';
import { useAuth } from './AuthContext';
import { gameApi } from '@/lib/api';
import { UserXPStats, XPUpdate, LevelUpNotification, UserAchievements } from '@/types/xp';

interface XPContextType {
    xpStats: UserXPStats | null;
    achievements: UserAchievements | null;
    loading: boolean;
    error: string | null;
    fetchXPStats: () => Promise<void>;
    fetchAchievements: () => Promise<void>;
    showLevelUpNotification: boolean;
    levelUpData: LevelUpNotification | null;
    hideLevelUpNotification: () => void;
}

const XPContext = createContext<XPContextType | undefined>(undefined);

export const useXP = () => {
    const context = useContext(XPContext);
    if (context === undefined) {
        throw new Error('useXP must be used within an XPProvider');
    }
    return context;
};

interface XPProviderProps {
    children: React.ReactNode;
}

export const XPProvider: React.FC<XPProviderProps> = ({ children }) => {
    const [xpStats, setXpStats] = useState<UserXPStats | null>(null);
    const [achievements, setAchievements] = useState<UserAchievements | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showLevelUpNotification, setShowLevelUpNotification] = useState(false);
    const [levelUpData, setLevelUpData] = useState<LevelUpNotification | null>(null);

    const { on, off, isConnected } = useWebSocket();
    const { user } = useAuth();
    const isAuthenticated = user.isAuthenticated;

    const fetchXPStats = useCallback(async () => {
        if (!isAuthenticated) {
            return;
        }
        
        try {
            setError(null);
            const response = await gameApi.xp.getUserXP();
            if (response.success) {
                setXpStats(response.data.data);
            } else {
                setError(response.error || 'Failed to fetch XP stats');
            }
        } catch (err: any) {
            if (err?.response?.status === 401) {
                console.log('User not authenticated for XP stats');
                return;
            }
            setError('Failed to fetch XP stats');
            console.error('Error fetching XP stats:', err);
        }
    }, [isAuthenticated]);

    const fetchAchievements = useCallback(async () => {
        if (!isAuthenticated) {
            return;
        }
        
        try {
            setError(null);
            const response = await gameApi.xp.getUserAchievements();
            if (response.success) {
                setAchievements(response.data.data.achievements);
            } else {
                setError(response.error || 'Failed to fetch achievements');
            }
        } catch (err: any) {
            if (err?.response?.status === 401) {
                console.log('User not authenticated for achievements');
                return;
            }
            setError('Failed to fetch achievements');
            console.error('Error fetching achievements:', err);
        }
    }, [isAuthenticated]);

    const hideLevelUpNotification = useCallback(() => {
        setShowLevelUpNotification(false);
        setLevelUpData(null);
    }, []);

    // Handle XP updates from WebSocket
    const handleXPUpdate = useCallback((data: XPUpdate) => {
        setXpStats(prev => prev ? {
            ...prev,
            currentLevel: data.newLevel,
            currentXP: data.newXP,
            totalXP: data.totalXP,
            levelProgress: data.levelProgress,
            nextLevelXP: data.nextLevelXP
        } : null);
    }, []);

    // Handle level up notifications
    const handleLevelUp = useCallback((data: LevelUpNotification) => {
        setLevelUpData(data);
        setShowLevelUpNotification(true);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideLevelUpNotification();
        }, 5000);
    }, [hideLevelUpNotification]);

    // Initial data fetch - only when authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchXPStats(),
                    fetchAchievements()
                ]);
            } catch (error) {
                console.error('Error fetching XP data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated, fetchXPStats, fetchAchievements]);

    // WebSocket event listeners
    useEffect(() => {
        if (isConnected) {
            on('xp_update', handleXPUpdate);
            on('level_up', handleLevelUp);
        }

        return () => {
            off('xp_update', handleXPUpdate);
            off('level_up', handleLevelUp);
        };
    }, [isConnected, on, off, handleXPUpdate, handleLevelUp]);

    const value: XPContextType = {
        xpStats,
        achievements,
        loading,
        error,
        fetchXPStats,
        fetchAchievements,
        showLevelUpNotification,
        levelUpData,
        hideLevelUpNotification
    };

    return (
        <XPContext.Provider value={value}>
            {children}
        </XPContext.Provider>
    );
};

export default XPContext;
