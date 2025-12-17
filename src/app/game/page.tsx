'use client'

import React from "react";

//components
import Banner from "@/components/common/Banner/Banner";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Button from "@/components/Buttons/Button";
import StepsSection from "@/components/common/StepSection/StepsSection";
import LiveWinsSection from "@/components/common/WinnerCard/LiveWinsSection";
import CasinoSection from "@/components/common/CasinoSection/CasinoSection";
import NFTSectionWithHeader from "@/components/common/NFTCard/NFTSectionWithHeader";
// import BonusCardSection from "../../Common/BonusCard/BonusCardSection";
// import BoxesSection from "../../Common/BoxCard/BoxesSection";
// import CryptoSection from "../../Common/CryptoCard/CryptoSection";
// import NewTableView from "./NewTableView";

const steps = [
  {
    number: "01",
    text: "Register Account",
  },
  {
    number: "02",
    text: "Make a Deposit and Play",
  },
  {
    number: "03",
    text: "Receive Rewards",
  },
];

const GamePage = () => {
  return (
    <div className="@container max-w-[1170px] w-full mx-auto px-6 py-12">
      <Banner />

      {/* Homepage main image area */}

      <StepsSection
        hasMarginBottom={true}
        steps={steps}
        className="@xl:block hidden"
      />

      {/* image area frame main */}

      <LiveWinsSection title="Live wins" hasFilters={true} />

      {/* casino view */}

      <CasinoSection />

      {/* Crypto view */}

      {/* <CryptoSection /> */}

      {/* Bonus */}

      {/* <BonusCardSection /> */}

      {/* Daily Bonuses */}

      {/* <BoxesSection /> */}

      {/* NFT LOOT BOXES */}

      <NFTSectionWithHeader
        title="NFT Lootboxes"
        buttonText="View All"
        buttonLink="/nft/lootboxes/play"
        isLootbox={true}
      />

      {/* table view */}
      {/* <NewTableView /> */}
    </div>
  );
};

export default GamePage;
