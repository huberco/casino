import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useGameSettings } from "@/contexts/GameSettingsContext";
import { DropdownTrigger, DropdownItem, DropdownMenu, Avatar, Dropdown } from "@heroui/react";
import { ACCOUNT_DROPDOWN_OPTIONS } from "@/components/ui/mockData";
import SvgIcon from "@/components/common/SvgIcon/SvgIcon";

//model assetss

//models

const AccountButton = () => {
  const { isTabletScreen, toggleDropdown, openDropdown } = useGameSettings();
  const { user } = useAuth();

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Avatar
          isBordered
          as="button"
          className="transition-transform"
          src={user?.profile?.avatar}
        />
      </DropdownTrigger>
      <DropdownMenu aria-label="Profile Actions" variant="flat">
        <>
          {ACCOUNT_DROPDOWN_OPTIONS.map((option) => (
            <DropdownItem key={option.label} textValue={option.label}>
              <Link
                href={option.route}
                className="dropdown-option link flex items-center gap-2"
                onClick={() => toggleDropdown("")}
              >
                <SvgIcon src={option.icon} alt={option.label} width={20} height={20} className="text-white shrink-0" />
                <span>{option.label}</span>
              </Link>
            </DropdownItem>
          ))}
          <DropdownItem key="logout" textValue="Log Out">
            <Link
              href="/"
              className="dropdown-option link flex items-center gap-2"
              onClick={() => toggleDropdown("")}
            >
              <SvgIcon src="/assets/modelImages/Frame (12).svg" alt="logout" width={20} height={20} className="text-white shrink-0" />
              <span>Log Out</span>
            </Link>
          </DropdownItem>
        </>
      </DropdownMenu>
    </Dropdown>
  );
};

export default AccountButton;
