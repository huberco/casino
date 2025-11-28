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
    useDisclosure,
    Snippet
} from '@heroui/react';
import { gameApi } from '@/lib/api';
import { useWebSocket } from '@/contexts/socketContext';

// Simple time formatting function (clamped to avoid negative times if server clock is ahead)
const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    let diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Clamp negative to 0 to avoid "-2s ago" due to clock skew or network delay
    if (diffInSeconds < 0) diffInSeconds = 0;

    if (diffInSeconds < 5) return 'just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

import { FaSearch, FaFilter, FaUser, FaGamepad, FaTrophy, FaTimes, FaCrown } from 'react-icons/fa';
import { FaCopy, FaEye } from 'react-icons/fa6';

interface CrashPlayer {
    id: string;
    username: string;
    avatar?: string;
    betAmount: number;
    cashoutMultiplier?: number;
    payout: number;
    status: 'won' | 'lost';
    joinedAt: string;
    cashedOutAt?: string;
}

interface CrashGame {
    id: string;
    roundId: string;
    round: number;
    time: string;
    crashPoint: number;
    totalBetAmount: number;
    totalPayout: number;
    playerCount: number;
    winnersCount: number;
    losersCount: number;
    serverSeed: string;
    serverSeedHash: string;
    publicSeed: string;
    completedAt: string;
    players: CrashPlayer[];
}

