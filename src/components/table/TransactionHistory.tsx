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
import { FaSearch } from 'react-icons/fa';

// Simple time formatting function
const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
    }
};

// Format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    }).format(amount);
};

// Transaction types
interface Transaction {
    id: string;
    user: {
        id: string;
        username: string;
        avatar?: string;
    };
    amount: number;
    type: string;
    name: string;
    description: string;
    ref: string;
    gameType?: string;
    gameId?: string;
    status: string;
    hash?: string;
    time: string;
}

interface TransactionHistoryData {
    transactions: Transaction[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
    };
}

interface TransactionStats {
    totalTransactions: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalBets: number;
    totalWins: number;
    netDeposits: number;
    netWinnings: number;
    totalProfit: number;
    avgTransactionAmount: number;
    maxTransactionAmount: number;
}

const TransactionHistory: React.FC = () => {
    const [data, setData] = useState<TransactionHistoryData | null>(null);
    const [stats, setStats] = useState<TransactionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters and pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [searchInput, setSearchInput] = useState(''); // Input field value
    const [searchTerm, setSearchTerm] = useState(''); // Actual search term used in queries
    const [transactionType, setTransactionType] = useState<'all' | 'my'>('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const itemsPerPage = 10;

    // Fetch transaction history
    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await gameApi.transaction.getHistory({
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm,
                transactionType,
                sortBy,
                sortOrder
            });

            if (response.success && response.data) {
                setData(response.data.data);
            } else {
                setError(response.error || 'Failed to fetch transaction history');
            }
        } catch (error) {
            console.error('Error fetching transaction history:', error);
            setError('Failed to fetch transaction history');
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, transactionType, sortBy, sortOrder]);

    // Fetch transaction statistics
    const fetchStats = useCallback(async () => {
        try {
            const response = await gameApi.transaction.getStats();
            if (response.success && response.data) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching transaction stats:', error);
        }
    }, []);

    // Load data on component mount and when dependencies change
    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Handle search input changes
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setSearchTerm(searchInput);
        }
    };

    const handleSearchSubmit = () => {
        setSearchTerm(searchInput);
    };

    // Handle sort changes
    const handleSortChange = (value: string) => {
        const [field, order] = value.split('-');
        setSortBy(field);
        setSortOrder(order as 'asc' | 'desc');
    };

    // Handle filter changes
    const handleFilterChange = (value: string) => {
        setTransactionType(value as 'all' | 'my');
    };

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, transactionType, sortBy, sortOrder]);

    // Load data when page changes
    useEffect(() => {
        if (currentPage > 1) {
            fetchHistory();
        }
    }, [currentPage, fetchHistory]);

    const getTransactionTypeColor = (type: string) => {
        switch (type) {
            case 'deposit':
                return 'success';
            case 'withdrawal':
                return 'warning';
            case 'bet':
                return 'primary';
            case 'win':
                return 'success';
            case 'loss':
                return 'danger';
            default:
                return 'default';
        }
    };

    const getTransactionTypeIcon = (type: string) => {
        switch (type) {
            case 'deposit':
                return '💰';
            case 'withdrawal':
                return '💸';
            case 'bet':
                return '🎯';
            case 'win':
                return '🏆';
            case 'loss':
                return '💥';
            default:
                return '📄';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'failed':
                return 'danger';
            default:
                return 'default';
        }
    };

    return (
        <div className="w-full">
            <Card className="bg-background-alt border border-gray-700/50">
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-2xl font-bold text-white">Transaction History</h2>
                        <p className="text-gray-400">View all your transaction records</p>
                    </div>
                </CardHeader>

                <CardBody className="pt-0">
                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <Card className="bg-background border border-gray-700/30">
                                <CardBody className="p-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white">{stats.totalTransactions}</div>
                                        <div className="text-sm text-gray-400">Total Transactions</div>
                                    </div>
                                </CardBody>
                            </Card>
                            <Card className="bg-background border border-gray-700/30">
                                <CardBody className="p-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-500">{formatCurrency(stats.totalDeposits)}</div>
                                        <div className="text-sm text-gray-400">Total Deposits</div>
                                    </div>
                                </CardBody>
                            </Card>
                            <Card className="bg-background border border-gray-700/30">
                                <CardBody className="p-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-red-500">{formatCurrency(stats.totalWithdrawals)}</div>
                                        <div className="text-sm text-gray-400">Total Withdrawals</div>
                                    </div>
                                </CardBody>
                            </Card>
                            <Card className="bg-background border border-gray-700/30">
                                <CardBody className="p-4">
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {formatCurrency(stats.totalProfit)}
                                        </div>
                                        <div className="text-sm text-gray-400">Net Profit</div>
                                    </div>
                                </CardBody>
                            </Card>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <Input
                            placeholder="Search transactions..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            className="flex-1"
                            classNames={{
                                inputWrapper:"bg-background"
                            }}
                            size="lg"
                            endContent={
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onPress={handleSearchSubmit}
                                    className="min-w-0 px-2 bg-transparent"
                                >
                                    <FaSearch />
                                </Button>
                            }
                        />

                        <Select
                            label="Filter"
                            placeholder="Transaction Type"
                            selectedKeys={[transactionType]}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="w-full md:w-48"
                            size="sm"
                            classNames={{
                                label: "hidden",
                                innerWrapper: "p-0!",
                                trigger:"bg-background"
                            }}
                        >
                            <SelectItem key="all">All Transactions</SelectItem>
                            <SelectItem key="my">My Transactions</SelectItem>
                        </Select>

                        <Select
                            label="sort"
                            placeholder="Sort By"
                            selectedKeys={[`${sortBy}-${sortOrder}`]}
                            onChange={(e) => handleSortChange(e.target.value)}
                            className="w-full md:w-48"
                            size="sm"
                            classNames={{
                                label: "hidden",
                                innerWrapper: "p-0!",
                                trigger:"bg-background"
                            }}
                        >
                            <SelectItem key="createdAt-desc">Latest First</SelectItem>
                            <SelectItem key="createdAt-asc">Oldest First</SelectItem>
                            <SelectItem key="amount-desc">Highest Amount</SelectItem>
                            <SelectItem key="amount-asc">Lowest Amount</SelectItem>
                            <SelectItem key="type-desc">Type A-Z</SelectItem>
                            <SelectItem key="type-asc">Type Z-A</SelectItem>
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
                            <Table aria-label="Transaction history table" classNames={{ base: "grid", wrapper: "bg-background", th: "bg-background-alt" }}>
                                <TableHeader>
                                    <TableColumn>ID</TableColumn>
                                    <TableColumn>USER</TableColumn>
                                    <TableColumn>TIME</TableColumn>
                                    <TableColumn>AMOUNT</TableColumn>
                                    <TableColumn>TYPE</TableColumn>
                                    <TableColumn>DESCRIPTION</TableColumn>
                                    <TableColumn>STATUS</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent="No transactions found" items={data?.transactions || []}>
                                    {(transaction) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell>
                                                <code className="text-xs px-2 py-1 rounded">
                                                    {transaction.id.slice(-8)}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar
                                                        src={transaction.user.avatar || '/assets/images/avatar/default.png'}
                                                        size="sm"
                                                        className="w-6 h-6"
                                                    />
                                                    <span className="text-sm font-medium">
                                                        {transaction.user.username}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {formatTime(transaction.time)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className={`font-medium ${transaction.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    color={getTransactionTypeColor(transaction.type)}
                                                    variant="flat"
                                                    startContent={getTransactionTypeIcon(transaction.type)}
                                                >
                                                    {transaction.type.toUpperCase()}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-xs">
                                                    <div className="text-sm font-medium truncate">
                                                        {transaction.name}
                                                    </div>
                                                    <div className="text-xs text-gray-400 truncate">
                                                        {transaction.description}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    color={getStatusColor(transaction.status)}
                                                    variant="flat"
                                                >
                                                    {transaction.status.toUpperCase()}
                                                </Chip>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {data && data.pagination.totalPages > 1 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination
                                        total={data.pagination.totalPages}
                                        page={currentPage}
                                        onChange={setCurrentPage}
                                        showControls
                                        showShadow
                                        color="primary"
                                    />
                                </div>
                            )}

                            {/* Results info */}
                            {data && (
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
        </div>
    );
};

export default TransactionHistory;
