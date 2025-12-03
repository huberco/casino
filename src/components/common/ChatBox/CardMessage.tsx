'use client'

import React from "react";
import { Image } from "@heroui/react";
import { StyledCardMessage } from "./styles";

interface CardMessageProps {
  rankIcon: string;
  playerName: string;
  messageText: string;
}

const CardMessage: React.FC<CardMessageProps> = ({ 
  rankIcon, 
  playerName, 
  messageText 
}) => {
  return (
    <StyledCardMessage>
      <div className="container-name">
        <div className="icon">
          <Image src={rankIcon} alt="rank" />
        </div>
        <div className="name">{playerName}:</div>
      </div>
      <span className="message">{messageText}</span>
    </StyledCardMessage>
  );
};

export default CardMessage;

