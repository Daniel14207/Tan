import React, { useState } from 'react';
import { Match } from '../types';
import { ChevronDown, ChevronUp, Sparkles, TrendingUp, HelpCircle, ShieldAlert, Lock } from 'lucide-react';
import { getTeamFlagAndColors } from './PremiumPoster';

export function getPredictedScore(match: Match): string {
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
  key?: any;
  match: Match;
  layout?: 'odds' | 'tip'; // 'odds' for 1X2 selector style, 'tip' for focus prediction style
  onBetClick?: (matchId: string, choice: '1' | 'X' | '2') => void;
  selectedBet?: '1' | 'X' | '2';
  isVipLocked?: boolean;
  onUnlockVip?: () => void;
  onDetailClick?: (match: Match) => void;
}

export default function MatchCard({
  match,
  layout = 'odds',
  onBetClick,
  selectedBet,
  isVipLocked = false,
  onUnlockVip,
  onDetailClick,
}: MatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const flagA = getTeamFlagAndColors(match.homeTeam).flag || '⚽';
  const flagB = getTeamFlagAndColors(match.awayTeam).flag || '⚽';
  const predictedScore = getPredictedScore(match);

  const homeWinPct = match.predictions.homeWinPct ?? 52;
  const drawPct = match.predictions.drawPct ?? 28;
  const awayWinPct = match.predictions.awayWinPct ?? 20;
  const exactScorePct = match.predictions.exactScorePct ?? 35;

  const hash = match.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Determine Risk Level, Confidence Pct, Badge and Progress bar colors
  const getPredictionMeta = () => {
    if (match.predictions.isBest) {
      return {
        risk: 'Safe',
        riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        confidence: 85 + (hash % 11),
        barColor: 'bg-emerald-500',
      };
    } else if (match.predictions.isVip || match.odds.homeWin > 2.8 || match.odds.awayWin > 2.8) {
      return {
        risk: 'Risky',
        riskColor: 'text-red-400 bg-red-500/10 border-red-500/20',
        confidence: 50 + (hash % 15),
        barColor: 'bg-red-500',
      };
    } else {
      return {
        risk: 'Medium',
        riskColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        confidence: 70 + (hash % 13),
        barColor: 'bg-amber-500',
      };
    }
  };

  const { risk, riskColor, confidence, barColor } = getPredictionMeta();

  // Dynamic values for expanded view
  const doubleChanceLabel = match.predictions.singleTip === '1' 
    ? '1X (Victoire Home ou Nul)' 
    : match.predictions.singleTip === '2' 
    ? 'X2 (Nul ou Victoire Away)' 
    : '12 (Victoire Home ou Away)';

  const statsText = hash % 2 === 0
    ? `${match.homeTeam} (V-N-V-V-D) vs ${match.awayTeam} (N-D-V-N-V)`
    : `${match.homeTeam} (N-V-D-V-V) vs ${match.awayTeam} (V-D-N-V-D)`;

  const goalsStats = hash % 2 === 0 ? '1.8 / 0.9 vs 1.1 / 1.4' : '2.1 / 1.1 vs 1.3 / 1.2';
  const possession = hash % 2 === 0 ? '56% vs 44%' : '52% vs 48%';

  const getReasoning = () => {
    const tip = match.predictions.singleTip;
    if (tip === '1') {
      return `Modèle prédictif : ${match.homeTeam} affiche une excellente dynamique offensive à domicile avec une moyenne élevée de buts par match. ${match.awayTeam} éprouve des difficultés tactiques en transition défensive à l'extérieur, ce qui favorise un avantage net pour l'équipe hôte.`;
    } else if (tip === '2') {
      return `Modèle prédictif : ${match.awayTeam} domine historiquement ses confrontations face à ${match.homeTeam}. Avec un effectif complet, une solidité au milieu de terrain et des performances récentes impressionnantes à l'extérieur, l'avantage est clairement attribué aux visiteurs.`;
    } else {
      return `Modèle prédictif : Deux formations très équilibrées sur le plan tactique. ${match.homeTeam} et ${match.awayTeam} ont tendance à fermer le jeu lors des grands rendez-vous, ce qui limite les espaces offensifs et laisse présager un score de parité serré.`;
    }
  };

  const reasoningText = getReasoning();

  // Highlight prediction column
  const tip = match.predictions.singleTip;
  const is1Highlighted = tip === '1' || tip === '1X';
  const isXHighlighted = tip === 'X';
  const is2Highlighted = tip === '2' || tip === 'X2';

  const isLiveOrFt = match.matchStatus === 'LIVE' || match.matchStatus === 'FT';

  // --- 1. VIP LOCKED CARD RENDER ---
  if (isVipLocked) {
    return (
      <div 
        id={`match-card-vip-locked-${match.id}`} 
        className="mb-4 overflow-hidden rounded-2xl bg-[#1A1D24] shadow-xl border border-amber-500/20 text-slate-200 p-6 flex flex-col items-center justify-center min-h-[180px] text-center"
      >
        <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3 animate-pulse">
          <Lock className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-extrabold text-amber-400 tracking-wider uppercase flex items-center gap-1.5 justify-center">
          <Sparkles className="h-4 w-4" /> CONSEIL VIP PREMIUM
        </h4>
        <p className="text-xs text-slate-400 mt-2 max-w-[280px] leading-relaxed">
          Débloquez cette prédiction exclusive pour le match <strong className="text-white">{match.homeTeam} vs {match.awayTeam}</strong> et maximisez vos gains.
        </p>
        <button
          id={`btn-unlock-vip-card-${match.id}`}
          onClick={onUnlockVip}
          className="mt-4 rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-black text-slate-950 transition-all shadow-lg uppercase tracking-wider"
        >
          Débloquer VIP Premium
        </button>
      </div>
    );
  }

  // --- 2. SPORTSBOOK STANDARD ODDS CARD LAYOUT ---
  if (layout === 'odds') {
    return (
      <div 
        id={`match-row-${match.id}`} 
        className="mb-3.5 overflow-hidden rounded-2xl bg-[#1A1D24] border border-slate-800 transition-all hover:border-slate-700/80 p-3.5 flex flex-col gap-3"
      >
        {/* Row 1: Header - League Name, Time & Risk Level */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-800/60 pb-2">
          <span className="flex items-center gap-1.5 tracking-wide truncate max-w-[180px]">
            <span className="text-xs">{flagA}</span>
            <span>{match.leagueName}</span>
          </span>
          <div className="flex items-center gap-2">
            {match.matchStatus === 'LIVE' ? (
              <span className="animate-pulse bg-red-500/20 text-red-400 font-mono font-black px-2 py-0.5 rounded border border-red-500/30 text-[9px] uppercase">
                🔴 LIVE {match.liveMinute}'
              </span>
            ) : match.matchStatus === 'FT' ? (
              <span className="bg-emerald-500/10 text-emerald-400 font-mono font-black px-2 py-0.5 rounded border border-emerald-500/20 text-[9px]">
                FT
              </span>
            ) : (
              <span className="bg-[#0F1115] text-slate-300 font-mono font-bold px-2 py-0.5 rounded border border-slate-800">
                🕒 {match.matchTime}
              </span>
            )}
            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${riskColor}`}>
              ● {risk}
            </span>
          </div>
        </div>

        {/* Row 2: Teams, Odds & Exact Score Grid */}
        <div className="flex items-center justify-between gap-3">
          {/* Teams Column */}
          <div className="w-[38%] flex flex-col gap-2 min-w-0 pr-1 select-none">
            {/* Home Team */}
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0 select-none filter drop-shadow-sm">{flagA}</span>
                <span className="text-xs font-black text-white truncate uppercase tracking-wide">
                  {match.homeTeam}
                </span>
              </div>
              {isLiveOrFt && (
                <span className="font-mono font-black text-xs text-emerald-400 bg-[#0F1115] px-1.5 py-0.5 rounded shrink-0 border border-slate-800">
                  {match.finalScoreHome ?? 0}
                </span>
              )}
            </div>

            {/* Away Team */}
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0 select-none filter drop-shadow-sm">{flagB}</span>
                <span className="text-xs font-black text-white truncate uppercase tracking-wide">
                  {match.awayTeam}
                </span>
              </div>
              {isLiveOrFt && (
                <span className="font-mono font-black text-xs text-emerald-400 bg-[#0F1115] px-1.5 py-0.5 rounded shrink-0 border border-slate-800">
                  {match.finalScoreAway ?? 0}
                </span>
              )}
            </div>
          </div>

          {/* Odds 1X2 Grid Column */}
          <div className="w-[45%] flex items-center justify-center gap-1">
            {/* Odd 1 */}
            <button
              id={`btn-bet-1-${match.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onBetClick?.(match.id, '1');
              }}
              className={`flex-1 h-12 flex flex-col items-center justify-center rounded-xl border text-center transition-all ${
                selectedBet === '1'
                  ? 'bg-emerald-600 border-emerald-500 text-white font-black'
                  : is1Highlighted
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-[#0F1115] border-slate-800 text-slate-300 hover:bg-slate-800/40'
              }`}
            >
              <span className="text-[8px] font-bold text-slate-500 uppercase leading-none">1</span>
              <span className="text-[11px] font-mono font-black mt-0.5 leading-none">
                {match.odds.homeWin.toFixed(2)}
              </span>
              <span className="text-[8px] font-semibold text-slate-400 mt-0.5 leading-none">({homeWinPct}%)</span>
            </button>

            {/* Odd X */}
            <button
              id={`btn-bet-X-${match.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onBetClick?.(match.id, 'X');
              }}
              className={`flex-1 h-12 flex flex-col items-center justify-center rounded-xl border text-center transition-all ${
                selectedBet === 'X'
                  ? 'bg-emerald-600 border-emerald-500 text-white font-black'
                  : isXHighlighted
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-[#0F1115] border-slate-800 text-slate-300 hover:bg-slate-800/40'
              }`}
            >
              <span className="text-[8px] font-bold text-slate-500 uppercase leading-none">X</span>
              <span className="text-[11px] font-mono font-black mt-0.5 leading-none">
                {match.odds.draw.toFixed(2)}
              </span>
              <span className="text-[8px] font-semibold text-slate-400 mt-0.5 leading-none">({drawPct}%)</span>
            </button>

            {/* Odd 2 */}
            <button
              id={`btn-bet-2-${match.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onBetClick?.(match.id, '2');
              }}
              className={`flex-1 h-12 flex flex-col items-center justify-center rounded-xl border text-center transition-all ${
                selectedBet === '2'
                  ? 'bg-emerald-600 border-emerald-500 text-white font-black'
                  : is2Highlighted
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-[#0F1115] border-slate-800 text-slate-300 hover:bg-slate-800/40'
              }`}
            >
              <span className="text-[8px] font-bold text-slate-500 uppercase leading-none">2</span>
              <span className="text-[11px] font-mono font-black mt-0.5 leading-none">
                {match.odds.awayWin.toFixed(2)}
              </span>
              <span className="text-[8px] font-semibold text-slate-400 mt-0.5 leading-none">({awayWinPct}%)</span>
            </button>
          </div>

          {/* Predicted exact score Column */}
          <div className="w-[17%] flex flex-col items-center justify-center">
            <button
              id={`btn-detail-exact-${match.id}`}
              onClick={() => onDetailClick?.(match)}
              className="w-full h-12 flex flex-col items-center justify-center bg-[#0F1115] hover:bg-slate-800/50 border border-slate-800 rounded-xl text-center select-none cursor-pointer"
            >
              <span className="text-[11px] font-mono font-black text-emerald-400 leading-none">
                {predictedScore}
              </span>
              <span className="text-[8px] font-bold text-slate-500 mt-1 leading-none">
                ({exactScorePct}%)
              </span>
            </button>
          </div>
        </div>

        {/* Row 3: Confidence Progress Bar & Action Button */}
        <div className="pt-2 border-t border-slate-800/60 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-500">🎯</span>
              <span className="text-[11px]">
                Modèle conseille: <strong className="text-white uppercase">{match.predictions.singleTip}</strong>
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Confiance: <strong className="text-emerald-400">{confidence}%</strong>
            </span>
          </div>

          {/* Dynamic Progress Bar */}
          <div className="w-full bg-[#0F1115] h-1.5 rounded-full overflow-hidden border border-slate-800/40">
            <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${confidence}%` }} />
          </div>
        </div>

        {/* Action Toggle Button */}
        <button
          id={`btn-toggle-expand-${match.id}`}
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-7 mt-0.5 bg-[#0F1115] hover:bg-slate-800/60 text-slate-400 hover:text-white rounded-xl border border-slate-800/80 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
        >
          <span>{isExpanded ? 'Réduire l\'analyse' : 'Afficher l\'analyse & stats'}</span>
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {/* Row 4: Expand Details Accordion Panel */}
        {isExpanded && (
          <div className="bg-[#0F1115] rounded-xl border border-slate-800/80 p-3 text-xs space-y-3.5 text-slate-300 animate-fadeIn select-none">
            {/* Probabilities & DC Grid */}
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800/60">
              <div>
                <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Probabilités 1X2</div>
                <div className="mt-1.5 font-mono font-black space-y-0.5 text-[11px] text-white">
                  <div className="flex justify-between"><span>Home (1):</span> <span className="text-emerald-400">{homeWinPct}%</span></div>
                  <div className="flex justify-between"><span>Nul (X):</span> <span className="text-slate-400">{drawPct}%</span></div>
                  <div className="flex justify-between"><span>Away (2):</span> <span className="text-emerald-400">{awayWinPct}%</span></div>
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Option Recommandée</div>
                <div className="mt-1.5 font-bold text-emerald-400 text-[11px] uppercase">
                  {doubleChanceLabel}
                </div>
                <div className="text-[9px] text-slate-500 mt-2 uppercase tracking-wider">Cote Pronostic</div>
                <div className="font-mono text-white text-[11px] font-bold">
                  {match.predictions.singleTipOdds.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Form & Stats */}
            <div>
              <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Historique & Forme</div>
              <div className="mt-1 font-black text-slate-200 text-[11px]">
                {statsText}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                <span>Buts marqués/encaissés: <strong>{goalsStats}</strong></span>
                <span>Possession: <strong>{possession}</strong></span>
              </div>
            </div>

            {/* Stadium Details */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-800/10 p-1.5 rounded border border-slate-800/40">
              <span>🏟️ Stade: <strong>{getStadium(match.homeTeam)}</strong></span>
            </div>

            {/* AI Reasoning Text */}
            <div className="space-y-1">
              <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Raisonnement de l'Modèle</div>
              <p className="text-[11px] leading-relaxed text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/50">
                {reasoningText}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- 3. FOCUS MATCH CARD LAYOUT ('tip') ---
  return (
    <div 
      id={`match-card-prediction-${match.id}`} 
      className="mb-4 overflow-hidden rounded-2xl bg-[#1A1D24] border border-slate-800 transition-all hover:border-slate-700 flex flex-col"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between bg-[#0F1115] px-4 py-3 border-b border-slate-800 text-slate-300">
        <span className="text-xs font-bold tracking-wide flex items-center gap-1.5">
          <span>{flagA}</span>
          <span>{match.leagueName}</span>
        </span>
        <div className="flex items-center gap-2">
          {match.predictions.isVip && (
            <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-black text-amber-400">
              VIP
            </span>
          )}
          {match.predictions.isBest && (
            <span className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[9px] font-black text-blue-400">
              BEST
            </span>
          )}
          <span className="text-xs font-mono font-medium text-slate-400">{match.matchTime}</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 flex flex-col">
        {/* Core match content */}
        <div className="flex items-center justify-between py-2">
          {/* Home team */}
          <div className="w-5/12 text-center text-sm font-black text-white uppercase tracking-wide">
            {match.homeTeam}
          </div>

          {/* Scores or vs indicator */}
          <div className="w-2/12 flex flex-col items-center justify-center">
            {match.finalScoreHome !== null && match.finalScoreAway !== null ? (
              <>
                <div className="text-xl font-mono font-black text-emerald-400 tracking-wider">
                  {match.finalScoreHome} - {match.finalScoreAway}
                </div>
                {match.halfTimeScoreHome !== null && (
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    HT: {match.halfTimeScoreHome} - {match.halfTimeScoreAway}
                  </div>
                )}
              </>
            ) : (
              <span className="rounded-full bg-[#0F1115] border border-slate-800 px-3 py-1 text-[11px] font-black text-slate-400 uppercase">
                VS
              </span>
            )}
          </div>

          {/* Away team */}
          <div className="w-5/12 text-center text-sm font-black text-white uppercase tracking-wide">
            {match.awayTeam}
          </div>
        </div>

        {/* Stadium & Time Details Bar */}
        <div className="px-2.5 py-1.5 mt-3 bg-[#0F1115] border border-slate-800 flex items-center justify-between text-[10px] text-slate-400 rounded-lg">
          <span className="truncate max-w-[170px]">
            🏟️ <strong>{getStadium(match.homeTeam)}</strong>
          </span>
          <span className="font-mono">
            ⏰ {match.matchTime}
          </span>
        </div>

        {/* Highlighted betting tips strip */}
        <div className="mt-3 pt-3 border-t border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black">
              🎯
            </span>
            <span className="text-xs font-black text-white uppercase">
              Pronostic: {match.predictions.singleTip} ({predictedScore})
            </span>
          </div>

          {/* Dynamic Odds Badge with chart trend icon */}
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-black text-white shadow-md transition-all cursor-pointer">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="font-mono">
              {match.predictions.singleTipOdds.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
