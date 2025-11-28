import React from "react";
import { StyledHoverableImgMainHome } from "@/components/common/HoverableImage/styles";

interface HoverableImgMainHomeProps {
  src: string;
  alt: string;
}

const HoverableImgMainHome: React.FC<HoverableImgMainHomeProps> = ({
  src,
  alt,
}) => {
  return (
    <div>
      <StyledHoverableImgMainHome>
        <img src={src} alt={alt} className="image-card" />
      </StyledHoverableImgMainHome>
    </div>
  );
};

export default HoverableImgMainHome;
