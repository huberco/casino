export interface UserXPStats {
    currentLevel: number;
    currentXP: number;
    totalXP: number;
    levelProgress: number;
    nextLevelXP: number;
    totalWagered: number;
    achievements: UserAchievements;
    rank: number;
    username: string;
    displayName: string;
    avatar?: string;
}

export interface UserAchievements {
    firstBet: Achievement;
    level5: Achievement;
    level10: Achievement;
    level25: Achievement;
    level50: Achievement;
    level100: Achievement;
    bigBettor: Achievement;
    whale: Achievement;
    [key: string]: Achievement;
}

export interface Achievement {
    name: string;
    description: string;
    unlocked: boolean;
}

export interface XPUpdate {
    newLevel: number;
    newXP: number;
    totalXP: number;
    levelProgress: number;
    nextLevelXP: number;
    leveledUp: boolean;
    levelsGained: number;
    xpGained: number;
    reason: string;
}

export interface LevelUpNotification {
    newLevel: number;
    levelsGained: number;
    totalXP: number;
}

export interface LeaderboardEntry {
    username: string;
    displayName: string;
    avatar?: string;
    level: number;
    totalXP: number;
    totalWagered: number;
}

export interface XPRequirements {
    level: number;
    xpRequired: number;
    totalXPRequired: number;
}
