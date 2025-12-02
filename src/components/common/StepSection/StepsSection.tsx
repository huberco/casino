'use client'

import React from "react";
import { StyledStepSection } from "./StyledStepSection";

interface Step {
  number: string;
  text: string;
}

interface StepsSectionProps {
  steps: Step[];
  className?: string;
  hasMarginBottom?: boolean;
}

const StepsSection: React.FC<StepsSectionProps> = ({ 
  steps, 
  className, 
  hasMarginBottom = false 
}) => {
  return (
    <StyledStepSection
      style={{
        paddingTop: "0px",
        paddingBottom: "0px",
        marginBottom: hasMarginBottom ? "36px" : "0",
      }}
      className={className || ""}
    >
      <div className="class-1">
        <div className="class-2">
          {steps.map((step, index) => (
            <div key={index} className="step-account">
              <div className="step-content">
                <div className="step-number">{step.number}</div> {step.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </StyledStepSection>
  );
};

export default StepsSection;

