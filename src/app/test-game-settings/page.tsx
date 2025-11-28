'use client';

import React from 'react';
import { useGameSettings } from '@/contexts/GameSettingsContext';
import { useWebSocket } from '@/contexts/socketContext';

export default function TestGameSettingsPage() {
  const { settings, loading, error, isGameEnabled, getMaintenanceMessage, refreshSettings } = useGameSettings();
  const { isConnected, debugSocketState } = useWebSocket();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Game Settings Test Page</h1>
        
        {/* Connection Status */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">WebSocket Connected:</span>
              <span className={`ml-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Settings Loading:</span>
              <span className={`ml-2 ${loading ? 'text-yellow-400' : 'text-green-400'}`}>
                {loading ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          <button 
            onClick={debugSocketState}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Debug Socket State
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-6">
            <h3 className="font-semibold">Error:</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Settings Display */}
        {settings ? (
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Current Settings</h2>
              <button 
                onClick={refreshSettings}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
              >
                Refresh Settings
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Global Settings */}
              <div>
                <h3 className="text-lg font-medium mb-3">Global Settings</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Maintenance Mode:</span>
                    <span className={`ml-2 ${settings.global.maintenanceMode ? 'text-red-400' : 'text-green-400'}`}>
                      {settings.global.maintenanceMode ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Allow Registrations:</span>
                    <span className={`ml-2 ${settings.global.allowRegistrations ? 'text-green-400' : 'text-red-400'}`}>
                      {settings.global.allowRegistrations ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Allow Deposits:</span>
                    <span className={`ml-2 ${settings.global.allowDeposits ? 'text-green-400' : 'text-red-400'}`}>
                      {settings.global.allowDeposits ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Allow Withdrawals:</span>
                    <span className={`ml-2 ${settings.global.allowWithdrawals ? 'text-green-400' : 'text-red-400'}`}>
                      {settings.global.allowWithdrawals ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Chat Enabled:</span>
                    <span className={`ml-2 ${settings.global.chatEnabled ? 'text-green-400' : 'text-red-400'}`}>
                      {settings.global.chatEnabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Game Settings */}
              <div>
                <h3 className="text-lg font-medium mb-3">Game Settings</h3>
                <div className="space-y-3">
                  {Object.entries(settings.games).map(([gameName, gameSettings]) => (
                    <div key={gameName} className="border border-gray-600 p-3 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium capitalize">{gameName}</span>
                        <span className={`px-2 py-1 rounded text-sm ${
                          isGameEnabled(gameName as any) ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                          {isGameEnabled(gameName as any) ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>Min Bet: {gameSettings.minBet}</div>
                        <div>Max Bet: {gameSettings.maxBet}</div>
                        {!isGameEnabled(gameName as any) && (
                          <div className="text-yellow-400">
                            Message: {getMaintenanceMessage(gameName as any)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-6 pt-4 border-t border-gray-600">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Version:</span> {settings.version}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span> {new Date(settings.lastUpdated).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            {loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p>Loading settings...</p>
              </div>
            ) : (
              <p className="text-gray-400">No settings loaded</p>
            )}
          </div>
        )}

        {/* Raw Settings JSON */}
        {settings && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Raw Settings JSON</h2>
            <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(settings, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
