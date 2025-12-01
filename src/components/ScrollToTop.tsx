'use client'
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const ScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to the top of the page when the route changes
  }, [pathname]);

  return null; // This component doesn't render anything in the DOM
};

export default ScrollToTop;
