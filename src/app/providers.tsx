// app/providers.tsx
'use client'

import AuthModal from '@/components/modals/AuthModal'
import SuccessModal from '@/components/modals/SuccessModal'
import ErrorModal from '@/components/modals/ErrorModal'
import { AuthProvider } from '@/contexts/AuthContext'
import { ModalProvider } from '@/contexts/modalContext'
import { WebSocketProvider } from '@/contexts/socketContext'
import { GameSettingsProvider } from '@/contexts/GameSettingsContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { XPProvider } from '@/contexts/XPContext'
import { AppLoadProvider } from '@/contexts/AppLoadContext'
import LevelUpNotification from '@/components/XP/LevelUpNotification'
import NotificationManager from '@/components/notifications/NotificationManager'
import BalanceUpdateListener from '@/components/BalanceUpdateListener'
import { HeroUIProvider, ToastProvider } from '@heroui/react'
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <AppLoadProvider>
      <AuthProvider>
        <WebSocketProvider>
          <XPProvider>
            <NotificationProvider>
              <GameSettingsProvider>
                <ModalProvider>
                  <WebSocketLoadingWrapper>
                    {children}
                    <AuthModal />
                    <SuccessModal />
                    <ErrorModal />
                    <LevelUpNotification />
                    <NotificationManager />
                    <BalanceUpdateListener />
                    <ToastProvider placement='top-center'/>
                  </WebSocketLoadingWrapper>
                </ModalProvider>
              </GameSettingsProvider>
            </NotificationProvider>
          </XPProvider>
        </WebSocketProvider>
      </AuthProvider>
      </AppLoadProvider>
    </HeroUIProvider>
  )
}

// Wrapper component to handle WebSocket loading state
function WebSocketLoadingWrapper({ children }: { children: React.ReactNode }) {
  // Removed GlobalLoading to prevent double loading views
  // GameStatusWrapper already handles loading states for game pages
  return <>{children}</>
}
