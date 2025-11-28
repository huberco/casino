'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

// Modal types that can be shown
export type ModalType = 
  | 'auth'
  | 'deposit'
  | 'withdraw'
  | 'profile-edit'
  | 'settings'
  | 'game-history'
  | 'referral-invite'
  | 'support-chat'
  | 'confirmation'
  | 'success'
  | 'error'

// Modal data interface for passing additional data to modals
export interface ModalData {
  [key: string]: any
}

// Modal context interface
interface ModalContextType {
  // Current modal state
  isOpen: boolean
  modalType: ModalType | null
  modalData: ModalData | null
  
  // Actions
  showModal: (type: ModalType, data?: ModalData) => void
  hideModal: () => void
  
  // Utility functions
  isModalOpen: (type: ModalType) => boolean
}

// Create the context
const ModalContext = createContext<ModalContextType | undefined>(undefined)

// Provider component
interface ModalProviderProps {
  children: ReactNode
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [modalType, setModalType] = useState<ModalType | null>(null)
  const [modalData, setModalData] = useState<ModalData | null>(null)

  // Show a modal with optional data
  const showModal = (type: ModalType, data?: ModalData) => {
    setModalType(type)
    setModalData(data || null)
    setIsOpen(true)
  }

  // Hide the current modal
  const hideModal = () => {
    setIsOpen(false)
    setModalType(null)
    setModalData(null)
  }

  // Check if a specific modal type is open
  const isModalOpen = (type: ModalType) => {
    return isOpen && modalType === type
  }

  const value: ModalContextType = {
    isOpen,
    modalType,
    modalData,
    showModal,
    hideModal,
    isModalOpen,
  }

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  )
}

// Custom hook to use the modal context
export function useModal() {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

// Hook for specific modal types
export function useModalType(type: ModalType) {
  const { isModalOpen, showModal, hideModal, modalData } = useModal()
  
  return {
    isOpen: isModalOpen(type),
    showModal: (data?: ModalData) => showModal(type, data),
    hideModal,
    modalData,
  }
}

// Utility functions for common modal operations
export const modalUtils = {
  // Show confirmation modal
  showConfirmation: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    return {
      type: 'confirmation' as ModalType,
      data: { title, message, onConfirm, onCancel }
    }
  },

  // Show success modal
  showSuccess: (title: string, message: string, duration = 3000, onClose?: () => void) => {
    return {
      type: 'success' as ModalType,
      data: { title, message, duration, onClose }
    }
  },

  // Show error modal
  showError: (title: string, message: string, onClose?: () => void) => {
    return {
      type: 'error' as ModalType,
      data: { title, message, onClose }
    }
  },

  // Show deposit modal
  showDeposit: (currency: string, minAmount?: number) => {
    return {
      type: 'deposit' as ModalType,
      data: { currency, minAmount }
    }
  },

  // Show withdraw modal
  showWithdraw: (currency: string, availableAmount: number) => {
    return {
      type: 'withdraw' as ModalType,
      data: { currency, availableAmount }
    }
  }
}
