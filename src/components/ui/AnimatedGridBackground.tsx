'use client';

import { useEffect, useState } from 'react';

interface GridSquare {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

export default function AnimatedGridBackground() {
  const [squares, setSquares] = useState<GridSquare[]>([]);
  
  // Grid configuration
  const gridSize = 12; // 24x24 grid for better coverage
  const squareSize = 200; // 40px squares
  
  useEffect(() => {
    // Initialize grid squares with random delays and durations
    const initialSquares: GridSquare[] = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        initialSquares.push({
          id: y * gridSize + x,
          x,
          y,
          delay: Math.random() * 30, // Random delay 0-10s
          duration: 3 + Math.random() * 4 // Random duration 3-7s
        });
      }
    }
    setSquares(initialSquares);
  }, []);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Static grid lines */}
      <div 
        className="w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(rgba(30, 41, 59, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30, 41, 59, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: `${squareSize}px ${squareSize}px`,
          backgroundPosition: '0 0'
        }}
      />
      
      {/* Animated squares using CSS animations */}
      {squares.map(square => (
        <div
          key={square.id}
          className="absolute"
          style={{
            left: `${square.x * squareSize}px`,
            top: `${square.y * squareSize}px`,
            width: `${squareSize}px`,
            height: `${squareSize}px`,
            animation: `glow ${square.duration}s ease-in-out infinite`,
            animationDelay: `${square.delay}s`
          }}
        >
          <div 
            className="w-full h-full bg-green-500/0 rounded-sm"
            style={{
              animation: `glow ${square.duration}s ease-in-out infinite`,
              animationDelay: `${square.delay}s`
            }}
          />
        </div>
      ))}
    </div>
  );
}
