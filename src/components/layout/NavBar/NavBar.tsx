'use client'
import React, { useContext } from "react";

//assets
import FULL_LOGO from "../../../../assets/LOGO Gamblify/Full LOGO.png";
import SMALL_LOGO_NO_BG from "../../../../assets/LOGO Gamblify/LOGO PNG.png";
// import SMALL_LOGO_BLACK_BG from "../../../../assets/LOGO Gamblify/LOGO.png";
// import { ReactComponent as MESSAGE_ICON } from "../../../../assets/images/message.svg";
// import ChatBox from "../../ChatBox/ChatBox";

// import RegisterModal from "../../../Common/Modals/RegisterModal";
// import AccountButton from "../AccountButton/AccountButton";
// import CashierModal from "./CashierModal/CashierModal";
// import CashierModal from "../../../Modals/CashierModals/CashierModal";
// import SearchModal from "../../../Modals/SearchModal/SearchModal";
// import RewardsButton from "../RewardsButton/RewardsButton";
// import TotalMoneyContainer from "../TotalMoneyContainer";
import { StyledNavBar } from "./styles";
// import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useGameSettings } from "@/contexts/GameSettingsContext";
import Button from "@/components/Buttons/Button";
import { Image } from "@heroui/react";

const NavBar = () => {
  // const {
  //   isChatBoxOpen,
  //   isMobileScreen,
  //   isTabletScreen,
  //   updateChatBox,
  //   updateLoggedIn,
  // } = useContext(AppContext);

  const { user } = useAuth();
  const  { isTabletScreen, isMobileScreen, isSidebarOpen, selectedOption } = useGameSettings();

  return (
    <StyledNavBar>
      <div
        className="h-16 flex justify-between items-center p-3"
        style={{
          boxShadow: "2px 2px 2px rgba(0,0,0,0.3)",
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          background: "#1A1D29",
          zIndex: 11,
        }}
      >
        <div
          className={`logo-container ${isTabletScreen ? "logo-container-mobile" : ""
            }`}
        >
          <Link href="/ " className="flex h-10 flex-shrink-0 cursor-pointer">
            <Image src="/assets/images/logo.png" alt="SPINX" width={150} />
          </Link>
          {/* Rewards Button */}
          {/* {user?.profile && (
            <div className="money-container">
              {isTabletScreen && !isMobileScreen ? (
                <TotalMoneyContainer money="$0.00" />
              ) : null}
              <RewardsButton />
            </div>
          )} */}
        </div>

        {user?.profile && (
          <>
            {/* Coins / Cashier / Buy Crypto Section */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              {!isTabletScreen && (
                <>
                  {/* <TotalMoneyContainer money={user?.profile.balance || 0.00} />

                  <CashierModal button={"Cashier"} />

                  <CashierModal button={"Buy Crypto"} /> */}
                </>
              )}
            </div>
          </>
        )}

        <div style={{ display: "flex", alignItems: "center" }}>
          {!user?.profile && (
            <>
              {/* <RegisterModal modalOption="login" />
              <RegisterModal modalOption="register" /> */}
              <Button className="primary-button">Login</Button>
            </>
          )}

          {/* {!isTabletScreen && (
            <div style={{ display: "flex" }}>
              {user?.profile && <AccountButton />}

              <SearchModal />
              {isChatBoxOpen === false ? (
                <Button className="mr-5" onClick={() => updateChatBox(true)}>
                  <Image src="/assets/images/message.svg" alt="MESSAGE" width={20} />
                </Button>
              ) : null}
            </div>
          )} */}
        </div>
      </div>

      {/* <ChatBox isChatBox={isChatBoxOpen} setIsChatBox={updateChatBox} /> */}
    </StyledNavBar>
  );
};

export default NavBar;
