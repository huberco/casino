'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Image } from '@heroui/react';
import { FaPlay, FaStop } from 'react-icons/fa';


interface JackpotSlotProps {
  onSpinStart?: (symbol: string) => void;
  onSpinEnd?: (symbol: string) => void;
  isSpinning?: boolean;
  targetSymbol?: string; // For controlled spins
  disabled?: boolean;
  jackpotAmount?: number;
}

const JackpotSlot: React.FC<JackpotSlotProps> = ({
  onSpinStart,
  onSpinEnd,
  isSpinning = false,
  targetSymbol,
  disabled = false,
  jackpotAmount = 0
}) => {
  const [currentSymbol, setCurrentSymbol] = useState("👑");
  const [spinning, setSpinning] = useState(false);
  const [symbols, setSymbols] = useState<string[]>([]);
  const reelRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const idleAnimationRef = useRef<Animation | null>(null);
  // Generate extended symbol list for fast spinning effect
  const generateSymbolList = useCallback((targetSymbol?: string) => {
    // Create 37-slot roulette wheel: alternating black/white with crown in center
    const rouletteSlots: string[] = [];

    // Add 18 alternating black and white coins (positions 0-17)
    for (let i = 0; i < 18; i++) {
      if ((targetSymbol === 'heads' || targetSymbol === 'crown') ? i % 2 === 0 : i % 2 === 1) {
        rouletteSlots.push('⚫'); // Black coin (even positions)
      } else {
        rouletteSlots.push('⚪'); // White coin (odd positions)
      }
    }

    // Add crown in the center (position 18)
    rouletteSlots.push('👑'); // Crown coin

    // Add 18 more alternating black and white coins (positions 19-36)
    for (let i = 0; i < 18; i++) {
      if ((targetSymbol === 'heads' || targetSymbol === 'crown') ? i % 2 === 0 : i % 2 === 1) {
        rouletteSlots.push('⚫'); // Black coin (even positions)
      } else {
        rouletteSlots.push('⚪'); // White coin (odd positions)
      }
    }

    // For spinning animation, repeat the roulette slots multiple times
    const extendedList: string[] = [];
    const spinCount = 370; // Much more symbols for faster movement

    // Create a very long list by repeating the roulette slots many times for fast speed
    for (let i = 0; i < spinCount; i++) {
      const slotIndex = i % rouletteSlots.length;
      extendedList.push(rouletteSlots[slotIndex]);
    }

    // Add 2 more symbols before the target to ensure we have enough for 5-symbol display
    extendedList.push((targetSymbol === 'heads' || targetSymbol === 'crown') ? "⚫" : "⚪");
    extendedList.push((targetSymbol === 'heads' || targetSymbol === 'crown') ? "⚪" : "⚫");

    // Add the target symbol (crown will be in center)
    const finalSymbol = targetSymbol === "heads" ? "⚫" : targetSymbol === "tails" ? "⚪" : targetSymbol === "crown" ? '👑' : ''; // Default to crown
    extendedList.push(finalSymbol);

    // Add 2 more symbols after target for complete 5-symbol view
    extendedList.push((targetSymbol === 'heads' || targetSymbol === 'crown') ? "⚪" : "⚫");
    extendedList.push((targetSymbol === 'heads' || targetSymbol === 'crown') ? "⚫" : "⚪");

    return { list: extendedList, finalSymbol };
  }, []);

  // Initialize symbols
  useEffect(() => {
    const { list, finalSymbol } = generateSymbolList(targetSymbol); // Initialize with crown
    setSymbols(list);
    setCurrentSymbol(finalSymbol); // Set initial symbol to crown
  }, [generateSymbolList]);

  // Start idle animation when component mounts or after spin ends
  useEffect(() => {
    const startIdleAnimation = () => {
      if (!reelRef.current || spinning) return;

      // Create seamless looping idle animation with crown
      const isLargeScreen = window.innerWidth >= 1536; // 2xl breakpoint
      const symbolWidth = isLargeScreen ? 128 : 64; // 2x scale for 2xl

      // Create extended symbol list for seamless looping (starting with crown)
      const extendedSymbols = [];
      const repeatCount = 2; // Repeat the symbol array 10 times

      // Start with crown, then add alternating black/white pattern
      const idleSlots = ['⚫', '⚪', '👑', '⚪', '⚫']; // Start with crown

      // Add alternating black/white pattern
      for (let i = 0; i < 18; i++) {
        if (i % 2 === 0) {
          idleSlots.push('⚪'); // White coin
        } else {
          idleSlots.push('⚫'); // Black coin
        }
      }

      // Create extended list by repeating the pattern
      for (let i = 0; i < repeatCount; i++) {
        extendedSymbols.push(...idleSlots);
      }

      // Set the extended symbols for seamless animation
      setSymbols(extendedSymbols);

      // Calculate total distance for one complete cycle through all symbols
      const totalSymbols = extendedSymbols.length;
      const totalDistance = totalSymbols * symbolWidth;

      idleAnimationRef.current = reelRef.current.animate(
        [
          { transform: 'translateX(0px)' },
          { transform: `translateX(-${totalDistance}px)` }, // Move through all symbols
        ],
        {
          duration: 120000, // 120 seconds for complete cycle (slow idle speed)
          iterations: Infinity, // Loop forever
          easing: 'linear', // Consistent speed
        }
      );
    };

    // Start idle animation after 3 seconds
    const timer = setTimeout(startIdleAnimation, 3000);

    return () => {
      clearTimeout(timer);
      if (idleAnimationRef.current) {
        idleAnimationRef.current.cancel();
      }
    };
  }, [spinning]);

  // Stop idle animation when spinning starts
  useEffect(() => {
    if (spinning && idleAnimationRef.current) {
      idleAnimationRef.current.cancel();
    }
  }, [spinning]);



  const spin = useCallback(async () => {
    if (spinning || disabled) return;

    setSpinning(true);
    const { list, finalSymbol } = generateSymbolList(targetSymbol);
    setSymbols(list);

    // Trigger onSpinStart callback
    onSpinStart?.(finalSymbol);

    // Create and run animation
    if (reelRef.current) {
      // Calculate dimensions based on screen size
      const isLargeScreen = window.innerWidth >= 1536; // 2xl breakpoint
      const symbolWidth = isLargeScreen ? 128 : 64; // 2x scale for 2xl
      const containerWidth = isLargeScreen ? 640 : 320; // 2x scale for 2xl

      // Calculate position to show 5 symbols with target in center (3rd position)
      // Target symbol is at index (list.length - 3) - the middle of the last 5 symbols
      const targetIndex = list.length - 3; // Target is 3rd from end

      // We want to show the last 5 symbols, with target in the center (position 2)
      // The viewing window shows symbols at positions: [targetIndex-2, targetIndex-1, targetIndex, targetIndex+1, targetIndex+2]
      const firstVisibleIndex = targetIndex - 2;
      const totalDistance = firstVisibleIndex * symbolWidth;

      // Debug positioning
      console.log('🎰 Horizontal slot positioning:', {
        targetSymbol: finalSymbol,
        targetIndex,
        firstVisibleIndex,
        symbolWidth,
        containerWidth,
        totalDistance,
        visibleSymbols: list.slice(firstVisibleIndex, firstVisibleIndex + 5)
      });

      // Cancel any existing animation
      if (animationRef.current) {
        animationRef.current.cancel();
      }

      // Create smooth horizontal spinning animation
      animationRef.current = reelRef.current.animate(
        [
          { transform: 'translateX(0px)', filter: 'blur(0px)' },
          { filter: 'blur(3px)', offset: 0.1 },
          { filter: 'blur(3px)', offset: 0.9 },
          { transform: `translateX(-${totalDistance}px)`, filter: 'blur(0px)' },
        ],
        {
          duration: 15000 + Math.random() * 2000, // 20-22 seconds
          easing: 'cubic-bezier(0.23, 1, 0.32, 1)', // Smooth easing
          fill: 'forwards'
        }
      );

      // Wait for animation to complete
      await new Promise((resolve) => {
        animationRef.current!.onfinish = resolve;
      });
    }

    // Update final symbol to match what's actually in the center
    const visibleSymbols = list.slice(-5);
    const centerSymbol = visibleSymbols[2]; // Center symbol (3rd of 5)
    setCurrentSymbol(centerSymbol);
    setSpinning(false);
    onSpinEnd?.(centerSymbol);

    // If we have a target symbol (winner), make sure it's displayed
    if (targetSymbol) {
      setCurrentSymbol(targetSymbol);
    }

    // Restart idle animation after 3 seconds
    setTimeout(() => {
      if (!spinning && reelRef.current) {
        // Reset position and start idle again
        reelRef.current.style.transform = 'translateX(0px)';

        // Create seamless looping idle animation with crown
        const isLargeScreen = window.innerWidth >= 1536;
        const symbolWidth = isLargeScreen ? 128 : 64;

        // Create extended symbol list for seamless looping (starting with crown)
        const extendedSymbols = [];
        const repeatCount = 2;

        // Start with crown, then add alternating black/white pattern
        const idleSlots = ['👑']; // Start with crown

        // Add alternating black/white pattern
        for (let i = 0; i < 18; i++) {
          if (i % 2 === 0) {
            idleSlots.push('⚫'); // Black coin
          } else {
            idleSlots.push('⚪'); // White coin
          }
        }

        // Create extended list by repeating the pattern
        for (let i = 0; i < repeatCount; i++) {
          extendedSymbols.push(...idleSlots);
        }

        // Set the extended symbols for seamless animation
        setSymbols(extendedSymbols);

        // Calculate total distance for one complete cycle through all symbols
        const totalSymbols = extendedSymbols.length;
        const totalDistance = totalSymbols * symbolWidth;

        idleAnimationRef.current = reelRef.current.animate(
          [
            { transform: 'translateX(0px)' },
            { transform: `translateX(-${totalDistance}px)` },
          ],
          {
            duration: 120000, // 120 seconds for complete cycle (slow idle speed)
            iterations: Infinity,
            easing: 'linear',
          }
        );
      }
    }, 3000); // Wait 3 seconds before restarting idle

  }, [spinning, disabled, targetSymbol, onSpinStart, onSpinEnd, generateSymbolList]);

  // Handle external spinning state
  useEffect(() => {
    if (isSpinning && !spinning) {
      spin();
    }
  }, [isSpinning, spinning, spin]);

  // Handle target symbol changes (for winner selection)
  useEffect(() => {
    if (targetSymbol && !spinning) {
      // If we have a target symbol and we're not spinning, 
      // we can update the current symbol to show the winner
      setCurrentSymbol(targetSymbol);
    }
  }, [targetSymbol, spinning]);


  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Jackpot Display */}
      {/* Slot Machine */}
      <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-6 border border-primary shadow-2xl">
        {/* Slot Reel Container - Horizontal */}
        <div className="relative w-80 h-20 2xl:w-[640px] 2xl:h-[160px] bg-black rounded-lg overflow-hidden border-2 border-gray-600">
          {/* Reel */}
          <div
            ref={reelRef}
            className="absolute inset-0 flex flex-row"
            style={{
              transform: spinning ? undefined : 'translateX(0px)',
            }}
          >
            {symbols.map((symbol, index) => (
              <div
                key={index}
                className="flex items-center justify-center w-16 h-full text-3xl 2xl:w-32 2xl:text-6xl bg-gradient-to-r from-gray-700 to-gray-800 border-r border-gray-600 flex-shrink-0"
                style={{ minWidth: '64px' }}
              >
                <Image className='2xl:hidden' src={`/assets/images/tokens/${symbol === "⚫" ? "heads.svg" : symbol === "⚪" ? "tails.svg" : symbol === "👑" ? "crown.png" : ""}`} alt="Crown" width={40} height={40} />
                <Image className='hidden 2xl:block' src={`/assets/images/tokens/${symbol === "⚫" ? "heads.svg" : symbol === "⚪" ? "tails.svg" : symbol === "👑" ? "crown.png" : ""}`} alt="Crown" width={60} height={60} />
              </div>
            ))}
          </div>

          {/* Viewing Window Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Left fade */}
            <div className="absolute top-0 left-0 bottom-0 w-16 2xl:w-32 bg-gradient-to-r from-black to-transparent z-10"></div>
            {/* Right fade */}
            <div className="absolute top-0 right-0 bottom-0 w-16 2xl:w-32 bg-gradient-to-l from-black to-transparent z-10"></div>
            {/* Center highlight - show 5 symbols */}
            <div className="absolute top-0 bottom-0 left-1/2 w-80 2xl:w-[640px] -ml-40 2xl:-ml-80 border-l-2 border-r-2 border-yellow-400 bg-yellow-400/10 z-10">
              {/* Individual symbol borders */}
              {/* <div className="absolute top-0 bottom-0 left-16 2xl:left-32 w-px bg-yellow-400/30"></div> */}
              <div className="absolute top-0 bottom-0 left-32 -translate-x-full transform w-10 2xl:left-64 to-yellow-400/30 bg-linear-to-r from-transparent"></div>
              <div className="absolute top-0 bottom-0 left-48 w-10 2xl:left-96 from-yellow-400/30 bg-linear-to-r to-transparent"></div>
              {/* <div className="absolute top-0 bottom-0 right-16 2xl:right-32 w-px bg-yellow-400/30"></div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JackpotSlot;
