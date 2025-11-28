'use client'
import React, { useState, useEffect } from "react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { DatePicker, SelectItem, Select, Spinner, Pagination, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import { parseDate, getLocalTimeZone, today } from "@internationalized/date";
import { gameApi } from "@/lib/api";
import { GameHistoryEntry, GameHistoryStats, GameHistoryFilters } from "@/types/gameHistory";
import { FaBomb, FaCoins, FaDice, FaRocket } from "react-icons/fa6";

const GAME_TYPES = [
  { label: "All Games", value: "all" },
  { label: "Mine", value: "mine" },
  { label: "Coinflip", value: "coinflip" },
  { label: "Crash", value: "crash" },
  { label: "Roulette", value: "roulette" }
];

const RESULT_TYPES = [
  { label: "All Results", value: "all" },
  { label: "Win", value: "win" },
  { label: "Loss", value: "loss" }
];

const GAME_ICONS = {
  mine: { bg: "bg-green-500/50", letter: "M" ,  icon: <FaBomb />},
  coinflip: { bg: "bg-orange-500/50", letter: "C", icon: <FaCoins /> },
  crash: { bg: "bg-blue-500/50", letter: "C", icon: <FaRocket /> },
  roulette: { bg: "bg-purple-500/50", letter: "R", icon: <FaDice /> }
};

