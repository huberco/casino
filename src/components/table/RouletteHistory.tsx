'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Button,
    Select,
    SelectItem,
    Pagination,
    Chip,
    Avatar,
    Spinner,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Image,
    Snippet,
} from '@heroui/react';
import { gameApi } from '@/lib/api';
import { useWebSocket } from '@/contexts/socketContext';
import { FaSearch, FaFilter, FaUser, FaTrophy, FaCrown } from 'react-icons/fa';

const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

interface RoulettePlayer {
    id: string;
    username: string;
    avatar?: string;
    betAmount: number;
    betType: 'heads' | 'tails' | 'crown';
    payout?: number;
}

interface RouletteGameItem {
    id: string;
    gameId: string;
    completedAt: string;
    totalBetAmount: number;
    playerCount: number;
    serverSeedHash: string;
    serverSeed?: string;
    publicSeed: string;
    winningType: 'heads' | 'tails' | 'crown';
    winningSlot?: number;
    winners?: RoulettePlayer[];
}

interface RouletteHistoryData {
    games: RouletteGameItem[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

interface RouletteStats {
    totalGames: number;
    totalWagered: number;
    totalWon: number;
    gamesWithCrown: number;
    gamesBlack: number;
    gamesWhite: number;
}

const RouletteHistory: React.FC = () => {
    const [data, setData] = useState<RouletteHistoryData | null>(null);
    const [stats, setStats] = useState<RouletteStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { on, off, isConnected } = useWebSocket();

    const [currentPage, setCurrentPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [gameType, setGameType] = useState<'all' | 'my'>('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showGameDetailModal, setShowGameDetailModal] = useState(false);
    const [selectedGame, setSelectedGame] = useState<RouletteGameItem | null>(null);

    const itemsPerPage = 10;

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await gameApi.roulette.getHistory({
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm || undefined,
                gameType,
                sortBy,
                sortOrder
            });

            if (response.success && response.data) {
                setData(response.data);
            } else {
                setError(response.error || 'Failed to fetch roulette history');
            }
        } catch (err) {
            setError('Failed to fetch roulette history');
            console.error('Error fetching roulette history:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, gameType, sortBy, sortOrder, itemsPerPage]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await gameApi.roulette.getStats();
            if (response.success && response.data) {
                setStats(response.data);
            }
        } catch (err) {
            console.error('Error fetching roulette stats:', err);
        }
    }, []);

    const copySeedToClipboard = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
        }
    };

    // Initial data load - only run once on mount
    useEffect(() => {
        fetchStats();
        fetchHistory();
    }, []); // Empty dependency array - only run once

