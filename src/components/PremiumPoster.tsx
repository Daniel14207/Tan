/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, Clock } from 'lucide-react';
import { ParsedMatch } from '../types';

// Helper to determine team flags for national teams, or generate smart visual monograms for club teams
export function getTeamFlagAndColors(teamName: string): { flag: string; isNational: boolean } {
  const name = (teamName || '').toLowerCase().trim();

  // Flag map for national selections (French & English names) & famous clubs
  const flagMap: { [key: string]: string } = {
    'france': '🇫🇷', 'maroc': '🇲🇦', 'morocco': '🇲🇦', 'soudan': '🇸🇩', 'sudan': '🇸🇩',
    'ouganda': '🇺🇬', 'uganda': '🇺🇬', 'mozambique': '🇲🇿', 'nigeria': '🇳🇬', 'nigéria': '🇳🇬',
    'guinee equatoriale': '🇬🇶', 'guinée équatoriale': '🇬🇶', 'equatorial guinea': '🇬🇶',
    'botswana': '🇧🇼', 'mali': '🇲🇱', 'benin': '🇧🇯', 'bénin': '🇧🇯', 'zambie': '🇿🇲', 'zambia': '🇿🇲',
    'gabon': '🇬🇦', 'senegal': '🇸🇳', 'sénégal': '🇸🇳', 'burkina faso': '🇧🇫', 'burkina': '🇧🇫',
    'cote d\'ivoire': '🇨🇮', 'côte d\'ivoire': '🇨🇮', 'ivory coast': '🇨🇮', 'angola': '🇦🇴',
    'egypte': '🇪🇬', 'Égypte': '🇪🇬', 'egypt': '🇪🇬', 'dr congo': '🇨🇩', 'rd congo': '🇨🇩', 'congo': '🇨🇩',
    'algerie': '🇩🇿', 'algérie': '🇩🇿', 'algeria': '🇩🇿', 'comores': '🇰🇲', 'comoros': '🇰🇲',
    'cameroun': '🇨🇲', 'cameroon': '🇨🇲', 'afrique du sud': '🇿🇦', 'south africa': '🇿🇦',
    'tanzanie': '🇹🇿', 'tanzania': '🇹🇿', 'tunisie': '🇹🇳', 'tunisia': '🇹🇳', 'zimbabwe': '🇿🇼',
    'madagascar': '🇲🇬', 'barea': '🇲🇬', 'brésil': '🇧🇷', 'bresil': '🇧🇷', 'brazil': '🇧🇷',
    'argentine': '🇦🇷', 'argentina': '🇦🇷', 'allemagne': '🇩🇪', 'germany': '🇩🇪',
    'espagne': '🇪🇸', 'spain': '🇪🇸', 'italie': '🇮🇹', 'italy': '🇮🇹', 'angleterre': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'england': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'portugal': '🇵🇹', 'belgique': '🇧🇪', 'belgium': '🇧🇪',
    'pays-bas': '🇳🇱', 'netherlands': '🇳🇱', 'croatie': '🇭🇷', 'croatia': '🇭🇷',
    'uruguay': '🇺🇾', 'colombie': '🇨🇴', 'colombia': '🇨🇴', 'ghana': '🇬🇭',
    'suisse': '🇨🇭', 'switzerland': '🇨🇭', 'suède': '🇸🇪', 'sweden': '🇸🇪',
    'japon': '🇯🇵', 'japan': '🇯🇵', 'corée': '🇰🇷', 'korea': '🇰🇷', 'togo': '🇹🇬',
    'guinee': '🇬🇳', 'guinea': '🇬🇳', 'cap-vert': '🇨🇻', 'cape verde': '🇨🇻',
    'mauritanie': '🇲🇷', 'mauritania': '🇲🇷', 'libye': '🇱🇾', 'libya': '🇱🇾',
    // European & domestic clubs mapping
    'real madrid': '👑', 'bayern munich': '🔴⚪', 'bayern': '🔴⚪', 'man city': '🩵',
    'manchester city': '🩵', 'psg': '🔵🔴', 'paris saint-germain': '🔵🔴', 'paris sg': '🔵🔴',
    'arsenal': '🔴', 'inter milan': '🔵⚫', 'inter': '🔵⚫', 'barcelona': '🔵🔴',
    'barcelone': '🔵🔴', 'napoli': '🔵', 'naples': '🔵', 'manchester united': '👹',
    'man united': '👹', 'chelsea': '🔵', 'liverpool': '🔴', 'tottenham': '🐓',
    'newcastle': '⚪⚫', 'aston villa': '🦁', 'brighton': '🔵⚪', 'atletico madrid': '🔴⚪',
    'atlético madrid': '🔴⚪', 'sevilla': '⚪🔴', 'seville': '⚪🔴', 'real sociedad': '🔵⚪',
    'villarreal': '🟡', 'real betis': '🟢⚪', 'valencia': '🦇', 'valence': '🦇',
    'juventus': '⚪⚫', 'ac milan': '🔴⚫', 'milan': '🔴⚫', 'as roma': '🐺',
    'roma': '🐺', 'lazio': '🦅', 'atalanta': '🔵⚫', 'fiorentina': '🟣',
    'dortmund': '🟡⚫', 'borussia dortmund': '🟡⚫', 'rb leipzig': '🐂', 'leipzig': '🐂',
    'bayer leverkusen': '🔴⚫', 'leverkusen': '🔴⚫', 'eintracht frankfurt': '🦅',
    'frankfurt': '🦅', 'union berlin': '🔴⚪', 'freiburg': '🦅', 'fribourg': '🦅',
    'vfb stuttgart': '🔴⚪', 'stuttgart': '🔴⚪', 'lyon': '🔵🔴⚪', 'lille': '🔴🔵',
    'monaco': '🔴⚪', 'nice': '🔴⚫', 'rennes': '🔴⚫', 'nantes': '🟡🟢',
    'porto': '🔵⚪', 'benfica': '🦅', 'sporting cp': '🦁🟢', 'sporting': '🦁🟢',
    'braga': '🔴⚪', 'vitoria guimaraes': '⚪⚫', 'famalicao': '🔵', 'boavista': '🏁',
    'rio ave': '🟢⚪'
  };

  // Check direct names
  if (flagMap[name]) {
    return { flag: flagMap[name], isNational: true };
  }

  // Check if name contains any of the country keys
  for (const key of Object.keys(flagMap)) {
    if (name.includes(key)) {
      return { flag: flagMap[key], isNational: true };
    }
  }

  // Check if it has club keywords
  const clubKeywords = ['fc', 'united', 'utd', 'city', 'real', 'athletic', 'club', 'sporting', 'ac', 'inter', 'bayer', 'borussia', 'as', 'olympique', 'psg', 'hotspur', 'tottenham', 'arsenal', 'chelsea', 'liverpool', 'everton', 'villa', 'celta', 'betis', 'getafe', 'valencia', 'sevilla', 'sociedad', 'bilbao', 'atlético', 'atletico', 'barcelona', 'madrid', 'juventus', 'napoli', 'lazio', 'fiorentina', 'bologna', 'atalanta', 'roma', 'milan', 'bayern'];
  const hasClubKeywords = clubKeywords.some(keyword => name.includes(keyword));

  if (hasClubKeywords || name.length > 3) {
    // Generate a 1-3 letter monogram of the team name
    const words = teamName.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(w => w.length > 0);
    let monogram = '';
    if (words.length === 1) {
      monogram = words[0].slice(0, 2).toUpperCase();
    } else {
      monogram = words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
    }
    return { flag: monogram || '⚽', isNational: false };
  }

  // Default selection flag: standard soccer ball
  return { flag: '⚽', isNational: false };
}

