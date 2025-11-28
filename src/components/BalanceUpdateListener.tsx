'use client';

import { useEffect } from 'react';
import { useWebSocket } from '@/contexts/socketContext';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Global component that listens for balance updates via WebSocket
 * and updates the user's balance in the auth context
 */
export default function BalanceUpdateListener() {
  const { on, off, isConnected } = useWebSocket();
  const { user, updateBalance } = useAuth();

  useEffect(() => {
    if (!isConnected || !user.isAuthenticated) return;

    const handleBalanceUpdate = (data: any) => {
      console.log('💰 Global balance update received:', data);
      
      // Only update if it's for the current user
      if (data.userId === user.profile?.id) {
        updateBalance(data.newBalance);
        
        // Optional: Show a toast notification for deposits/withdrawals
        if (data.reason === 'deposit_success') {
          console.log(`✅ Deposit successful: +${data.change}`);
        } else if (data.reason === 'withdrawal_success') {
          console.log(`✅ Withdrawal successful: ${data.change}`);
        }
      }
    };

    // Register the listener
    on('user_balance_update', handleBalanceUpdate);

    // Cleanup on unmount
    return () => {
      off('user_balance_update', handleBalanceUpdate);
    };
  }, [isConnected, on, off, user.isAuthenticated, user.profile?.id, updateBalance]);

  // This component doesn't render anything
  return null;
}

