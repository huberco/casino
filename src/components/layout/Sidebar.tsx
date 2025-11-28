'use client'
import { useAuth } from '@/contexts/AuthContext';
import { useXP } from '@/contexts/XPContext';
import { Avatar, Button, Input } from '@heroui/react';
import XPBar from '@/components/XP/XPBar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaAlignJustify, FaBookJournalWhills, FaChartGantt, FaFaceSmile, FaGear, FaUser, FaUserGroup, FaWallet } from 'react-icons/fa6';
import { FaTrophy, FaBell } from 'react-icons/fa';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  useDisclosure,
} from "@heroui/react";
import { FaHistory } from 'react-icons/fa';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth()
  const { xpStats } = useXP()
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const navItems = [
    { href: '/account/statistics', label: 'Statistics', icon: <FaChartGantt />, active: pathname === '/account/statistics' },
    { href: '/account/profile', label: 'Profile', icon: <FaUser />, active: pathname === '/account/profile' },
    { href: '/account/wallet', label: 'Wallet', icon: <FaWallet />, active: pathname === '/account/wallet' },
    { href: '/account/xp', label: 'Experience', icon: <FaTrophy />, active: pathname === '/account/xp' },
    // { href: '/account/referrals', label: 'Referrals', icon: <FaUserGroup />, active: pathname === '/account/referrals' },
    { href: '/account/notifications', label: 'Notifications', icon: <FaBell />, active: pathname === '/account/notifications' },
    { href: '/account/history', label: 'History', icon: <FaBookJournalWhills />, active: pathname === '/account/history' },
    { href: '/account/transactions', label: 'Transactions', icon: <FaHistory />, active: pathname === '/account/transactions' },
    { href: '/account/settings', label: 'Settings', icon: <FaGear />, active: pathname === '/account/settings' },
  ];

  return (
    <div className='relative'>
      <aside className="w-64 backdrop-blur-sm text-white  min-h-screen relative z-10 hidden lg:block">
        {/* User Profile Card */}
        <div className='flex flex-col gap-4 bg-background-alt rounded-xl p-6 border-r border-gray-700/50'>
          <div className=" rounded-lg p-4 mb-2">
            <div className="flex flex-col items-center ">
              <Avatar src={user.profile?.avatar} alt={user.profile?.displayName || user.profile?.username || user.username} className='w-24 h-24 border border-primary' />
              <div className='text-center mt-2'>
                <h3 className="font-semibold text-white">{user.profile?.displayName || user.profile?.username || user.profile?.name}</h3>
                <p className="text-sm text-gray-300">Level {xpStats?.currentLevel ?? 0}</p>
              </div>
            </div>
          </div>
          
          {/* XP Progress Bar */}
          <div className="px-2">
            <XPBar size="sm" showLevel={false} />
          </div>
          
          <div className='border-b border-gray-700/50 w-full'> </div>

          {/* Account Navigation */}
          <nav className="my-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${item.active
                      ? 'bg-primary text-background'
                      : 'text-gray-300 hover:bg-gray-700/80 hover:text-white'
                      }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        {/* Support Chat */}
        <div className="bg-background-alt rounded-lg py-4 px-2 mt-8 border-r border-gray-700/50 hidden">
          <h4 className="font-semibold text-gray-300 mb-3">Support Chat</h4>
          <div className="bg-background rounded-lg p-2 mb-3 h-72">
            <p className="text-sm text-gray-200 bg-background-alt rounded-lg p-2">
              Welcome to the support chat! How can we help you today?
            </p>
            <p className="text-xs text-gray-400 mt-1">10:30 AM</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button className="p-2 text-gray-400 hover:text-white w-12 min-w-0 rounded-lg">
              <FaFaceSmile />
            </Button>
            <Input
              type="text"
              placeholder="Type a message..."
              classNames={{
                inputWrapper: "bg-background border-gray-700 border rounded-lg"
              }}
              className="bg-background rounded-lg flex-1 text-white text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </aside>
      <div className="lg:hidden">
        <Button onPress={onOpen} className='fixed min-w-0 shadow shadow-white/20 top-32 left-0 opacity-50 z-40 rounded-l-none hover:opacity-100 duration-150 transform'>
          <FaAlignJustify />
        </Button>
        <Drawer
          isOpen={isOpen}
          placement='left'
          onOpenChange={onOpenChange}
        >
          <DrawerContent className='bg-background-alt'>
            {(onClose) => (
              <>
                {/* User Profile Card */}
                <div className='flex flex-col gap-4 bg-background-alt rounded-xl p-6 border-r border-gray-700/50'>
                  <div className=" rounded-lg p-4 mb-2">
                    <div className="flex flex-col items-center ">
                      <Avatar src={user.profile?.avatar} alt={user.profile?.displayName || user.profile?.username || user.username} className='w-24 h-24 border border-primary' />
                      <div className='text-center mt-2'>
                        <h3 className="font-semibold text-white">{user.profile?.displayName || user.profile?.username || user.username}</h3>
                        <p className="text-sm text-gray-300">Level {user.profile?.level ?? 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className='border-b border-gray-700/50 w-full'> </div>

                  {/* Account Navigation */}
                  <nav className="my-4">
                    <ul className="space-y-2">
                      {navItems.map((item) => (
                        <li key={item.href} onClick={onClose}>
                          <Link
                            href={item.href}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${item.active
                              ? 'bg-primary text-background'
                              : 'text-gray-300 hover:bg-gray-700/80 hover:text-white'
                              }`}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </>
            )}
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}

