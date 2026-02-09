'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    Tabs,
    Tab,
    Input,
    Button,
    Spinner,
    Checkbox
} from '@heroui/react'
import { FaArrowRight, FaArrowLeft, FaTimes } from 'react-icons/fa'
import { gameApi } from '@/lib/api'
import { useWebSocket } from '@/contexts/socketContext'
import { useAuth } from '@/contexts/AuthContext'
import { FaCircle } from 'react-icons/fa6'

interface HistoryItem {
    gameId: number
    result: number
    hash: string
}

interface AnalysisItem {
    range: string
    chance: string
    count: number
    maxCombo: number
}

interface AnalysisGame {
    gameId: number
    result: number
    inRange1: boolean
}

interface CrashHistoryModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function CrashHistoryModal({ isOpen, onClose }: CrashHistoryModalProps) {
    const { isConnected, on, off } = useWebSocket()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<string>('history')
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [analysis, setAnalysis] = useState<AnalysisItem[]>([])
    const [analysisGames, setAnalysisGames] = useState<AnalysisGame[]>([])
    const [threshold, setThreshold] = useState<number>(2)
    const [onlyMyGames, setOnlyMyGames] = useState<boolean>(false)
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [analysisPage, setAnalysisPage] = useState(1)
    const itemsPerPage = 20
    const analysisItemsPerPage = 20

    // Load history when modal opens and history tab is active, or when filter changes
    useEffect(() => {
        if (isOpen && activeTab === 'history') {
            loadHistory()
        }
    }, [isOpen, activeTab, onlyMyGames])

    // Recalculate analysis statistics from games array
    const recalculateAnalysis = useCallback((games: AnalysisGame[], currentThreshold: number) => {
        const range1: number[] = []
        const range2: number[] = []

        games.forEach(game => {
            if (game.inRange1) {
                range1.push(game.result)
            } else {
                range2.push(game.result)
            }
        })

        const range1Count = range1.length
        const range2Count = range2.length
        const totalCount = games.length

        const range1Chance = totalCount > 0 ? (range1Count / totalCount) * 100 : 0
        const range2Chance = totalCount > 0 ? (range2Count / totalCount) * 100 : 0

        // Calculate max combo
        let maxCombo1 = 0
        let maxCombo2 = 0
        let currentCombo1 = 0
        let currentCombo2 = 0

        games.forEach(game => {
            if (game.inRange1) {
                currentCombo1++
                currentCombo2 = 0
                maxCombo1 = Math.max(maxCombo1, currentCombo1)
            } else {
                currentCombo2++
                currentCombo1 = 0
                maxCombo2 = Math.max(maxCombo2, currentCombo2)
            }
        })

        setAnalysis([
            {
                range: `[1, ${currentThreshold})`,
                chance: range1Chance.toFixed(2),
                count: range1Count,
                maxCombo: maxCombo1
            },
            {
                range: `[${currentThreshold}, ∞)`,
                chance: range2Chance.toFixed(2),
                count: range2Count,
                maxCombo: maxCombo2
            }
        ])
    }, [])

    // Load analysis when modal opens and analysis tab is active (with default threshold 2)
    useEffect(() => {
        if (isOpen && activeTab === 'analysis') {
            loadAnalysis()
        }
    }, [isOpen, activeTab])

    // Listen for new round results to update both history and analysis in real-time
    useEffect(() => {
        if (!isConnected || !isOpen) return

        const handleRoundResult = (data: any) => {
            // Update history - add new result at the beginning
            setHistory(prev => {
                const newItem: HistoryItem = {
                    gameId: data.round,
                    result: data.crashPoint,
                    hash: data.serverSeedHash || data.roundId?.substring(0, 16) || ''
                }
                // Prepend new result and keep only last 100
                return [newItem, ...prev].slice(0, 100)
            })

            // Update analysis if it's already loaded
            setAnalysisGames(prev => {
                if (prev.length === 0) return prev
                
                const newGame: AnalysisGame = {
                    gameId: data.round,
                    result: data.crashPoint,
                    inRange1: data.crashPoint < threshold
                }
                // Prepend and keep only last 2000
                const updated = [newGame, ...prev].slice(0, 2000)
                // Recalculate analysis statistics
                recalculateAnalysis(updated, threshold)
                return updated
            })
        }

        on('crash_round_result', handleRoundResult)

        return () => {
            off('crash_round_result', handleRoundResult)
        }
    }, [isConnected, isOpen, threshold, on, off, recalculateAnalysis])

