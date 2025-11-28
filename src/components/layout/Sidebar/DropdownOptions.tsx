import React from "react";
import Link from "next/link";
import SvgIcon from "@/components/common/SvgIcon/SvgIcon";

interface DropdownOption {
  icon: string;
  text: string;
  sidebarUrl: string;
}

interface DropdownOptionsProps {
  options: DropdownOption[];
  onSubOptionClick: (subOptionIndex: number, sidebarUrl: string) => void;
  activeSubOptionIndex: string | null;
}

const DropdownOptions: React.FC<DropdownOptionsProps> = ({
  options,
  onSubOptionClick,
  activeSubOptionIndex,
}) => {
  return (
    <div className="dropdown-options">
      {options.map((option, index) => (
        <Link key={index} href={option.sidebarUrl}>
          <div
            className={`dropdown-option ${
              option.sidebarUrl === activeSubOptionIndex ? "active" : ""
            }`}
            onClick={() => onSubOptionClick(index, option.sidebarUrl)}
          >
            <SvgIcon
              src={option.icon}
              alt={option.text}
              width="20px"
              height="20px"
              color={option.sidebarUrl === activeSubOptionIndex ? "rgb(255, 255, 193)" : "#b1b6c6"}
              className="dropdown-icon"
            />
            <span className="dropdown-text">{option.text}</span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default DropdownOptions;

