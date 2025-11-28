'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner } from '@heroui/react';
import { useDailyStats } from '@/hooks/useDailyStats';
import { DailyStat } from '@/types/dailyStats';
import Box from '@mui/material/Box';
import { BarChart } from '@mui/x-charts/BarChart';

interface DailyPlayingChartProps {
  className?: string;
}

export default function DailyPlayingChart({ className }: DailyPlayingChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const { data, loading, error, refetch } = useDailyStats(selectedPeriod);

  const periods = [
    { label: '7D', value: 7 },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
    { label: '1Y', value: 365 }
  ];

  const handlePeriodChange = (period: number) => {
    setSelectedPeriod(period);
  };

  // Prepare data for MUI BarChart - moved to top to follow Rules of Hooks
  const chartData = React.useMemo(() => {
    if (!data || data.dailyStats.length === 0) {
      return {
        gamesData: [],
        wageredData: [],
        xAxisData: []
      };
    }

    const gamesData = data.dailyStats.map(day => day.games);
    const wageredData = data.dailyStats.map(day => day.wagered);
    const xAxisData = data.dailyStats.map(day => {
      const date = new Date(day.date);
      if (selectedPeriod <= 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (selectedPeriod <= 30) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short' });
      }
    });

    return {
      gamesData,
      wageredData,
      xAxisData
    };
  }, [data, selectedPeriod]);

  if (loading) {
    return (
      <Card className={`bg-background-alt border border-gray-700/50 ${className}`}>
        <CardBody className="p-6">
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" color="primary" />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-background-alt border border-red-500/20 ${className}`}>
        <CardBody className="p-6">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={refetch} color="primary" variant="flat">
              Retry
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!data || data.dailyStats.length === 0) {
    return (
      <Card className={`bg-background-alt border border-gray-700/50 ${className}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-semibold text-white">Daily Playing Activity</h2>
            <div className="flex space-x-1">
              {periods.map((period) => (
                <Button
                  key={period.value}
                  size="sm"
                  variant={selectedPeriod === period.value ? "solid" : "flat"}
                  color={selectedPeriod === period.value ? "primary" : "default"}
                  onPress={() => handlePeriodChange(period.value)}
                  className="text-xs"
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="text-center py-12 text-gray-400">
            <p>No playing activity found for the selected period.</p>
            <p className="text-sm mt-2">Start playing games to see your daily statistics!</p>
          </div>
        </CardBody>
      </Card>
    );
  }


  return (
    <Card className={`bg-background-alt border border-gray-700/50 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between w-full">
          <div>
            <h2 className="text-xl font-semibold text-white">Daily Playing Activity</h2>
            <p className="text-sm text-gray-400 mt-1">
              {data.summary.totalGames} games • {data.summary.activeDays} active days • {data.summary.winRate}% win rate
            </p>
          </div>
          <div className="flex space-x-1">
            {periods.map((period) => (
              <Button
                key={period.value}
                size="sm"
                variant={selectedPeriod === period.value ? "solid" : "flat"}
                color={selectedPeriod === period.value ? "primary" : "default"}
                onClick={() => handlePeriodChange(period.value)}
                className="text-xs"
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        {/* Summary Stats */}
        <div className="hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{data.summary.totalGames}</p>
              <p className="text-sm text-gray-400">Total Games</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{data.summary.totalWagered.toFixed(2)}</p>
              <p className="text-sm text-gray-400">Total Wagered</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{data.summary.totalWon.toFixed(2)}</p>
              <p className="text-sm text-gray-400">Total Won</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${data.summary.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.summary.totalProfit >= 0 ? '+' : ''}{data.summary.totalProfit.toFixed(2)}
              </p>
              <p className="text-sm text-gray-400">Net Profit</p>
            </div>
          </div>
        </div>

        {/* MUI Bar Chart */}
        <div className="relative">
          <Box sx={{ width: '100%', height: 420 }}>
            {chartData.gamesData.length > 0 ? (
              <BarChart
                height={400}
                series={[
                  {
                    data: chartData.gamesData,
                    label: 'Games',
                    color: '#3B82F6', // Blue
                  },
                  {
                    data: chartData.wageredData,
                    label: 'Wagered',
                    color: '#10B981', // Green
                  },
                ]}
                xAxis={[
                  {
                    scaleType: 'band',
                    data: chartData.xAxisData,
                    tickLabelStyle: {
                      fontSize: '0.75rem',
                      fill: '#9CA3AF',
                    },
                  },
                ]}
                yAxis={[
                  {
                    tickLabelStyle: {
                      fontSize: '0.75rem',
                      fill: '#9CA3AF',
                    },
                  },
                ]}
                margin={{ left: 20, right: 20, top: 30, bottom: 30 }}
                sx={{
                  '& .MuiChartsAxis-root': {
                    '& .MuiChartsAxis-tickLabel': {
                      fill: '#9CA3AF',
                      color: "white",
                      fontSize: '0.75rem',
                    },
                    '& .MuiChartsAxis-line': {
                      stroke: '#374151',
                    },
                    '& .MuiChartsAxis-tick': {
                      stroke: '#374151',
                    },
                  },
                  '& .MuiChartsGrid-root': {
                    '& .MuiChartsGrid-line': {
                      stroke: '#1F2937',
                      strokeOpacity: 0.3,
                    },
                  },
                  '& .MuiChartsLegend-root': {
                    '& .MuiChartsLegend-item': {
                      '& .MuiChartsLegend-label': {
                        fill: '#9CA3AF',
                        fontSize: '0.75rem',
                        color: "white",
                      },
                    },
                  },
                  '& .MuiChartsTooltip-root': {
                    '& .MuiChartsTooltip-content': {
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      color: '#F9FAFB',
                    },
                  },
                  backgroundColor: 'transparent',
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No data available for the selected period</p>
              </div>
            )}
          </Box>
        </div>
      </CardBody>
    </Card>
  );
}
