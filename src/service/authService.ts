import { gameApi } from '@/lib/api'
import type { UserProfile } from '@/types/user'

export class AuthService {
  // Get user profile from backend
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const response = await gameApi.user.getProfile()
      
      if (response.success && response.data) {
        return response.data as UserProfile
      }
      
      console.error('Failed to get user profile:', response.error)
      return null
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  // Update user profile
  async updateUserProfile(updates: { username?: string; avatar?: string }): Promise<UserProfile | null> {
    try {
      const response = await gameApi.user.updateProfile(updates)
      
      if (response.success && response.data) {
        return response.data as UserProfile
      }
      
      console.error('Failed to update user profile:', response.error)
      return null
    } catch (error) {
      console.error('Error updating user profile:', error)
      return null
    }
  }

  // Get user statistics
  async getUserStats(): Promise<any | null> {
    try {
      const response = await gameApi.user.getStatistics()
      
      if (response.success && response.data) {
        return response.data
      }
      
      console.error('Failed to get user stats:', response.error)
      return null
    } catch (error) {
      console.error('Error fetching user stats:', error)
      return null
    }
  }
}
// Create singleton instance
export const authService = new AuthService()