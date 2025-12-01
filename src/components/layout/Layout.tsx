'use client'
import React, { useEffect, useState } from 'react'
import { useGameSettings } from '@/contexts/GameSettingsContext';

interface LayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: LayoutProps) => {
    const { isSidebarOpen, isChatBoxOpen, isChatBoxCollapsed } = useGameSettings()
    const [isLargeScreen, setIsLargeScreen] = useState(false)
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsLargeScreen(window.innerWidth >= 1024)
        }
        
        checkScreenSize()
        window.addEventListener('resize', checkScreenSize)
        
        return () => window.removeEventListener('resize', checkScreenSize)
    }, [])
    
    const paddingLeft = isLargeScreen ? (isSidebarOpen ? '240px' : '55px') : '0'
    const paddingRight = isChatBoxOpen ? (isChatBoxCollapsed ? '248px' : '340px') : '0'
    return (
        <div 
            className="
                pl-0
                flex
                flex-col
                min-h-[calc(100vh-64px)]
                justify-between
                transition-all
                duration-[250ms]
                ease-in-out
                mt-16
                relative
                z-10
            "
            style={{
                paddingLeft,
                paddingRight
            }}
        >
            {children}
        </div>
    )
}

export default PageLayout