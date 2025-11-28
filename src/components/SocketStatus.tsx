'use client'

import { useWebSocket } from '@/contexts/socketContext'
import { useAuth } from '@/contexts/AuthContext'

export default function SocketStatus() {
  const { isConnected, connect, disconnect } = useWebSocket()
  const { user } = useAuth()


  const handleForceReconnect = async () => {
    try {
      await connect()
      console.log('✅ Force reconnection successful')
    } catch (error) {
      console.error('❌ Force reconnection failed:', error)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    console.log('🔌 Manually disconnected')
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-600 z-50">
      <div className="text-white text-sm space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>Socket: {isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${user.isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>Auth: {user.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</span>
        </div>
        

        <div className="flex gap-1 mt-2 flex-wrap">

          <button
            onClick={handleForceReconnect}
            className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 disabled:opacity-50"
            disabled={isConnected}
          >
            Reconnect
          </button>
          <button
            onClick={handleDisconnect}
            className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50"
            disabled={!isConnected}
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  )
}
