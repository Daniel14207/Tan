/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  X,
  MessageSquare,
  Star,
  Trophy,
  Calendar,
  Ticket,
  Clock,
  CircleDot,
  RefreshCw,
  Zap,
  Gauge,
  Mail,
  FileText,
  Lock,
  User,
  RotateCcw,
  LogOut,
  ChevronRight,
  Settings,
  Flame,
  Activity,
} from 'lucide-react';

import { useState } from 'react';

interface MoreSheetProps {
  onClose: () => void;
  onNavigateToView: (view: string) => void;
  onResetOnboarding: () => void;
  onLogout: () => void;
  onOpenSupport: () => void;
  onOpenPremium: () => void;
  onOpenAdmin?: () => void;
}

export default function MoreSheet({
  onClose,
  onNavigateToView,
  onResetOnboarding,
  onLogout,
  onOpenSupport,
  onOpenPremium,
  onOpenAdmin,
}: MoreSheetProps) {
  const [clicks, setClicks] = useState(0);

  const handleVersionClick = () => {
    const nextClicks = clicks + 1;
    if (nextClicks >= 5) {
      setClicks(0);
      if (onOpenAdmin) onOpenAdmin();
    } else {
      setClicks(nextClicks);
    }
  };
  return (
    <div className="w-full bg-[#f8fafc] min-h-screen text-slate-800 pb-16">
      {/* Top Header Row with Profile */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-100 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e0f2fe] text-blue-600 font-bold shadow-inner">
            <User className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-base font-black tracking-tight text-slate-900 leading-tight">
              More
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              livasetea@gmail.com
            </span>
          </div>
        </div>
        <button
          id="btn-more-close"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all focus:outline-none"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Support & Upgrade Cards */}
        <div className="space-y-3">
          {/* Chat / Support */}
          <button
            id="btn-more-support"
            onClick={onOpenSupport}
            className="w-full flex items-center justify-between p-4 rounded-3xl bg-white hover:bg-slate-50 border border-slate-100 shadow-sm transition-all text-left focus:outline-none"
          >
            <div className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <MessageSquare className="h-5 w-5" />
              </span>
              <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Chat / Support
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                1
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          </button>

          {/* Passer à Premium */}
          <button
            id="btn-more-premium"
            onClick={onOpenPremium}
            className="w-full flex items-center justify-between p-4 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-100 shadow-sm transition-all text-left focus:outline-none"
          >
            <div className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <Star className="h-5 w-5 fill-current" />
              </span>
              <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                Passer à Premium
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-amber-600" />
          </button>
        </div>

        {/* Featured Competition highlight: World Cup 2026 */}
        <div
          id="btn-more-featured-comp"
          onClick={() => onNavigateToView('home')}
          className="flex items-center justify-between p-4 rounded-3xl bg-white hover:bg-slate-50 border border-slate-200/65 shadow-sm transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
              <Trophy className="h-6 w-6" />
            </span>
            <div>
              <span className="inline-flex rounded-full bg-blue-900 text-white text-[10px] px-2 py-0.5 font-bold mb-1">
                1 ligues
              </span>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                World Cup 2026
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">
                World Cup-only bulletin and match de...
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </div>

        {/* Category Section: Tips */}
        <div>
          <h3 className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider mb-3 px-1">
            <Flame className="h-4 w-4 text-orange-500" />
            Tips
          </h3>
          <div className="grid grid-cols-2 gap-3.5">
            {/* Free Tips */}
            <button
              id="btn-shortcut-free-tips"
              onClick={() => onNavigateToView('free')}
              className="bg-white hover:bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm transition-all text-left flex flex-col justify-between min-h-[105px] focus:outline-none"
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Calendar className="h-4 w-4" />
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
              <span className="text-xs font-black text-slate-800 mt-2">Free Tips</span>
            </button>

            {/* Best Tips */}
            <button
              id="btn-shortcut-best-tips"
              onClick={() => onNavigateToView('best')}
              className="bg-white hover:bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm transition-all text-left flex flex-col justify-between min-h-[105px] focus:outline-none"
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Star className="h-4 w-4" />
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
              <span className="text-xs font-black text-slate-800 mt-2">Best Tips</span>
            </button>

            {/* VIP Tips */}
            <button
              id="btn-shortcut-vip-tips"
              onClick={() => onNavigateToView('vip')}
              className="bg-white hover:bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm transition-all text-left flex flex-col justify-between min-h-[105px] focus:outline-none"
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Trophy className="h-4 w-4" />
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
              <span className="text-xs font-black text-slate-800 mt-2">VIP Tips</span>
            </button>

            {/* Single Tips */}
            <button
              id="btn-shortcut-single-tips"
              onClick={() => onNavigateToView('single')}
              className="bg-white hover:bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm transition-all text-left flex flex-col justify-between min-h-[105px] focus:outline-none"
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Ticket className="h-4 w-4" />
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
              <span className="text-xs font-black text-slate-800 mt-2">Single Tips</span>
            </button>

            {/* HT-FT */}
            <button
              id="btn-shortcut-htft"
              onClick={() => onNavigateToView('htft')}
              className="bg-white hover:bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm transition-all text-left flex flex-col justify-between min-h-[105px] focus:outline-none"
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Clock className="h-4 w-4" />
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
              <span className="text-xs font-black text-slate-800 mt-2">HT-FT</span>
            </button>

            {/* Over-Under */}
            <button
              id="btn-shortcut-overunder"
              onClick={() => onNavigateToView('overunder')}
              className="bg-white hover:bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm transition-all text-left flex flex-col justify-between min-h-[105px] focus:outline-none"
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <CircleDot className="h-4 w-4" />
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
              <span className="text-xs font-black text-slate-800 mt-2">Over-Under</span>
            </button>

            {/* BTTS */}
            <button
              id="btn-shortcut-btts"
              onClick={() => onNavigateToView('btts')}
              className="bg-white hover:bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm transition-all text-left flex flex-col justify-between min-h-[105px] col-span-2 focus:outline-none"
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <RefreshCw className="h-4 w-4" />
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
              <span className="text-xs font-black text-slate-800 mt-2">BTTS (Both Teams To Score)</span>
            </button>
          </div>
        </div>

        {/* Category Section: Live */}
        <div>
          <h3 className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider mb-3 px-1">
            <Activity className="h-4 w-4 text-emerald-500" />
            Live
          </h3>
          <div className="grid grid-cols-2 gap-3.5">
            {/* Live Tips */}
            <button
              id="btn-shortcut-live-tips"
              onClick={() => onNavigateToView('live-tips')}
              className="bg-white hover:bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm transition-all text-left flex flex-col justify-between min-h-[105px] focus:outline-none"
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Zap className="h-4 w-4" />
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
              <span className="text-xs font-black text-slate-800 mt-2">Live Tips</span>
            </button>

            {/* Live Scores */}
            <button
              id="btn-shortcut-live-scores"
              onClick={() => onNavigateToView('live-scores')}
              className="bg-white hover:bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-sm transition-all text-left flex flex-col justify-between min-h-[105px] focus:outline-none"
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Gauge className="h-4 w-4" />
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
              <span className="text-xs font-black text-slate-800 mt-2">Live Scores</span>
            </button>
          </div>
        </div>

        {/* Category Section: Settings */}
        <div>
          <h3 className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider mb-3 px-1">
            <Settings className="h-4 w-4 text-slate-500" />
            Settings
          </h3>
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
            {/* Suggestions/Demandes */}
            <button
              id="btn-settings-suggestions"
              onClick={onOpenSupport}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 text-left focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Suggestions/Demandes</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>

            {/* Conditions d'utilisation */}
            <button
              id="btn-settings-terms"
              onClick={() => onNavigateToView('terms')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 text-left focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Conditions d'utilisation</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>

            {/* Politique de confidentialité */}
            <button
              id="btn-settings-privacy"
              onClick={() => onNavigateToView('privacy')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 text-left focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Politique de confidentialité</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>

            {/* Profil */}
            <button
              id="btn-settings-profile"
              onClick={() => onNavigateToView('profile')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 text-left focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Profil</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>

            {/* Reset Onboarding */}
            <button
              id="btn-settings-reset"
              onClick={onResetOnboarding}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 text-left focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Reset onboarding</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>

            {/* Se déconnecter */}
            <button
              id="btn-settings-logout"
              onClick={onLogout}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 text-left focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-4 w-4 text-red-500" />
                <span className="text-xs font-bold text-red-600">Se déconnecter</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Footer Version Details */}
        <div 
          onClick={handleVersionClick}
          className="pt-4 text-center text-[10px] text-slate-400 font-medium cursor-pointer select-none active:opacity-40"
        >
          Version 2.0.2 · Powered by Sourspark
        </div>
      </div>
    </div>
  );
}
