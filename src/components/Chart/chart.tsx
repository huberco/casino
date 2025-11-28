import * as React from 'react';
import Box from '@mui/material/Box';
import { AnimatedLineProps, LineChart } from '@mui/x-charts/LineChart';

interface CrashChartProps {
  multiplierHistory: number[];
  elapsedTime: number;
  gameStatus: 'betting' | 'running' | 'crashed' | 'ended';
  startTime?: Date;
}

export default function LiveLineChartNoSnap({
  multiplierHistory = [],
  elapsedTime = 0,
  gameStatus = 'betting',
  startTime
}: CrashChartProps) {

  // Prepare data for the chart
  const chartData = React.useMemo(() => {
    if (multiplierHistory.length === 0) {
      return {
        multipliers: [1.00],
        timePoints: [0],
      };
    }

    // Create time points based on elapsed time and data points
    const timePoints = multiplierHistory.map((_, index) => {
      return (elapsedTime * index) / (multiplierHistory.length - 1 || 1);
    });

    return {
      multipliers: multiplierHistory,
      timePoints,
    };
  }, [multiplierHistory, elapsedTime]);

  function CustomLine(props: AnimatedLineProps) {
    const { d, ownerState, className, ...other } = props;

    return (
      <React.Fragment>
        <path
          d={d}
          stroke={
            ownerState.gradientId ? `url(#${ownerState.gradientId})` : ownerState.color
          }
          strokeWidth={ownerState.isHighlighted ? 4 : 2}
          strokeLinejoin="round"
          fill="none"
          filter={ownerState.isHighlighted ? 'brightness(120%)' : undefined}
          opacity={ownerState.isFaded ? 0.3 : 1}
          className={className}
        />
        <path
          d={d}
          stroke="transparent"
          strokeWidth={25}
          fill="none"
          className="interaction-area"
          {...other}
        />
      </React.Fragment>
    );
  }

  // Determine chart color based on current multiplier value
  const getChartColor = () => {
    // Get the current (latest) multiplier value
    const currentMultiplier = chartData.multipliers[chartData.multipliers.length - 1] || 1;

    // If game has crashed or ended, show red
    if (gameStatus === 'crashed' || gameStatus === 'ended') {
      return '#EF4444'; // Red
    }

    // Color based on multiplier value
    if (currentMultiplier < 2) {
      return '#F97316'; // Orange
    } else if (currentMultiplier >= 2 && currentMultiplier < 10) {
      return '#10B981'; // Green
    } else {
      return '#F59E0B'; // Gold
    }
  };

  // Calculate dynamic Y-axis range
  const maxMultiplier = Math.max(...chartData.multipliers, 2);
  const yAxisMax = Math.max(maxMultiplier * 1.2, 2); // Show 20% more than max, minimum 5x

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <LineChart
        height={450} // 96 * 4 = 384px (h-96)
        skipAnimation={false}
        series={[
          {
            data: chartData.multipliers,
            color: getChartColor(),
            curve: 'monotoneX',
            label: 'Multiplier',
            shape: "star",
            type: "line",

            showMark: ({ index }) => index === chartData.multipliers.length - 1
          },

        ]}
        xAxis={[
          {
            scaleType: 'linear',
            data: chartData.timePoints,
            valueFormatter: (value: number) => `${value.toFixed(1)}s`,
            min: 0,
            max: Math.max(elapsedTime, 10), // Show at least 10 seconds
            hideTooltip: true,
          },
        ]}
        yAxis={[
          {
            valueFormatter: (value: number) => `${value.toFixed(2)}x`,
            min: 1,
            max: yAxisMax,
            hideTooltip: true,
          },
        ]}
        margin={{ left: 30, right: 30, top: 30, bottom: 60 }}
        sx={{
          '& .MuiChartsAxis-root': {
            '& .MuiChartsAxis-tickLabel': {
              fill: '#9CA3AF',
              fontSize: '2rem',
              strokeWidth: 4,
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
              strokeOpacity: 0.5,
            },
          },
          '& .MuiChartsLegend-root': {
            '& .MuiChartsLegend-item': {
              display: "none"
            },
          },

          backgroundColor: 'transparent',
        }}
        slots={{ line: CustomLine }}

      />
    </Box>
  );
}
