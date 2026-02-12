import React, { useContext, useState } from "react";
import { StyledAccountDropdown } from "./styles";
import { useGameSettings } from "@/contexts/GameSettingsContext";
import { ACCOUNT_DROPDOWN_OPTIONS } from "../ui/mockData";
import Link from "next/link";
import { Image } from "@heroui/react";
import SvgIcon from "../common/SvgIcon/SvgIcon";
import { useAuth } from "@/contexts/AuthContext";

const AccountDropdown = ({ userName }) => {
  const { toggleDropdown, openDropdown } = useGameSettings();
  const { user } = useAuth();

  return (
    <>
      {ACCOUNT_DROPDOWN_OPTIONS.map((option, index) => (

        <DropdownItem key="logout" color="danger">
          <Link
            className="dropdown-option link"
            href={option.route}
            key={index}
            onClick={() => toggleDropdown("")}
          >
            <SvgIcon src={option.icon} alt={option.label} className="text-shadow-white" />
            <span>{option.label}</span>
          </Link>
        </DropdownItem>
      ))}
      <DropdownItem>
        <Link
          className="dropdown-option link"
          href={"/"}
          onClick={() => {
            updateLoggedIn(false);
            toggleDropdown("");
          }}
        >
          {/* <OUT /> */}
          <SvgIcon src="/assets/modelImages/Frame (12).svg" alt="logout" />
          <span>Log Out</span>
        </Link>
      </DropdownItem >
    </>
  );
};

export default AccountDropdown;
