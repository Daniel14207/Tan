/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Match, League } from '../types';

// Seeded random number generator
export function seedRandom(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export const LEAGUE_TEAMS: Record<string, string[]> = {
  eng: [
    'Man City', 'Arsenal', 'Liverpool', 'Aston Villa', 'Tottenham', 'Chelsea',
    'Newcastle', 'Man United', 'West Ham', 'Brighton', 'Wolves', 'Fulham',
    'Bournemouth', 'Crystal Palace', 'Brentford', 'Everton', 'Nottingham',
    'Leicester', 'Ipswich', 'Southampton'
  ],
  ucl: [
    'Real Madrid', 'Man City', 'Bayern Munich', 'PSG', 'Arsenal', 'Inter Milan',
    'Barcelona', 'Atletico Madrid', 'Leverkusen', 'Dortmund', 'Juventus', 'AC Milan',
    'Sporting CP', 'Benfica', 'Porto', 'Monaco', 'Brest', 'Feyenoord', 'PSV',
    'Salzburg', 'Celtic', 'Lazio', 'Real Sociedad', 'Leipzig', 'Club Brugge',
    'Shakhtar', 'Bologna', 'Girona', 'Stuttgart', 'Lille', 'Atalanta', 'Dinamo Zagreb'
  ],
  can: [
    'Maroc', 'Sénégal', 'Égypte', "Côte d'Ivoire", 'Nigeria', 'Algérie',
    'Cameroun', 'Tunisie', 'Mali', 'Afrique du Sud', 'RD Congo', 'Burkina Faso',
    'Angola', 'Zambie', 'Guinée', 'Guinée Équatoriale', 'Gabon', 'Ouganda',
    'Mozambique', 'Bénin', 'Botswana', 'Zimbabwe', 'Comores', 'Tanzanie'
  ],
  wc: [
    'Argentine', 'France', 'Brésil', 'Angleterre', 'Belgique', 'Croatie',
    'Portugal', 'Espagne', 'Italie', 'Allemagne', 'Pays-Bas', 'Uruguay',
    'Colombie', 'Maroc', 'Sénégal', 'USA', 'Mexique', 'Japon', 'Corée du Sud',
    'Australie', 'Canada', 'Équateur', 'Suisse', 'Danemark', 'Suède', 'Pologne',
    'Autriche', 'Ukraine', 'Turquie', 'République Tchèque', 'Égypte', 'Nigeria',
    'Cameroun', 'Ghana', 'Arabie Saoudite', 'Iran', 'Chili', 'Pérou', 'Algérie',
    'Tunisie'
  ],
  ita: [
    'Inter Milan', 'AC Milan', 'Juventus', 'Atalanta', 'Bologna', 'AS Roma',
    'Lazio', 'Fiorentina', 'Torino', 'Napoli', 'Genoa', 'Monza', 'Verona',
    'Lecce', 'Udinese', 'Cagliari', 'Empoli', 'Parma', 'Como', 'Venezia'
  ],
  esp: [
    'Real Madrid', 'Barcelona', 'Girona', 'Atletico Madrid', 'Athletic Bilbao',
    'Real Sociedad', 'Real Betis', 'Villarreal', 'Valencia', 'Alaves',
    'Osasuna', 'Getafe', 'Celta Vigo', 'Sevilla', 'Mallorca', 'Las Palmas',
    'Vallecano', 'Leganes', 'Valladolid', 'Espanyol'
  ],
  fra: [
    'PSG', 'Monaco', 'Brest', 'Lille', 'Nice', 'Lens', 'Lyon', 'Marseille',
    'Reims', 'Rennes', 'Toulouse', 'Montpellier', 'Strasbourg', 'Nantes',
    'Le Havre', 'Auxerre', 'Angers', 'Saint-Étienne', 'Bordeaux', 'Lorient'
  ],
  ger: [
    'Leverkusen', 'Bayern Munich', 'Stuttgart', 'Leipzig', 'Dortmund',
    'Frankfurt', 'Hoffenheim', 'Heidenheim', 'Werder Bremen', 'Freiburg',
    'Augsburg', 'Wolfsburg', 'Monchengladbach', 'Union Berlin', 'Bochum',
    'St. Pauli', 'Holstein Kiel', 'Mainz', 'Koln', 'Schalke'
  ],
  por: [
    'Sporting CP', 'Benfica', 'Porto', 'Braga', 'Vitória SC', 'Moreirense',
    'Arouca', 'Famalicao', 'Casa Pia', 'Farense', 'Rio Ave', 'Gil Vicente',
    'Boavista', 'Estrela Amadora', 'Estoril', 'Nacional', 'Santa Clara',
    'AVS', 'Chaves', 'Vizela'
  ]
};

const LEAGUE_NAMES: Record<string, { name: string; logo: string }> = {
  can: { name: "Coupe d'Afrique", logo: '🏆' },
  ucl: { name: 'Ligue des Champions UEFA', logo: '🇪🇺' },
  eng: { name: 'Premier League', logo: '🦁' },
  esp: { name: 'La Liga', logo: '🇪🇸' },
  ita: { name: 'Serie A', logo: '🇮🇹' },
  ger: { name: 'Bundesliga', logo: '🇩🇪' },
  fra: { name: 'Ligue 1', logo: '🇫🇷' },
  por: { name: 'Liga Portugal', logo: '🇵🇹' },
  wc: { name: 'FIFA World Cup', logo: '🌎' }
};

// Generates stable random matches for any round, seed, and league.
export function generateVirtualRound(leagueId: string, virtualTime: string, roundIndex: number): Match[] {
  // Number of matches for this league
  let matchesCount = 10;
  if (leagueId === 'ucl') matchesCount = 16;
  else if (leagueId === 'can') matchesCount = 12;
  else if (leagueId === 'wc') matchesCount = 20;

  const rand = seedRandom(`${leagueId}-${virtualTime}-${roundIndex}`);

  const teams = [...(LEAGUE_TEAMS[leagueId] || LEAGUE_TEAMS['eng'])];
  
  // Shuffle teams deterministically
  for (let i = teams.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const temp = teams[i];
    teams[i] = teams[j];
    teams[j] = temp;
  }

  const leagueInfo = LEAGUE_NAMES[leagueId] || { name: 'Ligue Virtuelle', logo: '⚽' };
  const matches: Match[] = [];

  for (let m = 0; m < matchesCount; m++) {
    const homeTeam = teams[m * 2] || `Team A ${m}`;
    const awayTeam = teams[m * 2 + 1] || `Team B ${m}`;

    // Dynamic Odds Generation
    const homePower = 1 + rand() * 3;
    const awayPower = 1 + rand() * 3;
    
    let homeWin = parseFloat((1.5 + (awayPower / homePower) * 1.2).toFixed(2));
    let awayWin = parseFloat((1.5 + (homePower / awayPower) * 1.5).toFixed(2));
    let draw = parseFloat((2.8 + rand() * 1.8).toFixed(2));

    // Cap values to normal sportsbook ranges
    if (homeWin < 1.15) homeWin = 1.15;
    if (awayWin < 1.15) awayWin = 1.15;
    if (homeWin > 12) homeWin = 12;
    if (awayWin > 12) awayWin = 12;

    // Calculate prediction probabilities based on odds
    const totalInverse = (1 / homeWin) + (1 / draw) + (1 / awayWin);
    const homeWinPct = Math.round(((1 / homeWin) / totalInverse) * 100);
    const awayWinPct = Math.round(((1 / awayWin) / totalInverse) * 100);
    const drawPct = 100 - homeWinPct - awayWinPct;

    // Predetermine Scores
    let finalScoreHome = 0;
    let finalScoreAway = 0;

    const r = rand();
    if (homeWinPct > awayWinPct && homeWinPct > 45) {
      // Home win likely
      if (r < 0.4) { finalScoreHome = 2; finalScoreAway = 1; }
      else if (r < 0.7) { finalScoreHome = 1; finalScoreAway = 0; }
      else if (r < 0.85) { finalScoreHome = 2; finalScoreAway = 0; }
      else if (r < 0.95) { finalScoreHome = 3; finalScoreAway = 1; }
      else { finalScoreHome = 3; finalScoreAway = 0; }
    } else if (awayWinPct > homeWinPct && awayWinPct > 45) {
      // Away win likely
      if (r < 0.4) { finalScoreHome = 1; finalScoreAway = 2; }
      else if (r < 0.7) { finalScoreHome = 0; finalScoreAway = 1; }
      else if (r < 0.85) { finalScoreHome = 0; finalScoreAway = 2; }
      else if (r < 0.95) { finalScoreHome = 1; finalScoreAway = 3; }
      else { finalScoreHome = 0; finalScoreAway = 3; }
    } else {
      // Draw likely
      if (r < 0.5) { finalScoreHome = 1; finalScoreAway = 1; }
      else if (r < 0.8) { finalScoreHome = 0; finalScoreAway = 0; }
      else { finalScoreHome = 2; finalScoreAway = 2; }
    }

    const halfTimeScoreHome = Math.floor(rand() * (finalScoreHome + 1));
    const halfTimeScoreAway = Math.floor(rand() * (finalScoreAway + 1));

    // Goal times
    const homeGoalMinutes: string[] = [];
    const awayGoalMinutes: string[] = [];
    for (let i = 0; i < finalScoreHome; i++) {
      homeGoalMinutes.push(`${Math.floor(rand() * 88) + 1}'`);
    }
    for (let i = 0; i < finalScoreAway; i++) {
      awayGoalMinutes.push(`${Math.floor(rand() * 88) + 1}'`);
    }
    homeGoalMinutes.sort((a, b) => parseInt(a) - parseInt(b));
    awayGoalMinutes.sort((a, b) => parseInt(a) - parseInt(b));

    // Premium status allocation (VIP / Best / Free)
    // Stable mix of categories: VIP (approx 15%), Best (approx 25%), Free (60%)
    const catRand = rand();
    const isVip = catRand < 0.18;
    const isBest = !isVip && catRand < 0.45;
    const isFree = !isVip && !isBest;

    // Single Tip selection
    let singleTip = '1';
    let singleTipOdds = homeWin;
    if (homeWinPct >= awayWinPct && homeWinPct >= drawPct) {
      if (homeWinPct > 52) {
        singleTip = '1';
        singleTipOdds = homeWin;
      } else {
        singleTip = '1X';
        singleTipOdds = parseFloat((homeWin * 0.7).toFixed(2));
      }
    } else if (awayWinPct >= homeWinPct && awayWinPct >= drawPct) {
      if (awayWinPct > 52) {
        singleTip = '2';
        singleTipOdds = awayWin;
      } else {
        singleTip = 'X2';
        singleTipOdds = parseFloat((awayWin * 0.7).toFixed(2));
      }
    } else {
      singleTip = 'X';
      singleTipOdds = draw;
    }

    // Over/Under
    const btts: 'Yes' | 'No' = (finalScoreHome > 0 && finalScoreAway > 0) ? 'Yes' : 'No';
    const overUnder25: 'Over' | 'Under' = (finalScoreHome + finalScoreAway > 2) ? 'Over' : 'Under';

    const htResult = halfTimeScoreHome > halfTimeScoreAway ? '1' : halfTimeScoreHome < halfTimeScoreAway ? '2' : 'X';
    const ftResult = finalScoreHome > finalScoreAway ? '1' : finalScoreHome < finalScoreAway ? '2' : 'X';
    const htFt = `${htResult}/${ftResult}`;

    matches.push({
      id: `${leagueId}-${virtualTime}-${roundIndex}-${m}`,
      leagueId,
      leagueName: leagueInfo.name,
      round: `Journée ${Math.max(1, (roundIndex % 38) + 1)}`,
      matchTime: virtualTime,
      date: '2026-06-30',
      homeTeam,
      awayTeam,
      homeLogo: '',
      awayLogo: '',
      finalScoreHome,
      finalScoreAway,
      halfTimeScoreHome,
      halfTimeScoreAway,
      goalMinutes: {
        home: homeGoalMinutes,
        away: awayGoalMinutes
      },
      matchStatus: 'Pending',
      odds: { homeWin, draw, awayWin },
      predictions: {
        btts,
        bttsOdds: btts === 'Yes' ? parseFloat((1.5 + rand() * 0.5).toFixed(2)) : parseFloat((1.6 + rand() * 0.6).toFixed(2)),
        overUnder25,
        overUnderOdds: overUnder25 === 'Over' ? parseFloat((1.55 + rand() * 0.5).toFixed(2)) : parseFloat((1.5 + rand() * 0.5).toFixed(2)),
        singleTip,
        singleTipOdds,
        htFt,
        htFtOdds: parseFloat((2.1 + rand() * 12.0).toFixed(2)),
        isVip,
        isBest,
        isFree,
        status: 'Pending',
        homeWinPct,
        drawPct,
        awayWinPct,
        exactScorePct: Math.round(18 + rand() * 20)
      }
    });
  }

  return matches;
}
