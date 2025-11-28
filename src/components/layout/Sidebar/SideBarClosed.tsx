import React, { useState } from "react";
import { SECTIONS } from "@/components/ui/mockData";
import MyPopover from "@/components/common/Popover/MyPopover";
import { StyledClosedSidebar } from "./StyledSidebar";
import { useGameSettings } from "@/contexts/GameSettingsContext";
import { Image } from "@heroui/react";
import SvgIcon from "@/components/common/SvgIcon/SvgIcon";

interface SideBarClosedProps {
  toggleSideBar: (isOpen: boolean) => void;
}

interface DropdownOption {
  icon: string;
  text: string;
  sidebarUrl: string;
}

interface SidebarOption {
  icon: string;
  text: string;
  hasDropdown: boolean;
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
  options: SidebarOption[];
}

const SideBarClosed: React.FC<SideBarClosedProps> = ({ toggleSideBar }) => {
  const [sections] = useState<Section[]>(SECTIONS as Section[]);
  const { setSelectedOption } = useGameSettings();

  return (
    <StyledClosedSidebar>
      <MyPopover
        icon={
          <SvgIcon
            src="/assets/images/Frame (34).svg"
            width="25px"
            height="25px"
            color="#b1b6c6"
            alt="Expand sidebar"
          />
        }
        position="left"
        title="Collapse"
        onClick={() => toggleSideBar(true)}
      />

      {sections.map((section) =>
        section.options.map((option, optionIndex) => (
          <MyPopover
            key={optionIndex}
            parentOption={option}
            subOptions={option?.dropdownOptions}
            position="left"
            onClick={() => setSelectedOption(option.sidebarUrl)}
          />
        ))
      )}
    </StyledClosedSidebar>
  );
};

export default SideBarClosed;