interface CrashHistoryData {
    games: CrashGame[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

interface CrashStats {
    totalGames: number;
    totalWagered: number;
    totalWon: number;
    gamesWon: number;
    gamesLost: number;
    winRate: number;
    profit: number;
    roi: number;
    avgMultiplier: number;
    maxMultiplier: number;
    avgWager: number;
    maxWager: number;
    avgCrashPoint: number;
    maxCrashPoint: number;
}

const CrashHistory: React.FC = () => {
    const [data, setData] = useState<CrashHistoryData | null>(null);
    const [stats, setStats] = useState<CrashStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state for player details
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedGame, setSelectedGame] = useState<CrashGame | null>(null);

    // WebSocket for real-time updates
    const { on, off, isConnected } = useWebSocket();

    // Filters and pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [searchInput, setSearchInput] = useState(''); // Input field value
    const [searchTerm, setSearchTerm] = useState(''); // Actual search term used in queries
    const [gameType, setGameType] = useState<'all' | 'my'>('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const itemsPerPage = 10;

    // Fetch crash history
    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await gameApi.crash.getHistory({
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
                setError(response.error || 'Failed to fetch crash history');
            }
        } catch (err) {
            setError('Failed to fetch crash history');
            console.error('Error fetching crash history:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, gameType, sortBy, sortOrder, itemsPerPage]);

    // Fetch crash stats
    const fetchStats = useCallback(async () => {
        try {
            const response = await gameApi.crash.getStats();

            if (response.success && response.data) {
                console.log('fetch crash stats', response.data)
                setStats(response.data);
            }
        } catch (err) {
            console.error('Error fetching crash stats:', err);
        }
    }, []);

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

    // Listen for real-time crash game completions
    useEffect(() => {
        if (isConnected) {
            const handleCrashGameEnded = (gameData: any) => {
                console.log('🚀 Crash game ended (socket):', {
                    roundId: gameData.roundId,
                    round: gameData.round,
                    crashPoint: gameData.crashPoint,
                    playerCount: gameData.players?.length,
                    hasServerSeed: !!gameData.serverSeed
                });

                // Add the new game to the history via socket data (no HTTP request)
                setData(prevData => {
                    if (!prevData) return prevData;

                    // Only add to first page to avoid pagination issues
                    if (currentPage !== 1) {
                        return prevData;
                    }

                    // Create new game record from socket data
                    const newGame: CrashGame = {
                        id: gameData.roundId,
                        roundId: gameData.roundId,
                        round: gameData.round || 0,
                        time: gameData.endedAt || new Date().toISOString(),
                        crashPoint: gameData.crashPoint,
                        totalBetAmount: gameData.totalBetAmount || 0,
                        totalPayout: gameData.totalPayout || 0,
                        playerCount: gameData.players?.length || 0,
                        winnersCount: gameData.players?.filter((p: any) => p.cashoutMultiplier).length || 0,
                        losersCount: gameData.players?.filter((p: any) => !p.cashoutMultiplier).length || 0,
                        serverSeed: gameData.serverSeed || '',
                        serverSeedHash: gameData.serverSeedHash || '',
                        publicSeed: gameData.publicSeed || '',
                        completedAt: gameData.endedAt || new Date().toISOString(),
                        players: gameData.players?.map((player: any) => ({
                            id: player.userId,
                            username: player.username,
                            avatar: player.avatar,
                            betAmount: player.betAmount,
                            cashoutMultiplier: player.cashoutMultiplier,
                            payout: player.payout || 0,
                            status: player.cashoutMultiplier ? 'won' : 'lost',
                            joinedAt: player.joinedAt,
                            cashedOutAt: player.cashedOutAt
                        })) || []
                    };

                    // Add new game to the beginning of the list
                    const updatedGames = [newGame, ...prevData.games];

                    // Keep only the page size to avoid growing indefinitely
                    const maxGames = itemsPerPage;
                    const trimmedGames = updatedGames.slice(0, maxGames);

                    console.log('✅ Added new game via socket (no HTTP request)', {
                        gameId: newGame.id,
                        round: newGame.round,
                        newTotal: trimmedGames.length
                    });

                    return {
                        ...prevData,
                        games: trimmedGames,
                        pagination: {
                            ...prevData.pagination,
                            totalItems: prevData.pagination.totalItems + 1
                        }
                    };
                });

                // Refresh stats to get updated statistics (lightweight request)
                fetchStats();
            };

            const handlePlayerCashedOut = (cashoutData: any) => {
                console.log('💰 Player cashed out:', cashoutData);

                // Update existing game if it exists in current view
                setData(prevData => {
                    if (!prevData) return prevData;

                    const existingGameIndex = prevData.games.findIndex(game => game.roundId === cashoutData.roundId);

                    if (existingGameIndex !== -1) {
                        const updatedGames = [...prevData.games];
                        const game = updatedGames[existingGameIndex];

                        // Update the specific player in the game's players array
                        const updatedPlayers = game.players.map(player => {
                            if (player.id === cashoutData.userId) {
                                return {
                                    ...player,
                                    cashoutMultiplier: cashoutData.multiplier,
                                    payout: cashoutData.payout,
                                    status: 'won' as const,
                                    cashedOutAt: new Date().toISOString()
                                };
                            }
                            return player;
                        });

                        // Update game totals
                        updatedGames[existingGameIndex] = {
                            ...game,
                            players: updatedPlayers,
                            totalPayout: game.totalPayout + cashoutData.payout,
                            winnersCount: game.winnersCount + 1,
                            losersCount: game.losersCount - 1
                        };

                        return {
                            ...prevData,
                            games: updatedGames
                        };
                    }

                    return prevData;
                });
            };

            on('crash_game_ended', handleCrashGameEnded);
            on('crash_player_cashed_out', handlePlayerCashedOut);

            return () => {
                off('crash_game_ended', handleCrashGameEnded);
                off('crash_player_cashed_out', handlePlayerCashedOut);
            };
        }
    }, [isConnected, on, off, fetchStats]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleGameTypeChange = (value: string) => {
        setGameType(value as 'all' | 'my');
        setCurrentPage(1);
    };

    const handleSortChange = (value: string) => {
        const [field, order] = value.split('-');
        setSortBy(field);
        setSortOrder(order as 'asc' | 'desc');
        setCurrentPage(1);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setSearchTerm(searchInput);
        }
    };

    const handleSearchSubmit = () => {
        setSearchTerm(searchInput);
    };

    const handleViewDetails = (game: CrashGame) => {
        setSelectedGame(game);
        onOpen();
    };


    const getCrashPointColor = (crashPoint: number) => {
        if (crashPoint < 2) return 'text-orange-500';
        if (crashPoint >= 2 && crashPoint < 10) return 'text-green-500';
        return 'text-yellow-500';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).format(amount);
    };

    const formatMultiplier = (multiplier: number) => {
        return `${multiplier.toFixed(2)}x`;
    };

    if (error) {
        return (
            <Card className="w-full">
                <CardBody className="text-center py-8">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button color="primary" onClick={fetchHistory}>
                        Try Again
                    </Button>
                </CardBody>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className='shadow-sm bg-linear-0 from-background-alt to-background shadow-background'>
                        <CardBody className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{stats.totalGames}</div>
                            <div className="text-sm text-gray-600">Total Games</div>
                        </CardBody>
                    </Card>
                    <Card className='shadow-sm bg-linear-0 from-background-alt to-background shadow-background'>
                        <CardBody className="text-center">
                            <div className="text-2xl font-bold text-green-600">{stats?.winRate?.toFixed(1)}%</div>
                            <div className="text-sm text-gray-600">Win Rate</div>
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
                            <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(stats.profit)}
                            </div>
                            <div className="text-sm text-gray-600">Profit/Loss</div>
                        </CardBody>
                    </Card>
                    <Card className='shadow-sm bg-linear-0 from-background-alt to-background shadow-background'>
                        <CardBody className="text-center">
                            <div className={`text-2xl font-bold ${getCrashPointColor(stats.avgCrashPoint)}`}>
                                {formatMultiplier(stats.avgCrashPoint)}
                            </div>
                            <div className="text-sm text-gray-600">Avg Crash Point</div>
                        </CardBody>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card className='bg-background-alt'>
                <CardHeader>
                    <h3 className="text-lg font-semibold">Crash Game History</h3>
                </CardHeader>
                <CardBody>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <Input
                            size='lg'
                            placeholder="Search by player or round ID..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            endContent={
                                <Button
                                    size="sm"
                                    variant="light"
                                    onPress={handleSearchSubmit}
                                    className="min-w-0 px-2"
                                >
                                    <FaSearch className="text-gray-400" />
                                </Button>
                            }
                            className="flex-1 rounded-lg"
                            classNames={{
                                inputWrapper: "bg-background! rounded-lg"
                            }}
                        />

                        <Select
                            label="game type"
                            placeholder="Game Type"
                            selectedKeys={[gameType]}
                            onChange={(e) => handleGameTypeChange(e.target.value)}
                            startContent={<FaFilter className="text-gray-400" />}
                            className="w-full md:w-48"
                            size='sm'
                            classNames={{
                                label: "hidden",
                                innerWrapper: "p-0!",
                                trigger:"bg-background"
                            }}
                        >
                            <SelectItem key="all">All Games</SelectItem>
                            <SelectItem key="my">My Games</SelectItem>
                        </Select>

                        <Select
                            label="sort"
                            placeholder="Sort By"
                            selectedKeys={[`${sortBy}-${sortOrder}`]}
                            onChange={(e) => handleSortChange(e.target.value)}
                            className="w-full md:w-48"
                            size='sm'
                            classNames={{
                                label: "hidden",
                                innerWrapper: "p-0!",
                                trigger:"bg-background"
                            }}
                        >
                            <SelectItem key="createdAt-desc">Latest First</SelectItem>
                            <SelectItem key="createdAt-asc">Oldest First</SelectItem>
                            <SelectItem key="round-desc">Highest Round</SelectItem>
                            <SelectItem key="round-asc">Lowest Round</SelectItem>
                            <SelectItem key="crashPoint-desc">Highest Crash Point</SelectItem>
                            <SelectItem key="crashPoint-asc">Lowest Crash Point</SelectItem>
                            <SelectItem key="totalBetAmount-desc">Highest Total Bet</SelectItem>
                            <SelectItem key="totalBetAmount-asc">Lowest Total Bet</SelectItem>
                            <SelectItem key="playerCount-desc">Most Players</SelectItem>
                            <SelectItem key="playerCount-asc">Fewest Players</SelectItem>
                        </Select>
                    </div>

                    <Divider className="my-4" />

                    {/* Table */}
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Spinner size="lg" />
                        </div>
                    ) : (
                        <>
                            <Table aria-label="Crash game history table" classNames={{ base: "grid", wrapper: "bg-background", th: "bg-background-alt" }}>
                                <TableHeader>
                                    <TableColumn>ROUND</TableColumn>
                                    <TableColumn>SERVER SEED HASH</TableColumn>
                                    <TableColumn>TIME</TableColumn>
                                    <TableColumn>CRASH POINT</TableColumn>
                                    <TableColumn>TOTAL BET</TableColumn>
                                    <TableColumn>PLAYERS</TableColumn>
                                    <TableColumn>DETAILS</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent="No crash games found" items={data?.games || []}>
                                    {(game) => (
                                        <TableRow key={game.id}>
                                            <TableCell>
                                                <div className="font-medium text-blue-600">
                                                    #{game.round}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    onClick={() => navigator.clipboard.writeText(game.serverSeedHash)}
                                                    className="text-xs font-mono bg-background"
                                                >
                                                    <p>{game.serverSeed.slice(0, 8)}...</p>
                                                    <FaCopy />
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {formatTime(game.time)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className={`font-bold flex items-center gap-1 ${getCrashPointColor(game.crashPoint)}`}>
                                                    {formatMultiplier(game.crashPoint)}
                                                    {game.crashPoint >= 10 && <FaCrown className="text-yellow-500" />}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {formatCurrency(game.totalBetAmount)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{game.playerCount}</span>
                                                    <div className="text-xs text-gray-500">
                                                        ({game.winnersCount}W/{game.losersCount}L)
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    onClick={() => handleViewDetails(game)}
                                                    className='bg-background'
                                                >
                                                    <FaEye />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {data?.pagination && data.pagination.totalPages > 1 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination
                                        total={data.pagination.totalPages}
                                        page={currentPage}
                                        onChange={handlePageChange}
                                        showControls
                                        showShadow
                                        classNames={{
                                            item:"bg-background",
                                            next:"bg-background",
                                            prev:"bg-background",
                                        }}
                                    />
                                </div>
                            )}

                            {/* Results info */}
                            {data?.pagination && (
                                <div className="text-center text-sm text-gray-600 mt-4">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                                    {Math.min(currentPage * itemsPerPage, data.pagination.totalItems)} of{' '}
                                    {data.pagination.totalItems} results
                                </div>
                            )}
                        </>
                    )}
                </CardBody>
            </Card>

            {/* Player Details Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="2xl">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span>Round #{selectedGame?.round} Details</span>
                            <Chip color="primary" variant="flat">
                                {formatMultiplier(selectedGame?.crashPoint || 0)}
                            </Chip>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div>Server Seed: 
                                <Snippet size='sm'
                                    symbol=''
                                    className="text-xs"
                                    classNames={{
                                        pre: "max-w-[50px] sm:max-w-[150px]! truncate",
                                    }}>
                                    {selectedGame?.serverSeed}
                                </Snippet>
                            </div>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Card>
                                    <CardBody className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {formatCurrency(selectedGame?.totalBetAmount || 0)}
                                        </div>
                                        <div className="text-sm text-gray-600">Total Bet Amount</div>
                                    </CardBody>
                                </Card>
                                <Card>
                                    <CardBody className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {formatCurrency(selectedGame?.totalPayout || 0)}
                                        </div>
                                        <div className="text-sm text-gray-600">Total Payout</div>
                                    </CardBody>
                                </Card>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold">Players ({selectedGame?.playerCount || 0})</h4>
                                <div className="max-h-64 overflow-y-auto">
                                    <Table aria-label="Players in this round" classNames={{ base: "grid", wrapper: "bg-background", th: "bg-background-alt" }}>
                                        <TableHeader>
                                            <TableColumn>PLAYER</TableColumn>
                                            <TableColumn>BET</TableColumn>
                                            <TableColumn>MULTIPLIER</TableColumn>
                                            <TableColumn>PAYOUT</TableColumn>
                                            <TableColumn>STATUS</TableColumn>
                                        </TableHeader>
                                        <TableBody emptyContent="No players in this round" items={selectedGame?.players || []}>
                                            {(player) => (
                                                <TableRow key={player.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar
                                                                src={player.avatar}
                                                                name={player.username}
                                                                size="sm"
                                                                className="shrink-0"
                                                                icon={<FaUser  />}
                                                            />
                                                            <span className="font-medium">{player.username}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">
                                                            {formatCurrency(player.betAmount)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-blue-600">
                                                            {player.cashoutMultiplier ? formatMultiplier(player.cashoutMultiplier) : '-'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className={`font-medium ${player.payout > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                            {player.payout > 0 ? formatCurrency(player.payout) : formatCurrency(0)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            color={player.status === 'won' ? 'success' : 'danger'}
                                                            variant="flat"
                                                            startContent={player.status === 'won' ? <FaTrophy /> : <FaTimes />}
                                                        >
                                                            {player.status.toUpperCase()}
                                                        </Chip>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onPress={onClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div >
    );
};

export default CrashHistory;
