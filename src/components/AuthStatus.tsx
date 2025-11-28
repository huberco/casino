'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function AuthStatus() {
  const { user } = useAuth()

  return (
    <div className="fixed bottom-4 right-96 bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-600 z-50 max-w-sm">
      <div className="text-white text-sm space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${user.isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>Auth: {user.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${user.isLoading ? 'bg-yellow-500' : 'bg-gray-500'}`} />
          <span>Loading: {user.isLoading ? 'Yes' : 'No'}</span>
        </div>
        
        {user.isAuthenticated && (
          <>
            <div className="text-xs text-gray-400">
              ID: {user.id}
            </div>
            <div className="text-xs text-gray-400">
              Email: {user.email}
            </div>
            <div className="text-xs text-gray-400">
              Username: {user.profile?.displayName || user.profile?.username || user.username || 'None'}
            </div>
            <div className="text-xs text-gray-400">
              Profile: {user.profile ? 'Loaded' : 'Not loaded'}
            </div>
          </>
        )}
        
        <div className="text-xs text-gray-500 mt-2">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
