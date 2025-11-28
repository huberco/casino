import { Image, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import React, { useContext, useRef, useState } from "react";
import { StyledPopover } from "./styles";
import { useGameSettings } from "@/contexts/GameSettingsContext";
import CryptoFuturesCoins from "@/components/common/CryptoFuturesCoins/CryptoFuturesCoins";
import Link from "next/link";
import SvgIcon from "@/components/common/SvgIcon/SvgIcon";

interface SubOption {
    sidebarUrl: string;
    icon?: string | React.ComponentType<React.SVGProps<SVGSVGElement>>;
    text: string;
    [key: string]: any;
}

interface ParentOption {
    sidebarUrl: string;
    icon?: string | React.ComponentType<React.SVGProps<SVGSVGElement>>;
    text: string;
    dropdownOptions?: SubOption[];
    hasDropdown?: boolean;
    selectedSubOption?: string | null;
    isOpenedDropdown?: boolean;
    number?: string;
    count?: string;
    [key: string]: any;
}

interface MyPopoverProps {
    parentOption?: ParentOption;
    icon?: React.ReactNode;
    title?: string;
    position?: "left" | "right";
    subOptions?: SubOption[];
    onClick?: () => void;
}

const MyPopover: React.FC<MyPopoverProps> = ({
    parentOption,
    icon,
    title,
    position = "right",
    subOptions = [],
    onClick,
}) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
    const { selectedOption, setSelectedOption } = useGameSettings();

    const buttonRef = useRef<HTMLButtonElement>(null);

    const calculateTopPosition = (): number => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            return rect.bottom - (subOptions.length ? 72 : 36); // Use bottom to position below the button
        }
        return 0;
    };

    return (
        <Popover
            className="relative"
            onMouseEnter={() => setIsPopoverOpen(true)}
            onMouseLeave={() => setIsPopoverOpen(false)}
        >
            <PopoverTrigger ref={buttonRef}>
                {parentOption ? (
                    <Link href={parentOption.sidebarUrl ?? "/"} className="link" onClick={onClick}>
                        {parentOption.icon && (
                            typeof parentOption.icon === 'string' ? (
                                <SvgIcon
                                    src={parentOption.icon}
                                    alt={parentOption.text}
                                    width="20px"
                                    height="20px"
                                    color={parentOption.sidebarUrl === selectedOption ? "rgb(255, 255, 193)" : "#b1b6c6"}
                                />
                            ) : (
                                <parentOption.icon />
                            )
                        )}
                    </Link>
                ) : (
                    <div className="link" onClick={onClick}>
                        {icon}
                    </div>
                )}
            </PopoverTrigger>

            <PopoverContent>
                <StyledPopover
                    style={{
                        height: "auto",
                        top: `${calculateTopPosition()}px`,
                        left: subOptions.length ? "50px" : "66px",
                        zIndex: 1000,
                        width: subOptions.length ? "100%" : "auto",
                    }}
                >
                    {subOptions.length ? (
                        <div className="container-popover">
                            <div style={{ paddingBottom: "8px" }}>
                                <div className="title">{parentOption?.text}</div>
                                {parentOption?.text === "Crypto Futures" ? (
                                    <div style={{ padding: "0 8px 0" }}>
                                        <CryptoFuturesCoins />
                                    </div>
                                ) : (
                                    subOptions?.map((option, optionIndex) => (
                                        <Link
                                            key={optionIndex}
                                            href={option.sidebarUrl}
                                            className="option"
                                            onClick={() => setSelectedOption(option.sidebarUrl)}
                                        >
                                            {option.icon && (
                                                <div className="icon">
                                                        <option.icon
                                                            className={
                                                                option.sidebarUrl === selectedOption
                                                                    ? "activated"
                                                                    : ""
                                                            }
                                                            style={{ marginLeft: "-4px" }}
                                                        />
                                                </div>
                                            )}
                                            {option.text}
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="simple-popover">
                            {parentOption ? parentOption.text : title}
                            <div
                                className={`arrow ${position === "left" ? "arrow-left" : "arrow-right"
                                    }`}
                                style={{ top: "6.60001px" }}
                            ></div>
                        </div>
                    )}
                </StyledPopover>
            </PopoverContent>
        </Popover>
    );
};

export default MyPopover;