// Stable deterministic hashing function to get color pair based on team name
export function getTeamColors(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c1 = Math.abs(hash % 360);
  const c2 = (c1 + 135) % 360;
  return {
    from: `hsl(${c1}, 75%, 45%)`,
    to: `hsl(${c2}, 85%, 25%)`,
    text: `hsl(${c1}, 95%, 96%)`
  };
}

// Global, robust, bulletproof parser of sports prediction texts
export function parsePastedPredictions(text: string): ParsedMatch[] {
  if (!text) return [];
  const lines = text.split('\n');
  const parsed: ParsedMatch[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Remove any markdown, numbers at start, or bullet indicators e.g., "1.", "•", "-"
    let cleanLine = trimmed.replace(/^[\s\d•\-\.\*]+/g, '').trim();

    // Look for score inside parentheses or brackets e.g., (2-0) or [1-1]
    let score = '';
    const scoreRegex = /(?:\(|\s|\[)(\d+[-:]\d+)(?:\)|\s|\])/;
    const scoreMatch = cleanLine.match(scoreRegex);
    if (scoreMatch) {
      score = scoreMatch[1].trim();
      cleanLine = cleanLine.replace(scoreMatch[0], ' ');
    }

    // Now look for prediction outcome (1, X, 2, 1X, X2, 12, etc.)
    let result = '';
    // Look for colons/dashes preceding prediction e.g. ": 1" or ": X"
    const predRegex = /[:\-]\s*\b(1[xX2]?|[xX2]|[xX2]1|12)\b/i;
    const predMatch = cleanLine.match(predRegex);
    if (predMatch) {
      result = predMatch[1].trim().toUpperCase();
      cleanLine = cleanLine.replace(predMatch[0], ' ');
    } else {
      // Look for a standalone prediction at the end
      const standalonePredRegex = /\b(1[xX2]?|[xX2]|[xX2]1|12)\b\s*$/i;
      const standaloneMatch = cleanLine.match(standalonePredRegex);
      if (standaloneMatch) {
        result = standaloneMatch[1].trim().toUpperCase();
        cleanLine = cleanLine.replace(standaloneMatch[0], ' ');
      }
    }

    if (!result) result = '1';

    // Now split the teams
    const teamSeparators = /\s+(?:vs\b\.?|VS\b\.?|v\b\.?|V\b\.?|\-)\s+/i;
    let homeTeam = '';
    let awayTeam = '';

    if (teamSeparators.test(cleanLine)) {
      const parts = cleanLine.split(teamSeparators);
      if (parts.length >= 2) {
        homeTeam = parts[0].trim();
        awayTeam = parts.slice(1).join(' vs ').trim();
      }
    } else {
      const colonParts = cleanLine.split(':');
      if (colonParts.length >= 2) {
        homeTeam = colonParts[0].trim();
        awayTeam = colonParts.slice(1).join(':').trim();
      }
    }

    // Clean final team string values
    if (homeTeam) {
      homeTeam = homeTeam.replace(/^[:\-\s\.]+|[:\-\s\.]+$/g, '').trim();
    }
    if (awayTeam) {
      awayTeam = awayTeam.replace(/^[:\-\s\.]+|[:\-\s\.]+$/g, '').trim();
    }

    // Fallback if separation failed completely
    if (!homeTeam && cleanLine) {
      homeTeam = cleanLine.replace(/^[:\-\s\.]+|[:\-\s\.]+$/g, '').trim();
      awayTeam = 'Autre';
    }

    if (homeTeam && awayTeam) {
      const formatTeamName = (name: string) => {
        return name
          .split(' ')
          .map(word => word ? (word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) : '')
          .join(' ')
          .trim();
      };

      const homeFormatted = formatTeamName(homeTeam);
      const awayFormatted = formatTeamName(awayTeam);

      const homeMedia = getTeamFlagAndColors(homeFormatted);
      const awayMedia = getTeamFlagAndColors(awayFormatted);

      parsed.push({
        homeTeam: homeFormatted,
        awayTeam: awayFormatted,
        result: result,
        score: score || '1-0',
        homeFlag: homeMedia.flag,
        awayFlag: awayMedia.flag,
      });
    }
  }

  return parsed;
}

