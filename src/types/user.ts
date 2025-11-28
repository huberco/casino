// Supabase user interface - only basic auth info
export interface SupabaseUser {
  id: string
  email?: string
  user_metadata?: {
    name?: string
    avatar_url?: string
  }
}

// Complete user profile from backend
export interface UserProfile {
  id: string
  supabaseId?: string // Optional for wallet users
  walletAddress?: string // For MetaMask/wallet users
  email?: string // Optional for wallet users (can be added later)
  name?: string
  username?: string
  displayName?: string
  bio?: string
  avatar?: string
  balance: number
  totalGames?: number
  totalWins?: number
  totalLosses?: number
  totalWagered?: number
  totalWon?: number
  winRate?: number
  profitLoss?: number
  exp: number
  level: number
  isActive: boolean
  seed?: string
  lastLogin: string
  createdAt: string
  updatedAt?: string
  paymentAccount?: string
}

// Combined user state for context
export interface User {
  supabase: SupabaseUser | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
}
