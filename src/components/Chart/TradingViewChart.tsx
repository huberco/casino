'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useWebSocket } from '@/contexts/socketContext';

interface Candlestick {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: Date;
  volume: number;
}

interface TradingViewChartProps {
  symbol: string;
  height?: number;
  showControls?: boolean;
  onPriceChange?: (price: number, change: number, changePercent: number) => void;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ 
  symbol, 
  height = 400, 
  showControls = true,
  onPriceChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isConnected, on, off, emit } = useWebSocket();
  const [candlesticks, setCandlesticks] = useState<Candlestick[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1d'>('1m');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(0);
  const [lastPrice, setLastPrice] = useState<number>(0);

  // Chart configuration
  const chartConfig = {
    candleWidth: 10,
    candleSpacing: 3,
    padding: { top: 30, right: 60, bottom: 50, left: 80 },
    colors: {
      background: '#000000',
      grid: '#2a2a2a',
      text: '#ffffff',
      textSecondary: '#cccccc',
      bullish: '#00ff88',
      bearish: '#ff4444',
      neutral: '#888888',
      priceLine: '#ffff00'
    }
  };

  // Fetch initial data
  const fetchMarketData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log(">>>>>>>>>>>>>>>>>>>>>symbol + fetchMarketData",symbol)
      const { gameApi } = await import('@/lib/api');
      const response = await gameApi.featureTrading.getPriceHistory(symbol, timeframe, 200);
      
      if (response.success && response.data) {
        const history = response.data.history?.map((candle: any) => ({
          ...candle,
          timestamp: new Date(candle.timestamp)
        })) || [];
        setCandlesticks(history);
        
        // Set initial price from last candle
        if (history.length > 0) {
          const lastCandle = history[history.length - 1];
          setCurrentPrice(lastCandle.close);
          setLastPrice(lastCandle.close);
        }
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  // Get timeframe in milliseconds
  const getTimeframeMs = (tf: string): number => {
    const timeframes: { [key: string]: number } = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    return timeframes[tf] || 60 * 1000;
  };

  // Memoize event handlers to prevent unnecessary re-renders
  const handlePriceUpdate = useCallback((update: PriceUpdate) => {
    if (update.symbol.toLowerCase() === symbol.toLowerCase()) {
      const newPrice = update.price;
      const prevPrice = lastPrice || currentPrice;
      
      setCurrentPrice(newPrice);
      setLastPrice(prevPrice);
      
      // Calculate price change
      const change = newPrice - prevPrice;
      const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
      
      setPriceChange(change);
      setPriceChangePercent(changePercent);
      
      // Notify parent component
      if (onPriceChange) {
        onPriceChange(newPrice, change, changePercent);
      }
      
      // Update candlesticks
      setCandlesticks(prev => {
        const now = new Date();
        const lastCandle = prev[prev.length - 1];
        
        if (!lastCandle) return prev;
        
        const timeDiff = now.getTime() - lastCandle.timestamp.getTime();
        const timeframeMs = getTimeframeMs(timeframe);
        
        if (timeDiff >= timeframeMs) {
          // Create new candle
          const newCandle: Candlestick = {
            timestamp: new Date(Math.floor(now.getTime() / timeframeMs) * timeframeMs),
            open: lastCandle.close,
            high: newPrice,
            low: newPrice,
            close: newPrice,
            volume: update.volume
          };
          return [...prev.slice(-199), newCandle]; // Keep last 200 candles
        } else {
          // Update current candle
          const updatedCandles = [...prev];
          const lastIndex = updatedCandles.length - 1;
          updatedCandles[lastIndex] = {
            ...updatedCandles[lastIndex],
            high: Math.max(updatedCandles[lastIndex].high, newPrice),
            low: Math.min(updatedCandles[lastIndex].low, newPrice),
            close: newPrice
          };
          return updatedCandles;
        }
      });
    }
  }, [symbol, timeframe, onPriceChange, lastPrice, currentPrice]);

  const handleMarketData = useCallback((data: any) => {
    if (data.symbol && data.symbol.toLowerCase() === symbol.toLowerCase()) {
      setCurrentPrice(data.currentPrice || currentPrice);
      setPriceChange(data.change24h || priceChange);
      setPriceChangePercent(data.changePercent24h || priceChangePercent);
    }
  }, [symbol, currentPrice, priceChange, priceChangePercent]);

  // Set up event listeners - only when connected
  useEffect(() => {
    if (!isConnected) return;
    
    // Use only the general price update event for all symbols
    on('feature_trading_price_update', handlePriceUpdate);
    on('market_data', handleMarketData);

    return () => {
      off('feature_trading_price_update', handlePriceUpdate);
      off('market_data', handleMarketData);
    };
  }, [isConnected, on, off, handlePriceUpdate, handleMarketData]);

  // Handle subscription separately - only when symbol changes
  useEffect(() => {
    if (!isConnected || !symbol) return;

    // Subscribe to the new symbol
    emit('subscribe_market', { symbol });

    return () => {
      // Unsubscribe from the previous symbol
      emit('unsubscribe_market', { symbol });
    };
  }, [symbol, isConnected, emit]);

  // Fetch initial data when component mounts or symbol/timeframe changes
  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  // Draw chart
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || candlesticks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Optimize canvas rendering
    ctx.imageSmoothingEnabled = false;
    ctx.textBaseline = 'middle';

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const { padding } = chartConfig;

    // Clear canvas with crisp edges
    ctx.fillStyle = chartConfig.colors.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Calculate chart dimensions
    const chartWidth = canvasWidth - padding.left - padding.right;
    const chartHeight = canvasHeight - padding.top - padding.bottom;

    if (chartWidth <= 0 || chartHeight <= 0) return;

    // Get visible price range
    const visibleCandles = candlesticks.slice(-Math.floor(chartWidth / (chartConfig.candleWidth + chartConfig.candleSpacing)));
    const visiblePrices = visibleCandles.flatMap(c => [c.open, c.high, c.low, c.close]);
    const minPrice = Math.min(...visiblePrices);
    const maxPrice = Math.max(...visiblePrices);
    const priceRange = maxPrice - minPrice || 1;

    // Draw grid
    ctx.strokeStyle = chartConfig.colors.grid;
    ctx.lineWidth = 1;
    
    // Horizontal grid lines (price levels)
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(canvasWidth - padding.right, y);
      ctx.stroke();
      
      // Price labels with better font rendering
      const price = maxPrice - (priceRange / 5) * i;
      ctx.fillStyle = chartConfig.colors.textSecondary;
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(price.toFixed(2), padding.left - 15, y);
    }

    // Vertical grid lines (time)
    for (let i = 0; i <= 10; i++) {
      const x = padding.left + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, canvasHeight - padding.bottom);
      ctx.stroke();
    }

    // Draw candlesticks with better clarity
    visibleCandles.forEach((candle, index) => {
      const x = padding.left + index * (chartConfig.candleWidth + chartConfig.candleSpacing);
      const isBullish = candle.close > candle.open;
      
      // Candle body with crisp edges
      const bodyTop = padding.top + ((maxPrice - Math.max(candle.open, candle.close)) / priceRange) * chartHeight;
      const bodyBottom = padding.top + ((maxPrice - Math.min(candle.open, candle.close)) / priceRange) * chartHeight;
      const bodyHeight = Math.max(2, bodyBottom - bodyTop);

      // Draw candle body with outline for better visibility
      ctx.fillStyle = isBullish ? chartConfig.colors.bullish : chartConfig.colors.bearish;
      ctx.fillRect(x + chartConfig.candleSpacing / 2, bodyTop, chartConfig.candleWidth, bodyHeight);
      
      // Add subtle outline for better definition
      ctx.strokeStyle = isBullish ? '#00cc66' : '#cc3333';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + chartConfig.candleSpacing / 2, bodyTop, chartConfig.candleWidth, bodyHeight);

      // Candle wick with better visibility
      const wickTop = padding.top + ((maxPrice - candle.high) / priceRange) * chartHeight;
      const wickBottom = padding.top + ((maxPrice - candle.low) / priceRange) * chartHeight;
      const wickX = x + chartConfig.candleSpacing / 2 + chartConfig.candleWidth / 2;

      ctx.strokeStyle = isBullish ? chartConfig.colors.bullish : chartConfig.colors.bearish;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(wickX, wickTop);
      ctx.lineTo(wickX, wickBottom);
      ctx.stroke();
    });

    // Draw current price line with better visibility
    if (currentPrice > 0) {
      const priceY = padding.top + ((maxPrice - currentPrice) / priceRange) * chartHeight;
      ctx.strokeStyle = chartConfig.colors.priceLine;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, priceY);
      ctx.lineTo(canvasWidth - padding.right, priceY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price label with better font and background
      ctx.fillStyle = chartConfig.colors.background;
      ctx.fillRect(canvasWidth - padding.right + 5, priceY - 12, 120, 24);
      
      ctx.fillStyle = chartConfig.colors.priceLine;
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`$${currentPrice.toFixed(2)}`, canvasWidth - padding.right + 10, priceY);
    }

    // Chart title with better font
    ctx.fillStyle = chartConfig.colors.text;
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${symbol}/USD`, padding.left, 10);
  }, [candlesticks, currentPrice, symbol]);

  // Redraw chart when data changes
  useEffect(() => {
    drawChart();
  }, [drawChart]);

  // Handle resize with better quality
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Set actual canvas size
        canvas.width = rect.width * dpr;
        canvas.height = height * dpr;
        
        // Set display size
        canvas.style.width = rect.width + 'px';
        canvas.style.height = height + 'px';
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Scale context for crisp rendering
          ctx.scale(dpr, dpr);
          
          // Optimize rendering
          ctx.imageSmoothingEnabled = false;
        }
        
        drawChart();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [height, drawChart]);

  return (
    <div className="w-full">
      {showControls && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="px-3 py-1 bg-gray-800 text-white rounded border border-gray-600"
            >
              <option value="tick">tick</option>
              <option value="1m">1m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="1h">1h</option>
              <option value="1d">1d</option>
            </select>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="px-2 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
              >
                -
              </button>
              <span className="text-sm text-gray-400">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                className="px-2 py-1 bg-gray-700 text-white rounded text-sm hover:bg-gray-600"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="text-gray-400">Price: 
              <span className={`ml-2 font-mono ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${currentPrice.toFixed(2)}
              </span>
            </div>
            {priceChange !== 0 && (
              <div className={`${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10 rounded">
            <div className="text-white">Loading chart data...</div>
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          className="w-full border border-gray-600 rounded-lg shadow-lg"
          style={{ 
            height: `${height}px`,
            imageRendering: 'crisp-edges'
          }}
        />
      </div>
    </div>
  );
};

export default TradingViewChart;