export default function HistoryPage() {
  const [filterStart, setFilterStart] = useState<DateValue | null>(null);
  const [filterEnd, setFilterEnd] = useState<DateValue | null>(today(getLocalTimeZone()));
  const [selectedGameType, setSelectedGameType] = useState<string>("all");
  const [selectedResult, setSelectedResult] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [stats, setStats] = useState<GameHistoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchGameHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: GameHistoryFilters = {
        page: currentPage,
        limit: pageSize
      };

      if (selectedGameType !== "all") {
        filters.gameType = selectedGameType;
      }

      if (selectedResult !== "all") {
        filters.result = selectedResult;
      }

      if (filterStart) {
        filters.startDate = filterStart.toString();
      }

      if (filterEnd) {
        filters.endDate = filterEnd.toString();
      }

      const [historyResponse, statsResponse] = await Promise.all([
        gameApi.history.getGameHistory(filters),
        gameApi.history.getGameHistoryStats({
          gameType: selectedGameType !== "all" ? selectedGameType : undefined,
          startDate: filterStart?.toString(),
          endDate: filterEnd?.toString()
        })
      ]);

      if (historyResponse.success && historyResponse.data) {
        setHistory(historyResponse.data.data.transactions || []);
        setTotalPages(historyResponse.data.data.totalPages || 1);
      } else {
        setError(historyResponse.error || "Failed to fetch game history");
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data.data);
      }
    } catch (err) {
      setError("Failed to fetch game history");
      console.error("Error fetching game history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameHistory();
  }, [currentPage, selectedGameType, selectedResult, filterStart, filterEnd]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchGameHistory();
  };

  const handleClearFilters = () => {
    setFilterStart(null);
    setFilterEnd(today(getLocalTimeZone()));
    setSelectedGameType("all");
    setSelectedResult("all");
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatAmount = (amount: number) => {
    return amount.toFixed(3).replace(/\.?0+$/, '');
  };

  const getGameIcon = (gameType: string) => {
    return GAME_ICONS[gameType as keyof typeof GAME_ICONS] || { bg: "bg-gray-500", letter: "?" };
  };

  return (
    <div className="w-full">
      <Card className="bg-background-alt border border-gray-700/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-white">Game History</h1>
            <p className="text-gray-400">View your complete game history across all games</p>
          </div>
        </CardHeader>

        <CardBody className="pt-0">
          {/* Filter Options */}
          <div className="bg-background rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Filter Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <Select
              className="max-w-xs"
              items={GAME_TYPES}
              label="Game Type"
              labelPlacement="outside"
              placeholder="Select Game Type"
              selectedKeys={[selectedGameType]}
              onSelectionChange={(keys) => setSelectedGameType(Array.from(keys)[0] as string)}
              classNames={{
                trigger: "bg-background-alt"
              }}
            >
              {(item) => <SelectItem key={item.value}>{item.label}</SelectItem>}
            </Select>
          </div>
          <div>
            <Select
              className="max-w-xs"
              items={RESULT_TYPES}
              label="Result"
              labelPlacement="outside"
              placeholder="Select Result"
              selectedKeys={[selectedResult]}
              onSelectionChange={(keys) => setSelectedResult(Array.from(keys)[0] as string)}
              classNames={{
                trigger: "bg-background-alt"
              }}
            >
              {(item) => <SelectItem key={item.value}>{item.label}</SelectItem>}
            </Select>
          </div>
          <div>
            <DatePicker
              classNames={{
                inputWrapper: "bg-background-alt"
              }}
              className="max-w-[284px]"
              label="Date From"
              labelPlacement="outside"
              value={filterStart}
              onChange={setFilterStart}
            />
          </div>
          <div>
            <DatePicker
              classNames={{
                inputWrapper: "bg-background-alt"
              }}
              className="max-w-[284px]"
              labelPlacement="outside"
              label="Date To"
              value={filterEnd}
              onChange={setFilterEnd}
            />
          </div>
        </div>
        <div className="mt-4 flex space-x-3">
          <PrimaryButton onClick={handleApplyFilters} disabled={loading}>
            {loading ? "Loading..." : "Apply Filters"}
          </PrimaryButton>
          <PrimaryButton 
            className="border bg-transparent border-primary" 
            onClick={handleClearFilters}
            disabled={loading}
          >
            Clear Filters
          </PrimaryButton>
        </div>
      </div>

      {/* Game History Table */}
      <div className="bg-background-alt rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Game History</h2>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

              {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
          <Card className="bg-background border border-gray-700/30">
            <CardBody className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.totalGames}</div>
                <div className="text-sm text-gray-400">Total Games</div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-background border border-gray-700/30">
            <CardBody className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.winRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-400">Win Rate</div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-background border border-gray-700/30">
            <CardBody className="p-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.netProfit >= 0 ? '+' : ''}{formatAmount(stats.netProfit)}
                </div>
                <div className="text-sm text-gray-400">Net Profit</div>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-background border border-gray-700/30">
            <CardBody className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{formatAmount(stats.totalWagered)}</div>
                <div className="text-sm text-gray-400">Total Wagered</div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <Table aria-label="Game history table" classNames={{ base: "grid",wrapper:"bg-background",th:"bg-background-alt" }}>
            <TableHeader >
              <TableColumn>GAME</TableColumn>
              <TableColumn>DATE</TableColumn>
              <TableColumn>BET</TableColumn>
              <TableColumn>RESULT</TableColumn>
              <TableColumn>PROFIT/LOSS</TableColumn>
              <TableColumn>MULTIPLIER</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No game history found" items={history}>
              {(entry) => {
                const gameIcon = getGameIcon(entry.gameType);
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${gameIcon.bg} rounded-full flex items-center justify-center`}>
                          {gameIcon.icon}
                        </div>
                        <span className="text-white font-medium capitalize">{entry.gameName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-300">{formatDate(entry.date)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-white font-medium">{formatAmount(entry.betAmount)}</div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={entry.result === 'win' ? 'success' : entry.result === 'loss' ? 'danger' : 'warning'}
                        variant="flat"
                      >
                        {entry.result.charAt(0).toUpperCase() + entry.result.slice(1)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${
                        entry.profitLoss > 0 ? 'text-green-400' : 
                        entry.profitLoss < 0 ? 'text-red-400' : 
                        'text-gray-400'
                      }`}>
                        {entry.profitLoss > 0 ? '+' : ''}{formatAmount(entry.profitLoss)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-300">
                        {entry.multiplier ? `${entry.multiplier.toFixed(2)}x` : '-'}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination
              total={totalPages}
              page={currentPage}
              onChange={setCurrentPage}
              color="primary"
              classNames={{
                item:"bg-background"
              }}
            />
          </div>
        )}
      </div>


        </CardBody>
      </Card>
    </div>
  );
}
