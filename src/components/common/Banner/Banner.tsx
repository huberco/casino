'use client'

import React from "react";
// import SocialMediaButton from "../Buttons/SocialMediaButton/SocialMediaButton";

// import SMALL_LOGO_NO_BG from "../../../assets/LOGO Gamblify/LOGO PNG.png";
// import SMALL_LOGO_BLACK_BG from "../../../assets/LOGO Gamblify/LOGO.png";
// import RegisterModal from "../Modals/RegisterModal";
import { StyledBanner } from "./StyledBanner";
import SocialMediaButton from "@/components/Buttons/SocialMediaButton/SocialMediaButton";
import { Button, Image } from "@heroui/react";

const Banner = () => {
  return (
    <StyledBanner className="@container">
      <div className="main-content w-full @xl:w-auto">
        <Image src={`/assets/LOGO Gamblify/Full LOGO.png`} alt="logo" style={{ maxHeight: "40px" }} />
        <p className="main-heading">
          Experience true innovation with the highest rewards program within the
          industry.
        </p>
      <Button className="primary-button">Register</Button>

        {/* <RegisterModal buttonText="REGISTER NOW" modalOption="register" /> */}

        <p className="or-join-with">Or join with</p>

        <div className="social-media-container flex-col @xl:flex-row">
          <SocialMediaButton
            socialIcon={"/assets/images/Frame (22).svg"}
            socialName={"Steam"}
            url={"https://steamcommunity.com"}
          />
          <SocialMediaButton
            socialIcon={"/assets/images/Frame (23).svg"}
            socialName={"Twitch"}
            url={"https://www.twitch.tv"}
          />
          <SocialMediaButton
            socialIcon={"/assets/images/Frame (24).svg"}
            socialName={"Metamask"}
            url={"https://metamask.io"}
          />
        </div>
      </div>

      <div className="side-text hidden @xl:block">
        <p className="leverage-text">1000X LEVERAGE CRYPTO FUTURES</p>
        <p className="small-text">
          Instant execution, 0% slippage, 0% fees on loss
        </p>
      </div>
    </StyledBanner>
  );
};

export default Banner;
