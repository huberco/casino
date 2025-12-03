'use client'

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useGameSettings } from "@/contexts/GameSettingsContext";
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

interface ChatBoxProps {
    isChatBox: boolean;
    setIsChatBox: (isOpen: boolean) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ isChatBox, setIsChatBox }) => {
    const pathname = usePathname();

    const { isTabletScreen, isChatBoxCollapsed, setIsChatBoxCollapsed } = useGameSettings();

    const [message, setMessage] = useState(""); // Track the input message
    const [messages, setMessages] = useState<string[]>([]); // Store chat messages
    const [activeButton, setActiveButton] = useState("chat"); // Track the active button

    const handleButtonClick = (button: string) => {
        setActiveButton(button);
    };

    const handleSend = () => {
        if (message) {
            // Add the new message to the messages list
            setMessages([...messages, message]);
            // Clear the message input field
            setMessage("");
        }
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
                            {messages.length === 0 ? (
                                <ImagePart>
                                    <p>No Messages Yet</p>
                                </ImagePart>
                            ) : (
                                <div className="chat-messages">
                                    {messages.map((msg, index) => (
                                        <CardMessage
                                            key={index}
                                            rankIcon="/assets/images/rank-icon-gold.png"
                                            playerName="Alfred"
                                            messageText={msg}
                                        />
                                    ))}
                                </div>
                            )}

                            <MessageInput
                                type="text"
                                placeholder="Type a message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleInputKeyPress}
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
                                        disabled={!message}
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

