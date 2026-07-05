/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Menu, ShoppingCart, Bell } from 'lucide-react';

interface NavbarProps {
  title: string;
  cartCount: number;
  notificationCount: number;
  secondsRemaining?: number;
  cycleSeconds?: number;
  onMenuClick: () => void;
  onCartClick: () => void;
  onNotificationClick: () => void;
}

export default function Navbar({
  title,
  cartCount,
  notificationCount,
  secondsRemaining,
  cycleSeconds,
  onMenuClick,
  onCartClick,
  onNotificationClick,
}: NavbarProps) {
  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
    const ss = (seconds % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const getCycleTimerDisplay = () => {
    if (cycleSeconds === undefined) {
      if (secondsRemaining === undefined) return null;
      return secondsRemaining <= 20 ? (
        <span className="flex items-center gap-1 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block animate-pulse" />
          RÉSULTATS : {secondsRemaining}s
        </span>
      ) : secondsRemaining > 105 ? (
        <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100">
          PRE-MATCH
        </span>
      ) : (
        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
          LIVE : {formatTime(secondsRemaining)}
        </span>
      );
    }
    
    if (cycleSeconds < 120) {
      const left = 120 - cycleSeconds;
      const mm = Math.floor(left / 60).toString().padStart(2, '0');
      const ss = (left % 60).toString().padStart(2, '0');
      return (
        <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full border border-emerald-150 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
          PARIS OUVERTS : {mm}:{ss}
        </span>
      );
    } else if (cycleSeconds < 145) {
      const elapsed = cycleSeconds - 120;
      const step = Math.min(Math.floor((elapsed / 25) * 10), 9);
      const firstHalfMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45];
      const liveMin = firstHalfMinutes[step];
      return (
        <span className="flex items-center gap-1 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full border border-red-200 font-extrabold animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block animate-ping" />
          DIRECT 1ÈRE MI-TEMPS : {liveMin}'
        </span>
      );
    } else if (cycleSeconds < 150) {
      return (
        <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200 font-extrabold animate-pulse">
          ⏸️ MI-TEMPS
        </span>
      );
    } else if (cycleSeconds < 175) {
      const elapsed = cycleSeconds - 150;
      const step = Math.min(Math.floor((elapsed / 25) * 10), 9);
      const secondHalfMinutes = [46, 50, 55, 60, 65, 70, 75, 80, 85, 90];
      const liveMin = secondHalfMinutes[step];
      return (
        <span className="flex items-center gap-1 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full border border-red-200 font-extrabold animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block animate-ping" />
          DIRECT 2ÈME MI-TEMPS : {liveMin}'
        </span>
      );
    } else {
      const elapsed = 190 - cycleSeconds;
      return (
        <span className="flex items-center gap-1 bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full border border-slate-200 font-bold">
          🏁 RÉSULTAT FINAL ({elapsed}s)
        </span>
      );
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-white px-4 text-slate-900 shadow-sm border-b border-gray-200">
      {/* Left Menu Button */}
      <button
        id="btn-navbar-menu"
        onClick={onMenuClick}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none border border-gray-200"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-gray-650" />
      </button>

      {/* Center Title & Countdown */}
      <div className="flex flex-col items-center justify-center text-center select-none truncate px-1">
        <h1 className="text-[10px] font-black tracking-widest uppercase text-slate-800 font-sans leading-none">
          {title}
        </h1>
        <div className="flex items-center gap-1 mt-1 font-mono text-[9px] font-black uppercase">
          {getCycleTimerDisplay()}
        </div>
      </div>

      {/* Right Icons: Cart & Bell */}
      <div className="flex items-center gap-2">
        {/* Shopping Cart */}
        <button
          id="btn-navbar-cart"
          onClick={onCartClick}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none border border-gray-200"
          aria-label="Open cart"
        >
          <ShoppingCart className="h-5 w-5 text-gray-650" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-black text-white border-2 border-white">
              {cartCount}
            </span>
          )}
        </button>

        {/* Notifications Bell */}
        <button
          id="btn-navbar-notifications"
          onClick={onNotificationClick}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none border border-gray-200"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5 text-gray-650" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white border-2 border-white">
              {notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
