'use client'

import React from "react";
import { Button, Image } from "@heroui/react";
import SvgIcon from "../SvgIcon/SvgIcon";
import { StyledNFTCard } from "./styles";

export const calculateArrowMargin = (prices: number[], currentPrice: number): string => {
  if (!prices || prices.length < 3) return "28px";

  const [priceLeft, priceMiddle, priceRight] = prices;

  // Calculate the relative position of currentPrice in the range [priceLeft, priceRight]
  const relativePosition =
    (currentPrice - priceLeft) / (priceRight - priceLeft);

  // Calculate the margin-left for the arrow based on the relative position
  const marginLeft = `calc(${relativePosition * 100}% - 28px)`;

  return marginLeft;
};

interface NFTCardProps {
  imageSrc: string;
  title: string;
  subTitle: string;
  amount: string;
  buttonText: string;
  isLootbox?: boolean;
  prices?: number[];
  currentPrice?: number;
  hasPercentageText?: boolean;
  isSliderElement?: boolean;
}

const NFTCard: React.FC<NFTCardProps> = ({
  imageSrc,
  title,
  subTitle,
  amount,
  buttonText,
  isLootbox = true,
  prices = [],
  currentPrice = 0,
  hasPercentageText,
  isSliderElement = false,
}) => {
  const arrowMargin = calculateArrowMargin(prices, currentPrice);

  return (
    <div>
      <StyledNFTCard $isSliderElement={isSliderElement}>
        <div className="text-section">
          <p className="title">{title}</p>
          <span className="sub-title">
            {subTitle} <p className="amount">{amount}</p>
          </span>
        </div>

        <div className="image-section">
          <Image src={imageSrc} alt={title} className="w-full aspect-square"/>
          {hasPercentageText && (
            <div className="img-percentage-text">
              <div style={{ height: "3px" }}></div>
              <div className="percentage-text">
                <span>4.5%</span>
                <span>·</span>
                <span>10% </span>
                <span>·</span>
                <span>950</span>
                <span>·</span>
                <span>730K</span>
                <span>·</span>
                <span>x1.6</span>
              </div>
            </div>
          )}
        </div>

        <div className="info-section">
          <div className="info-text">
            <div className="name-img">
              <Image src="/assets/images/IMAGE.svg" alt="nft" width={18} height={18} />
              <span className="info-name">AKbot</span>
            </div>
            {isLootbox && <span className="item-count">7 Items</span>}
          </div>
        </div>

        {!isLootbox && (
          <div className="prices-container">
            <div className="prices">
              {prices.map((price, idx) => (
                <div key={idx}>${price}K</div>
              ))}
            </div>
            <div className="gradient-price" />
            <div
              className="arrow-current-price"
              style={{ marginLeft: arrowMargin }}
            >
              <SvgIcon 
                src="/assets/images/Arrow-Down.svg" 
                alt="arrow" 
                width="12px" 
                height="12px"
                color="#fff"
              />
              <div>${currentPrice}K</div>
            </div>
          </div>
        )}

        {isLootbox ? (
          <Button className=" bg-primary font-bold hover:bg-primary/50 rounded-lg w-full text-background cursor-pointer text-center py-3">
            {buttonText}
          </Button>
        ) : ( 
          <div className="flex gap-3">
            <Button className="bg-primary font-bold hover:bg-primary/50 rounded-lg w-full text-background cursor-pointer text-center py-3 buy">BUY</Button>
            <Button className="bg-primary font-bold hover:bg-primary/50 rounded-lg w-full text-background cursor-pointer text-center py-3bet">BET</Button>
          </div>
        )}
      </StyledNFTCard>
    </div>
  );
};

export default NFTCard;

