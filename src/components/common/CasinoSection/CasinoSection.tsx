'use client'

import React from "react";
import SectionHeader from "../SectionHeader/SectionHeader";
import SvgIcon from "../SvgIcon/SvgIcon";
import useSlider from "@/hooks/useSlider";
import HoverableImgMainHome from "../HoverableImage/HoverableImgMainHome";
import Slider from "../Slider/Slider";
import { StyledCasinoSection } from "./StyledCasinoSection";

const casinoImages = [
  "/assets/images/IMAGE (14).png",
  "/assets/images/IMAGE (15).png",
  "/assets/images/IMAGE (16).png",
  "/assets/images/IMAGE (17).png",
  "/assets/images/IMAGE (18).png",
  "/assets/images/IMAGE (14).png",
  "/assets/images/IMAGE (19).png",
  "/assets/images/IMAGE (14).png",
  "/assets/images/IMAGE (15).png",
  "/assets/images/IMAGE (16).png",
  "/assets/images/IMAGE (17).png",
  "/assets/images/IMAGE (18).png",
  "/assets/images/IMAGE (14).png",
  "/assets/images/IMAGE (19).png",
];

// Create a wrapper component for the SVG icon
const CasinoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <div className={className}>
    <SvgIcon 
      src="/assets/images/Frame (9).svg" 
      alt="casino" 
      width="20px" 
      height="20px"
      color="#fff"
    />
  </div>
);

const CasinoSection: React.FC = () => {
  const { containerRef, scrollLeft, scrollRight } = useSlider();

  const CardsComponent = casinoImages.map((image, index) => {
    return (
      <HoverableImgMainHome key={index} src={image} alt={`casino-${index}`} />
    );
  });

  return (
    <StyledCasinoSection>
      <SectionHeader
        iconHeader={CasinoIcon}
        casinoText="CASINO"
        sideButton="View All"
        sideButtonLink="/casino"
        hasRecommended={true}
        scrollLeft={scrollLeft}
        scrollRight={scrollRight}
      />

      <Slider CardsComponent={CardsComponent} containerRef={containerRef} />
    </StyledCasinoSection>
  );
};

export default CasinoSection;

