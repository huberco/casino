// SidebarOption.tsx
import React from "react";
import { DropdownBtn } from "@/components/Buttons/DropdownBtn";
import { Image } from "@heroui/react";
import Link from "next/link";
import SvgIcon from "@/components/common/SvgIcon/SvgIcon";

interface SidebarOptionProps {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>> | string;
  text: string;
  number?: string | number;
  count?: string | number;
  hasDropdown?: boolean;
  isOpenedDropdown?: boolean;
  onClickDropdown?: () => void;
  isActive?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  sidebarUrl: string;
  isBiggerOption?: boolean;
}

const SidebarOption: React.FC<SidebarOptionProps> = ({
  icon,
  text,
  number,
  count,
  hasDropdown = false,
  isOpenedDropdown = false,
  onClickDropdown,
  isActive,
  onClick,
  sidebarUrl,
  isBiggerOption = false,
}) => {
  const handleDropdownClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent the default behavior of the Link
    e.stopPropagation(); // Stop event propagation to prevent triggering onClick
    onClickDropdown?.();
  };

  const isIconString = typeof icon === 'string';
  const IconComponent = !isIconString ? icon : undefined;


  return (
    <Link href={sidebarUrl ?? "/"}>
      <div
        className={`option-sidebar ${isOpenedDropdown ? "opened-dropdown" : ""
          } ${isActive ? "option-active" : ""}`}
        onClick={onClick}
      >
        {icon && (
          <div
            style={{ color: isBiggerOption ? "#fff" : "" }}
            className={`icon-img ${isActive ? "activated" : ""}`}
          >
            {isIconString ? (
              <SvgIcon
                src={icon as string}
                alt={text}
                width="20px"
                height="20px"
                color={isActive ? "rgb(255, 255, 193)" : "#b1b6c6"}
                className="svg-icon"
              />
            ) : IconComponent ? (
              <IconComponent />
            ) : null}
          </div>
        )}
        <span
          style={{ color: isBiggerOption ? "#fff" : "" }}
          className={`info-text ${isActive ? "activated" : ""}`}
        >
          {text}
        </span>
        <div className="numbers-spacer">
          {number && (
            <span className={`info-number ${isActive ? "activated" : ""}`}>
              {number}
            </span>
          )}
          {count && (
            <span className={`count ${isActive ? "activated" : ""}`}>
              {count}
            </span>
          )}
        </div>

        {hasDropdown && (
          <div>
            <DropdownBtn onClick={handleDropdownClick}>
              <SvgIcon
                src={`/assets/images/${isOpenedDropdown ? "Arrow-Up" : "Arrow-Down"}.svg`}
                alt="arrow"
                height="16px"
                color={isActive ? "rgb(255, 255, 193)" : "#b1b6c6"}
                className="dropdown-arrow-icon flex items-center justify-centers "
              />
            </DropdownBtn>
          </div>
        )}
      </div>
    </Link>
  );
};

export default SidebarOption;

