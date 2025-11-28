'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardHeader, Button, Select, SelectItem, Chip } from '@heroui/react';
import { FaChartBar, FaDollarSign, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { FaChartLine } from 'react-icons/fa6';
import TradingViewChart from '@/components/Chart/TradingViewChart';
import TradingPanel from '@/components/TradingPanel';
import { useWebSocket } from '@/contexts/socketContext';
import { useAuth } from '@/contexts/AuthContext';
import { gameApi } from '@/lib/api';
import { useGamePageTracking } from '@/hooks/useGamePageTracking';
import { createChart, LineSeries, AreaSeries } from 'lightweight-charts';
// import { TradingChart } from './chart';
import BinanceChart from './testChart';
import PrimaryButton from '@/components/ui/PrimaryButton';

interface MarketData {
  symbol: string;
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  totalVolume24h: number;
  totalOpenPositions: number;
}

function BetControls({ symbol, currentPrice }: { symbol: string; currentPrice: number }) {
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [wager, setWager] = useState<number>(0.01);
  const [leverage, setLeverage] = useState<number>(1);
  const [placing, setPlacing] = useState<boolean>(false);

  const format = (v: number) => {
    if (!isFinite(v)) return '-';
    return v >= 1000 ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : v.toFixed(2);
  };

  const calculateBustPrice = (entry: number, lev: number, dir: 'up' | 'down') => {
    if (!entry || !lev) return 0;
    const delta = entry / lev;
    return dir === 'up' ? entry - delta : entry + delta;
  };

  const bustPrice = calculateBustPrice(currentPrice || 0, leverage || 1, direction);

  const placeBet = async () => {
    try {
      setPlacing(true);
      const res = await fetch('/api/trading/bets/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          token: symbol,
          direction,
          wager: Number(wager),
          leverage: Number(leverage),
        }),
      });
      const data = await res.json();
      if (!data?.success) {
        console.error('Failed to place bet', data);
        alert(data?.error || 'Failed to place bet');
      } else {
        alert('Bet placed');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to place bet');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="w-full rounded-md bg-background p-4">
      <div className="mb-3 flex gap-3">
        <Button
          onPress={() => setDirection('up')}
          className={`cursor-pointer hover:scale-[1.01] flex-1 px-3 py-2 rounded-md border ${direction === 'up' ? 'bg-primary/20 border-primary text-green-300' : 'bg-transparent border-gray-700 text-gray-300'}`}
        >
          <span className="inline-flex items-center gap-2"><FaArrowUp /> Up</span>
        </Button>
        <Button
          onPress={() => setDirection('down')}
          className={`cursor-pointer hover:scale-[1.01] flex-1 px-3 py-2 rounded-md border ${direction === 'down' ? 'bg-red-600/20 border-red-500 text-red-300' : 'bg-transparent border-gray-700 text-gray-300'}`}
        >
          <span className="inline-flex items-center gap-2"><FaArrowDown /> Down</span>
        </Button>
      </div>

      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">Wager</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={wager}
            onChange={(e) => setWager(Number(e.target.value))}
            className="flex-1 bg-transparent border border-gray-700 rounded-md px-3 py-2 text-white"
          />
          <Button className="px-2 py-2 text-xs border border-gray-700 rounded-md text-gray-300" onPress={() => setWager((v) => Math.max(0.01, v / 2))}>1/2</Button>
          <Button className="px-2 py-2 text-xs border border-gray-700 rounded-md text-gray-300" onPress={() => setWager((v) => Number((v * 2).toFixed(2)))}>x2</Button>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-xs text-gray-400 mb-1">Leverage</div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">x1</span>
          <input
            type="range"
            min={1}
            max={1000}
            step={1}
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-gray-400">x1000</span>
        </div>
        <div className="mt-2 text-sm text-gray-300 flex items-center justify-between">
          <div>
            <span className="text-gray-400 mr-2">Payout Multiplier</span>
            <span className="font-semibold">x{leverage.toLocaleString()}</span>
          </div>
          <div className="text-gray-400">
            <span className="mr-1">Bust Price:</span>
            <span className={`${direction === 'up' ? 'text-red-300' : 'text-green-300'} font-semibold`}>{format(bustPrice)}</span>
          </div>
        </div>
      </div>

      <PrimaryButton
        onClick={placeBet}
        disabled={placing}
        className="w-full mt-3 bg-primary  text-black font-semibold py-3 rounded-full disabled:opacity-60"
      >
        {placing ? 'Placing...' : 'Place Bet'}
      </PrimaryButton>

      <div className="mt-2 text-xs text-gray-500">Token: {symbol} • Entry: {format(currentPrice || 0)}</div>
    </div>
  );
}

