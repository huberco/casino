'use client'
import React, { useContext, useEffect } from "react";

//assets
import FULL_LOGO from "../../../../assets/LOGO Gamblify/Full LOGO.png";
import SMALL_LOGO_NO_BG from "../../../../assets/LOGO Gamblify/LOGO PNG.png";
import ChatBox from "@/components/common/ChatBox/ChatBox";
// import SMALL_LOGO_BLACK_BG from "../../../../assets/LOGO Gamblify/LOGO.png";
// import { ReactComponent as MESSAGE_ICON } from "../../../../assets/images/message.svg";

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
import { FaMessage, FaRegMessage } from "react-icons/fa6";
import { useModalStore } from "@/store/modalStore";
import AccountButton from "@/components/Buttons/AccountButton/AccountButton";

const NavBar = () => {
  // const {
  //   isChatBoxOpen,
  //   isMobileScreen,
  //   isTabletScreen,
  //   updateChatBox,
  //   updateLoggedIn,
  // } = useContext(AppContext);

  const { user } = useAuth();
  const  { isTabletScreen, isMobileScreen, isSidebarOpen, selectedOption, isChatBoxOpen, setIsChatBoxOpen } = useGameSettings();
  const { openModal } = useModalStore();

  const openAuthModal = () => {
    console.log("open Modal")
    openModal('auth')
  }

  useEffect(()=>{
    console.log("user", user)
  },[user])

  return (
    <StyledNavBar>
      <div
        className="h-16 flex justify-between items-center p-3 bg-background-alt"
        style={{
          boxShadow: "2px 2px 2px rgba(0,0,0,0.3)",
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          zIndex: 30,
        }}
      >
        <div
          className={`logo-container ${isTabletScreen ? "logo-container-mobile" : ""
            }`}
        >
          <Link href="/ " className="flex h-10 flex-shrink-0 cursor-pointer items-center gap-2 ml-4">
            <Image src="/web-app-manifest-512x512.png" alt="SPINX" width={40} />
            <span className="shadow-2xs
            shadow-amber-200 font-bold text-3xl bg-linear-to-r from-[#ff8719] via-[#ffe81a] to-[#ff8719] text-transparent bg-clip-text font-audiowide">BeT366</span>
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
                <p>Balance: {user?.profile.balance || 0.00}</p>
                  {/* <TotalMoneyContainer money={user?.profile.balance || 0.00} /> */}

                  {/* <CashierModal button={"Cashier"} />

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
              <Button className="primary-button" onClick={openAuthModal} >Login</Button>
            </>
          )}

          {!isTabletScreen && (
            <div style={{ display: "flex" }}>
              {user?.profile && <AccountButton />}

              {/* <SearchModal /> */}
              {isChatBoxOpen === false ? (
                <Button className="mr-5" onClick={() => setIsChatBoxOpen(true)}>
                  <Image src="/assets/images/message.svg" alt="MESSAGE" width={20} />
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <ChatBox isChatBox={isChatBoxOpen} setIsChatBox={setIsChatBoxOpen} />
    </StyledNavBar>
  );
};

export default NavBar;
