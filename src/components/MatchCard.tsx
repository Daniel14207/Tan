/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Match } from '../types';
import { ArrowRight, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';

interface MatchCardProps {
  key?: string;
  match: Match;
  layout?: 'odds' | 'tip'; // 'odds' for 1X2 selector style, 'tip' for focus prediction style
  onBetClick?: (matchId: string, choice: '1' | 'X' | '2') => void;
  selectedBet?: '1' | 'X' | '2';
  isVipLocked?: boolean;
  onUnlockVip?: () => void;
}

export default function MatchCard({
  match,
  layout = 'odds',
  onBetClick,
  selectedBet,
  isVipLocked = false,
  onUnlockVip,
}: MatchCardProps) {
  const getStadium = (homeTeam: string) => {
    const stadiums: Record<string, string> = {
      'Arsenal': 'Emirates Stadium',
      'Chelsea': 'Stamford Bridge',
      'Liverpool': 'Anfield',
      'Manchester United': 'Old Trafford',
      'Manchester City': 'Etihad Stadium',
      'Barcelona': 'Spotify Camp Nou',
      'Real Madrid': 'Santiago Bernabéu',
      'Juventus': 'Allianz Stadium',
      'AC Milan': 'San Siro',
      'Inter Milan': 'Stadio Giuseppe Meazza',
      'PSG': 'Parc des Princes',
      'Marseille': 'Orange Vélodrome',
      'Bayern Munich': 'Allianz Arena',
      'Dortmund': 'Signal Iduna Park',
      'Tottenham': 'Tottenham Hotspur Stadium',
    };
    return stadiums[homeTeam] || `${homeTeam} Arena`;
  };

  // Generate beautiful initial circle logo
  const renderTeamLogo = (team: string, classes: string) => {
    const initial = team.substring(0, 2).toUpperCase();
    return (
      <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold shadow-md select-none ${classes}`}>
        {initial}
      </div>
    );
  };

  const getStatusBadge = () => {
    if (match.matchStatus === 'FT') {
      return (
        <span className="rounded-md bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
          FT
        </span>
      );
    }
    if (match.matchStatus === 'LIVE') {
      return (
        <span className="animate-pulse rounded-md bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
          LIVE {match.liveMinute}'
        </span>
      );
    }
    return (
      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
        {match.matchTime}
      </span>
    );
  };

  // 1X2 Style Card
  if (layout === 'odds') {
    return (
      <div id={`match-card-${match.id}`} className="mb-4 overflow-hidden rounded-2xl bg-white shadow-md border border-slate-100 transition-all hover:shadow-lg">
        {/* Card Header */}
        <div className="flex items-center justify-between bg-slate-50/80 px-4 py-2.5 border-b border-slate-100">
          <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            🏆 {match.leagueName} matches
          </div>
          {getStatusBadge()}
        </div>

        {/* Card Body - Teams */}
        <div className="p-5 flex items-center justify-between">
          {/* Home Team */}
          <div className="flex flex-col items-center w-5/12 text-center">
            {renderTeamLogo(match.homeTeam, match.homeLogo)}
            <span className="mt-2 text-sm font-bold text-slate-800 font-sans truncate w-full">
              {match.homeTeam}
            </span>
            {match.finalScoreHome !== null && (
              <span className="mt-1 text-2xl font-black text-slate-900">
                {match.finalScoreHome}
              </span>
            )}
          </div>

          {/* Time & Arrow */}
          <div className="flex flex-col items-center w-2/12 justify-center">
            <span className="text-sm font-black text-slate-700 font-mono">
              {match.matchTime}
            </span>
            <span className="text-[10px] font-bold text-slate-400 mt-0.5">VS</span>
            <ArrowRight className="h-4 w-4 text-blue-500 mt-2 rotate-90 sm:rotate-0" />
            
            {/* Goal Minutes */}
            {(match.goalMinutes.home.length > 0 || match.goalMinutes.away.length > 0) && (
              <div className="text-[9px] text-slate-400 text-center mt-2 leading-tight hidden sm:block">
                {match.goalMinutes.home.join(', ')} / {match.goalMinutes.away.join(', ')}
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center w-5/12 text-center">
            {renderTeamLogo(match.awayTeam, match.awayLogo)}
            <span className="mt-2 text-sm font-bold text-slate-800 font-sans truncate w-full">
              {match.awayTeam}
            </span>
            {match.finalScoreAway !== null && (
              <span className="mt-1 text-2xl font-black text-slate-900">
                {match.finalScoreAway}
              </span>
            )}
          </div>
        </div>

        {/* Stadium & Time Details Bar */}
        <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5 truncate">
            🏟️ <strong className="font-bold text-slate-600">{getStadium(match.homeTeam)}</strong>
          </span>
          <span className="flex items-center gap-1 font-mono text-slate-400">
            📅 {match.date.split('-').reverse().join('/')} · ⏰ {match.matchTime}
          </span>
        </div>

        {/* Odds Row */}
        <div className="bg-slate-50/50 px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Bet 1 */}
          <button
            id={`btn-odds-1-${match.id}`}
            onClick={() => onBetClick?.(match.id, '1')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all focus:outline-none ${
              selectedBet === '1'
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-500 hover:text-emerald-600'
            }`}
          >
            <span className="opacity-60 text-[10px]">1</span>
            <span>{match.odds.homeWin.toFixed(2)}</span>
          </button>

          {/* Bet X */}
          <button
            id={`btn-odds-X-${match.id}`}
            onClick={() => onBetClick?.(match.id, 'X')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all focus:outline-none ${
              selectedBet === 'X'
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-500 hover:text-emerald-600'
            }`}
          >
            <span className="opacity-60 text-[10px]">X</span>
            <span>{match.odds.draw.toFixed(2)}</span>
          </button>

          {/* Bet 2 */}
          <button
            id={`btn-odds-2-${match.id}`}
            onClick={() => onBetClick?.(match.id, '2')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold transition-all focus:outline-none ${
              selectedBet === '2'
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-500 hover:text-emerald-600'
            }`}
          >
            <span className="opacity-60 text-[10px]">2</span>
            <span>{match.odds.awayWin.toFixed(2)}</span>
          </button>
        </div>
      </div>
    );
  }

  // Focus Prediction / Tip Style Card
  const wonLostStyle = match.predictions.status === 'Won'
    ? 'bg-green-100 text-green-700'
    : match.predictions.status === 'Lost'
    ? 'bg-red-100 text-red-600'
    : 'bg-amber-100 text-amber-700';

  if (isVipLocked) {
    return (
      <div id={`match-card-vip-locked-${match.id}`} className="mb-4 overflow-hidden rounded-2xl bg-white shadow-md border border-slate-100 text-slate-800 p-6 flex flex-col items-center justify-center min-h-[160px] text-center">
        <Sparkles className="h-8 w-8 text-amber-500 mb-2.5 animate-pulse" />
        <h4 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase">CONSEIL VIP PREMIUM</h4>
        <p className="text-xs text-slate-500 mt-1.5 max-w-[280px] leading-relaxed">
          Débloquez cette prédiction {match.homeTeam} vs {match.awayTeam} et accédez aux meilleures analyses.
        </p>
        <button
          id={`btn-unlock-vip-card-${match.id}`}
          onClick={onUnlockVip}
          className="mt-4 rounded-xl bg-[#1A237E] hover:bg-indigo-900 px-5 py-2 text-xs font-bold text-white transition-all shadow-md"
        >
          Débloquer maintenant
        </button>
      </div>
    );
  }

  return (
    <div id={`match-card-prediction-${match.id}`} className="mb-4 overflow-hidden rounded-2xl bg-white shadow-md border border-slate-100 transition-all hover:shadow-lg">
      {/* Header bar styled like screenshot: Light slate bar */}
      <div className="flex items-center justify-between bg-slate-50/80 px-4 py-2.5 border-b border-slate-100 text-slate-800">
        <span className="text-xs font-bold tracking-wide">
          {match.leagueName}
        </span>
        <div className="flex items-center gap-2">
          {match.predictions.isVip && (
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              VIP
            </span>
          )}
          {match.predictions.isBest && (
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
              BEST
            </span>
          )}
          <span className="text-xs font-medium text-slate-500">{match.matchTime}</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 flex flex-col">
        {/* Core match content */}
        <div className="flex items-center justify-between py-2">
          {/* Home team */}
          <div className="w-5/12 text-center text-sm font-extrabold text-slate-800">
            {match.homeTeam}
          </div>

          {/* Scores or Pending indicator */}
          <div className="w-2/12 flex flex-col items-center justify-center">
            {match.finalScoreHome !== null && match.finalScoreAway !== null ? (
              <>
                <div className="inline-flex items-center gap-1">
                  {match.predictions.status === 'Won' && (
                    <span className="rounded-md bg-green-100 text-green-700 px-2 py-0.5 text-[9px] font-bold">
                      ✓ Gagné
                    </span>
                  )}
                  {match.predictions.status === 'Lost' && (
                    <span className="rounded-md bg-red-100 text-red-600 px-2 py-0.5 text-[9px] font-bold">
                      ✗ Perdu
                    </span>
                  )}
                </div>
                <div className="text-xl font-black text-slate-800 tracking-wider mt-1">
                  {match.finalScoreHome} - {match.finalScoreAway}
                </div>
                {match.halfTimeScoreHome !== null && (
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                    HT: {match.halfTimeScoreHome} - {match.halfTimeScoreAway}
                  </div>
                )}
              </>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                vs
              </span>
            )}
          </div>

          {/* Away team */}
          <div className="w-5/12 text-center text-sm font-extrabold text-slate-800">
            {match.awayTeam}
          </div>
        </div>

        {/* Stadium & Time Details Bar */}
        <div className="px-1 py-1.5 mt-2 bg-slate-50/40 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium rounded-lg">
          <span className="flex items-center gap-1 truncate max-w-[170px]">
            🏟️ <strong className="font-bold text-slate-600">{getStadium(match.homeTeam)}</strong>
          </span>
          <span className="flex items-center gap-1 font-mono text-slate-400">
            📅 {match.date.split('-').reverse().join('/')} · ⏰ {match.matchTime}
          </span>
        </div>

        {/* Highlighted betting tips strip */}
        <div className="mt-3 pt-3 border-t border-dashed border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
              ⚽
            </span>
            <span className="text-xs font-bold text-slate-800">
              {layout === 'tip' ? match.predictions.singleTip : `BTTS: ${match.predictions.btts}`}
            </span>
          </div>

          {/* Dynamic Odds Badge with chart trend icon */}
          <div className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>
              {(layout === 'tip' ? match.predictions.singleTipOdds : match.predictions.bttsOdds).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
