'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { SocketIOClient } from '@/lib/websocket'

interface WebSocketContextType {
    isConnected: boolean
    connect: () => Promise<void>
    disconnect: () => void
    emit: (event: string, data: any) => void
    send: (event: string, data: any) => void
    on: (event: string, callback: (data: any) => void) => void
    off: (event: string, callback: (data: any) => void) => void
    // Centralized event system
    registerListener: (event: string, callback: (data: any) => void, componentId?: string) => void
    unregisterListener: (event: string, callback: (data: any) => void, componentId?: string) => void
    // Debugging
    debugSocketState: () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    const [isConnected, setIsConnected] = useState(false)
    const { user } = useAuth()

    // Centralized event listener registry
    const eventListenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map())
    const componentListenersRef = useRef<Map<string, Map<string, (data: any) => void>>>(new Map())

    // Track previous authentication state to detect changes
    const prevAuthStateRef = useRef<{
        isAuthenticated: boolean
    }>({ isAuthenticated: false })

    // Track if centralized listeners have been set up to prevent duplicates
    const centralizedListenersSetupRef = useRef<boolean>(false)
    
    // Track last connection attempt to prevent rapid reconnection
    const lastConnectionAttemptRef = useRef<number>(0)
    
    // Track if auth check is in progress to prevent multiple simultaneous checks
    const authCheckInProgressRef = useRef<boolean>(false)

    // Helper function to check if authentication is available (cookies)
    const checkAuthAvailable = useCallback(async (): Promise<boolean> => {
        // Prevent multiple simultaneous auth checks
        if (authCheckInProgressRef.current) {
            console.log('🔍 Auth check already in progress, skipping...')
            return false
        }
        
        try {
            authCheckInProgressRef.current = true
            console.log('🔍 Starting auth status check')
            const { authUtils } = await import('@/lib/api')
            const isAuth = await authUtils.isAuthenticated()
            if (isAuth) {
                console.log('🔑 User authenticated via cookies for WebSocket connection')
            }
            return isAuth
        } catch (error) {
            console.log('🔍 Auth check failed, assuming not ready:', error)
            return false
        } finally {
            authCheckInProgressRef.current = false
        }
    }, [])

    // Connect with authentication
    const connect = useCallback(async () => {
        try {
            const now = Date.now()
            const timeSinceLastAttempt = now - lastConnectionAttemptRef.current
            
            // Prevent rapid reconnection attempts (minimum 2 seconds between attempts)
            if (timeSinceLastAttempt < 2000) {
                console.log('🔄 Too soon since last connection attempt, skipping...')
                return
            }

            // Prevent multiple simultaneous connection attempts
            if (SocketIOClient.isConnecting) {
                console.log('🔄 WebSocket connection already in progress, skipping...')
                return
            }

            if (SocketIOClient.isConnected) {
                console.log('🔌 WebSocket already connected, skipping connection...')
                return
            }

            lastConnectionAttemptRef.current = now
            console.log('🔄 Starting WebSocket connection...')
            await SocketIOClient.connect()
            console.log('✅ WebSocket connected with authentication')
        } catch (error) {
            console.error('Failed to connect WebSocket:', error)
            setIsConnected(false)
        }
    }, [])

    // Disconnect
    const disconnect = useCallback(() => {
        SocketIOClient.disconnect()
        setIsConnected(false)
        console.log('🔌 WebSocket disconnected')
    }, [])

    // Emit event
    const emit = useCallback((event: string, data: any) => {
        console.log(`📡 Emitting event: ${event}`, data)
        if (isConnected) {
            SocketIOClient.emit(event, data)
        } else {
            console.warn('Cannot emit: WebSocket not connected')
        }
    }, [isConnected])

    // Send event (alias for emit)
    const send = useCallback((event: string, data: any) => {
        emit(event, data)
    }, [emit])

    // Listen to event
    const on = useCallback((event: string, callback: (data: any) => void) => {
        SocketIOClient.on(event, callback)
    }, [])

    // Remove event listener
    const off = useCallback((event: string, callback: (data: any) => void) => {
        SocketIOClient.off(event, callback)
    }, [])

    // Register centralized event listener
    const registerListener = useCallback((event: string, callback: (data: any) => void, componentId?: string) => {
        // Add to global listeners
        if (!eventListenersRef.current.has(event)) {
            eventListenersRef.current.set(event, new Set())
        }
        eventListenersRef.current.get(event)!.add(callback)

        // Add to component-specific listeners if componentId provided
        if (componentId) {
            if (!componentListenersRef.current.has(componentId)) {
                componentListenersRef.current.set(componentId, new Map())
            }
            componentListenersRef.current.get(componentId)!.set(event, callback)
        }

        // console.log(`📝 Registered listener for event: ${event}${componentId ? ` (component: ${componentId})` : ''}`)
    }, [])

    // Unregister centralized event listener
    const unregisterListener = useCallback((event: string, callback: (data: any) => void, componentId?: string) => {
        // Remove from global listeners
        const globalListeners = eventListenersRef.current.get(event)
        if (globalListeners) {
            globalListeners.delete(callback)
            if (globalListeners.size === 0) {
                eventListenersRef.current.delete(event)
            }
        }

        // Remove from component-specific listeners if componentId provided
        if (componentId) {
            const componentListeners = componentListenersRef.current.get(componentId)
            if (componentListeners) {
                componentListeners.delete(event)
                if (componentListeners.size === 0) {
                    componentListenersRef.current.delete(componentId)
                }
            }
        }

        // console.log(`🗑️ Unregistered listener for event: ${event}${componentId ? ` (component: ${componentId})` : ''}`)
    }, [])

    // Debug function for simplified socket system
    const debugSocketState = useCallback(() => {
        console.log('🔍 Simplified Socket State Debug:')
        console.log('  - isConnected:', isConnected)
        console.log('  - SocketIOClient.isConnected:', SocketIOClient.isConnected)
        console.log('  - Event listeners count:', eventListenersRef.current.size)
        console.log('  - Component listeners count:', componentListenersRef.current.size)
        console.log('  - System: Global event system - no room management needed')
    }, [isConnected])

    // Listen to WebSocket connection changes and connect on mount
    useEffect(() => {
        const handleConnect = () => {
            console.log("✅ WebSocket connected")
            // Set up centralized listeners
            setupCentralizedListeners()
        }

        const handleDisconnect = () => {
            console.log("❌ WebSocket disconnected")
            setIsConnected(false)
            // Reset the centralized listeners flag so they can be set up again on reconnect
            centralizedListenersSetupRef.current = false
        }

        const handleAuthError = (data: any) => {
            console.log("🔐 Auth error received:", data)
            // Auth errors are handled by falling back to anonymous connection
            // No need to disconnect or stop reconnection - backend handles fallback
        }

        const handleReconnect = () => {
            console.log("🔄 WebSocket reconnecting...")
        }

        const handleConnectionSuccess = () => {
            console.log("🔄 WebSocket connection successful")
            setIsConnected(true)
        }

        // Set up event listeners
        SocketIOClient.on('connect', handleConnect)
        SocketIOClient.on('disconnect', handleDisconnect)
        SocketIOClient.on('reconnect', handleReconnect)
        SocketIOClient.on('connection_success', handleConnectionSuccess)
        SocketIOClient.on('auth_error', handleAuthError)

        // Set up centralized event handling system
        const setupCentralizedListeners = () => {
            // Prevent duplicate setup
            if (centralizedListenersSetupRef.current) {
                console.log('🚪 Centralized listeners already set up, skipping...')
                return
            }

            console.log('🚪 Setting up centralized event listeners')

            // Set up centralized event dispatchers for all game events
            const gameEvents = [
                'connection_success',
                'connection_error',
                'auth_success',
                'auth_error',
                'user_balance_update',
                'coinflip_game_init',
                'coinflip_games_list',
                'coinflip_game_update', 
                'coinflip_game_created_success',
                'coinflip_game_joined_success',
                'coinflip_game_completed',
                'coinflip_game_cancelled',
                'coinflip_error',
                'crash_game_update',
                'crash_game_started',
                'crash_game_ended',
                'crash_betting_ended',
                'crash_multiplier_update',
                'crash_player_joined',
                'crash_player_cashed_out',
                'crash_game_crashed',
                'crash_game_paused',
                'crash_game_resumed',
                'crash_current_game',
                'crash_no_active_game',
                'crash_history',
                'crash_bet_placed',
                'crash_cashed_out',
                'crash_error',
                'roulette_game_started',
                'roulette_player_joined',
                'roulette_countdown_update',
                'roulette_betting_ended',
                'roulette_spin_start',
                'roulette_game_completed',
                'roulette_game_reset',
                'roulette_current_game',
                'roulette_no_active_game',
                'roulette_bet_placed',
                'roulette_reset_game',
                'roulette_history',
                'roulette_verification_result',
                'roulette_error',
                'mine_game_update',
                'mine_game_created_success',
                'mine_game_completed',
                'mine_error',
                'chat',
                'chat_message',
                'chat_history',
                'chat_user_joined',
                'chat_user_left',
                'chat_error',
                'server_settings',
                'server_settings_error',
                'server_settings_updated'
            ]

            gameEvents.forEach(event => {
                SocketIOClient.on(event, (data: any) => {
                    // console.log(`📡 Centralized event received: ${event}`, data)
                    
                    // Dispatch to all registered listeners for this event
                    const listeners = eventListenersRef.current.get(event)
                    if (listeners) {
                        listeners.forEach(callback => {
                            try {
                                callback(data)
                            } catch (error) {
                                console.error(`Error in event listener for ${event}:`, error)
                            }
                        })
                    }
                })
            })

            // Mark as set up
            centralizedListenersSetupRef.current = true
        }

        // Set up centralized listeners when connected
        if (SocketIOClient.isConnected) {
            setupCentralizedListeners()
        }

        // Connect when context mounts (only once)
        const initializeConnection = async () => {
            console.log("🔄 Initializing WebSocket connection")
            try {
                // Check authentication once - the authUtils.isAuthenticated() already has debouncing
                const authReady = await checkAuthAvailable()
                if (authReady) {
                    console.log("🔑 Authentication is ready, proceeding with connection")
                } else {
                    console.log("🔑 No authentication available, connecting anonymously")
                }
                
                await connect()
            } catch (error) {
                console.error('Failed to initialize WebSocket connection:', error)
            }
        }

        // Only initialize connection once on mount
        initializeConnection()

        return () => {
            SocketIOClient.off('connect', handleConnect)
            SocketIOClient.off('disconnect', handleDisconnect)
            SocketIOClient.off('reconnect', handleReconnect)
            SocketIOClient.off('connection_success', handleConnectionSuccess)
            SocketIOClient.off('auth_error', handleAuthError)
            // Reset the centralized listeners flag on cleanup
            centralizedListenersSetupRef.current = false
        }
    }, []) // Keep empty dependency array for mount-only effect

    // Handle authentication state changes - NO RECONNECTION, just update auth token
    useEffect(() => {
        // Only update authentication token if user state changes and we're connected
        if (SocketIOClient.isConnected && prevAuthStateRef.current.isAuthenticated !== user.isAuthenticated) {
            console.log('🔄 Authentication state changed, updating token (no reconnection)...')
            // Just emit auth update, don't reconnect
            if (user.isAuthenticated) {
                SocketIOClient.emit('update_auth_token', {})
            }
        }
        
        // Update previous auth state
        prevAuthStateRef.current = { isAuthenticated: user.isAuthenticated }
    }, [user.isAuthenticated])

    // No automatic reconnection - socket should stay connected once established

    const value: WebSocketContextType = {
        isConnected,
        connect,
        disconnect,
        emit,
        send,
        on,
        off,
        // Centralized event system
        registerListener,
        unregisterListener,
        // Debugging
        debugSocketState
    }

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    )
}

