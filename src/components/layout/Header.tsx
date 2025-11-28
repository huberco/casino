"use client"
import GameButton from '../ui/GameButton';

import { FaAngleDown, FaArrowDown, FaDiscord, FaGift, FaRankingStar, FaRightFromBracket, FaTelegram, FaTwitter, FaUser, FaWallet } from 'react-icons/fa6';
import TokenSelector from '../ui/TokenSelector';
import { Avatar, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Popover, PopoverTrigger, PopoverContent, Image } from '@heroui/react';
import React from 'react';
import {
  Navbar,
  NavbarBrand,
  NavbarMenuToggle,
  NavbarMenuItem,
  NavbarMenu,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import Link from "next/link";
import { useModal } from '@/contexts/modalContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import NotificationBell from '@/components/notifications/NotificationBell';
import Button from '../Buttons/Button';
import PrimaryButton from '../Buttons/PrimaryButton';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const pathname = usePathname()
  const { showModal, hideModal, isOpen } = useModal()
  const { user, signOut } = useAuth()

  const handleLogin = () => {
    showModal('auth')
  }

  const menuItems = [
    {
      href: "/game/roulette",
      name: "Roulette"
    },
    {
      href: "/game/mine",
      name: "Mine"
    },
    {
      href: "/game/crash",
      name: "Crash"
    },
    {
      href: "/game/coinflip",
      name: "Coinflip"
    },
  ];


  return (
    <header className="h-16 md:h-[120px] bg-background-alt text-white z-20 shadow-lg shadow-black/50 fixed top-0 left-0 right-0">
      <div className='max-w-[1920px] mx-auto hidden md:flex justify-between bg-background'>
        <div className='bg-background-alt w-[300px]'>
        </div>
        <div className='flex-1 flex justify-between'>
          <nav className="hidden md:flex px-6 py-2 gap-6 text-white/50 ">

            <Link href="/official/fair" className={`text-sm py-2 ${pathname === "/official/fair" ? "text-primary font-semibold" : "hover:text-primary text-white/50 transition-colors"}`}>
              Provably Fair
            </Link>
            <Link href="/official/faq" className={`text-sm py-2 ${pathname === "/official/faq" ? "text-primary font-semibold" : "hover:text-primary text-white/50 transition-colors"}`}>
              FAQ
            </Link>
            <Link href="/official/support" className={`text-sm py-2 ${pathname === "/official/support" ? "text-primary font-semibold" : "hover:text-primary text-white/50 transition-colors"}`}>
              Support
            </Link>
          </nav>
          <div className="flex items-center space-x-4 ">
            <div className="flex space-x-2">
              <Link href="https://discord.gg/spinx" className="p-2 hover:bg-gray-800 rounded">
                <FaDiscord className='text-white/50' />
              </Link>
              <Link href="https://x.com/spinx_game" className="p-2 hover:bg-gray-800 rounded">
                <FaTwitter className='text-white/50' />
              </Link>
              <Link href="https://t.me/spinx_game" className="p-2 hover:bg-gray-800 rounded">
                <FaTelegram className='text-white/50' />
              </Link>
            </div>
            <div className="flex items-center justify-center pr-4">
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex size-3 rounded-full bg-primary"></span>
              </span>
              <button className="p-2 hover:bg-gray-800 rounded ">
                29
              </button>
            </div>
          </div>
        </div>
      </div>
      <Navbar isBlurred isMenuOpen={isMenuOpen} onMenuOpenChange={setIsMenuOpen} classNames={{
        wrapper: "max-w-[1920px]! bg-background-alt",
      }}>
        <NavbarContent className="sm:hidden" justify="start">
          <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} />
        </NavbarContent>

        <NavbarContent className="sm:hidden pr-3" justify="center">
          <NavbarBrand>
            <Link href="/">
              <Image src="/assets/images/logo.png" alt="SPINX" width={150} />
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex gap-4 " justify="center">
          <NavbarBrand className='2xl:w-[300px] '>
            <Link href="/">
              <Image src="/assets/images/logo.png" className='lg:-translate-y-1/2 transform' alt="SPINX" width={150} />
            </Link>
          </NavbarBrand>
          <NavbarItem className='hidden xl:flex'>
            <GameButton href="/game/roulette">
              Roulette
            </GameButton>
          </NavbarItem>
          <NavbarItem className='hidden xl:flex'>
            <GameButton href="/game/mine">
              Mine
            </GameButton>
          </NavbarItem>
          <NavbarItem className='hidden xl:flex'>
            <GameButton href="/game/crash">
              Crash
            </GameButton>
          </NavbarItem>
          <NavbarItem className='hidden xl:flex'>
            <GameButton href="/game/coinflip">
              Coinflip
            </GameButton>
          </NavbarItem>
          <NavbarItem className="xl:hidden">
            <Dropdown classNames={{
              content: "min-w-[100px]",
              trigger: "h-12 rounded-full border-primary border-[1px]"
            }}>
              <DropdownTrigger>
                <Button>
                  Games
                  <FaAngleDown />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Action event example">
                <DropdownItem key="new" className={`flex ${pathname === "/game/roulette" ? "bg-primary text-background" : ""}`}>
                  <Link href="/game/roulette" className='text-center'>
                    Roulette
                  </Link>
                </DropdownItem>
                <DropdownItem key="copy" className={`${pathname === "/game/mine" ? "bg-primary text-background" : ""}`}>
                  <Link href="/game/mine" className='text-center'>
                    Mine
                  </Link>
                </DropdownItem>
                <DropdownItem key="edit" className={`${pathname === "/game/crash" ? "bg-primary text-background" : ""}`}>
                  <Link href="/game/crash" className='text-center'>
                    Crash
                  </Link>
                </DropdownItem>
                <DropdownItem key="delete" className={`${pathname === "/game/coinflip" ? "bg-primary text-background" : ""}`}>
                  <Link href="/game/coinflip" className='text-center'>
                    Coinflip
                  </Link>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
          <NavbarItem className='hidden'>
            <Link
              href="/daily-case"
              className="bg-primary text-background hover:scale-[1.01] text-semibold capitalize rounded-full px-4 py-2 transition-all duration-200 flex items-center gap-2"
            >
              <FaGift size={16} /> Daily Case
            </Link>
          </NavbarItem>
        </NavbarContent>

        <NavbarContent justify="end">
          {/* {user?.isAuthenticated && <NavbarItem className="hidden lg:flex">
            <TokenSelector />
          </NavbarItem>} */}
          {user?.isAuthenticated &&
            <NavbarItem className="hidden lg:flex">
              <Link
                href="/account/wallet"
                className="bg-background text-white hover:scale-[1.01] text-semibold capitalize rounded-full px-4 py-2 transition-all duration-200 flex items-center gap-2"
              >
                <FaWallet />
                {user.profile?.balance ? user.profile.balance.toFixed(3).replace(/\.?0+$/, '') : 0}
              </Link>
            </NavbarItem>
          }
          {user?.isAuthenticated && (
            <NavbarItem>
              <NotificationBell />
            </NavbarItem>
          )}
          <NavbarItem>
            {user?.isAuthenticated ?
              <Popover showArrow offset={10} placement="bottom">
                <PopoverTrigger>
                  <Avatar src={user.profile?.avatar} alt={user.profile?.displayName || user.profile?.username || user.username} className='w-10 h-10 cursor-pointer' />
                </PopoverTrigger>
                <PopoverContent className="w-[240px]">
                  {(titleProps) => (
                    <div className="py-2 w-full">
                      <div className="mt-2 flex flex-col gap-2 w-full">
                        <Link href='/account/profile' className='w-full flex justify-between rounded-lg hover:bg-primary hover:text-background px-4 py-2'>
                          Profile
                          <FaUser />
                        </Link>
                        <Link href='/official/leaderboard' className='w-full flex justify-between rounded-lg hover:bg-primary hover:text-background px-4 py-2'>
                          Leaderboard
                          <FaRankingStar />
                        </Link>
                        <div onClick={signOut} className='w-full items-center font-semibold cursor-pointer rounded-lg flex justify-between hover:bg-danger px-4 py-2'>
                          Logout
                          <FaRightFromBracket />
                        </div>
                      </div>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              : (
                <PrimaryButton
                  onClick={handleLogin}
                  className=""
                >
                  Sign In
                </PrimaryButton>)
            }
          </NavbarItem>
        </NavbarContent>

        <NavbarMenu className='pt-8'>
          <NavbarMenuItem className='flex' onClick={() => setIsMenuOpen(false)}>
            <Link href={`/game/roulette`} className={`w-full text-center rounded-full py-2 ${pathname === "/game/roulette" ? "bg-primary text-background" : "bg-background-alt"}`} >
              Roulette
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem className='flex' onClick={() => setIsMenuOpen(false)}>
            <Link href={`/game/mine`} className={`w-full text-center rounded-full py-2 ${pathname === "/game/mine" ? "bg-primary text-background" : "bg-background-alt"}`} >
              Mine
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem className='flex' onClick={() => setIsMenuOpen(false)}>
            <Link href={`/game/crash`} className={`w-full text-center rounded-full py-2 ${pathname === "/game/crash" ? "bg-primary text-background" : "bg-background-alt"}`} >
              Crash
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem className='flex' onClick={() => setIsMenuOpen(false)}>
            <Link href={`/game/coinflip`} className={`w-full text-center rounded-full py-2 ${pathname === "/game/coinflip" ? "bg-primary text-background" : "bg-background-alt"}`} >
              Coinflip
            </Link>
          </NavbarMenuItem>

          <div className="flex items-center justify-center space-x-4 w-full">
            <div className="flex space-x-2">
              <Link href="https://discord.gg/spinx" className="p-2 hover:bg-gray-800 rounded">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </Link>
              <Link href="https://x.com/spinx_game" className="p-2 hover:bg-gray-800 rounded">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
              <Link href="https://t.me/spinx_game" className="p-2 hover:bg-gray-800 rounded">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </Link>
            </div>
            <div className="flex items-center justify-center pr-4 absolute right-0 top-0">
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex size-3 rounded-full bg-primary"></span>
              </span>
              <button className="p-2 hover:bg-gray-800 rounded ">
                29
              </button>
            </div>
          </div>
        </NavbarMenu>
      </Navbar>

    </header >
  );
}
