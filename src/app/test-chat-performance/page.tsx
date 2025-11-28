'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardBody, CardHeader, Button, Input, Chip, Progress } from '@heroui/react';
import { MdPlayArrow, MdPause, MdStop, MdFlashOn, MdAccessTime, MdCheckCircle, MdCancel } from 'react-icons/md';

interface TestResult {
  method: 'immediate' | 'blocking';
  responseTime: number;
  timestamp: Date;
  success: boolean;
  message: string;
}

const ChatPerformanceTestPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [queueStats, setQueueStats] = useState<any>(null);
  const [autoTest, setAutoTest] = useState(false);
  const [testCount, setTestCount] = useState(0);
  const [maxTests] = useState(20);

  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Initialize socket connection
    const initializeSocket = () => {
      const newSocket = (window as any).io('ws://localhost:3001', {
        transports: ['websocket']
      });

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket');
        setIsConnected(true);
        setSocket(newSocket);
        socketRef.current = newSocket;

        // Join chat room
        newSocket.emit('join_room', { room: 'chat' });
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
        setIsConnected(false);
      });

      newSocket.on('chat_response_time', (data: any) => {
        const result: TestResult = {
          method: data.method,
          responseTime: data.responseTime,
          timestamp: new Date(),
          success: true,
          message: currentMessage
        };
        
        setTestResults(prev => [result, ...prev.slice(0, 99)]); // Keep last 100 results
        setTestCount(prev => prev + 1);
      });

      newSocket.on('queue_stats', (stats: any) => {
        setQueueStats(stats);
      });

      newSocket.on('chat_error', (error: any) => {
        console.error('Chat error:', error);
        const result: TestResult = {
          method: 'immediate',
          responseTime: 0,
          timestamp: new Date(),
          success: false,
          message: currentMessage
        };
        setTestResults(prev => [result, ...prev.slice(0, 99)]);
      });
    };

    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (autoTest && isRunning && testCount < maxTests) {
      const interval = setInterval(() => {
        if (socketRef.current && isConnected) {
          const message = `Auto test message ${testCount + 1}`;
          setCurrentMessage(message);
          socketRef.current.emit('chat', { message });
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [autoTest, isRunning, testCount, maxTests, isConnected]);

  const sendImmediateMessage = () => {
    if (socketRef.current && isConnected && currentMessage.trim()) {
      socketRef.current.emit('chat', { message: currentMessage });
    }
  };

  const sendBlockingMessage = () => {
    if (socketRef.current && isConnected && currentMessage.trim()) {
      socketRef.current.emit('chat_blocking', { message: currentMessage });
    }
  };

  const startAutoTest = () => {
    setIsRunning(true);
    setAutoTest(true);
    setTestCount(0);
    setTestResults([]);
  };

  const stopAutoTest = () => {
    setIsRunning(false);
    setAutoTest(false);
  };

  const clearResults = () => {
    setTestResults([]);
    setTestCount(0);
  };

  const getStats = () => {
    const immediateResults = testResults.filter(r => r.method === 'immediate' && r.success);
    const blockingResults = testResults.filter(r => r.method === 'blocking' && r.success);

    const immediateAvg = immediateResults.length > 0 
      ? immediateResults.reduce((sum, r) => sum + r.responseTime, 0) / immediateResults.length 
      : 0;
    
    const blockingAvg = blockingResults.length > 0 
      ? blockingResults.reduce((sum, r) => sum + r.responseTime, 0) / blockingResults.length 
      : 0;

    const improvement = blockingAvg > 0 ? ((blockingAvg - immediateAvg) / blockingAvg) * 100 : 0;

    return {
      immediate: {
        count: immediateResults.length,
        average: immediateAvg,
        min: immediateResults.length > 0 ? Math.min(...immediateResults.map(r => r.responseTime)) : 0,
        max: immediateResults.length > 0 ? Math.max(...immediateResults.map(r => r.responseTime)) : 0
      },
      blocking: {
        count: blockingResults.length,
        average: blockingAvg,
        min: blockingResults.length > 0 ? Math.min(...blockingResults.map(r => r.responseTime)) : 0,
        max: blockingResults.length > 0 ? Math.max(...blockingResults.map(r => r.responseTime)) : 0
      },
      improvement
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Chat Performance Test</h1>
          <p className="text-gray-400">Compare immediate vs blocking response times</p>
        </div>

        {/* Connection Status */}
        <Card className="bg-gray-800 border-gray-700">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-white">
                  WebSocket: {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {queueStats && (
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Queue: {queueStats.queuedMessages}</span>
                  <span>Failed: {queueStats.failedMessages}</span>
                  <span>Processing: {queueStats.isProcessing ? 'Yes' : 'No'}</span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Test Controls */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Test Controls</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Enter test message..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                className="flex-1"
                variant="bordered"
              />
              <Button
                color="success"
                onClick={sendImmediateMessage}
                startContent={<MdFlashOn className="w-4 h-4" />}
                isDisabled={!isConnected || !currentMessage.trim()}
              >
                Immediate
              </Button>
              <Button
                color="warning"
                onClick={sendBlockingMessage}
                startContent={<MdAccessTime className="w-4 h-4" />}
                isDisabled={!isConnected || !currentMessage.trim()}
              >
                Blocking
              </Button>
            </div>

            <div className="flex gap-4">
              <Button
                color="primary"
                onClick={startAutoTest}
                startContent={<MdPlayArrow className="w-4 h-4" />}
                isDisabled={isRunning || !isConnected}
              >
                Start Auto Test
              </Button>
              <Button
                color="danger"
                onClick={stopAutoTest}
                startContent={<MdPause className="w-4 h-4" />}
                isDisabled={!isRunning}
              >
                Stop Test
              </Button>
              <Button
                color="secondary"
                onClick={clearResults}
                startContent={<MdStop className="w-4 h-4" />}
              >
                Clear Results
              </Button>
            </div>

            {isRunning && (
              <div className="flex items-center gap-4">
                <Progress
                  value={(testCount / maxTests) * 100}
                  className="flex-1"
                  color="primary"
                />
                <span className="text-white text-sm">
                  {testCount} / {maxTests}
                </span>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Immediate Response Stats */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MdFlashOn className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold text-white">Immediate Response</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Count</p>
                  <p className="text-white text-xl font-bold">{stats.immediate.count}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Average</p>
                  <p className="text-white text-xl font-bold">{stats.immediate.average.toFixed(2)}ms</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Min</p>
                  <p className="text-white text-xl font-bold">{stats.immediate.min.toFixed(2)}ms</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Max</p>
                  <p className="text-white text-xl font-bold">{stats.immediate.max.toFixed(2)}ms</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Blocking Response Stats */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MdAccessTime className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-white">Blocking Response</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Count</p>
                  <p className="text-white text-xl font-bold">{stats.blocking.count}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Average</p>
                  <p className="text-white text-xl font-bold">{stats.blocking.average.toFixed(2)}ms</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Min</p>
                  <p className="text-white text-xl font-bold">{stats.blocking.min.toFixed(2)}ms</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Max</p>
                  <p className="text-white text-xl font-bold">{stats.blocking.max.toFixed(2)}ms</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Performance Improvement */}
        {stats.improvement > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Performance Improvement</h3>
            </CardHeader>
            <CardBody>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-500">{stats.improvement.toFixed(1)}%</p>
                <p className="text-gray-400">Faster Response Time</p>
                <p className="text-sm text-gray-500 mt-2">
                  Time saved: {(stats.blocking.average - stats.immediate.average).toFixed(2)}ms per message
                </p>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Test Results */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Test Results</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <MdCheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <MdCancel className="w-4 h-4 text-red-500" />
                    )}
                    <Chip
                      color={result.method === 'immediate' ? 'success' : 'warning'}
                      variant="flat"
                      size="sm"
                    >
                      {result.method}
                    </Chip>
                    <span className="text-white text-sm">{result.message}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-mono">
                      {result.responseTime.toFixed(2)}ms
                    </p>
                    <p className="text-gray-400 text-xs">
                      {result.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {testResults.length === 0 && (
                <p className="text-gray-400 text-center py-8">No test results yet</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ChatPerformanceTestPage;
