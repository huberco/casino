'use client'

import React from "react";
import { Image } from "@heroui/react";
import { StyledArrowIcons } from "./StyledArrowIcons";

interface ArrowIconsProps {
  scrollLeft: () => void;
  scrollRight: () => void;
}

const ArrowIcons: React.FC<ArrowIconsProps> = ({ scrollLeft, scrollRight }) => {
  return (
    <StyledArrowIcons>
      <button onClick={scrollLeft} className="arrow-style">
        <Image src="/assets/images/Frame (25).svg" alt="left" width={16} height={16} />
      </button>
      <button onClick={scrollRight} className="arrow-style">
        <Image src="/assets/images/Frame (26).svg" alt="right" width={16} height={16} />
      </button>
    </StyledArrowIcons>
  );
};

export default ArrowIcons;


