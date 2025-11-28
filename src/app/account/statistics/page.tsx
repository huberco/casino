'use client';

import React from 'react';
import DailyPlayingChart from '@/components/charts/DailyPlayingChart';

export default function StatisticsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <h1 className="text-3xl font-bold text-white">User Statistics</h1>

      {/* Top Level Statistics */}
      <div className="hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-background-alt rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Winning Rate</h3>
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-400 mb-2">43 Win</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '43%' }}></div>
            </div>
            <p className="text-sm text-gray-400 mt-2">43 / 100 Total Bets</p>
          </div>

          <div className="bg-background-alt rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Active Miners</h3>
              <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.5 2.54l2.6 1.53c.56-1.24.9-2.62.9-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.05.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-400 mb-2">20 rigs</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '40%' }}></div>
            </div>
            <p className="text-sm text-gray-400 mt-2">20 / 50 rigs</p>
          </div>

          <div className="bg-background-alt rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Total Rewards</h3>
              <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-400 mb-2">12,896.34 ETH</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '51.6%' }}></div>
            </div>
            <p className="text-sm text-gray-400 mt-2">Progress to 25k ETH</p>
          </div>

          <div className="bg-background-alt rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Network Difficulty</h3>
              <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-400 mb-2">2.89 PH</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '57.8%' }}></div>
            </div>
            <p className="text-sm text-gray-400 mt-2">2.89 / 5 PH</p>
          </div>
        </div>
      </div>

      {/* Mining Performance */}
      <div className="bg-background-alt rounded-lg p-6">
        <div className="flex items-center justify-between mb-6 flex-col sm:flex-row">
          <h2 className="text-xl font-semibold text-white text-start sm:text-center w-full sm:w-auto">PERFORMANCE</h2>
          <div className="flex space-x-1 w-full sm:w-auto justify-end">
            <button className="px-3 py-1 text-sm rounded text-gray-300 hover:bg-gray-700">1H</button>
            <button className="px-3 py-1 text-sm rounded bg-green-500 text-white">24H</button>
            <button className="px-3 py-1 text-sm rounded text-gray-300 hover:bg-gray-700">7D</button>
            <button className="px-3 py-1 text-sm rounded text-gray-300 hover:bg-gray-700">30D</button>
          </div>
        </div>
        <div className="">
          {/* Daily Playing Chart */}
          <DailyPlayingChart />
        </div>

      </div>
      {/* Network Status */}
      <div className="bg-background-alt rounded-lg p-6 hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">NETWORK STATUS</h2>
          <button className="p-2 hover:bg-gray-700 rounded">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400 mb-2">Network Health</p>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white font-semibold">Excellent</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400 mb-2">Block Time</p>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white font-semibold">2.4 min</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400 mb-2">Connectivity</p>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-white font-semibold">32 peers</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '64%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">Next Block Estimate</p>
            <div className="relative w-16 h-16 mx-auto">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="75, 100"
                  className="text-gray-700"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="25, 100"
                  className="text-green-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold">01:24</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">Current Block</p>
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
              <span className="text-white font-bold text-lg">#1,458,392</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
