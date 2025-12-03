'use client'

import React from "react";
import Link from "next/link";
import ArrowIcons from "../ArrowIcons/ArrowIcons";
import FilterButtonGroup from "@/components/Buttons/FilterButtonGroup";
import { StyledSectionHeader } from "./styles";

interface SectionHeaderProps {
  iconHeader?: React.ComponentType<{ className?: string }>;
  sideButton?: string;
  sideButtonLink?: string;
  casinoText: string;
  hasRecommended?: boolean;
  hasArrows?: boolean;
  hasFilterOptions?: boolean;
  onOptionChange?: (option: string) => void;
  filterOptions?: string[];
  scrollLeft?: () => void;
  scrollRight?: () => void;
  style?: React.CSSProperties;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  iconHeader: Icon,
  sideButton,
  sideButtonLink,
  casinoText,
  hasRecommended,
  hasArrows = true,
  hasFilterOptions,
  onOptionChange,
  filterOptions = [],
  scrollLeft,
  scrollRight,
  style,
}) => {
  return (
    <StyledSectionHeader style={style}>
      <div className="icon-group">
        {Icon && <Icon className="icon-header" />}
        <span className="casino-text">{casinoText}</span>
        {sideButton && sideButtonLink && (
          <Link href={sideButtonLink}>
            <span className="view-all-text">{sideButton}</span>
          </Link>
        )}
      </div>

      <div style={{ display: "flex" }}>
        {hasRecommended && (
          <div className="recommended-button">
            <button className="recommended-button-text">Recommended</button>
          </div>
        )}
        {hasFilterOptions && onOptionChange && (
          <FilterButtonGroup
            options={filterOptions}
            onOptionChange={onOptionChange}
          />
        )}
        {hasArrows && scrollLeft && scrollRight && (
          <ArrowIcons scrollLeft={scrollLeft} scrollRight={scrollRight} />
        )}
      </div>
    </StyledSectionHeader>
  );
};

export default SectionHeader;


