'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardBody, Input, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Snippet, Badge, Chip } from "@heroui/react"
import { FaRocket, FaCalculator, FaEye } from 'react-icons/fa'
import { addToast } from "@heroui/react"
import { gameApi } from '@/lib/api'

interface VerificationInputs {
  serverSeed: string
  publicSeed: string
  nonce: string
  eosBlockNumber: string
}

interface VerificationResult {
  verified: boolean
  expectedResult: {
    crashPoint: number
  }
  serverSeed: string
  publicSeed: string
  gameId: string
  timestamp: string
}

interface CrashGame {
  _id: string
  round: number
  status: string
  crashPoint: number
  totalBetAmount: number
  totalPayout: number
  playerCount: number
  serverSeed: string
  serverSeedHash: string
  publicSeed: string
  eosBlockNumber: number
  createdAt: string
  endTime?: string
  startTime?: string
  userBet?: {
    betAmount: number
    cashoutMultiplier?: number
    payout: number
    status: string
    joinedAt: string
    cashedOutAt?: string
  }
  userWon: boolean
}

const CrashVerification = () => {
  const [inputs, setInputs] = useState<VerificationInputs>({
    serverSeed: '',
    publicSeed: '',
    nonce: '',
    eosBlockNumber: ''
  })
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [gameHistory, setGameHistory] = useState<CrashGame[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGame, setSelectedGame] = useState<CrashGame | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const itemsPerPage = 10

  // Fetch game history
  const fetchHistory = useCallback(async (page: number = currentPage, searchTerm?: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await gameApi.crash.getUserGames({ status: 'ended' })

      if (response.success && response.data) {
        // Filter by search term if provided
        let filteredGames = Array.isArray(response.data) ? response.data : response.data.games || []
        
        if (searchTerm) {
          filteredGames = filteredGames.filter((game: any) =>
            game.round?.toString().includes(searchTerm) ||
            game._id?.toString().includes(searchTerm)
          )
        }

        // Calculate pagination
        const totalGames = filteredGames.length
        const totalPagesCount = Math.ceil(totalGames / itemsPerPage)
        setTotalPages(totalPagesCount)

        // Get current page data
        const startIndex = (page - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginatedGames = filteredGames.slice(startIndex, endIndex)

        setGameHistory(paginatedGames)
      }
    } catch (err) {
      console.error('Error fetching crash history:', err)
      setError('Failed to load game history')
      addToast({
        title: "Error",
        description: "Failed to load game history",
        color: "danger",
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchHistory(1, searchTerm)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setCurrentPage(1)
    fetchHistory(1, '')
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      fetchHistory(newPage, searchTerm)
    }
  }

  const handleInputChange = (field: keyof VerificationInputs, value: string) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleVerification = async () => {
    // Basic validation
    if (!inputs.serverSeed) {
      addToast({
        title: "Validation Error",
        description: "Server seed is required",
        color: "danger",
      })
      return
    }

    if (inputs.serverSeed.length !== 64) {
      addToast({
        title: "Validation Error",
        description: "Server seed must be exactly 64 characters long",
        color: "danger",
      })
      return
    }

    if (!inputs.publicSeed) {
      addToast({
        title: "Validation Error",
        description: "Public seed is required",
        color: "danger",
      })
      return
    }

    if (!inputs.nonce) {
      addToast({
        title: "Validation Error",
        description: "Game ID (nonce) is required",
        color: "danger",
      })
      return
    }

    try {
      setLoading(true)
      
      // Call backend verification API
      const response = await gameApi.crash.verifyGame({
        serverSeed: inputs.serverSeed,
        publicSeed: inputs.publicSeed,
        gameId: inputs.nonce
      })

      if (response.success && response.data) {
        setResult({
          verified: true,
          expectedResult: response.data.expectedResult,
          serverSeed: response.data.serverSeed,
          publicSeed: response.data.publicSeed,
          gameId: response.data.gameId,
          timestamp: response.data.timestamp
        })

        addToast({
          title: "Verification Complete",
          description: `Crash point verified: ${response.data.expectedResult.crashPoint.toFixed(2)}x`,
          color: "success",
        })
      } else {
        addToast({
          title: "Verification Failed",
          description: "Verification failed. Please check your inputs.",
          color: "danger",
        })
      }
    } catch (error) {
      addToast({
        title: "Verification Failed",
        description: "Verification failed. Please check your inputs.",
        color: "danger",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (game: CrashGame) => {
    setSelectedGame(game)
    setIsModalOpen(true)
  }

  const getCrashPointColor = (crashPoint: number) => {
    if (crashPoint < 150) return 'bg-red-500'
    if (crashPoint < 200) return 'bg-orange-500'
    if (crashPoint < 300) return 'bg-yellow-500'
    if (crashPoint < 500) return 'bg-green-500'
    return 'bg-purple-500'
  }

  const getCrashPointBadgeColor = (crashPoint: number) => {
    if (crashPoint < 150) return 'danger'
    if (crashPoint < 200) return 'warning'
    if (crashPoint < 300) return 'default'
    if (crashPoint < 500) return 'success'
    return 'secondary'
  }

  return (
    <div className="space-y-6">
      {/* Verification Form */}
      <Card className="bg-background-alt border border-gray-700" id="verification-form">
        <CardBody className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaRocket className="text-2xl text-purple-500" />
            <div>
              <h3 className="text-lg font-semibold text-white">Crash Verification</h3>
              <p className="text-gray-400 text-sm">Verify crash game results using server seed, public seed, and game ID</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Server Seed
              </label>
              <Input
                type="text"
                value={inputs.serverSeed}
                onChange={(e) => handleInputChange('serverSeed', e.target.value)}
                placeholder="Enter server seed (64 characters)"
                className="w-full"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-gray-800 border-gray-600"
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Public Seed (EOS Block Hash)
              </label>
              <Input
                type="text"
                value={inputs.publicSeed}
                onChange={(e) => handleInputChange('publicSeed', e.target.value)}
                placeholder="Enter public seed (64 characters)"
                className="w-full"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-gray-800 border-gray-600"
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Game ID (Round Number)
              </label>
              <Input
                type="text"
                value={inputs.nonce}
                onChange={(e) => handleInputChange('nonce', e.target.value)}
                placeholder="Enter game round number"
                className="w-full"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-gray-800 border-gray-600"
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                EOS Block Number
              </label>
              <Input
                type="text"
                value={inputs.eosBlockNumber}
                onChange={(e) => handleInputChange('eosBlockNumber', e.target.value)}
                placeholder="Enter EOS block number"
                className="w-full"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-gray-800 border-gray-600"
                }}
              />
            </div>
          </div>

          <div className="mt-4">
            <Button
              color="primary"
              startContent={<FaCalculator />}
              onPress={handleVerification}
              isLoading={loading}
              className="rounded-full text-background font-semibold"
            >
              Verify Crash Point
            </Button>
          </div>

          {/* Verification Result */}
          {result && (
            <div className="mt-6 p-6 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FaCalculator className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-green-500">Verification Result</h3>
              </div>
              <div className="space-y-2 text-white">
                <p><span className="text-gray-400">Crash Point:</span> <span className="font-bold text-2xl">{result.expectedResult.crashPoint.toFixed(2)}x</span></p>
                <p><span className="text-gray-400">Game ID:</span> {result.gameId}</p>
                <p className="text-xs text-gray-500">Verified at: {new Date(result.timestamp).toLocaleString()}</p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Game History */}
      <Card className="bg-background-alt border border-gray-700">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Your Crash Game History</h3>
            <div className="flex gap-2">
              <Input
                type="text"
                size='sm'
                placeholder="Search by game ID (partial match)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-64"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-gray-800 border-gray-600"
                }}
              />
              <Button
                size="sm"
                color="primary"
                variant="flat"
                onPress={handleSearch}
                className="px-4"
              >
                Search
              </Button>
              {searchTerm && (
                <Button
                  size="sm"
                  color="default"
                  variant="flat"
                  onPress={handleClearSearch}
                  className="px-4"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading games...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : gameHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No games found</div>
          ) : (
            <div className="space-y-4">
              <Table
                aria-label="Crash game history table"
                classNames={{
                }}
              >
                <TableHeader>
                  <TableColumn>ROUND</TableColumn>
                  <TableColumn>CRASH POINT</TableColumn>
                  <TableColumn>YOUR BET</TableColumn>
                  <TableColumn>RESULT</TableColumn>
                  <TableColumn>DATE</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {gameHistory.map((game) => (
                    <TableRow key={game._id}>
                      <TableCell>
                        <span className="font-mono">#{game.round}</span>
                      </TableCell>
                      <TableCell>
                        <Chip color={getCrashPointBadgeColor(game.crashPoint)} variant="flat">
                          {game.crashPoint.toFixed(2)}x
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {game.userBet ? (
                          <div>
                            <div>{game.userBet.betAmount.toFixed(2)} USDT</div>
                            {game.userBet.cashoutMultiplier && (
                              <div className="text-xs text-gray-400">@{game.userBet.cashoutMultiplier.toFixed(2)}x</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {game.userBet ? (
                          <Chip color={game.userWon ? "success" : "danger"} variant="flat">
                            {game.userWon ? `+${game.userBet.payout.toFixed(2)}` : `-${game.userBet.betAmount.toFixed(2)}`}
                          </Chip>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{new Date(game.createdAt).toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          startContent={<FaEye />}
                          onPress={() => handleViewDetails(game)}
                          className="rounded-full"
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-400 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
                    className="text-gray-300"
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => handlePageChange(currentPage + 1)}
                    isDisabled={currentPage === totalPages}
                    className="text-gray-300"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Game Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        size="2xl"
        classNames={{
          backdrop: "bg-black/80 backdrop-blur-sm",
          base: "border border-gray-700 bg-background-alt",
          header: "border-b border-gray-700",
          body: "py-6",
          footer: "border-t border-gray-700"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-white">
                <div className="flex items-center gap-2">
                  <FaRocket className="text-purple-500" />
                  <span>Crash Game Details</span>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedGame && (
                  <div className="space-y-6">
                    {/* Game Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-white font-semibold">Game Information</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Round:</span>
                            <span className="text-white font-mono">#{selectedGame.round}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className={`px-2 py-1 rounded text-xs ${selectedGame.status === 'ended' ? 'bg-green-900 text-green-300' :
                              selectedGame.status === 'flying' ? 'bg-blue-900 text-blue-300' :
                                'bg-gray-900 text-gray-300'
                              }`}>
                              {selectedGame.status}
                            </span>
                          </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Crash Point:</span>
                              <Chip color={getCrashPointBadgeColor(selectedGame.crashPoint)} variant="flat">
                                {selectedGame.crashPoint.toFixed(2)}x
                              </Chip>
                            </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total Players:</span>
                            <span className="text-white">{selectedGame.playerCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total Bet:</span>
                            <span className="text-white">{selectedGame.totalBetAmount?.toFixed(2)} USDT</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total Payout:</span>
                            <span className="text-white">{selectedGame.totalPayout?.toFixed(2)} USDT</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Completed:</span>
                            <span className="text-white text-xs">
                              {selectedGame.endTime ? new Date(selectedGame.endTime).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-white font-semibold">Seeds & Verification</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Game ID:</span>
                            <Snippet
                              size='sm'
                              symbol=''
                              className="text-xs"
                              classNames={{
                                pre: "max-w-[50px] sm:max-w-[150px]! truncate",
                              }}>
                              {selectedGame.round || selectedGame._id}
                            </Snippet>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Server Seed:</span>
                            <Snippet
                              size='sm'
                              symbol=''
                              className="text-xs"
                              classNames={{
                                pre: "max-w-[50px] sm:max-w-[150px]! truncate",
                              }}>
                              {selectedGame.serverSeed || 'N/A'}
                            </Snippet>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Public Seed:</span>
                            <Snippet
                              size='sm'
                              symbol=''
                              className="text-xs"
                              classNames={{
                                pre: "max-w-[50px] sm:max-w-[150px]! truncate",
                              }}>
                              {selectedGame.publicSeed || 'N/A'}
                            </Snippet>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">EOS Block:</span>
                            <span className="text-white font-mono text-xs">{selectedGame.eosBlockNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Created:</span>
                            <span className="text-white text-xs">
                              {selectedGame.createdAt ? new Date(selectedGame.createdAt).toLocaleString() : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* User's Bet */}
                    {selectedGame.userBet && (
                      <div className="space-y-2">
                        <h4 className="text-white font-semibold">Your Bet</h4>
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <div className="text-gray-400 text-sm">Bet Amount</div>
                              <div className="text-white font-semibold">{selectedGame.userBet.betAmount.toFixed(2)} USDT</div>
                            </div>
                              <div className="space-y-1">
                                <div className="text-gray-400 text-sm">Cashout At</div>
                                <Chip color="primary" variant="flat">
                                  {selectedGame.userBet.cashoutMultiplier ? `${selectedGame.userBet.cashoutMultiplier.toFixed(2)}x` : 'Not cashed'}
                                </Chip>
                              </div>
                            <div className="space-y-1">
                              <div className="text-gray-400 text-sm">Result</div>
                              <Chip color={selectedGame.userWon ? "success" : "danger"} variant="flat">
                                {selectedGame.userWon ? `+${selectedGame.userBet.payout.toFixed(2)}` : `LOST`}
                              </Chip>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="bordered" onPress={onClose} className='rounded-full'>Close</Button>
                <Button
                  color="primary"
                  onPress={() => {
                    if (selectedGame) {
                      setInputs({
                        serverSeed: selectedGame.serverSeed || '',
                        publicSeed: selectedGame.publicSeed || '',
                        nonce: selectedGame.round?.toString() || selectedGame._id,
                        eosBlockNumber: selectedGame.eosBlockNumber?.toString() || ''
                      })
                      onClose()
                      document.getElementById('verification-form')?.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className="rounded-full text-background"
                >
                  Use for Verification
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

export default CrashVerification
