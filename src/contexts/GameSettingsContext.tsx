'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useWebSocket } from './socketContext';

interface GameSettings {
  enabled: boolean;
  maintenanceMessage: string;
  minBet: number;
  maxBet: number;
}

interface GlobalSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowRegistrations: boolean;
  allowDeposits: boolean;
  allowWithdrawals: boolean;
  chatEnabled: boolean;
}

interface ServerSettings {
  games: {
    mine: GameSettings;
    crash: GameSettings;
    coinflip: GameSettings;
    roulette: GameSettings;
  };
  global: GlobalSettings;
  version: number;
  lastUpdated: string;
}

interface GameSettingsContextType {
  settings: ServerSettings | null;
  loading: boolean;
  error: string | null;
  isGameEnabled: (gameName: keyof ServerSettings['games']) => boolean;
  getMaintenanceMessage: (gameName: keyof ServerSettings['games']) => string;
  refreshSettings: () => void;
  isMobileScreen: boolean;
  isTabletScreen: boolean;
  isSidebarOpen: boolean;
  selectedOption: string | null;
  setSelectedOption: (option: string | null) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isChatBoxOpen: boolean;
  isChatBoxCollapsed: boolean;
  setIsChatBoxOpen: (isOpen: boolean) => void;
  setIsChatBoxCollapsed: (isCollapsed: boolean) => void;
}

const GameSettingsContext = createContext<GameSettingsContextType | undefined>(undefined);

interface GameSettingsProviderProps {
  children: ReactNode;
}

