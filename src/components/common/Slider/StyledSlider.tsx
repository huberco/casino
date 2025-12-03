'use client'

import styled from "styled-components";

export const StyledSlider = styled.div`
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;

  &::-webkit-scrollbar {
    display: none;
  }

  width: 100%;
  gap: 12px;
`;


