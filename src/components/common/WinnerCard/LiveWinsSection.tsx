'use client'

import React, { useState } from "react";
import { Image } from "@heroui/react";

import { WINNER_CARDS } from "@/components/ui/mockData";
import FilterButtonGroup from "@/components/Buttons/FilterButtonGroup";
import WinnerCard from "./WinnerCard";
import { LiveWinsSectionStyled, StyledCardsContainer } from "./styles";

interface LiveWinsSectionProps {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  hasFilters?: boolean;
}

const LiveWinsSection: React.FC<LiveWinsSectionProps> = ({ 
  icon: Icon, 
  title, 
  hasFilters 
}) => {
  const timeFilterOptions = ["Live", "Month", "Week", "Day"];

  const [activeOption, setActiveOption] = useState(timeFilterOptions[0]);

  const handleOptionChange = (option: string) => {
    setActiveOption(option);
  };

  const selectedCards = WINNER_CARDS[activeOption] || [];

  return (
    <>
      <LiveWinsSectionStyled>
        <div className="dot-section">
          {hasFilters ? (
            <Image src="/assets/images/Rectangle.png" alt="dot" className="dot-icon" />
          ) : (
            Icon && <Icon className="wins-icon" />
          )}
          {title && <span className="live-wins-text uppercase">{title}</span>}
        </div>

        {hasFilters && (
          <FilterButtonGroup
            options={timeFilterOptions}
            onOptionChange={handleOptionChange}
          />
        )}
      </LiveWinsSectionStyled>

      <StyledCardsContainer>
        {selectedCards.map((card, index) => (
          <WinnerCard
            key={index}
            imgSrc={card.imgSrc}
            cartIconSrc={card.cartIconSrc}
            username={card.username}
            price={card.price}
          />
        ))}
      </StyledCardsContainer>
    </>
  );
};

export default LiveWinsSection;

