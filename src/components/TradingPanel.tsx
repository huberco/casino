'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Input, Select, SelectItem, Card, CardBody, CardHeader, Chip, Divider } from '@heroui/react';
import { FaArrowUp, FaArrowDown, FaDollarSign, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/socketContext';
import { useModalType } from '@/contexts/modalContext';
import { gameApi } from '@/lib/api';

interface MarketData {
  symbol: string;
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  totalVolume24h: number;
  totalOpenPositions: number;
}

interface Position {
  _id: string;
  symbol: string;
  type: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  amount: number;
  leverage: number;
  pnl: number;
  openedAt: string;
  isOpen: boolean;
}

interface TradingPanelProps {
  symbol: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  onPositionUpdate?: () => void;
}

const TradingPanel: React.FC<TradingPanelProps> = ({
  symbol,
  currentPrice,
  priceChange,
  priceChangePercent,
  onPositionUpdate
}) => {
  const { user, fetchUserProfile } = useAuth();
  const { emit, on, off } = useWebSocket();
  const { showModal: showSuccessModal } = useModalType('success');
  const { showModal: showErrorModal } = useModalType('error');
  
  // Trading state
  const [positionType, setPositionType] = useState<'long' | 'short'>('long');
  const [amount, setAmount] = useState<number>(10);
  const [leverage, setLeverage] = useState<number>(10);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [userPositions, setUserPositions] = useState<Position[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);

  // Leverage options
  const leverageOptions = [1, 2, 3, 5, 10, 15, 20, 25, 50, 100];

  // Fetch user positions
  const fetchUserPositions = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoadingPositions(true);
      const response = await gameApi.featureTrading.getPositions(symbol);
      
      if (response.success) {
        setUserPositions(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    } finally {
      setIsLoadingPositions(false);
    }
  }, [user, symbol]);

  // Place trading position
  const placeOrder = async () => {
    if (!user) {
      showErrorModal({ message: 'Please login to place a trade' });
      return;
    }

    if (amount <= 0 || amount > (user.balance || 0)) {
      showErrorModal({ message: 'Invalid amount or insufficient balance' });
      return;
    }

    if (leverage < 1 || leverage > 100) {
      showErrorModal({ message: 'Invalid leverage amount' });
      return;
    }

    try {
      setIsPlacingOrder(true);
      
      const response = await gameApi.featureTrading.openPosition({
        symbol: symbol.toUpperCase(),
        type: positionType,
        amount,
        leverage
      });

      if (response.success) {
        showSuccessModal({ message: `${positionType.toUpperCase()} position opened successfully!` });
        setAmount(10); // Reset amount
        await fetchUserPositions();
        await fetchUserProfile(); // Update user balance
        if (onPositionUpdate) onPositionUpdate();
      } else {
        showErrorModal({ message: response.error || 'Failed to place order' });
      }
    } catch (error: any) {
      console.error('Failed to place order:', error);
      showErrorModal({ 
        message: error.response?.data?.error || 'Failed to place order' 
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Close position
  const closePosition = async (positionId: string) => {
    try {
      const response = await gameApi.featureTrading.closePosition(positionId);

      if (response.success) {
        showSuccessModal({ 
          message: `Position closed! PnL: ${response.data?.pnl >= 0 ? '+' : ''}$${response.data?.pnl?.toFixed(2)}` 
        });
        await fetchUserPositions();
        await fetchUserProfile();
        if (onPositionUpdate) onPositionUpdate();
      } else {
        showErrorModal({ message: response.error || 'Failed to close position' });
      }
    } catch (error: any) {
      console.error('Failed to close position:', error);
      showErrorModal({ 
        message: error.response?.data?.error || 'Failed to close position' 
      });
    }
  };

  // Calculate position size
  const positionSize = amount * leverage;

  // Load positions on mount and when user changes
  useEffect(() => {
    fetchUserPositions();
  }, [fetchUserPositions]);

  // Listen for position updates
  useEffect(() => {
    const handleNewPosition = (data: any) => {
      if (data.position && data.position.symbol === symbol) {
        fetchUserPositions();
      }
    };

    const handlePositionClosed = (data: any) => {
      if (data.symbol === symbol) {
        fetchUserPositions();
      }
    };

    on('feature_trading_new_position', handleNewPosition);
    on('feature_trading_position_closed', handlePositionClosed);

    return () => {
      off('feature_trading_new_position', handleNewPosition);
      off('feature_trading_position_closed', handlePositionClosed);
    };
  }, [symbol, on, off, fetchUserPositions]);

  return (
    <div className="space-y-4">
      {/* Trading Form */}
      <Card className="bg-background-alt border-gray-700">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Trade {symbol}</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Position Type */}
          <div className="flex gap-2">
            <Button
              variant={positionType === 'long' ? 'solid' : 'bordered'}
              color="success"
              className="flex-1"
              startContent={<FaArrowUp className="w-4 h-4" />}
              onPress={() => setPositionType('long')}
            >
              Long
            </Button>
            <Button
              variant={positionType === 'short' ? 'solid' : 'bordered'}
              color="danger"
              className="flex-1"
              startContent={<FaArrowDown className="w-4 h-4" />}
              onPress={() => setPositionType('short')}
            >
              Short
            </Button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Amount ($)</label>
            <Input
              type="number"
              value={amount.toString()}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              placeholder="Enter amount"
              className="text-white"
            />
            <div className="text-xs text-gray-500 mt-1">
              Balance: ${user?.balance?.toFixed(2) || '0.00'}
            </div>
          </div>

          {/* Leverage Select */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Leverage</label>
            <Select
              selectedKeys={[leverage.toString()]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setLeverage(parseInt(selected) || 10);
              }}
            >
              {leverageOptions.map((lev) => (
                <SelectItem key={lev.toString()}>
                  {lev}x
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Position Info */}
          <div className="p-3 bg-gray-800 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Position Size:</span>
              <span className="text-white font-semibold">${positionSize.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Liquidation Price:</span>
              <span className="text-orange-400 font-semibold">
                ${positionType === 'long' 
                  ? (currentPrice * (1 - 0.8 / leverage)).toFixed(2)
                  : (currentPrice * (1 + 0.8 / leverage)).toFixed(2)
                }
              </span>
            </div>
            {leverage > 10 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-orange-400">
                <FaExclamationTriangle className="w-3 h-3" />
                <span>High leverage increases risk</span>
              </div>
            )}
          </div>

          {/* Place Order Button */}
          <Button
            color={positionType === 'long' ? 'success' : 'danger'}
            size="lg"
            className="w-full"
            isDisabled={isPlacingOrder || !amount || amount <= 0}
            isLoading={isPlacingOrder}
            onPress={placeOrder}
          >
            {isPlacingOrder ? 'Placing Order...' : `Open ${positionType.toUpperCase()} Position`}
          </Button>
        </CardBody>
      </Card>

      {/* Current Positions */}
      {userPositions.length > 0 && (
        <Card className="bg-background-alt border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Your Positions</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {userPositions.map((position) => (
                <div key={position._id} className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{position.symbol}</span>
                      <Chip
                        size="sm"
                        color={position.type === 'long' ? 'success' : 'danger'}
                        variant="flat"
                      >
                        {position.type.toUpperCase()}
                      </Chip>
                      <span className="text-sm text-gray-400">{position.leverage}x</span>
                    </div>
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      onPress={() => closePosition(position._id)}
                    >
                      Close
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Entry Price</div>
                      <div className="text-white font-semibold">${position.entryPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Current Price</div>
                      <div className="text-white font-semibold">${position.currentPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Amount</div>
                      <div className="text-white font-semibold">${position.amount.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">PnL</div>
                      <div className={`font-semibold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${position.pnl.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Market Info */}
      <Card className="bg-background-alt border-gray-700">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Market Info</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Current Price</span>
              <span className={`text-white font-semibold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${currentPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">24h Change</span>
              <span className={`font-semibold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default TradingPanel;
