import axios, { AxiosInstance, AxiosResponse } from 'axios'
import config, { logConfig } from './config'

// Use configuration for API base URL
const API_BASE_URL = config.api.baseUrl

// Log configuration in development mode
logConfig()

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in all requests
})

// Request interceptor - ensure cookies are sent with all requests
apiClient.interceptors.request.use(
  async (requestConfig) => {
    // Always send cookies with requests (they contain the platform token)
    requestConfig.withCredentials = true

    return requestConfig
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    // Handle 401 errors (unauthorized) - but not for auth check endpoints
    if (error.response?.status === 401) {
      const url = error.config?.url || ''

      // Don't redirect for auth check endpoints - these are expected to return 401 for anonymous users
      if (url.includes('/auth/check')) {
        console.log('🔐 Auth check returned 401 - user is anonymous')
        return Promise.reject(new Error('Not authenticated'))
      }

      // Check if logout is already in progress to prevent multiple calls
      if (typeof window !== 'undefined' && sessionStorage.getItem('logout_in_progress')) {
        console.log('🔐 Logout already in progress, skipping')
        return Promise.reject(new Error('Authentication expired'))
      }

      // Don't redirect for token exchange endpoints - these should fail silently
      if (url.includes('/auth/exchange')) {
        console.log('🔐 Token exchange failed - clearing stored tokens')
        // Clear stored tokens to prevent infinite loop
        if (typeof window !== 'undefined') {
          // Set flag to prevent multiple logout calls
          sessionStorage.setItem('logout_in_progress', 'true')
          
          // Clear cookies by calling logout endpoint
          try {
            await apiClient.post('/auth/logout')
          } catch (logoutError) {
            // Ignore logout errors
          }
          // Clear localStorage/sessionStorage if any
          localStorage.removeItem('supabase.auth.token')
          sessionStorage.clear()
        }
        return Promise.reject(new Error('Token exchange failed'))
      }

      // For other endpoints, clear tokens and redirect to home page
      console.log('🔐 Authentication expired, clearing tokens and redirecting to home page')
      if (typeof window !== 'undefined') {
        // Set flag to prevent multiple logout calls
        sessionStorage.setItem('logout_in_progress', 'true')
        
        // Clear stored tokens first
        try {
          await apiClient.post('/auth/logout')
        } catch (logoutError) {
          // Ignore logout errors
        }
        // Clear localStorage/sessionStorage if any
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.clear()
        
        // Set a flag to prevent infinite loops
        sessionStorage.setItem('auth_redirect_flag', 'true')
        
        // Redirect to home page
        window.location.href = '/'
      }
      return Promise.reject(new Error('Authentication expired'))
    }

    return Promise.reject(error)
  }
)

// Helper function to handle API responses
const handleApiResponse = <T>(response: AxiosResponse): ApiResponse<T> => {
  // Normalize response to expected format
  // Both direct backend and Next.js proxy return raw data
  // We need to wrap it in { success: true, data: ... } format
  return {
    success: true,
    data: response.data
  }
}

// Helper function to handle API errors
const handleApiError = (error: any): ApiResponse => {
  console.error('API request failed:', error)

  if (error.response?.data?.error) {
    return {
      success: false,
      error: error.response.data.error
    }
  }

  if (error.message) {
    return {
      success: false,
      error: error.message
    }
  }

  return {
    success: false,
    error: 'Unknown error occurred'
  }
}

// Debounce utility for auth checks
let authCheckPromise: Promise<boolean> | null = null
let lastAuthCheck = 0
let lastAuthResult: boolean | null = null
const AUTH_CHECK_DEBOUNCE = 2000 // 2 second debounce

