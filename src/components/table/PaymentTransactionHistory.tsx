'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
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
import { FaFilter, FaUser, FaCopy, FaCheck, FaArrowUp, FaArrowDown } from 'react-icons/fa';

// Simple time formatting function
const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

// Format amount with proper decimals
const formatAmount = (amount: string | number, decimals: number = 6) => {
    return parseFloat(amount.toString()).toFixed(decimals);
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

interface PaymentTransaction {
    _id: string;
    user: string;
    openId: string;
    type: 'deposit' | 'withdrawal';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    chainId: string;
    tokenId: string;
    amount: string;
    amountUsd?: string;
    fromAddress?: string;
    toAddress?: string;
    txHash?: string;
    blockNumber?: string;
    confirmations?: number;
    createdAt: string;
    completedAt?: string;
    failedAt?: string;
    metadata?: {
        source?: string;
        timestamp?: string;
        fee?: string;
        tokenAddress?: string;
        safeCode?: string;
    };
}

interface PaymentTransactionHistoryData {
    transactions: PaymentTransaction[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

interface PaymentTransactionStats {
    totalTransactions: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalDepositAmount: number;
    totalWithdrawalAmount: number;
    pendingTransactions: number;
    completedTransactions: number;
    failedTransactions: number;
    netAmount: number;
    avgTransactionAmount: number;
    maxTransactionAmount: number;
}

interface PaymentTransactionHistoryProps {
    className?: string;
    showStats?: boolean;
    showFilters?: boolean;
    limit?: number;
    onTransactionUpdate?: () => void;
}

const PaymentTransactionHistory: React.FC<PaymentTransactionHistoryProps> = ({
    className = '',
    showStats = true,
    showFilters = true,
    limit = 20,
    onTransactionUpdate
}) => {
    const [data, setData] = useState<PaymentTransactionHistoryData | null>(null);
    const [stats, setStats] = useState<PaymentTransactionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    // WebSocket for real-time updates
    const { on, off, isConnected } = useWebSocket();

    // Filters and pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [transactionType, setTransactionType] = useState<'all' | 'deposit' | 'withdrawal'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');

    const itemsPerPage = limit;

    // Fetch payment transaction history
    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await gameApi.payment.getTransactions({
                limit: itemsPerPage,
                offset: (currentPage - 1) * itemsPerPage,
                type: transactionType !== 'all' ? transactionType : undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined
            });

            if (response.success && response.data) {
                setData({
                    transactions: response.data.transactions || [],
                    pagination: {
                        currentPage: currentPage,
                        totalPages: Math.ceil((response.data.transactions?.length || 0) / itemsPerPage),
                        totalItems: response.data.transactions?.length || 0,
                        itemsPerPage: itemsPerPage,
                        hasNextPage: currentPage < Math.ceil((response.data.transactions?.length || 0) / itemsPerPage),
                        hasPrevPage: currentPage > 1
                    }
                });
                // Call the update callback if provided
                if (onTransactionUpdate) {
                    onTransactionUpdate();
                }
            } else {
                setError(response.error || 'Failed to fetch payment transaction history');
            }
        } catch (err) {
            setError('Failed to fetch payment transaction history');
            console.error('Error fetching payment transaction history:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, transactionType, statusFilter, itemsPerPage]);

    // Fetch payment transaction stats
    const fetchStats = useCallback(async () => {
        try {
            const response = await gameApi.payment.getTransactionStats();
            if (response.success && response.data) {
                setStats(response.data);
            }
        } catch (err) {
            console.error('Error fetching payment transaction stats:', err);
        }
    }, []);

    // Load data on component mount and when filters change
    useEffect(() => {
        fetchHistory();
    }, [currentPage, transactionType, statusFilter, itemsPerPage]);

    useEffect(() => {
        if (showStats) {
            fetchStats();
        }
    }, [showStats]);

    // Listen for real-time balance updates (new transactions)
    useEffect(() => {
        if (isConnected) {
            const handleBalanceUpdate = (data: any) => {
                console.log('💰 Balance update received in PaymentTransactionHistory:', data);
                
                // Refresh the transaction list when a new transaction is processed
                if (data.reason === 'deposit_success' || data.reason === 'withdrawal_success' || data.reason === 'withdrawal_failed') {
                    fetchHistory();
                    if (showStats) {
                        fetchStats();
                    }
                }
            };

            on('user_balance_update', handleBalanceUpdate);

            return () => {
                off('user_balance_update', handleBalanceUpdate);
            };
        }
    }, [isConnected, on, off, fetchHistory, fetchStats, showStats]);

    // Handle filter changes - reset to page 1
    useEffect(() => {
        setCurrentPage(1);
    }, [transactionType, statusFilter]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleTransactionTypeChange = (value: string) => {
        setTransactionType(value as 'all' | 'deposit' | 'withdrawal');
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value as 'all' | 'pending' | 'completed' | 'failed');
        setCurrentPage(1);
    };


    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(id);
            setTimeout(() => setCopied(null), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'processing':
                return 'primary';
            case 'failed':
                return 'danger';
            case 'cancelled':
                return 'default';
            default:
                return 'default';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'deposit':
                return 'success';
            case 'withdrawal':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'deposit':
                return <FaArrowDown className="text-green-500" />;
            case 'withdrawal':
                return <FaArrowUp className="text-blue-500" />;
            default:
                return null;
        }
    };

    if (error) {
        return (
            <Card className={`w-full ${className}`}>
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
        <div className={`space-y-6 ${className}`}>

            {/* Filters */}
            {showFilters && (
                <Card className='bg-background'>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Payment Transaction History</h3>
                    </CardHeader>
                    <CardBody>
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <Select
                                label="transaction type"
                                placeholder="Transaction Type"
                                selectedKeys={[transactionType]}
                                onChange={(e) => handleTransactionTypeChange(e.target.value)}
                                startContent={<FaFilter className="text-gray-400" />}
                                className="w-full md:w-48"
                                size='sm'
                                classNames={{
                                    label: "hidden",
                                    innerWrapper: "p-0!",
                                    trigger:"bg-background-alt"
                                }}
                            >
                                <SelectItem key="all">All Types</SelectItem>
                                <SelectItem key="deposit">Deposits</SelectItem>
                                <SelectItem key="withdrawal">Withdrawals</SelectItem>
                            </Select>

                            <Select
                                label="status"
                                placeholder="Status"
                                selectedKeys={[statusFilter]}
                                onChange={(e) => handleStatusFilterChange(e.target.value)}
                                className="w-full md:w-48"
                                size='sm'
                                classNames={{
                                    label: "hidden",
                                    innerWrapper: "p-0!",
                                    trigger:"bg-background-alt!"
                                }}
                            >
                                <SelectItem key="all">All Status</SelectItem>
                                <SelectItem key="pending">Pending</SelectItem>
                                <SelectItem key="completed">Completed</SelectItem>
                                <SelectItem key="failed">Failed</SelectItem>
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
                                <Table aria-label="Payment transaction history table" classNames={{ base: "grid", wrapper: "bg-background", th: "bg-background-alt" }}>
                                    <TableHeader>
                                        <TableColumn>TYPE</TableColumn>
                                        <TableColumn>TIME</TableColumn>
                                        <TableColumn>AMOUNT</TableColumn>
                                        <TableColumn>NETWORK</TableColumn>
                                        <TableColumn>STATUS</TableColumn>
                                        <TableColumn>TRANSACTION HASH</TableColumn>
                                    </TableHeader>
                                    <TableBody emptyContent="No payment transactions found" items={data?.transactions || []}>
                                        {(transaction) => (
                                            <TableRow key={transaction._id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getTypeIcon(transaction.type)}
                                                        <Chip
                                                            color={getTypeColor(transaction.type)}
                                                            variant="flat"
                                                            size="sm"
                                                        >
                                                            {transaction.type.toUpperCase()}
                                                        </Chip>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <div>{formatTime(transaction.createdAt)}</div>
                                                        {transaction.completedAt && (
                                                            <div className="text-xs text-gray-500">
                                                                Completed: {formatTime(transaction.completedAt)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {formatAmount(transaction.amount, 6)} tokens
                                                    </div>
                                                    {transaction.amountUsd && (
                                                        <div className="text-xs text-gray-400">
                                                            ≈ {formatCurrency(parseFloat(transaction.amountUsd))}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        Chain {transaction.chainId}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        Token {transaction.tokenId}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        color={getStatusColor(transaction.status)}
                                                        variant="flat"
                                                        size="sm"
                                                    >
                                                        {transaction.status.toUpperCase()}
                                                    </Chip>
                                                </TableCell>
                                                <TableCell>
                                                    {transaction.txHash ? (
                                                        <div className="flex items-center gap-2">
                                                            <code className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300">
                                                                {transaction.txHash.slice(0, 8)}...{transaction.txHash.slice(-8)}
                                                            </code>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                isIconOnly
                                                                onPress={() => copyToClipboard(transaction.txHash!, `tx-${transaction._id}`)}
                                                                className="min-w-0 px-1"
                                                            >
                                                                {copied === `tx-${transaction._id}` ? (
                                                                    <FaCheck className="text-green-400" />
                                                                ) : (
                                                                    <FaCopy className="text-gray-400" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
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
            )}
        </div>
    );
};

export default PaymentTransactionHistory;
