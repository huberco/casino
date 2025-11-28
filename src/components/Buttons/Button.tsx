import { Button as MuiButton, ButtonProps as MuiButtonProps } from "@mui/material";
import PropTypes from "prop-types";
import React from "react";

interface ButtonProps extends Omit<MuiButtonProps, 'children'> {
  children: React.ReactNode;
  className?: string;
}

const Button = ({ children, className = "", ...props }: ButtonProps) => {
  return (
    <MuiButton
      className={`inline-flex items-center justify-center whitespace-nowrap transition-all duration-100 ease-in-out appearance-none border-none cursor-pointer select-none h-10 rounded-lg px-3 py-0 bg-[rgba(203,215,255,0.03)] text-white font-extrabold text-sm not-italic uppercase min-w-10 hover:bg-[rgba(203,215,255,0.055)] ${className}`}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

Button.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export default Button;
