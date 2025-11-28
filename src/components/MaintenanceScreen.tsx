'use client';

import React from 'react';
import { Card, CardBody, Button } from '@heroui/react';
import { MdBuild, MdRefresh, MdHome, MdArrowBack } from 'react-icons/md';
import { useRouter } from 'next/navigation';

interface MaintenanceScreenProps {
  title: string;
  message: string;
  showRefreshButton?: boolean;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  onRefresh?: () => void;
  onBack?: () => void;
}

const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  title,
  message,
  showRefreshButton = true,
  showHomeButton = true,
  showBackButton = true,
  onRefresh,
  onBack
}) => {
  const router = useRouter();

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  const handleHome = () => {
    router.push('/');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-background-alt flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-background-alt border-gray-700">
        <CardBody className="p-8 text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <MdBuild className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-4">
            {title}
          </h1>

          {/* Message */}
          <p className="text-gray-300 mb-8 leading-relaxed">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            {showRefreshButton && (
              <Button
                color="primary"
                variant="solid"
                className="w-full rounded-full text-background font-semibold"
                startContent={<MdRefresh className="w-4 h-4 font-semibold" />}
                onPress={handleRefresh}
              >
                Refresh
              </Button>
            )}

            <div className="flex gap-3">
              {showBackButton && (
                <Button
                  color="secondary"
                  variant="bordered"
                  className="flex-1 rounded-full font-semibold"
                  startContent={<MdArrowBack className="w-4 h-4" />}
                  onClick={handleBack}
                >
                  Back
                </Button>
              )}

              {showHomeButton && (
                <Button
                  color="secondary"
                  variant="bordered"
                  className="flex-1 rounded-full font-semibold"
                  startContent={<MdHome className="w-4 h-4" />}
                  onClick={handleHome}
                >
                  Home
                </Button>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-500">
              We&apos;re working hard to get everything back online. 
              Thank you for your patience!
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default MaintenanceScreen;