    const loadHistory = async () => {
        setIsLoadingHistory(true)
        try {
            const response = await gameApi.crash.getHistoryForModal({ 
                limit: 100,
                onlyMyGames: onlyMyGames 
            })
            if (response.success && response.data) {
                setHistory(response.data.data as HistoryItem[])
                setCurrentPage(1) // Reset to first page when filter changes
            }
        } catch (error) {
            console.error('Failed to load history:', error)
        } finally {
            setIsLoadingHistory(false)
        }
    }

    const loadAnalysis = async () => {
        setIsLoadingAnalysis(true)
        try {
            const response = await gameApi.crash.getAnalysis({ limit: 2000, threshold })
            if (response.success && response.data) {
                const data = (response.data as any).data || response.data
                setAnalysis(data.analysis || [])
                setAnalysisGames(data.games || [])
                setAnalysisPage(1)
            }
        } catch (error) {
            console.error('Failed to load analysis:', error)
        } finally {
            setIsLoadingAnalysis(false)
        }
    }

    const handleAnalysis = () => {
        // Validate threshold before running analysis
        if (!threshold || threshold <= 0 || isNaN(threshold)) {
            console.error('Invalid threshold value')
            return
        }
        loadAnalysis()
    }

    // Pagination for history
    const historyStartIndex = (currentPage - 1) * itemsPerPage
    const historyEndIndex = historyStartIndex + itemsPerPage
    const paginatedHistory = history.slice(historyStartIndex, historyEndIndex)
    const totalPages = Math.ceil(history.length / itemsPerPage)

    // Get color for result based on threshold (default 2)
    const getResultColor = (result: number) => {
        return result >= 10 ? 'text-yellow-400' : result >= 2 ? 'text-green-400' : 'text-orange-400'
    }

