'use client'
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, Button, Input, Skeleton } from '@heroui/react';
import { FaCheck, FaFaceSmile, FaMessage } from 'react-icons/fa6';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    useDisclosure,
} from "@heroui/react";
import { useWebSocket } from '@/contexts/socketContext';
import { useEffect, useState, useRef, useCallback } from 'react';
import { gameApi } from '@/lib/api';

interface ChatMessage {
    id: string;
    type: 'chat' | 'user_joined' | 'user_left' | 'error';
    message: string;
    user: {
        _id: string | null;
        displayName: string | null;
        username: string;
        avatar: string | null;
        level: number;
    };
    room: string;
    timestamp: string;
    isSystemMessage?: boolean;
    isHistory?: boolean;
}

export default function ChatView() {
    const { user } = useAuth()
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isConnected, registerListener, unregisterListener, emit } = useWebSocket()
    const [message, setMessage] = useState('')
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [error, setError] = useState<string | null>(null)
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [hasLoadedHistory, setHasLoadedHistory] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [chatMessages])

    useEffect(() => {
        if (isConnected) {
            // Handle chat messages
            const handleChatMessage = (data: ChatMessage) => {
                console.log("💬 Chat message received:", data)
                console.log("💬 Current chat messages count:", chatMessages.length)

                // Don't add duplicate messages (check if message already exists)
                setChatMessages(prev => {
                    const messageExists = prev.some(msg =>
                        msg.id === data.id ||
                        (msg.message === data.message && msg.user._id === data.user._id && msg.timestamp === data.timestamp)
                    );

                    if (messageExists) {
                        console.log("🔄 Duplicate message ignored:", data.id);
                        return prev;
                    }

                    console.log("✅ Adding new message to chat. New count:", prev.length + 1);
                    return [...prev, data];
                });
            }

            // Handle chat history
            const handleChatHistory = (data: any) => {
                console.log("📜 Chat history received:", data)
                if (data.messages && Array.isArray(data.messages)) {
                    setChatMessages(data.messages)
                    setHasLoadedHistory(true)
                    setIsLoadingHistory(false)
                    console.log("✅ Chat history loaded:", data.messages.length, "messages")
                }
            }

            // Handle chat errors
            const handleChatError = (data: any) => {
                console.log("❌ Chat error received:", data)
                setError(data.message)
                setIsLoadingHistory(false) // Reset loading state on error
                setTimeout(() => setError(null), 5000) // Clear error after 5 seconds
            }

            registerListener('chat', handleChatMessage, 'ChatView')
            registerListener('chat_history', handleChatHistory, 'ChatView')
            registerListener('chat_error', handleChatError, 'ChatView')

            // Use setTimeout to ensure listeners are fully registered before emitting
            console.log("🔄 hasLoadedHistory:", hasLoadedHistory, "isLoadingHistory:", isLoadingHistory)
            if (!hasLoadedHistory && !isLoadingHistory) {
                console.log("📜 Requesting chat history via WebSocket")
                setIsLoadingHistory(true);
                emit('get_chat_history', { limit: 50, room: 'default' })
            }
            return () => {
                unregisterListener('chat', handleChatMessage, 'ChatView')
                unregisterListener('chat_history', handleChatHistory, 'ChatView')
                unregisterListener('chat_error', handleChatError, 'ChatView')
            }
        }
    }, [isConnected, registerListener, unregisterListener, emit]) // Remove user.isAuthenticated and hasLoadedHistory from dependencies

    const handleSendMessage = (messageText: string) => {
        if (isConnected && user.isAuthenticated && messageText.trim()) {
            console.log("📤 Sending chat message:", messageText)
            emit('chat', { message: messageText })
            setMessage('') // Clear input after sending
        } else {
            console.log("❌ Cannot send message - isConnected:", isConnected, "isAuthenticated:", user.isAuthenticated, "messageText:", messageText)
        }
    }

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const renderMessage = (msg: ChatMessage, index: number) => {
        const isSystemMessage = msg.isSystemMessage || msg.type === 'user_joined' || msg.type === 'user_left'
        const isOwnMessage = user.isAuthenticated && msg.user._id?.toString() === user.profile?.id
        if (isSystemMessage) {
            return (
                <div key={msg.id || index} className="flex justify-center my-2">
                    <div className="bg-gray-700/50 text-gray-400 text-xs px-3 py-1 rounded-full">
                        {msg.message}
                    </div>
                </div>
            )
        }

        return (
            <div key={msg.id || index} className={`flex mb-3 w-full relative py-1`}>
                <div className={`flex  items-start gap-2 pt-1`}>
                    <Avatar
                        src={msg.user.avatar || '/assets/images/avatar/default.png'}
                        alt={msg.user.displayName || msg.user.username}
                        className="w-12 h-12 flex-shrink-0"
                    />
                    <div className={`flex flex-col `}>
                        <p className="text-xs text-gray-400 mb-1 truncate max-w-[100px]">
                            {msg.user.displayName || msg.user.username} <span>{msg.user.level > 0 && `(Lv.${msg.user.level})`}</span>
                        </p>
                        <div className={`px-3 py-2 rounded-lg border border-gray-700/50 ${isOwnMessage
                            ? 'bg-primary/70 text-background'
                            : 'bg-background-alt text-white'
                            }`}>
                            <p className="text-sm ">&nbsp;{msg.message}</p>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 absolute right-0 top-0 ">
                            {formatTimestamp(msg.timestamp)}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='fixed left-0 top-30 bottom-0 bg-background-alt z-20 border-t border-gray-700/50'>
            <aside className="w-[300px] backdrop-blur-sm text-white  relative z-10 hidden lg:flex h-full">
                {/* Realtime Chat */}
                <div className="bg-background-alt rounded-lg py-4 px-2 flex flex-col justify-between w-full">
                    <div className="bg-background scrollbar-hide rounded-lg p-2 mb-3 flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-300 text-sm p-2 rounded-lg mb-2">
                                {error}
                            </div>
                        )}
                        {isLoadingHistory ? (
                            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                    Loading chat history...
                                </div>
                            </div>
                        ) : chatMessages.length === 0 ? (
                            <div className="space-y-3">
                                {/* Skeleton messages */}
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex mb-3 w-full relative py-1 animate-pulse">
                                        <div className="max-w-[300px] w-full flex items-center gap-3">
                                            <div>
                                                <Skeleton className="flex rounded-full w-12 h-12" />
                                            </div>
                                            <div className="w-full flex flex-col gap-2">
                                                <Skeleton className="h-3 w-3/5 rounded-lg" />
                                                <Skeleton className="h-3 w-4/5 rounded-lg" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex justify-center my-4">
                                    <Skeleton className="w-24 h-4 rounded-sm" />
                                </div>
                                {[4, 5].map((i) => (
                                    <div key={i} className="flex mb-3 w-full relative py-1 animate-pulse">
                                        <div className="max-w-[300px] w-full flex items-center gap-3">
                                            <div>
                                                <Skeleton className="flex rounded-full w-12 h-12" />
                                            </div>
                                            <div className="w-full flex flex-col gap-2">
                                                <Skeleton className="h-3 w-3/5 rounded-lg" />
                                                <Skeleton className="h-3 w-4/5 rounded-lg" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            chatMessages.map((message, index) => renderMessage(message, index))
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button className="p-2 text-gray-400 hover:text-white w-12 min-w-0 rounded-lg">
                            <FaFaceSmile />
                        </Button>
                        <Input
                            onKeyUp={(e) => {
                                if (e.key === 'Enter' && user.isAuthenticated) {
                                    handleSendMessage(message)
                                }
                            }}
                            value={message}
                            onValueChange={setMessage}
                            type="text"
                            placeholder={user.isAuthenticated ? "Type a message..." : "Login to send messages"}
                            disabled={!user.isAuthenticated}
                            classNames={{
                                inputWrapper: `bg-background border-gray-700 border rounded-lg ${!user.isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''
                                    }`
                            }}
                            className="bg-background rounded-lg flex-1 text-white text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>
            </aside>
            <div className="lg:hidden">
                <Button onPress={onOpen} className='fixed min-w-0 shadow shadow-white/20 top-44 left-0 opacity-50 z-40 rounded-l-none hover:opacity-100 duration-150 transform'>
                    <FaMessage />
                </Button>
                <Drawer
                    isOpen={isOpen}
                    placement='left'
                    onOpenChange={onOpenChange}
                >
                    <DrawerContent className='bg-background-alt'>
                        {() => (
                            <>
                                <DrawerHeader className="flex flex-col gap-1 pb-2">
                                    <h4 className="text-large font-medium text-white">Chat</h4>
                                </DrawerHeader>
                                <DrawerBody className="px-4 pb-4">
                                    <div className="bg-background scrollbar-hide rounded-lg p-2 mb-3 flex-1 overflow-y-auto">
                                        {error && (
                                            <div className="bg-red-500/20 border border-red-500/50 text-red-300 text-sm p-2 rounded-lg mb-2">
                                                {error}
                                            </div>
                                        )}
                                        {isLoadingHistory ? (
                                            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                                    Loading chat history...
                                                </div>
                                            </div>
                                        ) : chatMessages.length === 0 ? (
                                            <div className="space-y-3">
                                                {/* Skeleton messages */}
                                                {[1, 2, 3].map((i) => (
                                                    <div key={i} className="flex mb-3 w-full relative py-1 animate-pulse">
                                                        <div className="max-w-[300px] w-full flex items-center gap-3">
                                                            <div>
                                                                <Skeleton className="flex rounded-full w-12 h-12" />
                                                            </div>
                                                            <div className="w-full flex flex-col gap-2">
                                                                <Skeleton className="h-3 w-3/5 rounded-lg" />
                                                                <Skeleton className="h-3 w-4/5 rounded-lg" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex justify-center my-4">
                                                    <Skeleton className="w-24 h-4 rounded-sm" />
                                                </div>
                                                {[4, 5].map((i) => (
                                                    <div key={i} className="flex mb-3 w-full relative py-1 animate-pulse">
                                                        <div className="max-w-[300px] w-full flex items-center gap-3">
                                                            <div>
                                                                <Skeleton className="flex rounded-full w-12 h-12" />
                                                            </div>
                                                            <div className="w-full flex flex-col gap-2">
                                                                <Skeleton className="h-3 w-3/5 rounded-lg" />
                                                                <Skeleton className="h-3 w-4/5 rounded-lg" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            chatMessages.map((message, index) => renderMessage(message, index))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button className="p-2 text-gray-400 hover:text-white w-12 min-w-0 rounded-lg">
                                            <FaFaceSmile />
                                        </Button>
                                        <Input
                                            onKeyUp={(e) => {
                                                if (e.key === 'Enter' && user.isAuthenticated) {
                                                    handleSendMessage(message)
                                                }
                                            }}
                                            value={message}
                                            onValueChange={setMessage}
                                            type="text"
                                            placeholder={user.isAuthenticated ? "Type a message..." : "Login to send messages"}
                                            disabled={!user.isAuthenticated}
                                            classNames={{
                                                inputWrapper: `bg-background border-gray-700 border rounded-lg ${!user.isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`
                                            }}
                                            className="bg-background rounded-lg flex-1 text-white text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </DrawerBody>
                            </>
                        )}
                    </DrawerContent>
                </Drawer>
            </div>
        </div>
    );
}