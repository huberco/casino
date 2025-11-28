import React from "react";
import { StyledHoverableImage } from "@/components/common/HoverableImage/styles";

interface HoverableImageProps {
  src: string;
  alt: string;
}

const HoverableImage: React.FC<HoverableImageProps> = ({ src, alt }) => {
  return (
    <div>
      <StyledHoverableImage>
        <img src={src} alt={alt} className="image-card" />
      </StyledHoverableImage>
    </div>
  );
};

export default HoverableImage;