// Beautifully crafted, dynamic vector logos for each competition/league
const CompetitionLogo: React.FC<{ title: string; className?: string }> = ({ title, className = "w-9 h-9" }) => {
  const lower = title.toLowerCase();
  
  if (lower.includes('champion') || lower.includes('ldc') || lower.includes('champions')) {
    // Starball (UCL)
    return (
      <svg className={`${className} text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]`} viewBox="0 0 100 100" fill="currentColor">
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-20" />
        <path d="M50 15 l2 4 h4 l-3 3 l1 4 l-4-2 l-4 2 l1-4 l-3-3 h4 z" />
        <path d="M72 25 l2 4 h4 l-3 3 l1 4 l-4-2 l-4 2 l1-4 l-3-3 h4 z" />
        <path d="M82 48 l2 4 h4 l-3 3 l1 4 l-4-2 l-4 2 l1-4 l-3-3 h4 z" />
        <path d="M72 71 l2 4 h4 l-3 3 l1 4 l-4-2 l-4 2 l1-4 l-3-3 h4 z" />
        <path d="M50 81 l2 4 h4 l-3 3 l1 4 l-4-2 l-4 2 l1-4 l-3-3 h4 z" />
        <path d="M28 71 l2 4 h4 l-3 3 l1 4 l-4-2 l-4 2 l1-4 l-3-3 h4 z" />
        <path d="M18 48 l2 4 h4 l-3 3 l1 4 l-4-2 l-4 2 l1-4 l-3-3 h4 z" />
        <path d="M28 25 l2 4 h4 l-3 3 l1 4 l-4-2 l-4 2 l1-4 l-3-3 h4 z" />
        <path d="M50 15 L72 25 L82 48 L72 71 L50 81 L28 71 L18 48 L28 25 Z" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60" />
      </svg>
    );
  }
  if (lower.includes('premier') || lower.includes('pl')) {
    // English Premier League Lion with a crown
    return (
      <svg className={`${className} text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.4)]`} viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 12 L58 22 L54 30 L50 26 L46 30 L42 22 Z" />
        <path d="M35 45 C35 32 65 32 65 45 C65 55 56 62 50 72 C44 62 35 55 35 45 Z" />
        <circle cx="45" cy="42" r="2.5" fill="#170026" />
        <circle cx="55" cy="42" r="2.5" fill="#170026" />
        <path d="M46 50 Q50 54 54 50" fill="none" stroke="#170026" strokeWidth="2.5" />
        <path d="M50 72 C50 72 40 82 45 88 L55 88 C60 82 50 72 50 72 Z" fill="currentColor" />
      </svg>
    );
  }
  if (lower.includes('liga')) {
    // La Liga logo
    return (
      <svg className={`${className} text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M30 20 L30 80 L70 80" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M48 20 L48 62 L80 62" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" className="opacity-80" />
        <circle cx="75" cy="30" r="8" fill="currentColor" />
      </svg>
    );
  }
  if (lower.includes('serie a')) {
    // Serie A shield
    return (
      <svg className={`${className} text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]`} viewBox="0 0 100 100" fill="currentColor">
        <path d="M15 15 L85 15 L75 85 L50 95 L25 85 Z" fill="none" stroke="currentColor" strokeWidth="4" />
        <path d="M50 22 L72 75 L61 75 L50 48 L39 75 L28 75 Z" />
        <circle cx="50" cy="38" r="4" fill="#001026" />
      </svg>
    );
  }
  if (lower.includes('bundesliga')) {
    // Bundesliga soccer player
    return (
      <svg className={`${className} text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]`} viewBox="0 0 100 100" fill="currentColor">
        <rect x="15" y="15" width="70" height="70" rx="12" fill="none" stroke="currentColor" strokeWidth="4" />
        <path d="M32 68 L42 50 L65 42 L48 32 L38 42 L28 38 L32 68 Z" />
        <circle cx="70" cy="28" r="6" />
      </svg>
    );
  }
  if (lower.includes('ligue 1')) {
    // Ligue 1 Hexagon
    return (
      <svg className={`${className} text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.4)]`} viewBox="0 0 100 100" fill="currentColor">
        <polygon points="50,15 82,32 82,68 50,85 18,68 18,32" fill="none" stroke="currentColor" strokeWidth="4" />
        <circle cx="50" cy="50" r="14" />
        <path d="M50 25 L50 75" stroke="currentColor" strokeWidth="4" />
      </svg>
    );
  }
  if (lower.includes('europa')) {
    // Europa League
    return (
      <svg className={`${className} text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]`} viewBox="0 0 100 100" fill="currentColor">
        <polygon points="35,20 65,20 60,65 50,85 40,65" fill="none" stroke="currentColor" strokeWidth="4" />
        <line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" strokeWidth="3" />
        <path d="M22 38 L34 44 M78 38 L66 44" stroke="currentColor" strokeWidth="3" />
      </svg>
    );
  }
  if (lower.includes('conference')) {
    // Conference League
    return (
      <svg className={`${className} text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]`} viewBox="0 0 100 100" fill="currentColor">
        <path d="M30 20 L70 20 L65 60 L50 82 L35 60 Z" fill="none" stroke="currentColor" strokeWidth="4" />
        <path d="M22 25 Q12 35 30 45 M78 25 Q88 35 70 45" fill="none" stroke="currentColor" strokeWidth="3" />
        <rect x="42" y="82" width="16" height="8" rx="2" />
      </svg>
    );
  }
  if (lower.includes('afrique') || lower.includes('can') || lower.includes('chan') || lower.includes('caf')) {
    // CAF
    return (
      <svg className={`${className} text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]`} viewBox="0 0 100 100" fill="currentColor">
        <path d="M25 18 C25 18 50 8 50 8 C50 8 75 18 75 18 C75 50 65 80 50 92 C35 80 25 50 25 18 Z" fill="none" stroke="currentColor" strokeWidth="4" />
        <path d="M38 28 C45 26 55 28 58 33 C60 36 60 43 56 48 C54 51 52 54 48 56 C45 58 48 66 45 70 C42 66 40 60 38 56 C36 50 35 43 38 28 Z" className="text-yellow-400" />
        <circle cx="50" cy="42" r="5" className="text-yellow-400" />
      </svg>
    );
  }
  if (lower.includes('monde') || lower.includes('mondial') || lower.includes('world cup')) {
    // Coupe du Monde
    return (
      <svg className={`${className} text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]`} viewBox="0 0 100 100" fill="currentColor">
        <path d="M35 85 L65 85 L60 68 L65 48 L65 28 C65 18 35 18 35 28 L35 48 L40 68 Z" fill="none" stroke="currentColor" strokeWidth="4" />
        <circle cx="50" cy="28" r="15" fill="currentColor" />
        <path d="M36 43 C42 53 58 53 64 43" fill="none" stroke="currentColor" strokeWidth="3" />
        <rect x="40" y="75" width="20" height="10" rx="2" />
      </svg>
    );
  }
  return (
    <svg className={`${className} text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]`} viewBox="0 0 100 100" fill="currentColor">
      <path d="M50 12 L82 28 L82 65 L50 88 L18 65 L18 28 Z" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M50 25 L58 40 L75 40 L62 50 L67 66 L50 56 L33 66 L38 50 L25 40 L42 40 Z" />
    </svg>
  );
};

interface PremiumPosterProps {
  title: string;
  time: string;
  date?: string;
  matches: ParsedMatch[];
  isPremium?: boolean;
}

export const PremiumPoster: React.FC<PremiumPosterProps> = ({
  title,
  time,
  date,
  matches,
  isPremium = true,
}) => {
  // If no matches are passed, fallback to beautiful parsed mock data matching the exact competition chosen
  const displayMatches = matches && matches.length > 0 ? matches : [
    { homeTeam: 'Morocco', awayTeam: 'Sudan', result: '1', score: '2-0', homeFlag: '🇲🇦', awayFlag: '🇸🇩' },
    { homeTeam: 'Uganda', awayTeam: 'Mozambique', result: 'X', score: '1-1', homeFlag: '🇺🇬', awayFlag: '🇲🇿' },
    { homeTeam: 'Nigeria', awayTeam: 'Equatorial Guinea', result: '1', score: '1-0', homeFlag: '🇳🇬', awayFlag: '🇬🇶' },
    { homeTeam: 'Botswana', awayTeam: 'Mali', result: '2', score: '0-1', homeFlag: '🇧🇼', awayFlag: '🇲🇱' },
    { homeTeam: 'Benin', awayTeam: 'Zambia', result: '1', score: '1-0', homeFlag: '🇧🇯', awayFlag: '🇿🇲' }
  ];

  // Helper to get competition styling parameters based on title/competition name
  const getCompTheme = (t: string) => {
    const lower = (t || '').toLowerCase();
    
    if (lower.includes('champion') || lower.includes('ldc') || lower.includes('champions')) {
      return {
        border: 'border-sky-500/80 shadow-[0_0_30px_rgba(14,165,233,0.3)]',
        bg: 'from-[#020d1e] via-[#041935] to-[#010307]',
        glowTop: 'bg-sky-500/20',
        glowBottom: 'bg-indigo-500/10',
        badge: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
        textGradient: 'from-sky-300 via-sky-400 to-indigo-400',
        accentColor: 'text-sky-400',
        resultBg: 'from-sky-400 to-indigo-500',
      };
    }
    if (lower.includes('premier') || lower.includes('pl')) {
      return {
        border: 'border-fuchsia-500/80 shadow-[0_0_30px_rgba(217,70,239,0.3)]',
        bg: 'from-[#170026] via-[#24003d] to-[#0a0012]',
        glowTop: 'bg-fuchsia-500/20',
        glowBottom: 'bg-pink-500/10',
        badge: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400',
        textGradient: 'from-fuchsia-300 via-pink-400 to-purple-400',
        accentColor: 'text-fuchsia-400',
        resultBg: 'from-fuchsia-500 to-pink-500',
      };
    }
    if (lower.includes('liga')) {
      return {
        border: 'border-rose-500/80 shadow-[0_0_30px_rgba(244,63,94,0.3)]',
        bg: 'from-[#210204] via-[#35050b] to-[#0a0002]',
        glowTop: 'bg-rose-500/20',
        glowBottom: 'bg-amber-500/10',
        badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
        textGradient: 'from-rose-300 via-rose-400 to-amber-400',
        accentColor: 'text-rose-400',
        resultBg: 'from-rose-500 to-amber-500',
      };
    }
    if (lower.includes('serie a')) {
      return {
        border: 'border-blue-500/80 shadow-[0_0_30px_rgba(59,130,246,0.3)]',
        bg: 'from-[#000d1e] via-[#021c3d] to-[#00030a]',
        glowTop: 'bg-blue-500/20',
        glowBottom: 'bg-cyan-500/10',
        badge: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        textGradient: 'from-blue-300 via-cyan-400 to-indigo-400',
        accentColor: 'text-blue-400',
        resultBg: 'from-blue-500 to-cyan-500',
      };
    }
    if (lower.includes('bundesliga')) {
      return {
        border: 'border-red-600/80 shadow-[0_0_30px_rgba(220,38,38,0.3)]',
        bg: 'from-[#190002] via-[#2d0508] to-[#030000]',
        glowTop: 'bg-red-600/20',
        glowBottom: 'bg-stone-500/10',
        badge: 'bg-red-500/10 border-red-500/30 text-red-400',
        textGradient: 'from-red-300 via-orange-400 to-rose-500',
        accentColor: 'text-red-400',
        resultBg: 'from-red-600 to-stone-800',
      };
    }
    if (lower.includes('ligue 1')) {
      return {
        border: 'border-lime-500/80 shadow-[0_0_30px_rgba(132,204,22,0.3)]',
        bg: 'from-[#031101] via-[#082305] to-[#000100]',
        glowTop: 'bg-lime-500/20',
        glowBottom: 'bg-emerald-500/10',
        badge: 'bg-lime-500/10 border-lime-500/30 text-lime-400',
        textGradient: 'from-lime-300 via-green-400 to-lime-500',
        accentColor: 'text-lime-400',
        resultBg: 'from-lime-400 to-emerald-600',
      };
    }
    if (lower.includes('europa')) {
      return {
        border: 'border-orange-500/80 shadow-[0_0_30px_rgba(249,115,22,0.3)]',
        bg: 'from-[#1a0a01] via-[#2b1403] to-[#050200]',
        glowTop: 'bg-orange-500/20',
        glowBottom: 'bg-amber-600/10',
        badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
        textGradient: 'from-orange-300 via-yellow-500 to-orange-400',
        accentColor: 'text-orange-400',
        resultBg: 'from-orange-500 to-amber-500',
      };
    }
    if (lower.includes('conference')) {
      return {
        border: 'border-green-500/80 shadow-[0_0_30px_rgba(34,197,94,0.3)]',
        bg: 'from-[#011402] via-[#042407] to-[#000200]',
        glowTop: 'bg-green-500/20',
        glowBottom: 'bg-lime-400/10',
        badge: 'bg-green-500/10 border-green-500/30 text-green-400',
        textGradient: 'from-green-300 via-lime-400 to-green-500',
        accentColor: 'text-green-400',
        resultBg: 'from-green-500 to-lime-500',
      };
    }
    if (lower.includes('afrique') || lower.includes('can') || lower.includes('chan') || lower.includes('caf')) {
      return {
        border: 'border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.35)]',
        bg: 'from-[#001408] via-[#01240f] to-[#000301]',
        glowTop: 'bg-emerald-500/25',
        glowBottom: 'bg-yellow-500/15',
        badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        textGradient: 'from-emerald-300 via-yellow-400 to-green-500',
        accentColor: 'text-yellow-400',
        resultBg: 'from-yellow-400 to-emerald-500',
      };
    }
    if (lower.includes('monde') || lower.includes('mondial') || lower.includes('world cup')) {
      return {
        border: 'border-yellow-500/80 shadow-[0_0_30px_rgba(234,179,8,0.35)]',
        bg: 'from-[#141001] via-[#282103] to-[#010000]',
        glowTop: 'bg-yellow-500/25',
        glowBottom: 'bg-amber-500/15',
        badge: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
        textGradient: 'from-yellow-200 via-amber-400 to-yellow-500',
        accentColor: 'text-yellow-400',
        resultBg: 'from-yellow-400 to-amber-500',
      };
    }
    // Default elegant theme
    return {
      border: 'border-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,0.3)]',
      bg: 'from-[#03060f] via-[#091024] to-[#010205]',
      glowTop: 'bg-amber-500/20',
      glowBottom: 'bg-indigo-500/10',
      badge: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
      textGradient: 'from-yellow-200 via-amber-400 to-yellow-500',
      accentColor: 'text-amber-400',
      resultBg: 'from-amber-400 to-yellow-600',
    };
  };

  const theme = getCompTheme(title);

  // --- DYNAMIC ADAPTATIVE ROW STYLE LOGIC ---
  const count = displayMatches.length;
  let rowPaddingClass = "p-2.5";
  let teamFontClass = "text-[10px]";
  let vsFontClass = "text-[10px]";
  let resultBadgeClass = "w-5.5 h-5.5 text-[10px]";
  let scoreBoxClass = "text-[9px] min-w-[34px] px-1.5 py-0.5";
  let flagSizeClass = "w-5.5 h-5.5 text-xs";

  if (count <= 5) {
    // Grand format (5 matches or less)
    rowPaddingClass = "p-3 sm:p-3.5";
    teamFontClass = "text-[11px] sm:text-xs font-black tracking-tight";
    vsFontClass = "text-[11px] sm:text-xs font-serif italic";
    resultBadgeClass = "w-6 h-6 text-[11px] sm:text-xs";
    scoreBoxClass = "text-[10px] sm:text-xs min-w-[38px] px-2 py-1";
    flagSizeClass = "w-6 h-6 text-sm";
  } else if (count <= 12) {
    // Format moyen (6 to 12 matches)
    rowPaddingClass = "p-2 sm:p-2.5";
    teamFontClass = "text-[9.5px] sm:text-[10.5px] font-extrabold tracking-tight";
    vsFontClass = "text-[9.5px] sm:text-[10.5px] font-serif italic";
    resultBadgeClass = "w-5 h-5 text-[9.5px] sm:text-[10px]";
    scoreBoxClass = "text-[8.5px] sm:text-[9.5px] min-w-[32px] px-1.5 py-0.5";
    flagSizeClass = "w-5 h-5 text-xs";
  } else {
    // Format compact (13 or more matches)
    rowPaddingClass = "p-1.5 sm:p-2";
    teamFontClass = "text-[8.5px] sm:text-[9.5px] font-extrabold tracking-tighter leading-none";
    vsFontClass = "text-[8.5px] sm:text-[9px] font-serif italic";
    resultBadgeClass = "w-4.5 h-4.5 text-[8.5px] sm:text-[9px]";
    scoreBoxClass = "text-[7.5px] sm:text-[8.5px] min-w-[28px] px-1 py-0.5";
    flagSizeClass = "w-4.5 h-4.5 text-[9px] sm:text-[10px]";
  }

  // Detect whether flag value is an emoji (national flag) or text monogram (club shield)
  const isEmojiFlag = (str: string) => {
    return /\p{Emoji}/u.test(str) && !/^[A-Z]{1,3}$/.test(str);
  };

  return (
    <div className={`relative w-full max-w-[360px] mx-auto overflow-hidden rounded-3xl border-2 ${theme.border} bg-gradient-to-b ${theme.bg} p-4 flex flex-col justify-between h-auto min-h-[380px] select-none text-white shadow-2xl animate-fade-in`}>
      {/* Background ambient light effects */}
      <div className={`absolute top-0 left-1/4 w-1/2 h-28 ${theme.glowTop} rounded-full blur-3xl -z-10`} />
      <div className={`absolute bottom-0 right-1/4 w-1/2 h-28 ${theme.glowBottom} rounded-full blur-3xl -z-10`} />

      {/* Glass-reflection top overlay */}
      <div className="absolute top-0 inset-x-0 h-2/3 bg-gradient-to-b from-white/5 to-transparent pointer-events-none -skew-y-3" />

      {/* 1. Brand & Header Section */}
      <div className="text-center pb-3 border-b border-white/10 relative z-10 flex flex-col items-center">
        {/* official comp logo */}
        <div className="mb-2 bg-black/40 p-2.5 rounded-full border border-white/10 shadow-inner flex items-center justify-center">
          <CompetitionLogo title={title} className="w-10 h-10" />
        </div>

        <span className={`text-[7px] font-black tracking-widest block mb-1 uppercase py-0.5 px-2 rounded-full w-max mx-auto border ${theme.badge}`}>
          🏆 PRONOSTIC PREMIUM 🏆
        </span>
        
        <h3 className={`font-sans font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b ${theme.textGradient} uppercase text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
          {title || "COUPE D'AFRIQUE"}
        </h3>
        
        {/* Column indicators */}
        <div className="w-full flex justify-between items-center text-[7px] font-extrabold text-white/40 px-2 mt-2">
          <span className="uppercase tracking-wider">MATCHS</span>
          <div className="flex gap-4">
            <span className="uppercase tracking-wider">1X2</span>
            <span className="uppercase tracking-wider">SCORE EXACT</span>
          </div>
        </div>
      </div>

      {/* 2. Matches List Section - Fully flexible, never truncated, dynamically sized */}
      <div className="my-3 flex-1 space-y-2 z-10 transition-all duration-300">
        {displayMatches.map((m, idx) => {
          const homeGrad = getTeamColors(m.homeTeam);
          const awayGrad = getTeamColors(m.awayTeam);
          const homeIsEmoji = isEmojiFlag(m.homeFlag || '⚽');
          const awayIsEmoji = isEmojiFlag(m.awayFlag || '⚽');

          return (
            <div 
              key={idx} 
              className={`flex items-center justify-between bg-gradient-to-r from-black/55 to-white/5 border border-white/5 hover:border-white/15 rounded-xl ${rowPaddingClass} transition-all shadow-[0_2px_6px_rgba(0,0,0,0.4)]`}
            >
              {/* Home Team */}
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {homeIsEmoji ? (
                  <span className={`${flagSizeClass} flex items-center justify-center select-none bg-black/40 rounded-full border border-white/10 shadow-inner shrink-0`}>
                    {m.homeFlag}
                  </span>
                ) : (
                  <div 
                    className={`${flagSizeClass} flex items-center justify-center text-[7.5px] font-black tracking-tighter select-none rounded-full border border-white/20 shadow-md shrink-0`}
                    style={{ background: `linear-gradient(135deg, ${homeGrad.from}, ${homeGrad.to})`, color: homeGrad.text }}
                  >
                    {m.homeFlag}
                  </div>
                )}
                <span className={`font-sans ${teamFontClass} text-white tracking-tight truncate uppercase`}>
                  {m.homeTeam}
                </span>
              </div>

              {/* VS Divider styled */}
              <div className={`px-1 text-center ${vsFontClass} ${theme.accentColor} font-black drop-shadow-[0_0_6px_rgba(245,158,11,0.4)] shrink-0 animate-pulse`}>
                VS
              </div>

              {/* Away Team */}
              <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end text-right">
                <span className={`font-sans ${teamFontClass} text-white tracking-tight truncate uppercase`}>
                  {m.awayTeam}
                </span>
                {awayIsEmoji ? (
                  <span className={`${flagSizeClass} flex items-center justify-center select-none bg-black/40 rounded-full border border-white/10 shadow-inner shrink-0`}>
                    {m.awayFlag}
                  </span>
                ) : (
                  <div 
                    className={`${flagSizeClass} flex items-center justify-center text-[7.5px] font-black tracking-tighter select-none rounded-full border border-white/20 shadow-md shrink-0`}
                    style={{ background: `linear-gradient(135deg, ${awayGrad.from}, ${awayGrad.to})`, color: awayGrad.text }}
                  >
                    {m.awayFlag}
                  </div>
                )}
              </div>

              {/* Result prediction & exact score badges */}
              <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-white/10 ml-1.5">
                {/* 1X2 Prediction Outcome Badge */}
                <div className={`bg-gradient-to-b ${theme.resultBg} text-slate-950 font-black flex items-center justify-center rounded ${resultBadgeClass} shadow-md border border-white/20 uppercase`}>
                  {m.result}
                </div>
                
                {/* Score Box */}
                <div className={`bg-[#031c13] text-emerald-400 font-mono font-black border border-emerald-500/30 rounded ${scoreBoxClass} text-center shadow-[0_0_6px_rgba(16,185,129,0.3)]`}>
                  {m.score}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Poster Footer */}
      <div className="border-t border-white/10 pt-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider">
          <Trophy className={`h-3.5 w-3.5 ${theme.accentColor} animate-pulse`} />
          <span className="text-white/75">LIVE TOP DYNAMIQUE</span>
        </div>
        
        {/* Digital Clock display */}
        <div className="font-mono text-xs font-black text-yellow-400 tracking-wider bg-black/60 border border-white/10 px-2.5 py-1 rounded-lg shadow-[0_0_8px_rgba(234,179,8,0.35)] flex items-center gap-1">
          <Clock className="h-3 w-3 text-yellow-500 shrink-0" />
          <span>{time || "14:56"}</span>
        </div>
      </div>
    </div>
  );
};
