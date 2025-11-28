import React, { useEffect, useState } from "react";
import { StyledFilterButtonGroup } from "./styles";

interface FilterButtonGroupProps {
  options: string[];
  onOptionChange: (option: string) => void;
}

const FilterButtonGroup: React.FC<FilterButtonGroupProps> = ({
  options,
  onOptionChange,
}) => {
  const [activeOption, setActiveOption] = useState<string>(options[0]);

  useEffect(() => {
    onOptionChange(activeOption); // Trigger option change when activeOption changes
  }, [activeOption, onOptionChange]);

  const handleOptionChange = (option: string) => {
    setActiveOption(option);
  };

  return (
    <StyledFilterButtonGroup>
      <div className="btn-container">
        {options.map((option: string, index: number) => (
          <button
            key={index}
            className={`button ${option === activeOption ? "btn-active" : ""}`}
            onClick={() => handleOptionChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </StyledFilterButtonGroup>
  );
};

export default FilterButtonGroup;
