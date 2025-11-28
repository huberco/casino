'use client'

import React from 'react'
import { Card, CardBody, Tabs, Tab } from "@heroui/react"
import { FaShieldAlt, FaDice, FaBomb, FaRocket, FaCircle } from 'react-icons/fa'
import AnimatedText from '@/components/AnimatedText'
import CoinflipVerification from './components/CoinflipVerification'
import CrashVerification from './components/CrashVerification'
import MineVerification from './components/MineVerification'
import RouletteVerification from './components/RouletteVerification'

const FairPage = () => {

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <FaShieldAlt className="text-4xl text-green-500" />
          <AnimatedText
            text="Provably Fair Verification"
            className="text-4xl font-bold text-white"
            type="typewriter"
            duration={0.1}
            delay={0.3}
            stagger={0.08}
          />
        </div>
        <AnimatedText
          text="Verify the fairness of any game result. Enter the game parameters and verify that the outcome was generated fairly."
          className="text-gray-300 text-lg max-w-2xl mx-auto"
          type="fade"
          duration={0.3}
          delay={1.0}
          stagger={0.01}
        />
      </div>

      {/* Game Tabs */}
      <Card className="bg-background-alt border border-gray-700">
        <CardBody className="p-0">
          <Tabs
            aria-label="Game verification tabs"
            classNames={{
              tabList: "bg-gray-800 border-b border-gray-700",
              tab: "text-gray-300 data-[selected=true]:text-white",
              tabContent: "text-gray-300 group-data-[selected=true]:text-white"
            }}
          >
            <Tab key="coinflip" title={
              <div className="flex items-center gap-2">
                <FaCircle />
                <span>Coinflip</span>
              </div>
            }>
              <CoinflipVerification />
            </Tab>

            <Tab key="crash" title={
              <div className="flex items-center gap-2">
                <FaRocket />
                <span>Crash</span>
              </div>
            }>
              <CrashVerification />
            </Tab>

            <Tab key="mine" title={
              <div className="flex items-center gap-2">
                <FaBomb />
                <span>Mine</span>
              </div>
            }>
              <MineVerification />
            </Tab>

            <Tab key="roulette" title={
              <div className="flex items-center gap-2">
                <FaDice />
                <span>Roulette</span>
              </div>
            }>
              <RouletteVerification />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* How It Works */}
      <Card className="bg-background-alt border border-gray-700">
        <CardBody className="p-8">
          <div className="text-center mb-8">
            <AnimatedText
              text="How to Verify Games"
              className="text-3xl font-bold text-white mb-4"
              type="typewriter"
              duration={0.1}
              delay={0.5}
              stagger={0.05}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-blue-400">1</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Get Game Data</h3>
              <p className="text-gray-400 text-sm">
                Find the server seed, client seed (if applicable), and game ID from your game history.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-green-400">2</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Enter Parameters</h3>
              <p className="text-gray-400 text-sm">
                Input all the required parameters in the verification form above.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-purple-400">3</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Verify Result</h3>
              <p className="text-gray-400 text-sm">
                Click verify to generate the result and compare it with your actual game outcome.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default FairPage