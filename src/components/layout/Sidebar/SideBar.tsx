'use client'

import React, { useState } from "react";

import { useGameSettings } from "@/contexts/GameSettingsContext";
import { SECTIONS } from "@/components/ui/mockData";
import Button from "@/components/Buttons/Button";
import DropdownOptions from "./DropdownOptions";
import SideBarClosed from "./SideBarClosed";
import SidebarOption from "./SidebarOption";
import { StyledOpenedSidebar } from "./StyledSidebar";
import { Image } from "@heroui/react";
import SvgIcon from "@/components/common/SvgIcon/SvgIcon";

interface DropdownOption {
  icon: string;
  text: string;
  sidebarUrl: string;
}

interface SidebarOptionType {
  icon: string;
  text: string;
  hasDropdown?: boolean;
  selectedSubOption: string | null;
  isOpenedDropdown: boolean;
  sidebarUrl: string;
  dropdownOptions?: DropdownOption[];
  number?: string;
  count?: string;
}

interface Section {
  name: string;
  selectedOption: string | null;
  options: SidebarOptionType[];
}

const SideBar = () => {
  const [sections, setSections] = useState<Section[]>(SECTIONS as Section[]);
  const {
    isTabletScreen,
    selectedOption,
    isSidebarOpen,
    setSelectedOption,
    setIsSidebarOpen,
  } = useGameSettings();

  const handleDropdownClick = (
    sectionIndex: number,
    optionIndex: number,
    sidebarUrl: string
  ) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].options[optionIndex].isOpenedDropdown =
      !updatedSections[sectionIndex].options[optionIndex].isOpenedDropdown;

    // Check if a sub-option is selected, reset main option if needed
    const selectedSubOption =
      sections[sectionIndex].options[optionIndex].selectedSubOption;
    if (
      selectedSubOption !== null &&
      !updatedSections[sectionIndex].options[optionIndex].isOpenedDropdown
    ) {
      updatedSections[sectionIndex].selectedOption = sidebarUrl;
      setSelectedOption(sidebarUrl);
    } else if (
      selectedSubOption !== null &&
      updatedSections[sectionIndex].options[optionIndex].isOpenedDropdown
    ) {
      updatedSections[sectionIndex].selectedOption = null;
    }

    setSections(updatedSections);
  };

  const handleSidebarOptionClick = (
    sectionIndex: number,
    optionIndex: number,
    sidebarUrl: string
  ) => {
    const updatedSections = sections.map((section: Section, idx: number) => ({
      ...section,
      options: section.options.map((option: SidebarOptionType) => ({
        ...option,
        selectedSubOption: null,
      })),
      selectedOption: idx === sectionIndex ? sidebarUrl : null,
    }));
    setSections(updatedSections);
    setSelectedOption(sidebarUrl);
  };

  const handleDropdownOptionClick = (
    sectionIndex: number,
    mainOptionIndex: number,
    subOptionIndex: number,
    sidebarUrl: string
  ) => {
    const updatedSections = sections.map((section: Section, idx: number) => ({
      ...section,
      selectedOption: null,
      options: section.options.map((option: SidebarOptionType, optIdx: number) => ({
        ...option,
        selectedSubOption:
          idx === sectionIndex && optIdx === mainOptionIndex
            ? sidebarUrl
            : null,
      })),
    }));
    setSelectedOption(sidebarUrl);
    setSections(updatedSections);
  };

  if (isTabletScreen && !isSidebarOpen) return null;

  return isSidebarOpen ? (
    <StyledOpenedSidebar>
      <div className="sidebar-content">
        <div>
          <Image src="/assets/images/AK BALANCE.svg" width={"100%"} />
        </div>

        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {sectionIndex === 0 ? (
              <div className="w-38 flex justify-between items-center cursor-pointer">
                <span className="other-text">{section.name}</span>
                <div onClick={() => setIsSidebarOpen(false)} className="cursor-pointer">
                  <SvgIcon
                    src="/assets/images/Frame (2).svg"
                    alt="Close sidebar"
                    width="20px"
                    height="20px"
                    color="#b1b6c6"
                    className="hover:opacity-80 transition-opacity"
                  />
                </div>
              </div>
            ) : (
              <span className="other-text">{section.name}</span>
            )}

            <div className="other-section">
              {section.options.map((option: SidebarOptionType, optionIndex: number) => (
                <div key={optionIndex}>
                  <SidebarOption
                    key={optionIndex}
                    icon={option.icon}
                    text={option.text}
                    number={option.number}
                    count={option.count}
                    hasDropdown={option.hasDropdown}
                    isOpenedDropdown={option.isOpenedDropdown}
                    onClick={() =>
                      handleSidebarOptionClick(
                        sectionIndex,
                        optionIndex,
                        option.sidebarUrl
                      )
                    }
                    onClickDropdown={() =>
                      handleDropdownClick(
                        sectionIndex,
                        optionIndex,
                        option.sidebarUrl
                      )
                    }
                    isActive={option.sidebarUrl === selectedOption}
                    sidebarUrl={option.sidebarUrl}
                    isBiggerOption={true}
                  />

                  {option.isOpenedDropdown && option.dropdownOptions && (
                    <DropdownOptions
                      options={option.dropdownOptions}
                      onSubOptionClick={(subOptionIndex: number, sidebarUrl: string) =>
                        handleDropdownOptionClick(
                          sectionIndex,
                          optionIndex,
                          subOptionIndex,
                          sidebarUrl
                        )
                      }
                      activeSubOptionIndex={selectedOption}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="divider" />

        <div className="payment">
          <Button className="buy-crypto">Buy Crypto</Button>

          <div className="payment-methods">
            <Image src="/assets/images/Frame (18).svg" width={"100%"} />
            <Image src="/assets/images/Frame (19).svg" width={"100%"} />
            <Image src="/assets/images/Frame (20).svg" width={"100%"} />
            <Image src="/assets/images/Frame (21).svg" width={"100%"} />
          </div>
        </div>
      </div>
    </StyledOpenedSidebar>
  ) : (
    <SideBarClosed toggleSideBar={setIsSidebarOpen} />
  );
};

export default SideBar;
