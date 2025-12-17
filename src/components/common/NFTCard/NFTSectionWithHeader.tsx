'use client'

import React from "react";
import SectionHeader from "../SectionHeader/SectionHeader";
import NFTCard from "./NFTCard";
import Link from "next/link";
import { NFTS_DATA } from "@/components/ui/mockData";
import useSlider from "@/hooks/useSlider";
import Slider from "../Slider/Slider";

// Create a wrapper component for the SVG icon
const NFTIcon: React.FC<{ className?: string }> = ({ className }) => (
  <div className={className}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-4v-4h4v4zm0-6h-4V7h4v4z"/>
    </svg>
  </div>
);

interface NFTSectionWithHeaderProps {
  isLootbox?: boolean;
  title: string;
  buttonText: string;
  buttonLink: string;
}

const NFTSectionWithHeader: React.FC<NFTSectionWithHeaderProps> = ({ 
  isLootbox, 
  title, 
  buttonText, 
  buttonLink 
}) => {
  const { containerRef, scrollLeft, scrollRight } = useSlider();

  const CardsComponent = NFTS_DATA.map((card, index) => (
    <Link href={`/nft/details/${card.id}`} key={index}>
      <NFTCard
        imageSrc={card.imageSrc}
        title={card.title}
        subTitle={card.subTitle}
        amount={card.amount}
        buttonText={card.buttonText}
        prices={card.prices}
        currentPrice={card.currentPrice}
        hasPercentageText={card.hasPercentageText}
        isLootbox={isLootbox}
        isSliderElement={true}
      />
    </Link>
  ));

  return (
    <>
      <SectionHeader
        iconHeader={NFTIcon}
        casinoText={title}
        sideButton={buttonText}
        sideButtonLink={buttonLink}
        scrollLeft={scrollLeft}
        scrollRight={scrollRight}
        style={{ marginBottom: "20px" }}
      />
      <Slider CardsComponent={CardsComponent} containerRef={containerRef} />
    </>
  );
};

export default NFTSectionWithHeader;



