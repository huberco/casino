'use client'
import React, { useEffect, useState } from 'react'
import { useGameSettings } from '@/contexts/GameSettingsContext';

interface LayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: LayoutProps) => {
    const { isSidebarOpen, isChatBoxOpen, isChatBoxCollapsed, isMobileScreen, isTabletScreen } = useGameSettings()
    const [screenWidth, setScreenWidth] = useState(0)
    
    useEffect(() => {
        const checkScreenSize = () => {
            setScreenWidth(window.innerWidth)
        }
        
        checkScreenSize()
        window.addEventListener('resize', checkScreenSize)
        
        return () => window.removeEventListener('resize', checkScreenSize)
    }, [])
    
    // Calculate padding based on screen size:
    // Mobile (< 576px): 0 (sidebar hidden)
    // Tablet (576px - 1023px): 55px (sidebar collapsed/closed)
    // Desktop (>= 1024px): 240px if open, 55px if closed
    const getPaddingLeft = () => {
        if (isMobileScreen || screenWidth < 576) {
            return '0' // Mobile: no padding, sidebar hidden
        } else if (isTabletScreen || (screenWidth >= 576 && screenWidth < 1024)) {
            return '55px' // Tablet: collapsed sidebar
        } else {
            return isSidebarOpen ? '240px' : '55px' // Desktop: open or closed
        }
    }
    
    const paddingLeft = getPaddingLeft()
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