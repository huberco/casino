'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardBody, Input, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Snippet, Avatar, AvatarGroup, Image, Badge, Chip } from "@heroui/react"
import { FaDice, FaCalculator, FaEye, FaCircle } from 'react-icons/fa'
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
    winningSlot: number
    winningType: string
  }
  serverSeed: string
  publicSeed: string
  gameId: string
  timestamp: string
}

interface RouletteGame {
  _id: string
  gameId: string
  status: string
  totalBetAmount: number
  playerCount: number
  winningSlot: number
  winningType: string
  winners: Array<{
    userId: string
    username: string
    avatar?: string
    betAmount: number
    betType: string
    payout: number
  }>
  serverSeed: string
  serverSeedHash: string
  publicSeed: string
  eosBlockNumber: number
  createdAt: string
  completedAt?: string
  userBet?: {
    betAmount: number
    betType: string
  }
  userWon: boolean
}

const RouletteVerification = () => {
  const [inputs, setInputs] = useState<VerificationInputs>({
    serverSeed: '',
    publicSeed: '',
    nonce: '',
    eosBlockNumber: ''
  })
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [gameHistory, setGameHistory] = useState<RouletteGame[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGame, setSelectedGame] = useState<RouletteGame | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const itemsPerPage = 10

  // Fetch game history
  const fetchHistory = useCallback(async (page: number = currentPage, searchTerm?: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await gameApi.roulette.getUserGames({ status: 'completed' })

      console.log(response)
      if (response.success && response.data) {
        // Filter by search term if provided
        let filteredGames = Array.isArray(response.data) ? response.data : response.data.games || []

        if (searchTerm) {
          filteredGames = filteredGames.filter((game: any) =>
            game.gameId?.toString().includes(searchTerm) ||
            game._id?.toString().includes(searchTerm)
          )
        }

        // Calculate pagination
        const totalGames = filteredGames.length
        const totalPagesCount = Math.ceil(totalGames / itemsPerPage)
        setTotalPages(totalPagesCount)

        // Get current page items
        const startIndex = (page - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginatedGames = filteredGames.slice(startIndex, endIndex)

        setGameHistory(paginatedGames)
      } else {
        setError('Failed to fetch game history')
      }
    } catch (err) {
      setError('Failed to fetch game history')
      console.error('Error fetching history:', err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

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

    if (inputs.publicSeed.length !== 64) {
      addToast({
        title: "Validation Error",
        description: "Public seed must be exactly 64 characters long",
        color: "danger",
      })
      return
    }

    if (!inputs.nonce) {
      addToast({
        title: "Validation Error",
        description: "Game ID is required",
        color: "danger",
      })
      return
    }

    try {
      const response = await gameApi.roulette.verifyGame({
        serverSeed: inputs.serverSeed,
        publicSeed: inputs.publicSeed,
        gameId: inputs.nonce,
        eosBlockNumber: inputs.eosBlockNumber ? parseInt(inputs.eosBlockNumber) : undefined
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
          description: "Roulette verification completed successfully!",
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
    }
  }

  const handleSearch = useCallback(() => {
    setCurrentPage(1)
    fetchHistory(1, searchTerm)
  }, [searchTerm, fetchHistory])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleViewGame = (game: RouletteGame) => {
    setSelectedGame(game)
    setIsModalOpen(true)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchHistory(page, searchTerm)
  }

  const getWinningTypeColor = (type: string) => {
    switch (type) {
      case 'heads': return 'bg-blue-600'
      case 'tails': return 'bg-red-600'
      case 'crown': return 'bg-yellow-600'
      default: return 'bg-gray-600'
    }
  }

  const getWinningTypeIcon = (type: string) => {
    switch (type) {
      case 'heads': return '/assets/images/tokens/heads.svg'
      case 'tails': return '/assets/images/tokens/tails.svg'
      case 'crown': return '/assets/images/tokens/crown.svg'
      default: return '/assets/images/tokens/heads.svg'
    }
  }

  return (
    <div className="space-y-6">
      {/* Verification Form */}
      <Card className="bg-background-alt border border-gray-700" id="verification-form">
        <CardBody className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaDice className="text-2xl text-purple-500" />
            <div>
              <h3 className="text-lg font-semibold text-white">Roulette Verification</h3>
              <p className="text-gray-400 text-sm">Verify roulette game results using server seed, public seed, and game ID</p>
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
                Public Seed (EOS Block)
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
                Game ID (Nonce)
              </label>
              <Input
                type="text"
                value={inputs.nonce}
                onChange={(e) => handleInputChange('nonce', e.target.value)}
                placeholder="Enter game ID"
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
                type="number"
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

          <div className="mt-6">
            <Button
              onClick={handleVerification}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <FaCalculator className="mr-2" />
              Verify Result
            </Button>
          </div>

          {/* Verification Result */}
          {result && (
            <div className="mt-6 p-4 bg-green-900/20 border border-green-500 rounded-lg">
              <h4 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
                <FaCircle className="text-green-400" />
                Expected Roulette Result:
              </h4>
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="space-y-2 md:w-1/2 w-full">
                  <div className="text-white flex justify-between items-center">
                    <strong className='text-white/40'>Winning Slot:</strong>
                    <Chip>{result.expectedResult.winningSlot}</Chip>
                  </div>
                  <div className="text-white flex justify-between items-center">
                    <strong className='text-white/40'>Winning Type:</strong>
                    <Chip className={getWinningTypeColor(result.expectedResult.winningType)}>
                      {result.expectedResult.winningType}
                    </Chip>
                  </div>
                  <div className="text-gray-300 text-sm truncate flex justify-between items-center">
                    <strong className='text-white/40'>Server Seed:</strong>
                    <Snippet
                      size='sm'
                      symbol=''
                      className="text-xs"
                      classNames={{
                        pre: "max-w-[150px]! truncate",
                      }}>{result.serverSeed}</Snippet>
                  </div>
                  <div className="text-gray-300 text-sm truncate flex justify-between items-center">
                    <strong className='text-white/40'>Public Seed:</strong>
                    <Snippet
                      size='sm'
                      symbol=''
                      className="text-xs"
                      classNames={{
                        pre: "max-w-[150px]! truncate",
                      }}>{result.publicSeed}</Snippet>
                  </div>
                  <div className="text-gray-300 text-sm truncate flex justify-between items-center">
                    <strong className='text-white/40'>Generated At:</strong> {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className='shrink-0 flex gap-4 flex-col items-center justify-center w-full md:w-1/2'>
                  <div className='flex flex-wrap gap-4 p-2 rounded-full border border-primary/40'>
                    <div className='flex items-center gap-2 flex-row-reverse'>
                      <Chip className='bg-yellow-500 text-background text-xs'>18</Chip>
                      <Image src={`/assets/images/tokens/crown.png`} alt="Crown" width={20} height={20} />
                    </div>
                    <div className='flex items-center gap-2 flex-row-reverse'>
                      <Chip className='bg-primary text-background text-xs'>1 - 17</Chip>
                      <Image src={`/assets/images/tokens/heads.svg`} alt="Crown" width={20} height={20} />
                    </div>
                    <div className='flex items-center gap-2 flex-row-reverse'>
                      <Chip className='bg-gray-400 text-background text-xs'>19 - 36</Chip>
                      <Image src={`/assets/images/tokens/tails.svg`} alt="Crown" width={20} height={20} />
                    </div>
                  </div>
                  <Image src={getWinningTypeIcon(result.expectedResult.winningType)} alt="Winning Type" width={150} height={150} className='animate-appearance-in' />
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Game History */}
      <Card className="bg-background-alt border border-gray-700">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4 flex-col sm:flex-row gap-2">
            <h3 className="text-lg font-semibold text-white">Completed Roulette Games</h3>
            <div className="flex gap-2">
              <Input
                ref={searchInputRef}
                type="text"
                size='sm'
                placeholder="Search by game ID..."
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
                onClick={handleSearch}
                color="primary"
                variant="flat"
                size="sm"
              >
                Search
              </Button>
            </div>
          </div>

          <div className='overflow-x-auto w-full grid'>
            <Table aria-label="Roulette game history" classNames={{ base: "grid!" }}>
              <TableHeader>
                <TableColumn>GAME ID</TableColumn>
                <TableColumn>Players</TableColumn>
                <TableColumn>TOTAL BET</TableColumn>
                <TableColumn>WINNING SLOT</TableColumn>
                <TableColumn>WINNING TYPE</TableColumn>
                <TableColumn>YOUR BET</TableColumn>
                <TableColumn>RESULT</TableColumn>
                <TableColumn>TIME</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-400">
                      Loading roulette game history...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-red-400">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : gameHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-400">
                      No completed roulette games found. Start playing to see your history!
                    </TableCell>
                  </TableRow>
                ) : (
                  gameHistory.map((game, index) => (
                    <TableRow key={game._id || index}>
                      <TableCell className="text-blue-400 font-mono text-sm">
                        {game.gameId || game._id?.substring(0, 8)}
                      </TableCell>
                      <TableCell className="text-white">
                        <div className="flex items-center gap-2">
                          <span>{game.playerCount}</span>
                          <AvatarGroup isBordered size="sm">
                            {game.winners?.slice(0, 2).map((winner, idx) => (
                              <Avatar key={idx} src={winner.avatar} alt={winner.username} />
                            ))}
                          </AvatarGroup>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{game.totalBetAmount?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-white font-mono">{game.winningSlot}</TableCell>
                      <TableCell className="text-white">
                        <Image src={`/assets/images/tokens/${game.winningType === "heads" ? "heads.svg" : game.winningType === "tails" ? "tails.svg" : "crown.png"}`} alt={game.winningType} width={20} height={20} />
                      </TableCell>
                      <TableCell className="text-white">
                        {game.userBet ? (
                          <div className='flex items-center gap-2'>
                            <div>{game.userBet.betAmount.toFixed(2)}</div>
                            <Image src={`/assets/images/tokens/${game.userBet.betType === "heads" ? "heads.svg" : game.userBet.betType === "tails" ? "tails.svg" : "crown.png"}`} alt={game.userBet.betType} width={20} height={20} />
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-white">
                        <Badge color={game.userWon ? "success" : "danger"} variant="flat">
                          {game.userWon ? "WIN" : "LOSE"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        {game.completedAt ? new Date(game.completedAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          startContent={<FaEye />}
                          onPress={() => handleViewGame(game)}
                          className="rounded-full"
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              <Button
                size="sm"
                variant="flat"
                isDisabled={currentPage === 1}
                onPress={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="flat"
                isDisabled={currentPage === totalPages}
                onPress={() => handlePageChange(currentPage + 1)}
              >
                Next
              </Button>
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
                  <FaDice className="text-purple-500" />
                  <span>Roulette Game Details</span>
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
                            <span className="text-gray-400">Status:</span>
                            <span className={`px-2 py-1 rounded text-xs ${selectedGame.status === 'completed' ? 'bg-green-900 text-green-300' :
                              selectedGame.status === 'betting' ? 'bg-blue-900 text-blue-300' :
                                'bg-gray-900 text-gray-300'
                              }`}>
                              {selectedGame.status}
                            </span>
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
                            <span className="text-gray-400">Winning Slot:</span>
                            <span className="text-white font-mono">{selectedGame.winningSlot}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Winning Type:</span>
                            <Chip size="sm" className={getWinningTypeColor(selectedGame.winningType)}>
                              {selectedGame.winningType}
                            </Chip>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Result:</span>
                            <Image src={getWinningTypeIcon(selectedGame.winningType)} alt={selectedGame.winningType} width={40} height={40} />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Completed:</span>
                            <span className="text-white text-xs">
                              {selectedGame.completedAt ? new Date(selectedGame.completedAt).toLocaleString() : 'N/A'}
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
                                pre: "max-w-[150px]! truncate",
                              }}>
                              {selectedGame.gameId || selectedGame._id}
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
                              <div className="text-gray-400 text-sm">Bet Type</div>
                              <Chip size="sm" className={getWinningTypeColor(selectedGame.userBet.betType)}>
                                {selectedGame.userBet.betType}
                              </Chip>
                            </div>
                            <div className="space-y-1">
                              <div className="text-gray-400 text-sm">Result</div>
                              <Badge color={selectedGame.userWon ? "success" : "danger"} variant="flat">
                                {selectedGame.userWon ? "WON" : "LOST"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Winners */}
                    {selectedGame.winners && selectedGame.winners.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-white font-semibold">Winners ({selectedGame.winners.length})</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {selectedGame.winners.map((winner, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Avatar src={winner.avatar} size="sm" />
                                <span className="text-white">{winner.username}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-white text-sm">{winner.betAmount.toFixed(2)} USDT</div>
                                <div className="text-green-400 text-sm font-semibold">+{winner.payout.toFixed(2)} USDT</div>
                              </div>
                            </div>
                          ))}
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
                        nonce: selectedGame.gameId?.toString() || selectedGame._id,
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

export default RouletteVerification