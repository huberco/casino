'use client'

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useGameSettings } from "@/contexts/GameSettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/contexts/socketContext";
import SvgIcon from "../SvgIcon/SvgIcon";
import { Image } from "@heroui/react";
import CryptoFuturesCoins from "@/components/common/CryptoFuturesCoins/CryptoFuturesCoins";
import CardMessage from "./CardMessage";
import {
    ImagePart,
    MessageInput,
    StyledChatBoxContainer,
    StyledIconSection,
    SwitchContainer,
} from "./styles";

// Shape from backend: chat event has user: { _id, username, avatar, level }; chat_history has user: { id, username, avatar, level, displayName?, isAnonymous? }
export interface ChatMessagePayload {
    id: string;
    user: {
        _id?: string;
        id?: string;
        username: string;
        avatar?: string | null;
        level?: number;
        displayName?: string | null;
        isAnonymous?: boolean;
    };
    message: string;
    timestamp: string;
    isHistory?: boolean;
}

interface ChatBoxProps {
    isChatBox: boolean;
    setIsChatBox: (isOpen: boolean) => void;
}

const DEFAULT_AVATAR = "/assets/images/avatar/default.png";

const ChatBox: React.FC<ChatBoxProps> = ({ isChatBox, setIsChatBox }) => {
    const pathname = usePathname();
    const { user } = useAuth();
    const { isConnected, emit, registerListener, unregisterListener } = useWebSocket();
    const { isTabletScreen, isChatBoxCollapsed, setIsChatBoxCollapsed } = useGameSettings();

    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
    const [activeButton, setActiveButton] = useState("chat");
    const [error, setError] = useState<string | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const hasLoadedHistoryRef = useRef(false);

    const handleButtonClick = (button: string) => {
        setActiveButton(button);
    };

    // Request chat history when chat is open and socket is connected
    useEffect(() => {
        if (!isChatBox || !isConnected || activeButton !== "chat") return;

        const handleChat = (data: ChatMessagePayload) => {
            setMessages((prev) => {
                const exists = prev.some(
                    (m) =>
                        m.id === data.id ||
                        (m.message === data.message &&
                            (m.user._id ?? m.user.id) === (data.user._id ?? data.user.id) &&
                            m.timestamp === data.timestamp)
                );
                if (exists) return prev;
                return [...prev, data];
            });
        };

        const handleChatHistory = (data: { messages?: ChatMessagePayload[] }) => {
            if (data.messages && Array.isArray(data.messages)) {
                setMessages(data.messages);
                hasLoadedHistoryRef.current = true;
            }
            setIsLoadingHistory(false);
        };

        const handleChatError = (data: { message?: string }) => {
            setError(data.message ?? "Chat error");
            setIsLoadingHistory(false);
            setTimeout(() => setError(null), 5000);
        };

        registerListener("chat", handleChat, "ChatBox");
        registerListener("chat_history", handleChatHistory, "ChatBox");
        registerListener("chat_error", handleChatError, "ChatBox");

        if (!hasLoadedHistoryRef.current && !isLoadingHistory) {
            setIsLoadingHistory(true);
            emit("get_chat_history", { limit: 50, room: "default" });
        }

        return () => {
            unregisterListener("chat", handleChat, "ChatBox");
            unregisterListener("chat_history", handleChatHistory, "ChatBox");
            unregisterListener("chat_error", handleChatError, "ChatBox");
        };
    }, [isChatBox, isConnected, activeButton, emit, registerListener, unregisterListener]);

    const handleSend = () => {
        const text = message.trim();
        if (!text) return;
        if (!isConnected) {
            setError("Not connected. Reconnecting...");
            return;
        }
        if (!user.isAuthenticated) {
            setError("Please log in to send messages.");
            setTimeout(() => setError(null), 3000);
            return;
        }
        emit("chat", { message: text });
        setMessage("");
    };

    const handleCollapse = () => {
        setIsChatBoxCollapsed(!isChatBoxCollapsed);
    };

    const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };

    return (
        <>
            {isChatBox ? (
                <StyledChatBoxContainer
                    $isTabletScreen={isTabletScreen}
                    style={{
                        padding: pathname.includes("/sports")
                            ? "0px 16px 64px"
                            : "0px 16px 16px",
                        width: isChatBoxCollapsed ? "248px" : "340px",
                    }}
                >
                    <div className="top-actions-container">
                        <div className="chat-trades">
                            <div
                                className={`btn-chatbox ${activeButton === "chat" ? "active-btn" : ""
                                    }`}
                                onClick={() => handleButtonClick("chat")}
                            >
                                <SvgIcon
                                    src="/assets/images/Frame (31).svg"
                                    alt="message"
                                    width="14px"
                                    height="14px"
                                    color={activeButton === "chat" ? "rgb(255, 255, 193)" : "rgb(103, 109, 124)"}
                                />
                            </div>
                            <div
                                className={`btn-chatbox ${activeButton === "trades" ? "active-btn" : ""
                                    }`}
                                style={{ cursor: "pointer" }}
                                onClick={() => handleButtonClick("trades")}
                            >
                                <SvgIcon
                                    src="/assets/images/Frame (32).svg"
                                    alt="trades"
                                    width="9px"
                                    height="14px"
                                    color={activeButton === "trades" ? "rgb(255, 255, 193)" : "rgb(103, 109, 124)"}
                                    className="switch-icon"
                                />
                                <SvgIcon
                                    src="/assets/images/Frame (33).svg"
                                    alt="arrow"
                                    width="7px"
                                    height="5px"
                                    color={activeButton === "trades" ? "rgb(255, 255, 193)" : "rgb(103, 109, 124)"}
                                    className="arrow-icon"
                                />
                            </div>
                        </div>

                        <SwitchContainer>
                            <div className="container-buttons">
                                <button onClick={handleCollapse}>
                                    <SvgIcon
                                        src="/assets/images/Frame (34).svg"
                                        alt="collapse"
                                        width="22px"
                                        height="22px"
                                        color="rgb(134, 141, 166)"
                                        className={`collapse-icon ${isChatBoxCollapsed ? "collapsed" : ""
                                            }`}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </button>
                                <button onClick={() => setIsChatBox(false)}>
                                    <SvgIcon
                                        src="/assets/images/Frame (35).svg"
                                        alt="close"
                                        width="20px"
                                        height="20px"
                                        color="rgb(134, 141, 166)"
                                        className="cross-icon"
                                        style={{ cursor: 'pointer' }}
                                    />
                                </button>
                            </div>
                        </SwitchContainer>
                    </div>

                    {activeButton === "chat" ? (
                        <>
                            {error && (
                                <div className="mb-2 rounded-lg border border-red-500/50 bg-red-500/10 px-2 py-1.5 text-sm text-red-300">
                                    {error}
                                </div>
                            )}
                            {isLoadingHistory ? (
                                <ImagePart>
                                    <p>Loading chat...</p>
                                </ImagePart>
                            ) : messages.length === 0 ? (
                                <ImagePart>
                                    <p>No Messages Yet</p>
                                </ImagePart>
                            ) : (
                                <div className="chat-messages">
                                    {messages.map((msg) => (
                                        <CardMessage
                                            key={msg.id}
                                            rankIcon={msg.user.avatar ?? DEFAULT_AVATAR}
                                            playerName={msg.user.displayName ?? msg.user.username}
                                            messageText={msg.message}
                                        />
                                    ))}
                                </div>
                            )}

                            <MessageInput
                                type="text"
                                placeholder={user.isAuthenticated ? "Type a message..." : "Log in to send messages"}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleInputKeyPress}
                                disabled={!user.isAuthenticated}
                            />

                            <StyledIconSection>
                                <div className="icons">
                                    <Image src="/assets/images/IMAGE (43).png" alt="emoji" className="emoji" />
                                    <SvgIcon
                                        src="/assets/images/Frame (36).svg"
                                        alt="settings"
                                        width="13px"
                                        height="13px"
                                        color="#b1b6c6"
                                        className="settings"
                                    />
                                    <p>Rules</p>
                                </div>

                                <div className="info">
                                    <p className="info-value">200</p>
                                    <button
                                        onClick={handleSend}
                                        className="send-button"
                                        disabled={!message.trim() || !user.isAuthenticated || !isConnected}
                                    >
                                        Send
                                    </button>
                                </div>
                            </StyledIconSection>
                        </>
                    ) : (
                        <div className="container-bets">
                            <div className="section-title" style={{ marginBottom: "21px" }}>
                                My Active Bets
                            </div>
                            <div className="active-bets" style={{ padding: "0px 0px 10px" }}>
                                <SvgIcon
                                    src="/assets/images/Frame (32).svg"
                                    alt="candle"
                                    width="16px"
                                    height="16px"
                                    color="rgb(103, 109, 124)"
                                />

                                <div className="text">No Bets Yet</div>
                            </div>

                            <div style={{ paddingTop: "25px" }}>
                                <div className="section-title" style={{ marginBottom: "10px" }}>
                                    Market Prices
                                </div>
                                <CryptoFuturesCoins />
                            </div>
                        </div>
                    )}
                </StyledChatBoxContainer>
            ) : null}
        </>
    );
};

export default ChatBox;