export const GameSettingsProvider: React.FC<GameSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<ServerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [isTabletScreen, setIsTabletScreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, emit, registerListener, unregisterListener } = useWebSocket();
  const [isChatBoxOpen, setIsChatBoxOpen] = useState(false);
  const [isChatBoxCollapsed, setIsChatBoxCollapsed] = useState(false);

  // Store callback functions for cleanup
  const settingsCallback = useCallback((data: any) => {
    console.log('🔄 Game settings loaded', data);
    if (data.success) {
      setSettings(data.data);
      setError(null);
    } else {
      setError(data.error || 'Failed to load settings');
    }
    setLoading(false);
  }, []);

  const errorCallback = useCallback((data: any) => {
    setError(data.error || 'Failed to load settings');
    setLoading(false);
  }, []);

  const updateCallback = useCallback((data: any) => {
    if (data.success) {
      setSettings(data.data);
      console.log('🔄 Game settings updated in real-time');
    }
  }, []);

  // Load settings on mount and when socket connects
  useEffect(() => {
    console.log('🔄 Game settings useEffect', isConnected);
    if (isConnected) {
      setupSocketListeners();
      // Load settings after listeners are registered (small delay to ensure listeners are ready)
      setTimeout(() => {
        loadSettings();
      }, 100);
    }
  }, [isConnected]);

  // Fallback: Load settings via API if WebSocket is not available
  useEffect(() => {
    console.log('🔄 Game settings useEffect (fallback)', isConnected);
    if (!isConnected) {
      // Try to load settings via API as fallback
      const loadSettingsViaAPI = async () => {
        try {
          setLoading(true);
          setError(null);

          const response = await fetch('/api/settings/public');
          const data = await response.json();

          if (data.success) {
            setSettings(data.data);
            setError(null);
          } else {
            setError(data.error || 'Failed to load settings');
          }
        } catch (error) {
          console.error('Error loading settings via API:', error);
          setError('Failed to load settings');
        } finally {
          setLoading(false);
        }
      };

      // loadSettingsViaAPI();
    }
  }, [isConnected]);

  const loadSettings = () => {
    if (!isConnected) {
      console.log('❌ Cannot load settings: WebSocket not connected');
      return;
    }

    console.log('📡 Emitting get_server_settings event');
    setLoading(true);
    setError(null);

    emit('get_server_settings', {});
  };

  const setupSocketListeners = () => {
    if (!isConnected) {
      console.log('❌ Cannot setup socket listeners: WebSocket not connected');
      return;
    }

    console.log('🔧 Setting up socket listeners for game settings');

    // Listen for settings response
    registerListener('server_settings', settingsCallback, 'GameSettingsProvider');

    // Listen for settings error
    registerListener('server_settings_error', errorCallback, 'GameSettingsProvider');

    // Listen for real-time settings updates
    registerListener('server_settings_updated', updateCallback, 'GameSettingsProvider');

    console.log('✅ Socket listeners registered for game settings');
  };

  const isGameEnabled = (gameName: keyof ServerSettings['games']): boolean => {
    if (!settings) return false;

    const game = settings.games[gameName];
    return game?.enabled && !settings.global.maintenanceMode;
  };

  const getMaintenanceMessage = (gameName: keyof ServerSettings['games']): string => {
    if (!settings) {
      return `${gameName} game is currently under maintenance. Please try again later.`;
    }

    // Global maintenance mode takes priority
    if (settings.global.maintenanceMode) {
      return settings.global.maintenanceMessage || 'The platform is currently under maintenance. Please try again later.';
    }

    // Game-specific maintenance message
    const game = settings.games[gameName];
    return game?.maintenanceMessage || `${gameName} game is currently under maintenance. Please try again later.`;
  };

  const refreshSettings = () => {
    loadSettings();
  };

  // Cleanup socket listeners on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        unregisterListener('server_settings', settingsCallback, 'GameSettingsProvider');
        unregisterListener('server_settings_error', errorCallback, 'GameSettingsProvider');
        unregisterListener('server_settings_updated', updateCallback, 'GameSettingsProvider');
      }
    };
  }, [isConnected, unregisterListener, settingsCallback, errorCallback, updateCallback]);

  const value: GameSettingsContextType = {
    settings,
    loading,
    isMobileScreen,
    isTabletScreen,
    isSidebarOpen,
    isChatBoxOpen,
    isChatBoxCollapsed,
    selectedOption,
    error,
    isGameEnabled,
    getMaintenanceMessage,
    refreshSettings,
    setSelectedOption,
    setIsSidebarOpen,
    setIsChatBoxOpen,
    setIsChatBoxCollapsed
  };

  const handleWindowResize = () => {
    const width = window.innerWidth;
    
    if (width < 576) {
      setIsMobileScreen(true);
      setIsTabletScreen(false);
      // Close sidebar on mobile
      setIsSidebarOpen(false);
    } else if (width < 1024) {
      setIsMobileScreen(false);
      setIsTabletScreen(true);
      // Close sidebar on tablet (collapsed state)
      setIsSidebarOpen(false);
    } else {
      setIsMobileScreen(false);
      setIsTabletScreen(false);
      // Desktop: keep sidebar open by default
      if (!isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    }
  };

  useEffect(() => {
    // Call handleWindowResize when the component mounts to set screen sizes initially
    handleWindowResize();

    setSelectedOption(location.pathname);

    // Attach the event listener when the component mounts
    window.addEventListener("resize", handleWindowResize);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  // Update sidebar state when screen size changes
  useEffect(() => {
    if (isMobileScreen) {
      // Mobile: close sidebar
      setIsSidebarOpen(false);
    } else if (isTabletScreen) {
      // Tablet: close sidebar (collapsed state)
      setIsSidebarOpen(false);
    } else {
      // Desktop (>= 1024px): open sidebar by default
      setIsSidebarOpen(true);
    }
  }, [isMobileScreen, isTabletScreen, setIsSidebarOpen]);

  return (
    <GameSettingsContext.Provider value={value}>
      {children}
    </GameSettingsContext.Provider>
  );
};

export const useGameSettings = (): GameSettingsContextType => {
  const context = useContext(GameSettingsContext);
  if (context === undefined) {
    throw new Error('useGameSettings must be used within a GameSettingsProvider');
  }
  return context;
};
