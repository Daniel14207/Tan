/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Menu, ShoppingCart, Bell } from 'lucide-react';

interface NavbarProps {
  title: string;
  cartCount: number;
  notificationCount: number;
  onMenuClick: () => void;
  onCartClick: () => void;
  onNotificationClick: () => void;
}

export default function Navbar({
  title,
  cartCount,
  notificationCount,
  onMenuClick,
  onCartClick,
  onNotificationClick,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-[#1A237E] px-4 text-white shadow-md border-b border-[#283593]">
      {/* Left Menu Button */}
      <button
        id="btn-navbar-menu"
        onClick={onMenuClick}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors focus:outline-none"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-white" />
      </button>

      {/* Title */}
      <h1 className="text-sm font-bold tracking-wider uppercase text-white font-sans truncate px-2">
        {title}
      </h1>

      {/* Right Icons: Cart & Bell */}
      <div className="flex items-center gap-2">
        {/* Shopping Cart */}
        <button
          id="btn-navbar-cart"
          onClick={onCartClick}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors focus:outline-none"
          aria-label="Open cart"
        >
          <ShoppingCart className="h-5 w-5 text-white" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-[#1A237E]">
              {cartCount}
            </span>
          )}
        </button>

        {/* Notifications Bell */}
        <button
          id="btn-navbar-notifications"
          onClick={onNotificationClick}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors focus:outline-none"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5 text-white" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white border-2 border-[#1A237E]">
              {notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
