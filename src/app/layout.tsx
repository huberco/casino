import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnimatedGridBackground from "@/components/ui/AnimatedGridBackground";
import ChatView from "@/components/Chat/ChatView";
import SocketStatus from "@/components/SocketStatus";
import AuthStatus from "@/components/AuthStatus";
import Script from "next/script";
import NavBar from "@/components/layout/NavBar/NavBar";
import { GlobalStyle } from "./globalStyle";
import SideBar from "@/components/layout/Sidebar/SideBar";
import ScrollToTop from "@/components/ScrollToTop";
import PageLayout from "@/components/layout/Layout";
import PageLoader from "@/components/layout/PageLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bet366",
  description: "The next generation of blockchain gaming with futuristic experiences and real rewards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scrollbar-hide">
      <head>
        {/* Replace with your GA4 Measurement ID */}
        <Script
          id="ga4"
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-CXYFKEB521`}
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CXYFKEB521', { send_page_view: true });
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
      >
        <GlobalStyle />
        <Providers>
          <PageLoader />
          <div className="min-h-screen scrollbar-hide relative ">
            {/* <AnimatedGridBackground /> */}
            <NavBar />
            <SideBar />
            <ScrollToTop />
            <PageLayout>
              {children}
            </PageLayout>
          </div>
        </Providers>
      </body>
    </html>
  );
}
