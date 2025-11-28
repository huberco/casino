import { Button, ButtonProps } from "@heroui/react";
import PropTypes from "prop-types";
import React from "react";

interface PrimaryButtonProps extends Omit<ButtonProps, 'children' | 'onClick' | 'disabled'> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const PrimaryButton = ({ 
  children, 
  className = "", 
  onClick, 
  isLoading = false, 
  disabled = false,
  ...props 
}: PrimaryButtonProps) => {
  const isDisabled = disabled || isLoading;

  return (
    <Button
      onPress={onClick}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center whitespace-nowrap",
        "transition-all duration-100 ease-in-out",
        "appearance-none border-none",
        "select-none h-10 rounded-lg px-6 py-0",
        "font-extrabold text-sm not-italic uppercase tracking-[0.5px]",
        "bg-[rgb(255,232,26)] text-[rgb(20,23,34)]",
        "w-full my-6",
        "shadow-[rgba(255,176,25,0.4)_0px_0px_10px,rgba(255,255,255,0.2)_0px_1px_0px_inset,rgba(0,0,0,0.15)_0px_-3px_0px_inset,rgb(255,135,25)_0px_0px_15px_inset]",
        isDisabled 
          ? "opacity-50 cursor-not-allowed pointer-events-none" 
          : "cursor-pointer hover:brightness-110",
        isLoading ? "relative" : "",
        className
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </Button>
  );
};

PrimaryButton.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default PrimaryButton;
