'use client'

import React from "react";
import { Image } from "@heroui/react";
import { StyledArrowIcons } from "./StyledArrowIcons";
import { FaAngleLeft, FaAngleRight} from "react-icons/fa6";

interface ArrowIconsProps {
  scrollLeft: () => void;
  scrollRight: () => void;
}

const ArrowIcons: React.FC<ArrowIconsProps> = ({ scrollLeft, scrollRight }) => {
  return (
    <StyledArrowIcons>
      <button onClick={scrollLeft} className="arrow-style group ">
        <FaAngleLeft className="group-hover:text-primary!"/>
      </button>
      <button onClick={scrollRight} className="arrow-style group">
        <FaAngleRight className="group-hover:text-primary!"/>
      </button>
    </StyledArrowIcons>
  );
};

export default ArrowIcons;


