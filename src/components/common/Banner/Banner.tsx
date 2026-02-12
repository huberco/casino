'use client'

import React from "react";
// import SocialMediaButton from "../Buttons/SocialMediaButton/SocialMediaButton";

// import SMALL_LOGO_NO_BG from "../../../assets/LOGO Gamblify/LOGO PNG.png";
// import SMALL_LOGO_BLACK_BG from "../../../assets/LOGO Gamblify/LOGO.png";
// import RegisterModal from "../Modals/RegisterModal";
import { StyledBanner } from "./StyledBanner";
import SocialMediaButton from "@/components/Buttons/SocialMediaButton/SocialMediaButton";
import { Button, Image } from "@heroui/react";
import Link from "next/link";

const Banner = () => {
  return (
    <StyledBanner className="@container">
      <div className="main-content w-full @xl:w-auto">
        <Image src={`/assets/LOGO Gamblify/Full LOGO.png`} alt="logo" style={{ maxHeight: "40px" }} />
        <p className="main-heading">
          By default, you will be credited with <span className="font-bold text-primary">10 USDT</span> to your account. This is for you to test the platform and get familiar with the interface.
          You can deposit more USDT to your account to start playing.
        </p>
        <Link href="/account/wallet" className="w-full">
          <Button className="primary-button w-full">Deposit</Button>
        </Link>

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
