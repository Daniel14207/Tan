/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Match {
  id: string;
  leagueId: string;
  leagueName: string;
  round: string; // e.g. "Journée 1", "Journée 2"
  matchTime: string; // e.g. "20:00"
  date: string; // e.g. "2026-06-30"
  homeTeam: string;
  awayTeam: string;
  homeLogo: string; // Color gradient or acronym background
  awayLogo: string;
  finalScoreHome: number | null;
  finalScoreAway: number | null;
  halfTimeScoreHome: number | null;
  halfTimeScoreAway: number | null;
  goalMinutes: {
    home: string[]; // e.g. ["12'", "44'"]
    away: string[]; // e.g. ["78'"]
  };
  matchStatus: 'FT' | 'LIVE' | 'Pending';
  liveMinute?: number;
  odds: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  predictions: {
    btts: 'Yes' | 'No';
    bttsOdds: number;
    overUnder25: 'Over' | 'Under';
    overUnderOdds: number;
    singleTip: string; // e.g. "1" or "X" or "2" or "1X"
    singleTipOdds: number;
    htFt: string; // e.g. "1/1", "X/1"
    htFtOdds: number;
    isVip: boolean;
    isBest: boolean;
    isFree: boolean;
    status: 'Pending' | 'Won' | 'Lost';
  };
}

export interface League {
  id: string;
  name: string;
  country: string;
  logo: string;
  matchesCount: number;
  liveCount: number;
  ftCount: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  date: string;
  read: boolean;
}

export interface SupportMessage {
  id: string;
  sender: 'user' | 'support';
  text: string;
  timestamp: string;
}

export interface UserAccount {
  userId: string;
  username: string;
  phoneNumber: string;
  dob: string;
  passwordHash: string;
  isVip: boolean;
  isSuspended: boolean;
  createdAt: string;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userPhone: string;
  method: 'orange' | 'airtel' | 'mvola' | 'usdt';
  reference: string;
  amount: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: string;
}

export interface LiveSignal {
  id: string;
  type: 'signal' | 'announcement';
  title: string;
  content: string;
  matchInfo?: string;
  prediction?: string;
  odds?: number;
  isPremium: boolean;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: string;
}

