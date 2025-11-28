'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { useGameSettings } from '@/contexts/GameSettingsContext';
import { useWebSocket } from '@/contexts/socketContext';
import MaintenanceScreen from './MaintenanceScreen';
import ConnectionCheckScreen from './ConnectionCheckScreen';
import { Spinner } from '@heroui/react';

interface GameStatusWrapperProps {
  gameName: 'mine' | 'crash' | 'coinflip' | 'roulette';
  children: ReactNode;
  fallbackTitle?: string;
  showRefreshButton?: boolean;
  showHomeButton?: boolean;
  showBackButton?: boolean;
}

const GameStatusWrapper: React.FC<GameStatusWrapperProps> = ({
  gameName,
  children,
  fallbackTitle,
  showRefreshButton = true,
  showHomeButton = true,
  showBackButton = true
}) => {
  const { settings, loading, error, isGameEnabled, getMaintenanceMessage, refreshSettings } = useGameSettings();
  const { isConnected, connect } = useWebSocket();
  const [connectionTimeout, setConnectionTimeout] = useState(false);
  const [settingsTimeout, setSettingsTimeout] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false);

  // Track if we've attempted connection and handle timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Only start timeout after we've attempted connection and still not connected
    if (hasAttemptedConnection && !isConnected && !connectionTimeout) {
      timeoutId = setTimeout(() => {
        setConnectionTimeout(true);
      }, 5000); // 10 second timeout
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [hasAttemptedConnection, isConnected, connectionTimeout]);

  // Handle settings loading timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (loading && !settingsTimeout) {
      timeoutId = setTimeout(() => {
        setSettingsTimeout(true);
      }, 15000); // 15 second timeout for settings loading
    } else if (!loading) {
      setSettingsTimeout(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loading, settingsTimeout]);

  // Attempt connection when component mounts
  useEffect(() => {
    if (!hasAttemptedConnection) {
      setHasAttemptedConnection(true);
      connect().catch(console.error);
    }
  }, [hasAttemptedConnection, connect]);

  // Reset retry count when connection is restored
  useEffect(() => {
    if (isConnected && connectionTimeout) {
      setRetryCount(0);
      setConnectionTimeout(false);
      setSettingsTimeout(false);
    }
  }, [isConnected, connectionTimeout]);

  const handleRetryConnection = async () => {
    try {
      setRetryCount(prev => prev + 1);
      setConnectionTimeout(false);
      setSettingsTimeout(false);
      await connect();
    } catch (error) {
      console.error('Failed to reconnect:', error);
    }
  };

  // Show connection check screen only after timeout
  if (connectionTimeout) {
    return (
      <ConnectionCheckScreen
        title="Server Connection Lost"
        message="Unable to connect to the game server. This could be due to network issues or server maintenance."
        showRefreshButton={showRefreshButton}
        showHomeButton={showHomeButton}
        showBackButton={showBackButton}
        onRefresh={refreshSettings}
        onRetry={handleRetryConnection}
        retryCount={retryCount}
        maxRetries={3}
      />
    );
  }

  // Show loading spinner while settings are loading or attempting connection
  if ((loading && !settingsTimeout) || (!isConnected && !connectionTimeout)) {
    return (
      <div className="min-h-screen bg-background-alt flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="text-white mt-4">
            {loading ? "Loading game settings..." : "Connecting to server..."}
          </p>
          <p className="text-gray-400 text-sm mt-2">Please wait while we establish connection</p>
        </div>
      </div>
    );
  }

  // Show connection error if settings loading timed out
  if (settingsTimeout && loading) {
    return (
      <ConnectionCheckScreen
        title="Settings Loading Timeout"
        message="Game settings are taking too long to load. This could be due to network issues or server problems."
        showRefreshButton={showRefreshButton}
        showHomeButton={showHomeButton}
        showBackButton={showBackButton}
        onRefresh={refreshSettings}
        onRetry={handleRetryConnection}
        retryCount={retryCount}
        maxRetries={3}
      />
    );
  }

  // Show error state if settings failed to load
  if (error) {
    // Check if it's a connection-related error
    const isConnectionError = error.toLowerCase().includes('connection') || 
                             error.toLowerCase().includes('network') || 
                             error.toLowerCase().includes('timeout') ||
                             error.toLowerCase().includes('fetch');

    if (isConnectionError) {
      return (
        <ConnectionCheckScreen
          title="Connection Error"
          message={`Unable to connect to the server: ${error}. Please check your internet connection and try again.`}
          showRefreshButton={showRefreshButton}
          showHomeButton={showHomeButton}
          showBackButton={showBackButton}
          onRefresh={refreshSettings}
          onRetry={handleRetryConnection}
          retryCount={retryCount}
          maxRetries={3}
        />
      );
    }

    return (
      <MaintenanceScreen
        title="Server Error"
        message={`Unable to load game settings: ${error}. Please try again later.`}
        showRefreshButton={true}
        showHomeButton={true}
        showBackButton={true}
        onRefresh={refreshSettings}
      />
    );
  }

  // Show maintenance screen if game is disabled (only after settings have loaded)
  if (settings && !isGameEnabled(gameName)) {
    const title = fallbackTitle || `${gameName.charAt(0).toUpperCase() + gameName.slice(1)} Game Unavailable`;
    const message = getMaintenanceMessage(gameName);

    return (
      <MaintenanceScreen
        title={title}
        message={message}
        showRefreshButton={showRefreshButton}
        showHomeButton={showHomeButton}
        showBackButton={showBackButton}
        onRefresh={refreshSettings}
      />
    );
  }

  // Game is enabled, render the game content
  return <>{children}</>;
};

export default GameStatusWrapper;