interface TradingStats {
  totalMarkets: number;
  totalVolume24h: number;
  totalOpenPositions: number;
  markets: MarketData[];
}

export default function FeatureTradingPage() {
  const { isConnected, on, off, emit } = useWebSocket();
  const { user } = useAuth();

  // Track when user visits this game page
  useGamePageTracking({ gameType: 'feature_trading' });

  // State
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BNB');
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [tradingStats, setTradingStats] = useState<TradingStats | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Available trading pairs
  // const tradingPairs = ['BTC', 'ETH', 'BNB', 'SOL'];
  const tradingPairs = ['BNB'];

  // Fetch markets data
  const fetchMarkets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await gameApi.featureTrading.getMarkets();

      console.log('response', response);
      if (response.success) {
        setMarkets(response.data || []);

        // Set initial price for selected symbol
        const selectedMarket = response.data.find((m: MarketData) => m.symbol === selectedSymbol);
        if (selectedMarket) {
          setCurrentPrice(selectedMarket.currentPrice);
          setPriceChange(selectedMarket.change24h);
          setPriceChangePercent(selectedMarket.changePercent24h);
        }
      }
    } catch (error) {
      console.error('Failed to fetch markets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSymbol]);

  // Fetch trading statistics
  const fetchTradingStats = useCallback(async () => {
    try {
      const response = await gameApi.featureTrading.getStats();
      if (response.success) {
        setTradingStats(response.data || null);
      }
    } catch (error) {
      console.error('Failed to fetch trading stats:', error);
    }
  }, []);

  // Handle price updates from chart
  const handlePriceChange = useCallback((price: number, change: number, changePercent: number) => {
    setCurrentPrice(price);
    setPriceChange(change);
    setPriceChangePercent(changePercent);
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchMarkets();
    fetchTradingStats();
  }, [fetchMarkets, fetchTradingStats]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handlePriceUpdate = useCallback((data: any) => {
    if (data.symbol && data.symbol === selectedSymbol) {
      setCurrentPrice(data.price);

      // Update markets data
      setMarkets(prev => prev.map(market =>
        market.symbol === data.symbol
          ? { ...market, currentPrice: data.price }
          : market
      ));
    }
  }, [selectedSymbol]);

  const handleMarketData = useCallback((data: any) => {
    if (data.symbol) {
      setMarkets(prev => prev.map(market =>
        market.symbol === data.symbol
          ? { ...market, ...data }
          : market
      ));

      // Update current price if it's the selected symbol
      if (data.symbol === selectedSymbol) {
        setCurrentPrice(data.currentPrice);
        setPriceChange(data.change24h);
        setPriceChangePercent(data.changePercent24h);
      }
    }
  }, [selectedSymbol]);

  // Listen for real-time updates - only set up once when connected
  useEffect(() => {
    if (!isConnected) return;

    on('feature_trading_price_update', handlePriceUpdate);
    on('market_data', handleMarketData);

    return () => {
      off('feature_trading_price_update', handlePriceUpdate);
      off('market_data', handleMarketData);
    };
  }, [isConnected, on, off, handlePriceUpdate, handleMarketData]);

  // Note: Market subscription is now handled by the TradingViewChart component
  // to avoid duplicate subscriptions and infinite loops

  // Update selected market when symbol changes
  useEffect(() => {
    const selectedMarket = markets.find(m => m.symbol === selectedSymbol);
    if (selectedMarket) {
      setCurrentPrice(selectedMarket.currentPrice);
      setPriceChange(selectedMarket.change24h);
      setPriceChangePercent(selectedMarket.changePercent24h);
    }
  }, [selectedSymbol, markets]);

  const selectedMarketData = markets.find(m => m.symbol === selectedSymbol);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-alt p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Trading</h1>
            <p className="text-gray-400">Trade cryptocurrencies with leverage in real-time</p>
          </div>

          <div className="flex items-center gap-4">
            {/* <Select
              selectedKeys={[selectedSymbol]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedSymbol(selected);
              }}
              className="max-w-[120px]"
            >
              {tradingPairs.map((symbol) => (
                <SelectItem key={symbol}>
                  {symbol}
                </SelectItem>
              ))}
            </Select> */}
          </div>
        </div>

        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {markets.map((market) => (
            <Card
              key={market.symbol}
              className={`bg-background-alt border-gray-700 cursor-pointer transition-all ${selectedSymbol === market.symbol ? 'ring-2 ring-primary' : ''
                }`}
              onPress={() => setSelectedSymbol(market.symbol)}
            >
              <CardBody className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-white">{market.symbol}</span>
                  <div className={`flex items-center gap-1 ${market.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                    {market.changePercent24h >= 0 ? (
                      <FaArrowUp className="w-4 h-4" />
                    ) : (
                      <FaArrowDown className="w-4 h-4" />
                    )}
                    <span className="text-sm">
                      {market.changePercent24h >= 0 ? '+' : ''}{market.changePercent24h.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-2xl font-bold text-white">
                    ${market.currentPrice.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">
                    24h: ${market.change24h.toFixed(2)}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Vol: ${market.totalVolume24h.toFixed(0)}</span>
                    <span>Pos: {market.totalOpenPositions}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Trading Statistics */}
        {tradingStats && (
          <Card className="bg-background-alt border-gray-700">
            <CardHeader>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FaChartBar className="w-5 h-5" />
                Trading Statistics
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{tradingStats.totalMarkets}</div>
                  <div className="text-sm text-gray-400">Markets</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    ${tradingStats.totalVolume24h.toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-400">24h Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{tradingStats.totalOpenPositions}</div>
                  <div className="text-sm text-gray-400">Open Positions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {tradingStats.markets.reduce((sum, m) => sum + m.totalOpenPositions, 0)}
                  </div>
                  <div className="text-sm text-gray-400">Total Positions</div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Main Trading Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-3">
            <Card className="bg-background-alt border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedSymbol} Chart</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`text-xl font-bold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${currentPrice.toFixed(2)}
                      </span>
                      <Chip
                        size="sm"
                        color={priceChange >= 0 ? 'success' : 'danger'}
                        variant="flat"
                      >
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                      </Chip>
                    </div>
                  </div>

                  {selectedMarketData && (
                    <div className="text-right text-sm text-gray-400">
                      <div>24h Volume: ${selectedMarketData.totalVolume24h.toFixed(0)}</div>
                      <div>Positions: {selectedMarketData.totalOpenPositions}</div>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardBody>
                <div className='flex-col flex lg:flex-row gap-4'>
                  <div className='w-full lg:w-1/2 xl:w-2/3'>
                    <BinanceChart />
                  </div>
                  <div className='w-full lg:w-1/2 xl:w-1/3'>
                    {/* Bet Control Panel */}
                    <BetControls
                      symbol={selectedSymbol}
                      currentPrice={currentPrice}
                    />
                  </div>
                </div>
                {/* <TradingViewChart
                  symbol={selectedSymbol}
                  height={500}
                  showControls={true}
                  onPriceChange={handlePriceChange}
                /> */}
                {/* <TradingChart token={selectedSymbol} /> */}
              </CardBody>
            </Card>
          </div>

          {/* Trading Panel */}
          <div>
            {/* <TradingChart /> */}
            {/* <TradingChart token={tokenData as any} /> */}
            {/* <TradingPanel
              symbol={selectedSymbol}
              currentPrice={currentPrice}
              priceChange={priceChange}
              priceChangePercent={priceChangePercent}
            /> */}
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <Card className="bg-yellow-900/20 border-yellow-500/50">
            <CardBody>
              <div className="flex items-center gap-3 text-yellow-400">
                <FaChartLine className="w-5 h-5" />
                <span>Connecting to trading server...</span>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Authentication Notice */}
        {!user?.profile && (
          <Card className="bg-blue-900/20 border-blue-500/50">
            <CardBody>
              <div className="flex items-center gap-3 text-blue-400">
                <FaDollarSign className="w-5 h-5" />
                <span>Please login to start trading</span>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
