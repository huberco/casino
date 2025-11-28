'use client'

import React, { useEffect, useState, createContext, useContext } from 'react'
import { Card, CardBody } from '@heroui/react'
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa'

export interface NotificationData {
  _id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  duration?: number
  timestamp: Date
}

interface NotificationProps {
  notification: NotificationData
  onClose: (id: string) => void
}

export default function Notification({ notification, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Auto-close after duration
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, notification.duration)
      return () => clearTimeout(timer)
    }
  }, [notification.duration, notification._id]) // Added notification.id to ensure effect runs for each unique notification

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose(notification._id)
    }, 300)
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <FaCheckCircle className="text-green-500" />
      case 'error':
        return <FaTimesCircle className="text-red-500" />
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" />
      case 'info':
      default:
        return <FaInfoCircle className="text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
      default:
        return 'text-blue-800'
    }
  }

  return (
    <div
      className={`
        max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <Card className={`border ${getBackgroundColor()}`}>
        <CardBody className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-medium ${getTextColor()}`}>
                {notification.title}
              </h4>
              <p className={`text-xs mt-1 ${getTextColor()} opacity-80`}>
                {notification.message}
              </p>
              <p className={`text-xs mt-2 ${getTextColor()} opacity-60`}>
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={handleClose}
              className={`flex-shrink-0 ml-2 ${getTextColor()} opacity-60 hover:opacity-100 transition-opacity`}
            >
              <FaTimesCircle className="w-4 h-4" />
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

// Notification context for global notifications
interface NotificationContextType {
  notifications: NotificationData[]
  addNotification: (notification: Omit<NotificationData, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  const addNotification = (notification: Omit<NotificationData, 'id' | 'timestamp'>) => {
    const newNotification: NotificationData = {
      ...notification,
      _id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }
    
    setNotifications(prev => [...prev, newNotification])
  }

  const removeNotification = (id: string) => {
    console.log(">>>>>>>>>>>>>>>>>>id", id)
    setNotifications(prev => prev.filter(n => n._id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  useEffect(() => {
    console.log(">>>>>>>>>>>>>>>>>>notifications", notifications)
  }, [notifications])

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      
      {/* Render notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {notifications.map(notification => (
          <div key={notification._id} className="pointer-events-auto">
            <Notification
              notification={notification}
              onClose={removeNotification}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
