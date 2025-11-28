'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, CardBody } from '@heroui/react';
import { FaWifi, FaRedo, FaHome, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';

interface ConnectionCheckScreenProps {
  title?: string;
  message?: string;
  showRefreshButton?: boolean;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  onRefresh?: () => void;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

const ConnectionCheckScreen: React.FC<ConnectionCheckScreenProps> = ({
  title = "Connection Lost",
  message = "Unable to connect to the server. Please check your internet connection and try again.",
  showRefreshButton = true,
  showHomeButton = true,
  showBackButton = true,
  onRefresh,
  onRetry,
  retryCount = 0,
  maxRetries = 3
}) => {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(retryCount);
  
  // Animation refs
  const wifiIconRef = useRef<HTMLDivElement>(null);
  const slashRef = useRef<HTMLDivElement>(null);
  const warningRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const handleRetry = async () => {
    if (retryAttempts >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    setRetryAttempts(prev => prev + 1);

    try {
      if (onRetry) {
        await onRetry();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  // Animation sequence for connection lost
  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.5 });

    // Step 1: Show WiFi icon (connected state)
    tl.fromTo(wifiIconRef.current, 
      { 
        scale: 0, 
        rotation: 0,
        color: '#10b981' // green
      },
      { 
        scale: 1, 
        duration: 0.5, 
        ease: 'back.out(1.7)' 
      }
    )
    // Step 2: WiFi starts flickering (connection issues)
    .to(wifiIconRef.current, 
      { 
        color: '#f59e0b', // yellow
        duration: 0.3 
      }
    )
    .to(wifiIconRef.current, 
      { 
        scale: 0.8, 
        duration: 0.2 
      }
    )
    .to(wifiIconRef.current, 
      { 
        scale: 1, 
        duration: 0.2 
      }
    )
    .to(wifiIconRef.current, 
      { 
        scale: 0.8, 
        duration: 0.2 
      }
    )
    .to(wifiIconRef.current, 
      { 
        scale: 1, 
        duration: 0.2 
      }
    )
    // Step 3: Connection lost - turn red and add slash
    .to(wifiIconRef.current, 
      { 
        color: '#ef4444', // red
        duration: 0.3 
      }
    )
    .fromTo(slashRef.current,
      { 
        scaleX: 0, 
        opacity: 0 
      },
      { 
        scaleX: 1, 
        opacity: 1, 
        duration: 0.4, 
        ease: 'power2.out' 
      }
    )
    // Step 4: Warning icon appears
    .fromTo(warningRef.current,
      { 
        scale: 0, 
        rotation: -180 
      },
      { 
        scale: 1, 
        rotation: 0, 
        duration: 0.5, 
        ease: 'back.out(1.7)' 
      }
    )
    // Step 5: Status text appears
    .fromTo(statusRef.current,
      { 
        opacity: 0, 
        y: 20 
      },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.4, 
        ease: 'power2.out' 
      }
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div className="bg-background-alt flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-background border border-gray-700">
        <CardBody className="p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div ref={wifiIconRef} className="text-6xl">
                <FaWifi />
              </div>
              <div ref={slashRef} className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-0.5 bg-red-500 rotate-45"></div>
              </div>
              <div ref={warningRef} className="absolute -top-2 -right-2">
                <FaExclamationTriangle className="text-2xl text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
            <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
          </div>

          {/* Connection Status */}
          <div ref={statusRef} className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-red-400">
              <FaWifi className="text-lg" />
              <span className="text-sm font-medium">No Server Response</span>
            </div>
            {retryAttempts > 0 && (
              <p className="text-xs text-red-300 mt-2">
                Retry attempts: {retryAttempts}/{maxRetries}
              </p>
            )}
          </div>

          {/* Troubleshooting Tips */}
          <div className="bg-gray-800/50 rounded-lg p-4 text-left">
            <h3 className="text-sm font-semibold text-white mb-2">Troubleshooting Tips:</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Try refreshing the page</li>
              <li>• Clear your browser cache</li>
              <li>• Disable VPN if using one</li>
              <li>• Contact support if problem persists</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Retry Button */}
            {retryAttempts < maxRetries && (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                onPress={handleRetry}
                isLoading={isRetrying}
                startContent={!isRetrying && <FaRedo />}
                disabled={isRetrying}
              >
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </Button>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {showBackButton && (
                <Button
                  className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-semibold"
                  onPress={handleGoBack}
                  startContent={<FaArrowLeft />}
                >
                  Go Back
                </Button>
              )}
              {showHomeButton && (
                <Button
                  className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-semibold"
                  onPress={handleGoHome}
                  startContent={<FaHome />}
                >
                  Go Home
                </Button>
              )}
            </div>
          </div>

          {/* Auto-retry indicator */}
          {retryAttempts >= maxRetries && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-xs text-yellow-300">
                Maximum retry attempts reached. Please check your connection or contact support.
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default ConnectionCheckScreen;
