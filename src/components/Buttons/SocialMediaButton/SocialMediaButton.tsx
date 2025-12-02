'use client';
import React from "react";
import { StyledSocialMediaButton } from "./StyledSocialMediaButton";
import { Image } from "@heroui/react";
import SvgIcon from "@/components/common/SvgIcon/SvgIcon";

const SocialMediaButton = ({ socialIcon: Icon, socialName, url }: { socialIcon: string, socialName: string, url: string }) => {
  const handleClick = () => {
    // Redirect to the specified URL when the button is clicked
    window.open(url, "_blank");
  };

  return (
    <StyledSocialMediaButton onClick={handleClick}>
      <SvgIcon
        src={Icon}
        alt="Close sidebar"
        width="17px"
        height="17px"
        color="#b1b6c6"
        className="hover:opacity-80 transition-opacity"
      />
      <p className="btn-text">{socialName}</p>
    </StyledSocialMediaButton>
  );
};

export default SocialMediaButton;