// Cookie-based authentication utilities
export const authUtils = {
  // Check if user is authenticated by making a request to the backend
  isAuthenticated: async (): Promise<boolean> => {
    const now = Date.now()
    
    // If we have a recent auth check, return the cached result
    if (authCheckPromise && (now - lastAuthCheck) < AUTH_CHECK_DEBOUNCE) {
      console.log('🔄 Using cached auth check result')
      return authCheckPromise
    }
    
    // If we have a very recent result and it was false (not authenticated), return it immediately
    if (lastAuthResult === false && (now - lastAuthCheck) < 500) {
      console.log('🔄 Using recent false auth result')
      return false
    }
    
    // Create new auth check promise
    authCheckPromise = (async () => {
      try {
        lastAuthCheck = now
        console.log('🔐 Making new auth check request')
        const response = await apiClient.get('/auth/check')
        const result = response.status === 200 && response.data?.success === true
        lastAuthResult = result
        return result
      } catch (error: any) {
        // 401 is expected for anonymous users, so return false without logging error
        if (error?.response?.status === 401) {
          lastAuthResult = false
          return false
        }
        console.error('❌ Auth check failed:', error)
        lastAuthResult = false
        return false
      } finally {
        // Clear the promise after completion
        setTimeout(() => {
          authCheckPromise = null
        }, AUTH_CHECK_DEBOUNCE)
      }
    })()
    
    return authCheckPromise
  },

  // Exchange Supabase token for platform JWT
  exchangeToken: async (supabaseToken: string): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post('/auth/exchange', { token: supabaseToken })
      return handleApiResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  },

  // Logout by calling the backend logout endpoint
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout')
      console.log('✅ Logged out successfully')
    } catch (error) {
      console.error('❌ Logout failed:', error)
    }
  },


}

