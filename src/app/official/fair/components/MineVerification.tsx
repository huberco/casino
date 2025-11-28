'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardBody, Input, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Snippet } from "@heroui/react"
import { FaBomb, FaCalculator, FaEye } from 'react-icons/fa'
import { addToast } from "@heroui/react"
import { gameApi } from '@/lib/api'
import PrimaryButton from '@/components/ui/PrimaryButton'

const MineVerification = () => {
  const [inputs, setInputs] = useState({
    serverSeed: '',
    clientSeed: '',
    nonce: '',
    numMines: ''
  })
  const [result, setResult] = useState<any>(null)
  const [gameHistory, setGameHistory] = useState<any[]>([])
  const [searchFilter, setSearchFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedGame, setSelectedGame] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Ref to store current search filter for pagination
  const currentSearchFilter = useRef('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage] = useState(10)

  // Fetch mine history
  const fetchHistory = useCallback(async (page: number = currentPage, searchTerm?: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await gameApi.mine.getHistory({
        page: page,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        gameType: 'my', // Only get current user's games
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      if (response.success && response.data) {
        setGameHistory(response.data.games || [])

        // Update pagination info
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1)
          setTotalItems(response.data.pagination.totalItems || 0)
        }
      } else {
        setError(response.error || 'Failed to fetch mine history')
      }
    } catch (err) {
      setError('Failed to fetch mine history')
      console.error('Error fetching mine history:', err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage])

  // Load initial data
  useEffect(() => {
    console.log("fetch mine game history")
    fetchHistory()
  }, [fetchHistory])

  // Handle opening game details modal
  const handleViewGame = (game: any) => {
    setSelectedGame(game)
    setIsModalOpen(true)
  }

  // Handle closing modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedGame(null)
  }

  const handleInputChange = (field: string, value: string) => {
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
    console.log(inputs.serverSeed.length)

    if (inputs.serverSeed.length !== 64) {
      addToast({
        title: "Validation Error",
        description: "Server seed must be exactly 64 characters long",
        color: "danger",
      })
      return
    }

    if (!inputs.clientSeed) {
      addToast({
        title: "Validation Error",
        description: "Client seed is required",
        color: "danger",
      })
      return
    }

    if (inputs.clientSeed.length !== 64) {
      addToast({
        title: "Validation Error",
        description: "Client seed must be exactly 32 characters long",
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

    const gameId = parseInt(inputs.nonce);
    if (!inputs.nonce || isNaN(gameId) || gameId < 100000) {
      addToast({
        title: "Validation Error",
        description: "Game ID must be a number starting from 100000",
        color: "danger",
      })
      return
    }

    if (!inputs.numMines) {
      addToast({
        title: "Validation Error",
        description: "Number of mines is required",
        color: "danger",
      })
      return
    }

    const numMines = parseInt(inputs.numMines);
    if (isNaN(numMines) || numMines < 1 || numMines >= 25) {
      addToast({
        title: "Validation Error",
        description: "Number of mines must be between 1 and 24",
        color: "danger",
      })
      return
    }

    try {
      // Call the backend API to verify the mine positions
      const response = await gameApi.mine.verifyGame({
        gameId: inputs.nonce, // Game ID as string
        serverSeed: inputs.serverSeed,
        clientSeed: inputs.clientSeed,
        numMines: numMines,
        gridSize: 5 // Default 5x5 grid
      })

      if (response.success && response.data) {
        const verificationResult = {
          verified: response.data.verified,
          serverSeed: response.data.serverSeed,
          clientSeed: response.data.clientSeed,
          expectedPositions: response.data.expectedPositions,
          gridSize: response.data.gridSize,
          numMines: response.data.numMines,
          timestamp: new Date().toISOString()
        }

        setResult(verificationResult)

        addToast({
          title: "Verification Complete",
          description: "Mine positions generated successfully! Compare with your game history.",
          color: "success",
        })
      } else {
        addToast({
          title: "Verification Failed",
          description: response.error || "Failed to verify mine positions",
          color: "danger",
        })
      }
    } catch (error) {
      console.error('Verification error:', error)
      addToast({
        title: "Verification Failed",
        description: "Failed to verify mine positions. Please check your inputs.",
        color: "danger",
      })
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchFilter(value)
  }

  const handleSearch = () => {
    setCurrentPage(1) // Reset to first page when searching
    currentSearchFilter.current = searchFilter // Update ref
    fetchHistory(1, searchFilter) // Fetch first page with new search filter
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleClearSearch = () => {
    setSearchFilter('')
    setCurrentPage(1)
    currentSearchFilter.current = '' // Update ref
    fetchHistory(1, '') // Fetch without search filter
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  useEffect(() => {
    if (result) {
      setResult(null)
    }
  }, [selectedGame])

  // Refetch when page changes
  useEffect(() => {
    fetchHistory(currentPage, currentSearchFilter.current)
  }, [currentPage])

  return (
    <div className="space-y-6">
      {/* Verification Form */}
      <Card id="verification-form" className="bg-background-alt border border-gray-700">
        <CardBody className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaBomb className="text-2xl text-yellow-500" />
            <div>
              <h3 className="text-lg font-semibold text-white">Mine Result Generator</h3>
              <p className="text-gray-400 text-sm">Generate expected mine positions using server seed, client seed, game ID, and number of mines</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Server Seed
              </label>
              <Input
                type="text"
                value={inputs.serverSeed}
                onChange={(e) => handleInputChange('serverSeed', e.target.value)}
                placeholder="Enter server seed"
                className="w-full"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-gray-800 border-gray-600"
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client Seed
              </label>
              <Input
                type="text"
                value={inputs.clientSeed}
                onChange={(e) => handleInputChange('clientSeed', e.target.value)}
                placeholder="Enter client seed"
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
                type="number"
                value={inputs.nonce}
                onChange={(e) => handleInputChange('nonce', e.target.value)}
                placeholder="Enter game ID (e.g., 100000)"
                min="100000"
                className="w-full"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-gray-800 border-gray-600"
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Mines
              </label>
              <Input
                type="number"
                value={inputs.numMines}
                onChange={(e) => handleInputChange('numMines', e.target.value)}
                placeholder="Enter number of mines (1-24)"
                min="1"
                max="24"
                className="w-full"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-gray-800 border-gray-600"
                }}
              />
            </div>
          </div>

          <div className="mt-6">
            <PrimaryButton
              onClick={handleVerification}
              className="bg-primary text-background font-semibold"
            >
              <FaCalculator className="mr-2" />
              Generate Result
            </PrimaryButton>
          </div>

          {/* Verification Result */}
          {result && (
            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
              <h4 className="font-semibold mb-2 text-blue-400">
                Expected Mine Positions:
              </h4>
              <div className='flex-col md:flex-row gap-4 flex'>
                <div className="space-y-2">
                  <p className="text-white">
                    <strong>Generated:</strong> ✅ Success
                  </p>
                  {result.expectedPositions && (
                    <p className="text-white">
                      <strong>Expected Mine Positions:</strong> [{result.expectedPositions.join(', ')}]
                    </p>
                  )}
                  <p className="text-gray-300 text-sm">
                    <strong>Grid Size:</strong> {result.gridSize}x{result.gridSize}
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong>Number of Mines:</strong> {result.numMines}
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong>Server Seed:</strong> {result.serverSeed?.substring(0, 16)}...
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong>Client Seed:</strong> {result.clientSeed?.substring(0, 16)}...
                  </p>
                  <p className="text-gray-300 text-sm">
                    <strong>Verified At:</strong> {new Date(result.timestamp).toLocaleString()}
                  </p>
                </div>
                <div
                  className="grid gap-1 mx-auto"
                  style={{
                    gridTemplateColumns: `repeat(${result.gridSize}, 1fr)`,
                    width: 'fit-content'
                  }}
                >
                  {Array.from({ length: result.gridSize * result.gridSize }, (_, index) => {
                    const isMine = result.expectedPositions?.includes(index)
                    return (
                      <div
                        key={index}
                        className={`w-8 h-8 flex items-center justify-center text-xs font-bold border border-gray-600 ${isMine
                          ? 'bg-red-600 text-white' // Mine revealed
                          : 'bg-gray-700 text-gray-300' // Unrevealed
                          }`}
                      >
                        {isMine ? (
                          <FaBomb className="text-xs" />
                        ) : (
                          '?'
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Game History */}
      <Card className="bg-background-alt border border-gray-700">
        <CardBody className="p-3 sm:p-6">
          <div className="flex items-center justify-between mb-4 flex-col sm:flex-row gap-4">
            <h3 className="text-lg font-semibold text-white">Mine Game History</h3>
            <div className="flex gap-2">
              <Input
                type="text"
                size='sm'
                placeholder="Search by game ID (partial match)..."
                value={searchFilter}
                onChange={(e) => handleSearchChange(e.target.value)}
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
              {searchFilter && (
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

          <Table aria-label="Mine game history" classNames={{ base: "grid" }}>
            <TableHeader>
              <TableColumn>GAME ID</TableColumn>
              <TableColumn>PLAYER</TableColumn>
              <TableColumn>BET</TableColumn>
              <TableColumn>MINES</TableColumn>
              <TableColumn>REVEALED</TableColumn>
              <TableColumn>MULTIPLIER</TableColumn>
              <TableColumn>PAYOUT</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>TIME</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-gray-400">
                    Loading mine game history...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-red-400">
                    {error}
                  </TableCell>
                </TableRow>
              ) : gameHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-gray-400">
                    No mine games found. Start playing to see your history!
                  </TableCell>
                </TableRow>
              ) : (
                gameHistory.map((game: any, index: number) => (
                  <TableRow key={game._id || index}>
                    <TableCell className="text-blue-400 font-mono text-sm">
                      {game.gameId || game._id?.substring(0, 8)}
                    </TableCell>
                    <TableCell className="text-white">{game.player?.username || 'Anonymous'}</TableCell>
                    <TableCell className="text-white">{game.wager?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell className="text-white">{game.numMines || 0}</TableCell>
                    <TableCell className="text-white">{game.revealedTiles?.length || 0}</TableCell>
                    <TableCell className="text-white">{game.multiplier?.toFixed(2) || '0.00'}x</TableCell>
                    <TableCell className="text-white">
                      {game.payout ? game.payout.toFixed(2) : game.status === 'completed' ? (game.wager * (game.currentMultiplier || 0)).toFixed(2) : '0.00'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${game.status === 'win' ? 'bg-green-900 text-green-300' :
                        game.status === 'active' ? 'bg-blue-900 text-blue-300' :
                          game.status === 'lose' ? 'bg-red-900 text-red-300' :
                            'bg-gray-900 text-gray-300'
                        }`}>
                        {game.status || 'unknown'}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {game.completedAt ? new Date(game.completedAt).toLocaleString() : 'Unknown'}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between px-4 py-3 border-t border-gray-700">
              <div className="flex items-center text-sm text-gray-400">
                <span>
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  color="default"
                  onPress={handlePreviousPage}
                  isDisabled={currentPage === 1}
                  className="text-gray-300"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={currentPage === pageNum ? "solid" : "flat"}
                        color={currentPage === pageNum ? "primary" : "default"}
                        onPress={() => handlePageChange(pageNum)}
                        className={`min-w-[32px] ${currentPage === pageNum
                            ? "bg-primary text-background"
                            : "text-gray-300 hover:bg-gray-700"
                          }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  size="sm"
                  variant="flat"
                  color="default"
                  onPress={handleNextPage}
                  isDisabled={currentPage === totalPages}
                  className="text-gray-300"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Game Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
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
                  <FaBomb className="text-red-500" />
                  <span>Mine Game Details</span>
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
                            <span className="text-gray-400">Player:</span>
                            <span className="text-white">{selectedGame.player?.username || 'Anonymous'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Bet Amount:</span>
                            <span className="text-white">{selectedGame.wager?.toFixed(4).replace(/.0+$/, '')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Grid Size:</span>
                            <span className="text-white">{selectedGame.gridSize}x{selectedGame.gridSize}</span>
                          </div>
                          <div className="flex justify-between flex-wrap">
                            <span className="text-gray-400">Mines:</span>
                            <p className="text-white whitespace-pre">{selectedGame.mineTiles.toString()}</p>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className={`px-2 py-1 rounded text-xs ${selectedGame.status === 'win' ? 'bg-green-900 text-green-300' :
                              selectedGame.status === 'active' ? 'bg-blue-900 text-blue-300' :
                                selectedGame.status === 'lose' ? 'bg-red-900 text-red-300' :
                                  'bg-gray-900 text-gray-300'
                              }`}>
                              {selectedGame.status || 'unknown'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Final Multiplier:</span>
                            <span className="text-white">{selectedGame.multiplier?.toFixed(4).replace(/.0+$/, '')}x</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Payout:</span>
                            <span className="text-white">
                              {selectedGame.payout ? selectedGame.payout.toFixed(4).replace(/.0+$/, '') :
                                selectedGame.status === 'completed' ?
                                  (selectedGame.betAmount * (selectedGame.multiplier || 0)).toFixed(4).replace(/.0+$/, '') : '0.0000'}
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
                              className=" text-xs"
                              classNames={{
                                pre: "max-w-[50px] sm:max-w-[150px]! truncate",
                              }}>
                              {selectedGame.serverSeed || 'N/A'}
                            </Snippet>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Client Seed:</span>
                            <Snippet
                              size='sm'
                              symbol=''
                              className=" text-xs"
                              classNames={{
                                pre: "max-w-[50px] sm:max-w-[150px]! truncate",
                              }}>
                              {selectedGame.clientSeed || 'N/A'}
                            </Snippet>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Revealed Tiles:</span>
                            <span className="text-white">{selectedGame.revealedTiles.toString() || 0}</span>
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

                    {/* Mine Grid Visualization */}
                    <div className="space-y-2">
                      <h4 className="text-white font-semibold">Mine Grid ({selectedGame.gridSize}x{selectedGame.gridSize})</h4>
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <div
                          className="grid gap-1 mx-auto"
                          style={{
                            gridTemplateColumns: `repeat(${selectedGame.gridSize}, 1fr)`,
                            width: 'fit-content'
                          }}
                        >
                          {Array.from({ length: selectedGame.gridSize * selectedGame.gridSize }, (_, index) => {
                            const isMine = selectedGame.mineTiles?.includes(index)
                            const isRevealed = selectedGame.revealedTiles?.includes(index)
                            const isGameOver = selectedGame.status === 'lose' || selectedGame.status === 'win'

                            return (
                              <div
                                key={index}
                                className={`w-8 h-8 flex items-center justify-center text-xs font-bold border border-gray-600 ${isMine && (isGameOver || isRevealed)
                                  ? 'bg-red-600 text-white' // Mine revealed
                                  : isRevealed
                                    ? 'bg-green-600 text-white' // Safe tile revealed
                                    : 'bg-gray-700 text-gray-300' // Unrevealed
                                  }`}
                              >
                                {isMine && (isGameOver || isRevealed) ? (
                                  <FaBomb className="text-xs" />
                                ) : isRevealed ? (
                                  '✓'
                                ) : (
                                  '?'
                                )}
                              </div>
                            )
                          })}
                        </div>
                        <div className="mt-3 flex justify-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-red-600 border border-gray-600"></div>
                            <span className="text-gray-400">Mine ({selectedGame.numMines})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-green-600 border border-gray-600"></div>
                            <span className="text-gray-400">Safe Revealed ({selectedGame.revealedTiles?.length || 0})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-gray-700 border border-gray-600"></div>
                            <span className="text-gray-400">Unrevealed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="bordered" className='font-semibold rounded-full' onPress={onClose} >
                  Close
                </Button>
                <Button
                  className='text-background font-semibold rounded-full'
                  color="primary"
                  onPress={() => {
                    if (selectedGame) {
                      setInputs({
                        serverSeed: selectedGame.serverSeed || '',
                        clientSeed: selectedGame.clientSeed || '',
                        nonce: selectedGame.gameId?.toString() || selectedGame._id,
                        numMines: selectedGame.numMines?.toString() || ''
                      })
                      onClose()
                      // Scroll to verification form
                      document.getElementById('verification-form')?.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                >
                  Use for Verification
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div >
  )
}

export default MineVerification