    // Get color for analysis result
    const getAnalysisResultColor = (inRange1: boolean) => {
        return inRange1 ? 'text-orange-400' : 'text-green-400'
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
            scrollBehavior="inside"
            classNames={{
                base: 'bg-background-alt border border-gray-700/50',
                header: 'border-b border-gray-700/50',
                body: 'p-0'
            }}
        >
            <ModalContent>
                <ModalHeader className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">History</h2>
                </ModalHeader>
                <ModalBody>
                    <Tabs
                        selectedKey={activeTab}
                        onSelectionChange={(key) => setActiveTab(key as string)}
                        classNames={{
                            base: 'w-full',
                            tabList: 'bg-background border-b border-gray-700/50',
                            tab: 'data-[selected=true]:bg-background-alt',
                            tabContent: 'text-gray-400 data-[selected=true]:text-white'
                        }}
                    >
                        <Tab key="history" title="History">
                            <div className="p-4">
                                <div className="mb-4 flex items-center justify-between hidden">
                                    <Checkbox
                                        isSelected={onlyMyGames}
                                        onValueChange={setOnlyMyGames}
                                        isDisabled={!user.isAuthenticated}
                                        classNames={{
                                            label: "text-sm text-gray-400"
                                        }}
                                    >
                                        Filter with my games
                                    </Checkbox>
                                </div>
                                {isLoadingHistory ? (
                                    <div className="flex justify-center items-center py-8">
                                        <Spinner size="lg" />
                                    </div>
                                ) : (
                                    <div className="w-full">
                                        <table className="w-full">
                                            <thead>
                                                <tr>
                                                    <th className="text-xs text-left px-2 py-1 text-gray-400 w-[10%]">Game ID</th>
                                                    <th className="text-xs text-left px-2 py-1 text-gray-400 w-[20%]">Crash</th>
                                                    <th className="text-xs text-center px-2 py-1 text-gray-400 w-[70%]">Server Seed Hash</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedHistory.map((item, index) => (
                                                    <tr
                                                        key={index}
                                                        className={`hover:bg-background/50 transition-colors ${
                                                            index % 2 === 0 ? 'bg-background/30' : ''
                                                        }`}
                                                    >
                                                        <td className="px-2 py-2 flex items-center gap-2">
                                                            <FaCircle className={`${getResultColor(item.result)} text-xs`} />
                                                            <div className="font-mono text-sm text-white">
                                                                {item.gameId}
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <div className={`font-semibold ${getResultColor(item.result)}`}>
                                                                {item.result.toFixed(2)}
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <div className="font-mono text-xs text-gray-400 truncate md:block hidden">
                                                                {item.hash.substring(0, 16)}...{item.hash.substring(item.hash.length - 16)}
                                                            </div>
                                                            <div className="font-mono text-xs text-gray-400 truncate md:hidden block">
                                                                {item.hash.substring(0, 8)}...{item.hash.substring(item.hash.length - 8)}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {!isLoadingHistory && totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <Button
                                            size="sm"
                                            variant="light"
                                            isDisabled={currentPage === 1}
                                            onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        >
                                            <FaArrowLeft />
                                        </Button>
                                        <span className="text-sm text-gray-400">
                                            {String(currentPage)} of {String(totalPages)}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="light"
                                            isDisabled={currentPage >= totalPages}
                                            onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        >
                                            <FaArrowRight />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Tab>

                        <Tab key="analysis" title="Analysis">
                            <div className="p-4 space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-400 whitespace-nowrap">Last 2000 issue, payout &lt;</span>
                                        <Input
                                            type="number"
                                            value={threshold > 0 ? threshold.toString() : ''}
                                            onValueChange={(value) => {
                                                if (value === '' || value === null || value === undefined) {
                                                    setThreshold(0)
                                                } else {
                                                    const numValue = parseFloat(value)
                                                    if (!isNaN(numValue)) {
                                                        setThreshold(numValue)
                                                    }
                                                }
                                            }}
                                            min={0.1}
                                            step={0.1}
                                            className="w-20"
                                            classNames={{
                                                input: 'text-center text-sm',
                                                inputWrapper: 'bg-background h-8 min-h-8'
                                            }}
                                        />
                                    </div>
                                    <Button
                                        color="primary"
                                        onPress={handleAnalysis}
                                        isLoading={isLoadingAnalysis}
                                        className="bg-background border border-gray-700 text-white h-8"
                                        size="sm"
                                    >
                                        Analysis
                                    </Button>
                                </div>

                                {analysis.length > 0 && (
                                    <>
                                        <div className="w-full border border-gray-700 rounded-lg text-sm overflow-hidden">
                                            <table className="w-full table-auto">
                                                <thead>
                                                    <tr>
                                                        <th className="text-center border border-gray-700 border-t-0 border-b-0 border-l-0 px-2 py-1 text-gray-400">Range</th>
                                                        <th className="text-center border border-gray-700 border-t-0 border-b-0 px-2 py-1 text-gray-400">Chance</th>
                                                        <th className="text-center border border-gray-700 border-t-0 border-b-0 px-2 py-1 text-gray-400">Count</th>
                                                        <th className="text-center border border-gray-700 border-t-0 border-b-0 border-r-0 rounded-tr-lg px-2 py-1 text-gray-400">Max Combo</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {analysis.map((item, index) => (
                                                        <tr key={index}>
                                                            <td className="px-2 py-1 text-center border border-gray-700 border-b-0 border-l-0 text-white">{item.range}</td>
                                                            <td className="px-2 py-1 text-center border border-gray-700 border-b-0 border-l-0 text-white">{item.chance}%</td>
                                                            <td className="px-2 py-1 text-center border border-gray-700 border-b-0 border-l-0 text-white">{item.count}</td>
                                                            <td className="px-2 py-1 text-center border border-gray-700 border-b-0 border-r-0 text-white">{item.maxCombo}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="relative mt-3">

                                            {/* Game rows with circles and connecting lines */}
                                            <div className="relative">
                                                <table className="w-full mt-4">
                                                    <thead>
                                                        {/* Header with range labels */}
                                                        <tr>
                                                            <th className="text-left px-2 py-1 text-gray-400 w-[30%]">Game ID</th>
                                                            <th className="text-center px-2 py-1 text-gray-400 w-[35%]">[1, {threshold})</th>
                                                            <th className="text-center px-2 py-1 text-gray-400 w-[35%]">[{threshold}, ∞)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {analysisGames
                                                            .slice((analysisPage - 1) * analysisItemsPerPage, analysisPage * analysisItemsPerPage)
                                                            .map((game, localIndex) => {
                                                                const globalIndex = (analysisPage - 1) * analysisItemsPerPage + localIndex
                                                                const prevGame = globalIndex > 0 ? analysisGames[globalIndex - 1] : null
                                                                const isInRange1 = game.inRange1
                                                                const wasInRange1 = prevGame?.inRange1

                                                                // Calculate line positions - approximate based on layout
                                                                const leftCircleX = 132 // Position for left side (range 2) - 40% of width
                                                                const rightCircleX = 224 // Position for right side (range 1) - ~60% of width

                                                                // Determine if we need a connecting line
                                                                const needsDiagonalLine = prevGame && wasInRange1 !== isInRange1
                                                                const needsVerticalLine = prevGame && wasInRange1 === isInRange1

                                                                return (
                                                                    <tr
                                                                        key={globalIndex}
                                                                        className={`relative h-[2.125rem] ${localIndex % 2 === 0 ? 'bg-background/30' : ''
                                                                            }`}
                                                                    >
                                                                        {/* Connecting lines */}
                                                                        {/* {needsDiagonalLine && (
                                      <div
                                        className="absolute bg-green-400 z-0"
                                        style={{
                                          width: '98px',
                                          height: '2px',
                                          top: '0px',
                                          left: wasInRange1 ? `${rightCircleX}px` : `${leftCircleX}px`,
                                          transform: `rotate(${wasInRange1 ? '20.28' : '159.72'}deg)`,
                                          transformOrigin: 'left center'
                                        }}
                                      />
                                    )}
                                    {needsVerticalLine && (
                                      <div
                                        className="absolute bg-green-400 z-0"
                                        style={{
                                          width: '34px',
                                          height: '2px',
                                          top: '0px',
                                          left: isInRange1 ? `${rightCircleX}px` : `${leftCircleX}px`,
                                          transform: 'rotate(90deg)',
                                          transformOrigin: 'left center'
                                        }}
                                      />
                                    )} */}
                                                                        <td>
                                                                            <span className="text-left text-gray-400">{game.gameId}</span>
                                                                        </td>
                                                                        <td className="">
                                                                            {isInRange1 ? <div
                                                                                className={`circle text-xs min-w-14 w-16 h-5 rounded-xl flex items-center justify-center z-10 px-2 bg-orange-500 text-white mx-auto`}
                                                                            >
                                                                                {game.result.toFixed(2)}×
                                                                            </div> : <div></div>}
                                                                        </td>
                                                                        <td>
                                                                            {!isInRange1 ? <div
                                                                                className={`circle text-xs min-w-14 w-16 h-5 rounded-xl flex items-center justify-center z-10 px-2 bg-green-500 text-black mx-auto`}
                                                                            >
                                                                                {game.result.toFixed(2)}×
                                                                            </div> : <div></div>}
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination */}
                                            <div className="flex justify-center mt-1">
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    isDisabled={analysisPage === 1}
                                                    onPress={() => setAnalysisPage(prev => Math.max(1, prev - 1))}
                                                    className="p-2 text-white size-10 rounded-l-lg"
                                                    isIconOnly
                                                >
                                                    <FaArrowLeft />
                                                </Button>
                                                <div className="flex h-10 pl-1 pr-2 mx-1 items-center text-sm">
                                                    <span className="size-8 flex justify-center items-center text-white">
                                                        {String(analysisPage)}
                                                    </span>
                                                    <span className="text-gray-400 ml-1 mr-1">of</span>
                                                    <span className="size-8 flex justify-center items-center text-gray-400">
                                                        {String(Math.ceil(analysisGames.length / analysisItemsPerPage)).padStart(2, '0')}
                                                    </span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    isDisabled={analysisPage >= Math.ceil(analysisGames.length / analysisItemsPerPage)}
                                                    onPress={() => setAnalysisPage(prev => Math.min(Math.ceil(analysisGames.length / analysisItemsPerPage), prev + 1))}
                                                    className="p-2 text-white size-10 rounded-r-lg"
                                                    isIconOnly
                                                >
                                                    <FaArrowRight />
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {isLoadingAnalysis && (
                                    <div className="flex justify-center items-center py-8">
                                        <Spinner size="lg" />
                                    </div>
                                )}
                            </div>
                        </Tab>
                    </Tabs>
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}
