'use client'

import React from "react";
import { Image } from "@heroui/react";
import { StyledHoverableImgMainHome } from "./styles";

interface HoverableImgMainHomeProps {
  src: string;
  alt: string;
}

const HoverableImgMainHome: React.FC<HoverableImgMainHomeProps> = ({ src, alt }) => {
  return (
    <div>
      <StyledHoverableImgMainHome>
        <Image src={src} alt={alt} className="image-card" />
      </StyledHoverableImgMainHome>
    </div>
  );
};

export default HoverableImgMainHome;
