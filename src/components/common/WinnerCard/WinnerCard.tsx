'use client'

import React from "react";
import { StyledWinnerCard } from "./styles";
import { Image } from "@heroui/react";

interface WinnerCardProps {
  imgSrc: string;
  cartIconSrc: string;
  username: string;
  price: string;
}

const WinnerCard: React.FC<WinnerCardProps> = ({ 
  imgSrc, 
  cartIconSrc, 
  username, 
  price 
}) => {
  return (
    <StyledWinnerCard>
      <div className="card-content">
        <Image src={imgSrc} alt="winner" className="card-image" />
        <div className="user-details">
          <Image src={cartIconSrc} alt="cart" className="cart-icon" />
          <p className="username">{username}</p>
        </div>
        <p className="price">{`$${price}`}</p>
      </div>
    </StyledWinnerCard>
  );
};

export default WinnerCard;


