import styled from "styled-components";

interface StyledPageLayoutProps {
  $isSidebarOpen: boolean;
  $isChatBoxOpen?: boolean;
  $isChatBoxCollapsed?: boolean;
}

interface ContentLayoutProps {
  $isTabletScreen?: boolean;
}

export const StyledPageLayout = styled.div`
  padding-left: 0;
  
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 64px);
  justify-content: space-between;
  transition: all 250ms ease 0s;
  margin-top: 64px;


  .background-overlay {
    position: fixed;
    z-index: 99;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    background: rgba(20, 23, 34, 0.75);
  }
`;

export const ContentLayout = styled.div<ContentLayoutProps>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: 0px auto;
  width: 100%;
  max-width: 1170px;
  padding: ${({ $isTabletScreen }) =>
    $isTabletScreen ? "16px 16px 24px" : "24px 24px 48px"};
  background: #1a1d29;
`;

export const SportsContentLayout = styled.div<ContentLayoutProps>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  flex: 1;
  padding: ${({ $isTabletScreen }) =>
    $isTabletScreen ? "16px 16px 24px" : "24px 24px 48px"};
  background: #1a1d29;
`;
