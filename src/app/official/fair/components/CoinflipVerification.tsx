'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardBody, Input, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Snippet, Avatar, AvatarGroup, Image, Badge, Chip } from "@heroui/react"
import { FaCircle, FaCalculator, FaEye } from 'react-icons/fa'
import { addToast } from "@heroui/react"
import { gameApi } from '@/lib/api'
import PrimaryButton from '@/components/ui/PrimaryButton'

const CoinflipVerification = () => {
  const [inputs, setInputs] = useState({
    serverSeed: '',
    creatorSeed: '',
    joinerSeed: '',
    nonce: ''
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

  // Fetch coinflip history
  const fetchHistory = useCallback(async (page: number = currentPage, searchTerm?: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await gameApi.coinflip.getUserGames({ status: 'completed' })

      if (response.success && response.data) {
        // Filter by search term if provided
        // getUserGames returns array directly, not wrapped in {games: [...]}
        let filteredGames = Array.isArray(response.data) ? response.data : response.data.games || []

        if (searchTerm) {
          filteredGames = filteredGames.filter((game: any) =>
            game.gameId?.toString().includes(searchTerm) ||
            game._id?.toString().includes(searchTerm) ||
            game.creator?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            game.joiner?.username?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        // Pagination
        const startIndex = (page - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginatedGames = filteredGames.slice(startIndex, endIndex)

        setGameHistory(paginatedGames)
        setTotalPages(Math.ceil(filteredGames.length / itemsPerPage))
        setTotalItems(filteredGames.length)
      } else {
        setError(response.error || 'Failed to fetch coinflip history')
      }
    } catch (err) {
      setError('Failed to fetch coinflip history')
      console.error('Error fetching coinflip history:', err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage])

  // Load initial data
  useEffect(() => {
    console.log("fetch coinflip game history")
    fetchHistory()
  }, [fetchHistory])

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }))
  }

  const handleVerification = async () => {
    // Validation
    if (inputs.serverSeed.length !== 64) {
      addToast({
        title: "Validation Error",
        description: "Server seed must be exactly 64 characters long",
        color: "danger",
      })
      return
    }

    if (inputs.creatorSeed.length !== 64) {
      addToast({
        title: "Validation Error",
        description: "Creator seed must be exactly 32 characters long",
        color: "danger",
      })
      return
    }

    if (inputs.joinerSeed.length !== 64) {
      addToast({
        title: "Validation Error",
        description: "Joiner seed must be exactly 32 characters long",
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
      // Call the backend API to verify the coinflip result
      const response = await gameApi.coinflip.verifyGame({
        gameId: inputs.nonce,
        serverSeed: inputs.serverSeed,
        creatorSeed: inputs.creatorSeed,
        joinerSeed: inputs.joinerSeed
      })

      if (response.success && response.data) {
        const verificationResult = {
          verified: response.data.verified,
          serverSeed: response.data.serverSeed,
          creatorSeed: response.data.creatorSeed,
          joinerSeed: response.data.joinerSeed,
          expectedResult: response.data.expectedResult,
          timestamp: new Date().toISOString()
        }

        setResult(verificationResult)

        addToast({
          title: "Verification Complete",
          description: "Coinflip result generated successfully! Compare with your game history.",
          color: "success",
        })
      } else {
        addToast({
          title: "Verification Failed",
          description: response.error || "Failed to verify coinflip result",
          color: "danger",
        })
      }
    } catch (error) {
      console.error('Verification error:', error)
      addToast({
        title: "Verification Failed",
        description: "Failed to verify coinflip result. Please check your inputs.",
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

  const handleViewGame = (game: any) => {
    setSelectedGame(game)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedGame(null)
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
            <FaCircle className="text-2xl text-yellow-500" />
            <div>
              <h3 className="text-lg font-semibold text-white">Coinflip Result Generator</h3>
              <p className="text-gray-400 text-sm">Generate expected coinflip results using server seed, creator seed, joiner seed, and game ID</p>
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
                Creator Seed
              </label>
              <Input
                type="text"
                value={inputs.creatorSeed}
                onChange={(e) => handleInputChange('creatorSeed', e.target.value)}
                placeholder="Enter creator seed"
                className="w-full"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-gray-800 border-gray-600"
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Joiner Seed
              </label>
              <Input
                type="text"
                value={inputs.joinerSeed}
                onChange={(e) => handleInputChange('joinerSeed', e.target.value)}
                placeholder="Enter joiner seed"
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
                Expected Coinflip Result:
              </h4>
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="space-y-2 md:w-1/2 w-full">

                  <div className="text-white flex justify-between items-center">
                    <strong className='text-white/40'>Winner Side:</strong> 
                    <Chip>{result.expectedResult.winnerSide}</Chip>
                  </div>
                  <div className="text-white flex justify-between items-center">
                    <strong className='text-white/40'>Ticket Number:</strong> <Chip>{result.expectedResult.ticket}</Chip>
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
                    <strong className='text-white/40'>Creator Seed:</strong>
                    <Snippet
                      size='sm'
                      symbol=''
                      className="text-xs"
                      classNames={{
                        pre: "max-w-[150px]! truncate",
                      }}>{result.creatorSeed}</Snippet>
                  </div>
                  <div className="text-gray-300 text-sm truncate flex justify-between items-center">
                    <strong className='text-white/40'>Joiner Seed:</strong>
                    <Snippet
                      size='sm'
                      symbol=''
                      className="text-xs"
                      classNames={{
                        pre: "max-w-[150px]! truncate",
                      }}>{result.joinerSeed}</Snippet>
                  </div>
                  <div className="text-gray-300 text-sm truncate flex justify-between items-center">
                    <strong className='text-white/40'>Generated At:</strong> {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className='shrink-0 flex items-center justify-center w-full md:w-1/2'>
                  <Image src={`/assets/images/tokens/${result.expectedResult.winnerSide.toLowerCase()}.svg`} alt="Winner Side" width={150} height={150} className='animate-appearance-in' />
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Game History */}
      <Card className="bg-background-alt border border-gray-700">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Completed Coinflip Games</h3>
            <div className="flex gap-2">
              <Input
                type="text"
                size='sm'
                placeholder="Search completed games by game ID..."
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
          <div className='overflow-x-auto w-full grid'>
            <Table aria-label="Coinflip game history" classNames={{ base: "grid!" }}>
              <TableHeader>
                <TableColumn>GAME ID</TableColumn>
                <TableColumn>Players</TableColumn>
                <TableColumn>BET AMOUNT</TableColumn>
                <TableColumn>WINNER</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>TIME</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400">
                      Loading coinflip game history...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-red-400">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : gameHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400">
                      No completed coinflip games found
                    </TableCell>
                  </TableRow>
                ) : (
                  gameHistory.map((game, index) => (
                    <TableRow key={game._id || index}>
                      <TableCell className="text-blue-400 font-mono text-sm">
                        {game.gameId || game._id?.substring(0, 8)}
                      </TableCell>
                      <TableCell className="text-white">
                        <AvatarGroup isBordered>
                          <Avatar color='default' src={game.creator._id === game.winner._id ? game.joiner?.avatar : game.creator?.avatar} alt={game.creator?.displayName || game.creator?.username || 'Unknown'} />
                          <Avatar color='primary' src={game.winner?.avatar} alt={game.winner?.displayName || game.winner?.username || 'Unknown'} />
                        </AvatarGroup>
                      </TableCell>
                      <TableCell className="text-white">{game.betAmount?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-white">
                        <p>{game.winner?.displayName || game.winner?.username || 'Unknown'} </p>
                      </TableCell>
                      <TableCell className="text-white">
                        <span className={`px-2 py-1 rounded text-xs ${game.status === 'completed' ? 'bg-green-600' :
                          game.status === 'waiting' ? 'bg-yellow-600' : 'bg-gray-600'
                          }`}>
                          {game.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-white">
                        {game.createdAt ? new Date(game.createdAt).toLocaleDateString() : '-'}
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
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
          base: "bg-background-alt border border-gray-700",
          header: "border-b border-gray-700",
          body: "py-6",
          footer: "border-t border-gray-700"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <FaCircle className="text-yellow-500" />
                  <span>Coinflip Game Details</span>
                </div>

              </ModalHeader>
              <ModalBody>
                {selectedGame && (
                  <div className="space-y-6">
                    {/* Game Info */}
                    <div className="space-y-2">
                      <h4 className="text-white font-semibold">Game Information</h4>
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
                          <span className="text-gray-400">Result:</span>
                          <Image src={`/assets/images/tokens/${selectedGame.coinSide || 'heads'}.svg`} alt={selectedGame.creator?.coin || 'heads'} width={80} height={80} />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className="text-white">{selectedGame.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Bet Amount:</span>
                          <span className="text-white">{selectedGame.betAmount?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Winner:</span>
                          <span className="text-white">{selectedGame.winner?.username || 'None'}</span>
                        </div>
                      </div>
                      <div className='flex items-center justify-center gap-4'>
                        <div className='flex gap-2 justify-start items-center flex-col'>
                          <div>
                            <Badge isOneChar color="success" content={<Image src={`/assets/images/tokens/${selectedGame.coinSide || 'heads'}.svg`} alt={selectedGame.creator?.coin || 'heads'} width={20} height={20} />} placement="bottom-right">
                              <Image
                                src={selectedGame.creator?.avatar}
                                alt={selectedGame.creator?.displayName || selectedGame.creator?.username}
                                className="w-14 h-14 rounded-full"
                              />
                            </Badge>
                          </div>

                          <div className='flex flex-col items-center justify-center'>
                            <h4 className="text-white font-bold">{selectedGame.creator?.displayName || selectedGame.creator?.username}</h4>
                            <p className="text-gray-400 text-sm ">Level {selectedGame.creator?.level}</p>
                          </div>
                        </div>
                        <Image src={`/assets/images/vs.png`} alt='vs' width={60} />
                        <div className='flex gap-2 justify-start items-center flex-col'>
                          <Badge isOneChar color="success" content={<Image src={`/assets/images/tokens/${selectedGame.coinSide === 'heads' ? 'tails' : 'heads'}.svg`} alt={selectedGame.creator?.coin || 'heads'} width={20} height={20} />} placement="bottom-right">
                            <Image
                              src={selectedGame.joiner.avatar}
                              alt={selectedGame.joiner?.displayName || selectedGame.joiner?.username}
                              className="w-14 h-14 rounded-full"
                            />
                          </Badge>


                          <div className='flex flex-col items-center justify-center'>
                            <h4 className="text-white font-bold ">{selectedGame.joiner?.displayName || selectedGame.joiner?.username}</h4>
                            <p className="text-gray-400 text-sm ">Level {selectedGame.joiner?.level}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seeds & Verification */}
                    <div className="space-y-2">
                      <h4 className="text-white font-semibold">Seeds & Verification</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Server Seed:</span>
                          <Snippet
                            size='sm'
                            symbol=''
                            className=" text-xs"
                            classNames={{
                              pre: "max-w-[150px]! truncate",
                            }}>
                            {selectedGame.serverSeed || 'N/A'}
                          </Snippet>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Creator Seed:</span>
                          <Snippet
                            size='sm'
                            symbol=''
                            className=" text-xs"
                            classNames={{
                              pre: "max-w-[150px]! truncate",
                            }}>
                            {selectedGame.creatorSeed || 'N/A'}
                          </Snippet>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Joiner Seed:</span>
                          <Snippet
                            size='sm'
                            symbol=''
                            className=" text-xs"
                            classNames={{
                              pre: "max-w-[150px]! truncate",
                            }}>
                            {selectedGame.joinerSeed || 'N/A'}
                          </Snippet>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="bordered" onPress={onClose} className='rounded-full'>Close</Button>
                <PrimaryButton
                  onClick={() => {
                    if (selectedGame) {
                      setInputs({
                        serverSeed: selectedGame.serverSeed || '',
                        creatorSeed: selectedGame.creatorSeed || '',
                        joinerSeed: selectedGame.joinerSeed || '',
                        nonce: selectedGame.gameId?.toString() || selectedGame._id
                      })
                      onClose()
                      document.getElementById('verification-form')?.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                >
                  Use for Verification
                </PrimaryButton>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

export default CoinflipVerification