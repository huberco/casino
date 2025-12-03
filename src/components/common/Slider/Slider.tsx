'use client'

import React from "react";
import { StyledSlider } from "./StyledSlider";

interface SliderProps {
  CardsComponent: React.ReactNode;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const Slider: React.FC<SliderProps> = ({ CardsComponent, containerRef }) => {
  return <StyledSlider ref={containerRef}>{CardsComponent}</StyledSlider>;
};

export default Slider;


