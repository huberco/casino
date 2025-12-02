'use client';
import React from "react";
import { StyledSocialMediaButton } from "./StyledSocialMediaButton";
import { Image } from "@heroui/react";

const SocialMediaButton = ({ socialIcon: Icon, socialName, url }: { socialIcon: string, socialName: string, url: string }) => {
  const handleClick = () => {
    // Redirect to the specified URL when the button is clicked
    window.open(url, "_blank");
  };

  return (
    <StyledSocialMediaButton onClick={handleClick}>
      <Image src={Icon} alt={socialName} className="icon-img" style={{ width: "17px", height: "17px" }} />
      <p className="btn-text">{socialName}</p>
    </StyledSocialMediaButton>
  );
};

export default SocialMediaButton;
