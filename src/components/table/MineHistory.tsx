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
    Divider
} from '@heroui/react';
import { gameApi } from '@/lib/api';
import { useWebSocket } from '@/contexts/socketContext';
// Simple time formatting function since date-fns might not be available
const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
};
import { FaSearch, FaFilter, FaUser, FaGamepad, FaTrophy, FaTimes } from 'react-icons/fa';

interface MineGame {
    id: string;
    gameId:string;
    player: {
        id: string;
        username: string;
        avatar?: string;
    };
    token?: {
        symbol: string;
        name: string;
    };
    time: string;
    wager: number;
    multiplier: number;
    payout: number;
    status: 'playing' | 'win' | 'lose';
    gridSize: number;
    numMines: number;
    revealedTiles: number;
    completedAt?: string;
}

interface MineHistoryData {
    games: MineGame[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

interface MineStats {
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
}

const MineHistory: React.FC = () => {
    const [data, setData] = useState<MineHistoryData | null>(null);
    const [stats, setStats] = useState<MineStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    // Fetch mine history
    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await gameApi.mine.getHistory({
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
                setError(response.error || 'Failed to fetch mine history');
            }
        } catch (err) {
            setError('Failed to fetch mine history');
            console.error('Error fetching mine history:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, gameType, sortBy, sortOrder, itemsPerPage]);

    // Fetch mine stats
    const fetchStats = async () => {
        try {
            const response = await gameApi.mine.getStats();

            if (response.success && response.data) {
                console.log('fetch stats', response.data)
                setStats(response.data);
            }
        } catch (err) {
            console.error('Error fetching mine stats:', err);
        }
    };

    // // Load data on component mount and when filters change
    // useEffect(() => {
    //     fetchHistory();
    // }, [fetchHistory]);

    useEffect(() => {
        fetchStats();
    }, []);

    // Handle search and filter changes - reset to page 1
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, gameType, sortBy, sortOrder]);

    // Handle data fetching - single effect for all changes
    useEffect(() => {
        fetchHistory();
    }, [currentPage, searchTerm, gameType, sortBy, sortOrder, fetchHistory]);

    // Listen for real-time mine game completions
    useEffect(() => {
        if (isConnected) {
            const handleMineGameCompleted = (gameData: any) => {
                console.log('🎮 Mine game completed:', gameData);

                // Update or add the game to the list
                setData(prevData => {
                    if (!prevData) return prevData;

                    const newGame: MineGame = {
                        id: gameData.gameId,
                        gameId:gameData.gameId,
                        player: {
                            id: gameData.player.id,
                            username: gameData.player.username,
                            avatar: gameData.player.avatar || undefined
                        },
                        token: undefined, // Token not provided in the event
                        time: gameData.time,
                        wager: gameData.wager,
                        multiplier: gameData.multiplier,
                        payout: gameData.payout,
                        status: gameData.status,
                        gridSize: gameData.gridSize,
                        numMines: gameData.numMines,
                        revealedTiles: gameData.revealedTiles,
                        completedAt: gameData.completedAt
                    };

                    // Check if this game already exists in the list (for resumed games)
                    const existingGameIndex = prevData.games.findIndex(game => game.id === gameData.id);
                    
                    let updatedGames: MineGame[];
                    let updatedPagination = prevData.pagination;
                    
                    if (existingGameIndex !== -1) {
                        // Update existing game (resumed game completed)
                        updatedGames = [...prevData.games];
                        updatedGames[existingGameIndex] = newGame;
                        console.log('🔄 Updated existing game in history:', gameData.gameId);
                    } else {
                        // Check if this might be a resumed game that's not on current page
                        // For resumed games, we should add them to the top since they're now completed
                        updatedGames = [newGame, ...prevData.games];
                        
                        // Only increment total items if this is truly a new game
                        // For resumed games, the total count should remain the same
                        const isResumedGame = gameData.status && (gameData.status === 'win' || gameData.status === 'lose');
                        if (!isResumedGame) {
                            updatedPagination = {
                                ...prevData.pagination,
                                totalItems: prevData.pagination.totalItems + 1
                            };
                        }
                        console.log('➕ Added game to history:', gameData.gameId, isResumedGame ? '(resumed)' : '(new)');
                    }
                    
                    return {
                        ...prevData,
                        games: updatedGames,
                        pagination: updatedPagination
                    };
                });

                // Refresh stats to get updated statistics
                fetchStats();
            };

            on('mine_game_completed', handleMineGameCompleted);

            return () => {
                off('mine_game_completed', handleMineGameCompleted);
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'win':
                return 'success';
            case 'lose':
                return 'danger';
            case 'playing':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'win':
                return <FaTrophy className="text-green-500" />;
            case 'lose':
                return <FaTimes className="text-red-500" />;
            case 'playing':
                return <FaGamepad className="text-yellow-500" />;
            default:
                return null;
        }
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                </div>
            )}

            {/* Filters */}
            <Card className='bg-background-alt'>
                <CardHeader>
                    <h3 className="text-lg font-semibold">Mine Game History</h3>
                </CardHeader>
                <CardBody>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <Input
                            size='lg'
                            placeholder="Search by player or game ID..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            classNames={{
                                inputWrapper: "bg-background!"
                            }}
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
                            <SelectItem key="wager-desc">Highest Wager</SelectItem>
                            <SelectItem key="wager-asc">Lowest Wager</SelectItem>
                            <SelectItem key="multiplier-desc">Highest Multiplier</SelectItem>
                            <SelectItem key="multiplier-asc">Lowest Multiplier</SelectItem>
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
                            <Table aria-label="Mine game history table" classNames={{ base: "grid", wrapper: "bg-background", th: "bg-background-alt" }}>
                                <TableHeader>
                                    <TableColumn>ID</TableColumn>
                                    <TableColumn>PLAYER</TableColumn>
                                    <TableColumn>TIME</TableColumn>
                                    <TableColumn>WAGER</TableColumn>
                                    <TableColumn>MULTIPLIER</TableColumn>
                                    <TableColumn>PAYOUT</TableColumn>
                                    <TableColumn>STATUS</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent="No mine games found" items={data?.games || []}>
                                    {(game) => (
                                        <TableRow key={game.id}>
                                            <TableCell>
                                                <code className="text-xs px-2 py-1 rounded">
                                                    {game.gameId}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar
                                                        src={game.player.avatar}
                                                        name={game.player.username}
                                                        size="sm"
                                                        icon={<FaUser />}
                                                    />
                                                    <span className="font-medium">{game.player.username}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {formatTime(game.time)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {formatCurrency(game.wager)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-blue-600">
                                                    {formatMultiplier(game.multiplier)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className={`font-medium ${game.payout > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                                    {game.payout > 0 ? formatCurrency(game.payout) : '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    color={getStatusColor(game.status)}
                                                    variant="flat"
                                                    startContent={getStatusIcon(game.status)}
                                                >
                                                    {game.status.toUpperCase()}
                                                </Chip>
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
        </div >
    );
};

export default MineHistory;
