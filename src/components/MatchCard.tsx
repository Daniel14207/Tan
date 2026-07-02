/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Match } from '../types';
import { ArrowRight, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
import { getTeamFlagAndColors } from './PremiumPoster';

function getPredictedScore(match: Match): string {
  if (match.matchStatus === 'FT' && match.finalScoreHome !== null && match.finalScoreAway !== null) {
    return `${match.finalScoreHome}-${match.finalScoreAway}`;
  }
  const hash = match.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const tip = match.predictions.singleTip;
  if (tip === '1') {
    const homeGoals = (hash % 2) + 1; // 1 or 2
    const awayGoals = hash % homeGoals; // 0 or 1
    return `${homeGoals}-${awayGoals}`;
  } else if (tip === '2') {
    const awayGoals = (hash % 2) + 1;
    const homeGoals = hash % awayGoals;
    return `${homeGoals}-${awayGoals}`;
  } else {
    const goals = hash % 2; // 0 or 1
    return `${goals}-${goals}`;
  }
}

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
    const flagA = getTeamFlagAndColors(match.homeTeam).flag;
    const flagB = getTeamFlagAndColors(match.awayTeam).flag;
    const predictedScore = getPredictedScore(match);
    
    // Determine prediction type and colors
    const tip = match.predictions.singleTip;
    let predColor = 'bg-emerald-500 text-white'; // Default Green for 1
    if (tip === 'X') {
      predColor = 'bg-amber-400 text-amber-950'; // Yellow for X
    } else if (tip === '2') {
      predColor = 'bg-blue-600 text-white'; // Blue for 2
    } else if (tip === '1X') {
      predColor = 'bg-emerald-500 text-white';
    } else if (tip === 'X2') {
      predColor = 'bg-blue-600 text-white';
    }

    const isSelected = selectedBet === tip;

    return (
      <div 
        id={`match-card-${match.id}`} 
        className="mb-3.5 overflow-hidden rounded-3xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100/70 transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-4 flex items-center justify-between gap-4"
      >
        {/* Teams and VS Column */}
        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
          {/* Home Team */}
          <div className="flex items-center gap-2.5 w-[42%]">
            <span className="text-2xl select-none filter drop-shadow-sm shrink-0">{flagA}</span>
            <span className="text-xs font-black text-slate-800 font-sans truncate">
              {match.homeTeam}
            </span>
          </div>

          {/* VS Divider or Live/FT Score */}
          <div className="flex flex-col items-center justify-center shrink-0 w-12">
            {match.matchStatus === 'FT' && match.finalScoreHome !== null && match.finalScoreAway !== null ? (
              <div className="text-center">
                <span className="text-xs font-black text-slate-900 font-mono tracking-tighter bg-slate-100 px-2 py-1 rounded-lg">
                  {match.finalScoreHome}-{match.finalScoreAway}
                </span>
                <span className="text-[7px] font-black uppercase text-green-600 block mt-0.5 tracking-wider">FINI</span>
              </div>
            ) : match.matchStatus === 'LIVE' && match.finalScoreHome !== null && match.finalScoreAway !== null ? (
              <div className="text-center">
                <span className="text-xs font-black text-rose-600 font-mono tracking-tighter bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 animate-pulse">
                  {match.finalScoreHome}-{match.finalScoreAway}
                </span>
                <span className="text-[7px] font-black uppercase text-rose-600 block mt-0.5 tracking-wider">LIVE</span>
              </div>
            ) : (
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                VS
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-2.5 w-[42%] justify-end text-right">
            <span className="text-xs font-black text-slate-800 font-sans truncate order-1">
              {match.awayTeam}
            </span>
            <span className="text-2xl select-none filter drop-shadow-sm shrink-0 order-2">{flagB}</span>
          </div>
        </div>

        {/* Prediction Cards Column (Right aligned) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Prediction Main Card */}
          <button
            id={`btn-prediction-tip-${match.id}`}
            onClick={() => onBetClick?.(match.id, tip as any)}
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95 ${predColor} ${
              isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105' : ''
            }`}
          >
            <span className="text-[8px] font-bold uppercase tracking-wider opacity-75 leading-none">PRONO</span>
            <span className="text-base font-black tracking-tighter mt-1 leading-none">{tip}</span>
          </button>

          {/* Predicted Exact Score Card */}
          <div className="h-14 px-2.5 flex flex-col items-center justify-center bg-slate-50 border border-slate-100/60 rounded-2xl text-center select-none shrink-0 min-w-[56px]">
            <span className="text-[8px] font-bold uppercase text-slate-400 tracking-wider leading-none">SCORE</span>
            <span className="text-xs font-black font-mono text-slate-700 mt-1 leading-none">
              {predictedScore}
            </span>
          </div>
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