    // Handle search and filter changes - reset to page 1
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, gameType, sortBy, sortOrder]);

    // Handle data fetching for user-initiated changes (search, filter, sort, pagination)
    useEffect(() => {
        // Skip initial load to avoid duplicate calls
        if (currentPage === 1 && !searchTerm && gameType === 'all' && sortBy === 'createdAt' && sortOrder === 'desc') {
            return; // Initial load already handled above
        }
        fetchHistory();
    }, [currentPage, searchTerm, gameType, sortBy, sortOrder]);

    useEffect(() => {
        if (!isConnected) return;

        const handleSpinStart = (_data: any) => {
            // Simple refresh on new round - only fetch stats to avoid excessive history requests
            fetchStats();
        };

        const handleGameCompleted = (gameData: any) => {
            console.log('🎰 Roulette game completed (socket):', gameData);
            // Add the new game to the history
            setData(prevData => {
                if (!prevData) return prevData;

                const newGame: RouletteGameItem = {
                    id: gameData.gameId,
                    gameId: gameData.gameId,
                    winningType: gameData.winningType,
                    serverSeedHash: gameData.serverSeedHash,
                    serverSeed: gameData.serverSeed,
                    publicSeed: gameData.publicSeed,
                    completedAt: gameData.completedAt || new Date().toISOString(),
                    totalBetAmount: gameData.totalBetAmount,
                    playerCount: gameData.playerCount,
                    winners: gameData.winners || []
                };

                // If we're on page 1, add the new game to the top
                if (currentPage === 1) {
                    const updatedGames = [newGame, ...prevData.games].slice(0, itemsPerPage);
                    return {
                        ...prevData,
                        games: updatedGames,
                        pagination: {
                            ...prevData.pagination,
                            totalItems: prevData.pagination.totalItems + 1
                        }
                    };
                } else {
                    // If we're on other pages, just update the total count
                    // The user will see the new game when they go back to page 1
                    return {
                        ...prevData,
                        pagination: {
                            ...prevData.pagination,
                            totalItems: prevData.pagination.totalItems + 1
                        }
                    };
                }
            });
            // Only refresh stats, not history (history is updated via state)
            fetchStats();
        };

        on('roulette_spin_start', handleSpinStart);
        on('roulette_game_completed', handleGameCompleted);

        return () => {
            off('roulette_spin_start', handleSpinStart);
            off('roulette_game_completed', handleGameCompleted);
        };
    }, [isConnected, on, off, fetchStats, currentPage, itemsPerPage]);

    const handlePageChange = (page: number) => setCurrentPage(page);
    const handleGameTypeChange = (value: string) => { setGameType(value as 'all' | 'my'); setCurrentPage(1); };
    const handleSortChange = (value: string) => { const [field, order] = value.split('-'); setSortBy(field); setSortOrder(order as 'asc' | 'desc'); setCurrentPage(1); };
    const handleSearchKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') setSearchTerm(searchInput); };
    const handleSearchSubmit = () => setSearchTerm(searchInput);

    const handleViewGameDetail = (game: RouletteGameItem) => {
        setSelectedGame(game);
        setShowGameDetailModal(true);
    };

    const handleCloseGameDetailModal = () => {
        setShowGameDetailModal(false);
        setSelectedGame(null);
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(amount);

    const winningChip = (type: string) => {
        const label = type?.toUpperCase();
        const color = type === 'heads' ? 'default' : type === 'tails' ? 'primary' : 'warning';
        return <Chip color={color as any} variant="flat" startContent={type === 'crown' ? <FaCrown /> : undefined}>{label}</Chip>;
    };

    if (error) {
        return (
            <Card className="w-full">
                <CardBody className="text-center py-8">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button color="primary" onClick={fetchHistory}>Try Again</Button>
                </CardBody>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className='shadow-sm bg-linear-0 from-background-alt to-background shadow-background'>
                        <CardBody className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{stats.totalGames}</div>
                            <div className="text-sm text-gray-600">Total Games</div>
                        </CardBody>
                    </Card>
                    <Card className='shadow-sm bg-linear-0 from-background-alt to-background shadow-background'>
                        <CardBody className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalWagered)}</div>
                            <div className="text-sm text-gray-600">Total Wagered</div>
                        </CardBody>
                    </Card>
                    <Card className='shadow-sm bg-linear-0 from-background-alt to-background shadow-background'>
                        <CardBody className="text-center">
                            <div className="text-2xl font-bold text-gray-200">{stats.gamesBlack}</div>
                            <div className="text-sm text-gray-600">Black Wins</div>
                        </CardBody>
                    </Card>
                    <Card className='shadow-sm bg-linear-0 from-background-alt to-background shadow-background'>
                        <CardBody className="text-center">
                            <div className="text-2xl font-bold text-yellow-500">{stats.gamesWithCrown}</div>
                            <div className="text-sm text-gray-600">Crown Wins</div>
                        </CardBody>
                    </Card>
                </div>
            )}

            <Card className='bg-background-alt'>
                <CardHeader>
                    <h3 className="text-lg font-semibold">Roulette Game History</h3>
                </CardHeader>
                <CardBody>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <Input
                        size='lg'
                            placeholder="Search by player or game ID..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            endContent={<Button size="sm" variant="light" onPress={handleSearchSubmit} className="min-w-0 px-2"><FaSearch className="text-gray-400" /></Button>}
                            className="flex-1 rounded-lg"
                            classNames={{ inputWrapper: "rounded-lg bg-background!" }}
                        />

                        <Select label="game type" placeholder="Game Type" selectedKeys={[gameType]} onChange={(e) => handleGameTypeChange(e.target.value)} startContent={<FaFilter className="text-gray-400" />} className="w-full md:w-48" size='sm' classNames={{ label: "hidden", innerWrapper: "p-0!", trigger:"bg-background" }}>
                            <SelectItem key="all">All Games</SelectItem>
                            <SelectItem key="my">My Games</SelectItem>
                        </Select>

                        <Select label="sort" placeholder="Sort By" selectedKeys={[`${sortBy}-${sortOrder}`]} onChange={(e) => handleSortChange(e.target.value)} className="w-full md:w-48" size='sm' classNames={{ label: "hidden", innerWrapper: "p-0!", trigger:"bg-background" }}>
                            <SelectItem key="createdAt-desc">Latest First</SelectItem>
                            <SelectItem key="createdAt-asc">Oldest First</SelectItem>
                            <SelectItem key="totalBetAmount-desc">Highest Total Bet</SelectItem>    
                            <SelectItem key="totalBetAmount-asc">Lowest Total Bet</SelectItem>
                            <SelectItem key="playerCount-desc">Most Players</SelectItem>
                            <SelectItem key="playerCount-asc">Fewest Players</SelectItem>
                        </Select>
                    </div>

                    <Divider className="my-4" />

                    {loading ? (
                        <div className="flex justify-center py-8"><Spinner size="lg" /></div>
                    ) : (
                        <>
                            <Table aria-label="Roulette game history table" classNames={{ base: "grid", wrapper: "bg-background", th: "bg-background-alt" }}>
                                <TableHeader>
                                    <TableColumn>GAME</TableColumn>
                                    <TableColumn>SERVER SEED HASH</TableColumn>
                                    <TableColumn>TIME</TableColumn>
                                    <TableColumn>WIN</TableColumn>
                                    <TableColumn>TOTAL BET</TableColumn>
                                    <TableColumn>PLAYERS</TableColumn>
                                    <TableColumn>ACTIONS</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent="No roulette games found" items={data?.games || []}>
                                    {(game) => (
                                        <TableRow key={game.id}>
                                            <TableCell>
                                                <div className="font-medium text-blue-600">{(game.gameId || game.id)}</div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-xs">{game.serverSeedHash?.slice(0, 12)}...</code>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-s">{formatTime(game.completedAt || (new Date()).toISOString())}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Image src={`/assets/images/tokens/${game?.winningType === 'crown' ? "crown.png" : game?.winningType === 'heads' ? "heads.svg" : game?.winningType === 'tails' ? "tails.svg" : ""}`} alt={game?.winningType} width={20} height={20} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{formatCurrency(game.totalBetAmount)}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{game.playerCount}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    color="primary"
                                                    variant="flat"
                                                    onPress={() => handleViewGameDetail(game)}
                                                >
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            {data?.pagination && data.pagination.totalPages > 1 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination total={data.pagination.totalPages} page={currentPage} onChange={handlePageChange} showControls showShadow classNames={{ item:"bg-background", next:"bg-background", prev:"bg-background" }} />
                                </div>
                            )}

                            {data?.pagination && (
                                <div className="text-center text-sm text-gray-600 mt-4">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, data.pagination.totalItems)} of {data.pagination.totalItems} results
                                </div>
                            )}
                        </>
                    )}
                </CardBody>
            </Card>

            {/* Game Detail Modal */}
            <Modal
                isOpen={showGameDetailModal}
                onClose={handleCloseGameDetailModal}
                size="3xl"
                classNames={{
                    base: "bg-background border border-gray-700",
                    header: "border-b border-gray-700",
                    body: "py-6",
                    footer: "border-t border-gray-700"
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Game Details</h2>
                            <div className="text-sm text-gray-400">
                                ID: {selectedGame ? (selectedGame.gameId || selectedGame.id) : ''}
                            </div>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        {selectedGame && (
                            <div className="space-y-6">
                                {/* Game Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-800/50 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Game Result</h3>
                                        <div className="flex items-center space-x-2">
                                            <Image src={`/assets/images/tokens/${selectedGame.winningType === 'crown' ? "crown.png" : selectedGame.winningType === 'heads' ? "heads.svg" : selectedGame.winningType === 'tails' ? "tails.svg" : ""}`} alt={selectedGame.winningType} width={40} height={40} />
                                            
                                            <span className="text-lg font-bold text-white">
                                                {selectedGame.winningType?.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/50 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Total Bet</h3>
                                        <div className="text-lg font-bold text-white">
                                            {formatCurrency(selectedGame.totalBetAmount)}
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/50 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Players</h3>
                                        <div className="text-lg font-bold text-white">
                                            {selectedGame.playerCount}
                                        </div>
                                    </div>
                                    <div className="bg-gray-800/50 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Time</h3>
                                        <div className="text-sm text-white">
                                            {formatTime(selectedGame.completedAt)}
                                        </div>
                                    </div>
                                </div>

                                {/* Server Seeds */}
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-white">Provably Fair</h3>
                                    <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                                        <div className='flex flex-col gap-4 items-start'>
                                            <label className="text-sm text-gray-400">Server Seed Hash</label>
                                            <Snippet hideSymbol onCopy={(value) => copySeedToClipboard(selectedGame.serverSeedHash)} ><span>{selectedGame.serverSeedHash.slice(0, 24)}...</span></Snippet>
                                        </div>
                                        {selectedGame.serverSeed && (
                                            <div className='flex flex-col gap-4 items-start'>
                                                <label className="text-sm text-gray-400">Server Seed</label>
                                                <Snippet hideSymbol onCopy={(value) => copySeedToClipboard(selectedGame.serverSeed || '')} ><span>{selectedGame.serverSeed?.slice(0, 24)}...</span></Snippet>
                                            </div>
                                        )}
                                        <div className='flex flex-col gap-4 items-start'>
                                            <label className="text-sm text-gray-400">Public Seed</label>
                                            <Snippet hideSymbol onCopy={(value) => copySeedToClipboard(selectedGame.publicSeed)} ><span>{selectedGame.publicSeed.slice(0, 24)}...</span></Snippet>
                                        </div>
                                    </div>
                                </div>

                                {/* Winners */}
                                {selectedGame.winners && selectedGame.winners.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-white">
                                            🏆 Winners ({selectedGame.winners.length})
                                        </h3>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {selectedGame.winners.map((winner: any, index: number) => (
                                                <div key={index} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            {winner.avatar ? (
                                                                <img
                                                                    src={winner.avatar}
                                                                    alt={winner.username}
                                                                    className="w-8 h-8 rounded-full"
                                                                />
                                                            ) : (
                                                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                                                    <FaUser className="text-white text-sm" />
                                                                </div>
                                                            )}
                                                            <span className="text-white font-medium">{winner.username}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-green-400 font-bold">
                                                            +{formatCurrency(winner.payout)}
                                                        </div>
                                                        <div className="text-gray-400 text-sm">
                                                            Bet: {formatCurrency(winner.betAmount)} ({winner.betType})
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </ModalBody>
                    <ModalFooter className="justify-end">
                        <Button
                            color="primary"
                            onPress={handleCloseGameDetailModal}
                            className="px-8 py-2 rounded-full text-background font-semibold"
                        >
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};

export default RouletteHistory;