export function useWebSocket() {
    const context = useContext(WebSocketContext)
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider')
    }
    return context
}

/**
 * Centralized Socket Event System
 * 
 * This system automatically handles:
 * - Global event dispatching to all registered listeners
 * - Automatic cleanup when components unmount
 * - No room management needed - backend handles everything globally
 * 
 * Usage:
 * 
 * // Single event
 * useSocketEvent('coinflip_game_update', (data) => {
 *   console.log('Game updated:', data)
 * }, 'my-component')
 * 
 * // Multiple events
 * useSocketEvents({
 *   'coinflip_game_update': (data) => { /* handle update 
 *   'coinflip_game_completed': (data) => { /* handle completion 
 * }, 'my-component')
 * 
 * Benefits:
 * - No room management needed
 * - No event listener cleanup needed
 * - Automatic reconnection handling
 * - Centralized event dispatching
 */

// Custom hook for centralized event listening
export function useSocketEvent(event: string, callback: (data: any) => void, componentId?: string) {
    const { registerListener, unregisterListener } = useWebSocket()
    
    useEffect(() => {
        const componentName = componentId || `component-${Math.random().toString(36).substr(2, 9)}`
        registerListener(event, callback, componentName)
        
        return () => {
            unregisterListener(event, callback, componentName)
        }
    }, [event, callback, componentId, registerListener, unregisterListener])
}

// Utility hook for multiple events at once
export function useSocketEvents(events: { [event: string]: (data: any) => void }, componentId?: string) {
    const { registerListener, unregisterListener } = useWebSocket()
    
    useEffect(() => {
        const componentName = componentId || `component-${Math.random().toString(36).substr(2, 9)}`
        
        // Register all events
        Object.entries(events).forEach(([event, callback]) => {
            registerListener(event, callback, componentName)
        })
        
        return () => {
            // Unregister all events
            Object.entries(events).forEach(([event, callback]) => {
                unregisterListener(event, callback, componentName)
            })
        }
    }, [events, componentId, registerListener, unregisterListener])
}