// Game-specific API methods
export const gameApi = {
  // Coinflip game
  coinflip: {
    getConfig: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/coinflip/config')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    createGame: async (data: { betAmount: number; side: 'head' | 'tail' }): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post('/coinflip/create', data)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    joinGame: async (gameId: string, data: { side: 'heads' | 'tails' }): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post(`/coinflip/game/${gameId}/join`, data)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getGameState: async (gameId: string): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get(`/coinflip/game/${gameId}`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getPublicGameState: async (gameId: string): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get(`/coinflip/game/${gameId}/public`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getPlayerGames: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/coinflip/games')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getUserGames: async (params?: { status?: string; limit?: number; page?: number }): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/coinflip/my-games', {
          params: params || {}
        })
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getRecentFlips: async (params: { limit?: number } = {}): Promise<ApiResponse> => {
      try {
        const { limit = 10 } = params
        const response = await apiClient.get('/coinflip/recent', {
          params: { limit }
        })
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getOnlinePlayers: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/coinflip/players')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getPlayerStatistics: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/coinflip/statistics')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    cancelGame: async (gameId: string): Promise<ApiResponse> => {
      try {
        const response = await apiClient.delete(`/coinflip/game/${gameId}`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    verifyGame: async (data: { gameId: string; serverSeed: string; creatorSeed: string; joinerSeed: string }): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post('/coinflip/verify', data)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },
  },

  // Crash game
  crash: {
    getConfig: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/crash/config')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    placeBet: async (data: { betAmount: number; autoCashout?: number; autoBet?: boolean }): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post('/crash/bet', data)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    cashOut: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post('/crash/cashout')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getGameHistory: async (params: { limit?: number } = {}): Promise<ApiResponse> => {
      try {
        const { limit = 10 } = params
        const response = await apiClient.get('/crash/history', {
          params: { limit }
        })
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getPlayerBets: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/crash/bets')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getPlayerStatistics: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/crash/statistics')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getCurrentGame: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/crash/current')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getHistory: async (params: {
      page?: number;
      limit?: number;
      search?: string;
      gameType?: 'all' | 'my';
      sortBy?: string;
      sortOrder?: 'asc' | 'desc'
    } = {}): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/crash/history', {
          params
        })
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getStats: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/crash/stats')
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getUserGames: async (params: { status?: string } = {}): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/crash/user-games', {
          params
        })
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    verifyGame: async (data: { serverSeed: string; publicSeed: string; gameId: string }): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post('/crash/verify', data)
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getPlayerGames: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/crash/games')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },
  },
  // Roulette game
  roulette: {
    getCurrentGame: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/roulette/current')
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    placeBet: async (betAmount: number, betType: 'black' | 'white' | 'crown'): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post('/roulette/bet', { betAmount, betType })
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getHistory: async (params: {
      page?: number;
      limit?: number;
      search?: string;
      gameType?: 'all' | 'my';
      sortBy?: string;
      sortOrder?: 'asc' | 'desc'
    } = {}): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/roulette/history', {
          params
        })
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getStats: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/roulette/stats')
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getUserGames: async (params?: { status?: string; limit?: number; page?: number }): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/roulette/my-games', {
          params: params || {}
        })
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    verifyGame: async (data: { gameId: string; serverSeed: string; publicSeed: string; eosBlockNumber?: number }): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post('/roulette/verify', data)
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },
  },

  // Mine game
  mine: {
    getConfig: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/mine/config')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    createGame: async (data: { betAmount: number; numMines: number }): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post('/mine/create', data)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getGameState: async (gameId: string): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get(`/mine/game/${gameId}`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getPublicGameState: async (gameId: string): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get(`/mine/game/${gameId}/public`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getPlayerGames: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/mine/games')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    deleteGame: async (gameId: string): Promise<ApiResponse> => {
      try {
        const response = await apiClient.delete(`/mine/game/${gameId}`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    cashOut: async (gameId: string): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post(`/mine/game/${gameId}/cashout`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getHistory: async (params: {
      page?: number;
      limit?: number;
      search?: string;
      gameType?: 'all' | 'my';
      sortBy?: string;
      sortOrder?: 'asc' | 'desc'
    } = {}): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/mine/history', {
          params
        })
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getStats: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/mine/stats')
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getIncompleteGames: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/mine/incomplete')
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    verifyGame: async (data: { gameId: string; serverSeed: string; clientSeed: string; numMines: number; gridSize?: number }): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post('/mine/verify', data)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },
  },

  // Transaction management
  transaction: {
    getHistory: async (params: {
      page?: number;
      limit?: number;
      search?: string;
      transactionType?: 'all' | 'my';
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/transaction/history-page', {
          params
        })
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getStats: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/transaction/stats-page')
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getTransactionByRef: async (ref: string): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get(`/transaction/ref/${ref}`)
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },
  },

  // User profile
  user: {
    getStatistics: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/user/statistics')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },
    getProfile: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/user/profile')
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    updateProfile: async (data: any): Promise<ApiResponse> => {
      try {
        const response = await apiClient.put('/user/profile', data)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    uploadAvatar: async (formData: FormData): Promise<ApiResponse> => {
      try {
        // First upload to Pinata via Next.js API
        const uploadResponse = await fetch('/api/upload-avatar', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file to Pinata');
        }

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success || !uploadResult.data?.avatar) {
          throw new Error('Failed to get IPFS URL from upload');
        }

        // Then update the user profile in the backend with the new avatar URL
        const response = await apiClient.put('/user/profile', {
          avatar: uploadResult.data.avatar
        });

        return handleApiResponse(response.data);
      } catch (error) {
        return handleApiError(error);
      }
    },

    regenerateSeed: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post('/user/regenerate-seed');
        return handleApiResponse(response);
      } catch (error) {
        return handleApiError(error);
      }
    },
  },

  // Admin/Cron management
  admin: {
    getCronStatus: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/cron/status')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    triggerChatCleanup: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post('/cron/trigger-chat-cleanup')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },
  },

  // Chat API
  chat: {
    getMessages: async (params: { room?: string; page?: number; limit?: number } = {}): Promise<ApiResponse> => {
      try {
        const { room = 'default', page = 1, limit = 50 } = params
        const response = await apiClient.get('/chat/messages', {
          params: { room, page, limit }
        })
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getChatStatistics: async (room: string = 'default'): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/chat/stats', {
          params: { room }
        })
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getOnlineUsers: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/chat/online')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    getUserChatHistory: async (params: { room?: string; page?: number; limit?: number } = {}): Promise<ApiResponse> => {
      try {
        const { room = 'default', page = 1, limit = 20 } = params
        const response = await apiClient.get('/chat/history', {
          params: { room, page, limit }
        })
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    searchMessages: async (params: { q: string; room?: string; page?: number; limit?: number }): Promise<ApiResponse> => {
      try {
        const { q, room = 'default', page = 1, limit = 20 } = params
        const response = await apiClient.get('/chat/search', {
          params: { q, room, page, limit }
        })
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    deleteMessage: async (messageId: string): Promise<ApiResponse> => {
      try {
        const response = await apiClient.delete(`/chat/${messageId}`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },
  },

  // XP API methods
  xp: {
    // Get user's XP information
    getUserXP: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/xp/user')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Get user achievements
    getUserAchievements: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/xp/achievements')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Get level leaderboard
    getLevelLeaderboard: async (limit: number = 10): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get(`/xp/leaderboard/level?limit=${limit}`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Get wagering leaderboard
    getWageringLeaderboard: async (limit: number = 10): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get(`/xp/leaderboard/wagering?limit=${limit}`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Get weekly wagering leaderboard
    getWeeklyWageringLeaderboard: async (limit: number = 10): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get(`/xp/leaderboard/weekly-wagering?limit=${limit}`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Get leaderboard (generic method for both types)
    getLeaderboard: async (endpoint: string, limit: number = 10): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get(`${endpoint}?limit=${limit}`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Get XP requirements for levels
    getXPRequirements: async (maxLevel: number = 50): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get(`/xp/requirements?maxLevel=${maxLevel}`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    }
  },

  // Game History API methods
  history: {
    // Get user's game history with filters
    getGameHistory: async (filters: {
      gameType?: string;
      result?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {}): Promise<ApiResponse> => {
      try {
        const params = new URLSearchParams();
        if (filters.gameType) params.append('gameType', filters.gameType);
        if (filters.result) params.append('result', filters.result);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const response = await apiClient.get(`/game-history/user?${params.toString()}`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Get game history statistics
    getGameHistoryStats: async (filters: {
      gameType?: string;
      startDate?: string;
      endDate?: string;
    } = {}): Promise<ApiResponse> => {
      try {
        const params = new URLSearchParams();
        if (filters.gameType) params.append('gameType', filters.gameType);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        const response = await apiClient.get(`/game-history/user/stats?${params.toString()}`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Get daily playing statistics for charts
    getDailyStats: async (days: number = 30): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get(`/game-history/user/daily-stats?days=${days}`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    }
  },

  // Payment API methods
  payment: {
    // Create payment user
    createPaymentUser: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post('/payment/user/create')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Create wallet
    createWallet: async (chainId: string, tokenId?: string): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post('/payment/user/wallet', {
          chainId,
          tokenId
        })
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Get wallet addresses
    getWalletAddresses: async (chainIds?: string): Promise<ApiResponse> => {
      try {
        const params = chainIds ? { chainIds } : {}
        const response = await apiClient.get('/payment/user/wallets', { params })
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Process withdrawal
    processWithdrawal: async (data: {
      tokenId: string
      amount: string
      addressTo: string
      safeCheckCode: string
      metadata?: any
    }): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post('/payment/user/withdraw', data)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Get transactions
    getTransactions: async (params?: {
      type?: 'deposit' | 'withdrawal'
      status?: 'pending' | 'processing' | 'completed' | 'failed'
      limit?: number
      offset?: number
    }): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/payment/user/transactions', { params })
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Get transaction statistics
    getTransactionStats: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/payment/user/stats')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Get supported assets
    getSupportedAssets: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/payment/assets')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },
  },

  // Game Status API methods
  gameStatus: {
    // Get active player counts for all games
    getActivePlayerCounts: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/game-status/active-players')
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Get active player count for a specific game type
    getGamePlayerCount: async (gameType: string): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get(`/game-status/active-players/${gameType}`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    }
  },

  // Feature Trading API methods
  featureTrading: {
    // Get all trading markets
    getMarkets: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/feature-trading/markets')
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Get specific market data
    getMarketData: async (symbol: string): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get(`/feature-trading/markets/${symbol}`)
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Get price history for charting
    getPriceHistory: async (symbol: string, timeframe: string = '1m', limit: number = 200): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get(`/feature-trading/markets/${symbol}/history`, {
          params: { timeframe, limit }
        })
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Get user's trading positions
    getPositions: async (symbol?: string): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/feature-trading/positions', {
          params: symbol ? { symbol } : {}
        })
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Open a new trading position
    openPosition: async (data: {
      symbol: string
      type: 'long' | 'short'
      amount: number
      leverage: number
    }): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post('/feature-trading/positions/open', data)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Close a trading position
    closePosition: async (positionId: string): Promise<ApiResponse> => {
      try {
        const response = await apiClient.post(`/feature-trading/positions/${positionId}/close`)
        return handleApiResponse(response)
      } catch (error) {
        return handleApiError(error)
      }
    },

    // Get trading statistics
    getStats: async (): Promise<ApiResponse> => {
      try {
        const response = await apiClient.get('/feature-trading/stats')
        return handleApiResponse(response.data)
      } catch (error) {
        return handleApiError(error)
      }
    }
  }
}

export { apiClient }
