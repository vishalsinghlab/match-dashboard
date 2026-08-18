export type SportCategory = 'cricket' | 'football' | 'basketball' | 'tennis' | 'esports' | 'other';

export interface Batsman {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isStriker?: boolean;
}

export interface Bowler {
  name: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
}

export interface CricketData {
  innings: string;
  runs: number;
  wickets: number;
  overs: string;
  crr: number;
  rrr: number;
  target?: number;
  striker: Batsman;
  nonStriker: Batsman;
  bowler: Bowler;
  recentBalls: string[];
  partnershipRuns: number;
  partnershipBalls: number;
  lastWicket: string;
}

export interface FootballEvent {
  minute: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'sub';
  player: string;
  team: 'home' | 'away';
  detail?: string;
}

export interface FootballData {
  minute: string;
  half: string;
  possessionHome: number;
  possessionAway: number;
  shotsHome: number;
  shotsAway: number;
  shotsOnTargetHome: number;
  shotsOnTargetAway: number;
  foulsHome: number;
  foulsAway: number;
  yellowCardsHome: number;
  yellowCardsAway: number;
  redCardsHome: number;
  redCardsAway: number;
  cornersHome: number;
  cornersAway: number;
  offsidesHome: number;
  offsidesAway: number;
  formationHome: string;
  formationAway: string;
  lineupHome: string[];
  lineupAway: string[];
  events: FootballEvent[];
}

export interface BasketballPlayerStat {
  name: string;
  pts: number;
  reb: number;
  ast: number;
  min: string;
  team: 'home' | 'away';
}

export interface BasketballData {
  quarter: string;
  gameClock: string;
  shotClock: number;
  q1: { home: number; away: number };
  q2: { home: number; away: number };
  q3: { home: number; away: number };
  q4: { home: number; away: number };
  fgPctHome: number;
  fgPctAway: number;
  threePtPctHome: number;
  threePtPctAway: number;
  ftPctHome: number;
  ftPctAway: number;
  reboundsHome: number;
  reboundsAway: number;
  assistsHome: number;
  assistsAway: number;
  turnoversHome: number;
  turnoversAway: number;
  personalFoulsHome: number;
  personalFoulsAway: number;
  topPlayers: BasketballPlayerStat[];
}

export interface TennisSetScore {
  setNumber: number;
  home: number;
  away: number;
}

export interface TennisData {
  setScores: TennisSetScore[];
  currentGameHome: string;
  currentGameAway: string;
  server: 'home' | 'away';
  acesHome: number;
  acesAway: number;
  doubleFaultsHome: number;
  doubleFaultsAway: number;
  breakPointsWonHome: string;
  breakPointsWonAway: string;
  unforcedErrorsHome: number;
  unforcedErrorsAway: number;
  firstServePctHome: number;
  firstServePctAway: number;
  totalPointsHome: number;
  totalPointsAway: number;
}

export interface EsportsPlayerStat {
  name: string;
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  hsPct: number;
  team: 'home' | 'away';
}

export interface EsportsData {
  mapScoreHome: number;
  mapScoreAway: number;
  roundScoreHome: number;
  roundScoreAway: number;
  currentMap: string;
  phase: string;
  bombStatus: string;
  economyHome: string;
  economyAway: string;
  loadoutHome: string;
  loadoutAway: string;
  playerStats: EsportsPlayerStat[];
  mapHistory: Array<{ mapName: string; home: number; away: number; winner: 'home' | 'away' }>;
}

export interface GenericData {
  period: string;
  timeRemaining: string;
  possessionControl: string;
  momentumPercentage: number;
  eventsLog: string[];
}

export function normalizeSport(sportName?: string): SportCategory {
  if (!sportName) return 'other';
  const s = sportName.toLowerCase();
  if (s.includes('cricket')) return 'cricket';
  if (s.includes('football') || s.includes('soccer')) return 'football';
  if (s.includes('basket')) return 'basketball';
  if (s.includes('tennis')) return 'tennis';
  if (s.includes('esport') || s.includes('gaming') || s.includes('cs:go') || s.includes('valorant') || s.includes('dota') || s.includes('league')) return 'esports';
  return 'other';
}

export function generateCricketTelemetry(homeScore: number, awayScore: number, meta?: Record<string, any>): CricketData {
  const runs = meta?.['runs'] ?? (homeScore * 6 + 112);
  const wickets = meta?.['wickets'] ?? Math.min(9, Math.floor(homeScore / 4));
  const overs = meta?.['overs'] ?? `${Math.min(19, 10 + Math.floor(homeScore / 3))}.${(homeScore % 6)}`;
  const oversNum = parseFloat(overs) || 15.2;
  const crr = meta?.['crr'] ? parseFloat(meta['crr']) : parseFloat((runs / Math.max(1, oversNum)).toFixed(2));
  const rrr = meta?.['rrr'] ? parseFloat(meta['rrr']) : 8.75;

  return {
    innings: '2nd Innings',
    runs,
    wickets,
    overs,
    crr,
    rrr,
    target: 215,
    striker: {
      name: meta?.['striker']?.['name'] ?? 'V. Kohli',
      runs: meta?.['striker']?.['runs'] ?? (45 + (homeScore % 20)),
      balls: 32,
      fours: 4,
      sixes: 2,
      strikeRate: parseFloat(((45 / 32) * 100).toFixed(1)),
      isStriker: true,
    },
    nonStriker: {
      name: meta?.['nonStriker']?.['name'] ?? 'K.L. Rahul',
      runs: meta?.['nonStriker']?.['runs'] ?? 28,
      balls: 21,
      fours: 3,
      sixes: 1,
      strikeRate: 133.3,
      isStriker: false,
    },
    bowler: {
      name: meta?.['bowler']?.['name'] ?? 'P. Cummins',
      overs: meta?.['bowler']?.['overs'] ?? '3.4',
      maidens: 0,
      runs: 31,
      wickets: 2,
      economy: 8.45,
    },
    recentBalls: meta?.['recentBalls'] ?? ['4', '1', 'W', '6', '0', '2', '1wd', '4'],
    partnershipRuns: 54,
    partnershipBalls: 38,
    lastWicket: 'R. Sharma 34 (22b) - 98/2',
  };
}

export function generateFootballTelemetry(homeScore: number, awayScore: number, meta?: Record<string, any>): FootballData {
  const minute = meta?.['minute'] ?? `${Math.min(90, 42 + homeScore * 5)}'`;
  const possessionHome = meta?.['possession']?.['home'] ?? 58;
  const possessionAway = meta?.['possession']?.['away'] ?? (100 - possessionHome);

  return {
    minute,
    half: '2nd Half',
    possessionHome,
    possessionAway,
    shotsHome: meta?.['shots']?.['home'] ?? (8 + homeScore * 2),
    shotsAway: meta?.['shots']?.['away'] ?? (5 + awayScore * 2),
    shotsOnTargetHome: meta?.['shotsOnTarget']?.['home'] ?? (4 + homeScore),
    shotsOnTargetAway: meta?.['shotsOnTarget']?.['away'] ?? (2 + awayScore),
    foulsHome: meta?.['fouls']?.['home'] ?? 10,
    foulsAway: meta?.['fouls']?.['away'] ?? 12,
    yellowCardsHome: meta?.['yellowCards']?.['home'] ?? 2,
    yellowCardsAway: meta?.['yellowCards']?.['away'] ?? 3,
    redCardsHome: meta?.['redCards']?.['home'] ?? 0,
    redCardsAway: meta?.['redCards']?.['away'] ?? 0,
    cornersHome: meta?.['corners']?.['home'] ?? 7,
    cornersAway: meta?.['corners']?.['away'] ?? 4,
    offsidesHome: 2,
    offsidesAway: 1,
    formationHome: '4-3-3 Attacking',
    formationAway: '4-2-3-1 Counter',
    lineupHome: ['GK Courtois', 'RB Carvajal', 'CB Militao', 'CB Rudiger', 'LB Mendy', 'CM Valverde', 'CM Camavinga', 'AM Bellingham', 'RW Rodrygo', 'LW Vinicius Jr', 'ST Mbappe'],
    lineupAway: ['GK Neuer', 'RB Kimmich', 'CB Upamecano', 'CB Kim', 'LB Davies', 'CM Laimer', 'CM Goretzka', 'AM Olise', 'RW Sane', 'LW Musiala', 'ST Kane'],
    events: [
      { minute: "24'", type: 'goal', player: 'Vinicius Jr', team: 'home', detail: 'Assist by Bellingham' },
      { minute: "38'", type: 'yellow_card', player: 'Kimmich', team: 'away', detail: 'Tactical Foul' },
      { minute: "54'", type: 'goal', player: 'H. Kane', team: 'away', detail: 'Penalty Kick' },
      { minute: "71'", type: 'sub', player: 'Modric in, Camavinga out', team: 'home' },
    ],
  };
}

export function generateBasketballTelemetry(homeScore: number, awayScore: number, meta?: Record<string, any>): BasketballData {
  const h = Math.max(72, homeScore * 5 + 68);
  const a = Math.max(68, awayScore * 5 + 62);

  return {
    quarter: meta?.['quarter'] ?? 'Q4',
    gameClock: meta?.['gameClock'] ?? '03:45',
    shotClock: meta?.['shotClock'] ?? 14,
    q1: meta?.['q1'] ?? { home: 28, away: 24 },
    q2: meta?.['q2'] ?? { home: 31, away: 29 },
    q3: meta?.['q3'] ?? { home: 24, away: 28 },
    q4: meta?.['q4'] ?? { home: h - 83, away: a - 81 },
    fgPctHome: 49.2,
    fgPctAway: 45.8,
    threePtPctHome: 39.1,
    threePtPctAway: 34.6,
    ftPctHome: 84.6,
    ftPctAway: 78.9,
    reboundsHome: 42,
    reboundsAway: 38,
    assistsHome: 27,
    assistsAway: 21,
    turnoversHome: 9,
    turnoversAway: 13,
    personalFoulsHome: 16,
    personalFoulsAway: 19,
    topPlayers: [
      { name: 'L. James', pts: 31, reb: 9, ast: 11, min: "34' ", team: 'home' },
      { name: 'A. Davis', pts: 24, reb: 14, ast: 3, min: "32' ", team: 'home' },
      { name: 'S. Curry', pts: 35, reb: 5, ast: 8, min: "35' ", team: 'away' },
      { name: 'D. Green', pts: 8, reb: 10, ast: 9, min: "29' ", team: 'away' },
    ],
  };
}

export function generateTennisTelemetry(homeScore: number, awayScore: number, meta?: Record<string, any>): TennisData {
  return {
    setScores: meta?.['setScores'] ?? [
      { setNumber: 1, home: 6, away: 4 },
      { setNumber: 2, home: 3, away: 6 },
      { setNumber: 3, home: 7, away: 5 },
    ],
    currentGameHome: meta?.['gameScore']?.['home'] ?? '40',
    currentGameAway: meta?.['gameScore']?.['away'] ?? '30',
    server: meta?.['server'] ?? 'home',
    acesHome: meta?.['aces']?.['home'] ?? 12,
    acesAway: meta?.['aces']?.['away'] ?? 8,
    doubleFaultsHome: meta?.['doubleFaults']?.['home'] ?? 3,
    doubleFaultsAway: meta?.['doubleFaults']?.['away'] ?? 5,
    breakPointsWonHome: meta?.['breakPointsWon']?.['home'] ?? '4/7',
    breakPointsWonAway: meta?.['breakPointsWon']?.['away'] ?? '2/6',
    unforcedErrorsHome: 19,
    unforcedErrorsAway: 27,
    firstServePctHome: 68,
    firstServePctAway: 61,
    totalPointsHome: 108,
    totalPointsAway: 94,
  };
}

export function generateEsportsTelemetry(homeScore: number, awayScore: number, meta?: Record<string, any>): EsportsData {
  return {
    mapScoreHome: meta?.['mapScore']?.['home'] ?? 2,
    mapScoreAway: meta?.['mapScore']?.['away'] ?? 1,
    roundScoreHome: meta?.['roundScore']?.['home'] ?? (11 + (homeScore % 5)),
    roundScoreAway: meta?.['roundScore']?.['away'] ?? (9 + (awayScore % 5)),
    currentMap: meta?.['currentMap'] ?? 'de_inferno (Map 3)',
    phase: meta?.['phase'] ?? 'BOMB PLANTED 💣',
    bombStatus: meta?.['bombStatus'] ?? '45s Fuse Ticking',
    economyHome: meta?.['economy']?.['home'] ?? '$16,400 (Full Armor & AWP)',
    economyAway: meta?.['economy']?.['away'] ?? '$4,200 (Force Buy & SMGs)',
    loadoutHome: 'Full Buy (2 AK-47, 1 AWP, 2 M4A1-S)',
    loadoutAway: 'Half Buy (Galil, MP9, Armor + Nades)',
    playerStats: [
      { name: 's1mple', kills: 26, deaths: 12, assists: 6, adr: 108.4, hsPct: 58, team: 'home' },
      { name: 'b1t', kills: 19, deaths: 14, assists: 4, adr: 84.1, hsPct: 68, team: 'home' },
      { name: 'ZywOo', kills: 24, deaths: 15, assists: 5, adr: 99.8, hsPct: 52, team: 'away' },
      { name: 'apex', kills: 12, deaths: 18, assists: 9, adr: 62.0, hsPct: 41, team: 'away' },
    ],
    mapHistory: [
      { mapName: 'De_Mirage', home: 16, away: 12, winner: 'home' },
      { mapName: 'De_Nuke', home: 11, away: 16, winner: 'away' },
      { mapName: 'De_Inferno', home: 13, away: 11, winner: 'home' },
    ],
  };
}

export function generateGenericTelemetry(homeScore: number, awayScore: number): GenericData {
  return {
    period: '2nd Half',
    timeRemaining: '12:40',
    possessionControl: 'Home Control',
    momentumPercentage: 65,
    eventsLog: [
      'Turnover forced by Home Defense',
      'Timeout called by Away Coach',
      'Point scored by Home Team',
    ],
  };
}

export interface FormattedFeedItem {
  icon: string;
  badge: string;
  badgeClass: string;
  headline: string;
  detail: string;
}

export function formatSportFeedItem(
  update: { score: { home: number; away: number }; timestamp: number; meta?: Record<string, any> },
  sport: SportCategory
): FormattedFeedItem {
  const meta = update.meta || {};
  const home = update.score.home;
  const away = update.score.away;

  switch (sport) {
    case 'cricket': {
      const runs = meta['runs'] ?? (home * 6 + 112);
      const wickets = meta['wickets'] ?? Math.min(9, Math.floor(home / 4));
      const overs = meta['overs'] ?? `${Math.min(19, 10 + Math.floor(home / 3))}.${home % 6}`;
      const crr = meta['crr'] ?? (runs / Math.max(1, parseFloat(overs) || 15)).toFixed(2);
      const recentBall = meta['recentBalls']?.[0] ?? (home % 2 === 0 ? '4' : '1');
      const isWicket = recentBall === 'W';
      const isBoundary = recentBall === '6' || recentBall === '4';

      return {
        icon: isWicket ? 'fa-solid fa-skull' : isBoundary ? 'fa-solid fa-bolt-lightning' : 'fa-solid fa-baseball-bat-ball',
        badge: isWicket ? 'WICKET 🔴' : isBoundary ? `BOUNDARY ${recentBall} ⚡` : 'CRICKET TICK',
        badgeClass: isWicket ? 'badge-wicket' : isBoundary ? 'badge-boundary' : 'badge-cricket',
        headline: `Score: ${runs}/${wickets} (${overs} ov) • CRR: ${crr}`,
        detail: `Last Ball: ${recentBall} run(s) | Striker: ${meta['striker']?.['name'] ?? 'V. Kohli'} ${meta['striker']?.['runs'] ?? (45 + (home % 15))}*(${meta['striker']?.['balls'] ?? 32}b) | Bowler: ${meta['bowler']?.['name'] ?? 'P. Cummins'}`,
      };
    }

    case 'football': {
      const minute = meta['minute'] ?? `${Math.min(90, 42 + home * 5)}'`;
      const possHome = meta['possession']?.['home'] ?? 58;
      const possAway = meta['possession']?.['away'] ?? (100 - possHome);

      return {
        icon: 'fa-solid fa-futbol',
        badge: `FOOTBALL TICK (${minute})`,
        badgeClass: 'badge-football',
        headline: `Match Score: Home ${home} - ${away} Away`,
        detail: `Match Minute: ${minute} | Possession: Home ${possHome}% vs ${possAway}% Away | Shots: ${meta['shots']?.['home'] ?? (8 + home * 2)} home, ${meta['shots']?.['away'] ?? 5} away`,
      };
    }

    case 'basketball': {
      const quarter = meta['quarter'] ?? 'Q4';
      const gameClock = meta['gameClock'] ?? '03:45';
      const homeScoreCalc = Math.max(72, home * 5 + 68);
      const awayScoreCalc = Math.max(68, away * 5 + 62);

      return {
        icon: 'fa-solid fa-basketball',
        badge: `${quarter} ${gameClock}`,
        badgeClass: 'badge-basketball',
        headline: `Score: Home ${homeScoreCalc} - ${awayScoreCalc} Away`,
        detail: `Period: ${quarter} (${gameClock}) | Shot Clock: ${meta['shotClock'] ?? 14}s | FG%: 49.2% vs 45.8% | Top Scorer: S. Curry 35 pts`,
      };
    }

    case 'tennis': {
      const pointsHome = meta['gameScore']?.['home'] ?? (home % 2 === 0 ? '40' : '30');
      const pointsAway = meta['gameScore']?.['away'] ?? (away % 2 === 0 ? '30' : '15');
      const server = meta['server'] ?? 'home';

      return {
        icon: 'fa-solid fa-table-tennis-paddle-ball',
        badge: `LIVE GAME: ${pointsHome} - ${pointsAway}`,
        badgeClass: 'badge-tennis',
        headline: `Sets: 6-4 | 3-6 | 7-5 • Live Game: ${pointsHome} - ${pointsAway}`,
        detail: `Server: ${server === 'home' ? 'Home Player 🎾' : 'Away Player 🎾'} | Aces: ${meta['aces']?.['home'] ?? 12} vs ${meta['aces']?.['away'] ?? 8} | Break Points: ${meta['breakPointsWon']?.['home'] ?? '4/7'}`,
      };
    }

    case 'esports': {
      const currentMap = meta['currentMap'] ?? 'de_inferno';
      const roundHome = meta['roundScore']?.['home'] ?? (11 + (home % 5));
      const roundAway = meta['roundScore']?.['away'] ?? (9 + (away % 5));
      const phase = meta['phase'] ?? 'BOMB PLANTED 💣';

      return {
        icon: 'fa-solid fa-gamepad',
        badge: `${currentMap} (${roundHome}-${roundAway})`,
        badgeClass: 'badge-esports',
        headline: `Round Score: Home ${roundHome} - ${roundAway} Away • Maps: 2 - 1`,
        detail: `Phase: ${phase} | Home Eco: ${meta['economy']?.['home'] ?? '$16,400'} | Top Fragger: ${meta['topFragger']?.['name'] ?? 's1mple'} (${meta['topFragger']?.['kills'] ?? 26} Kills)`,
      };
    }

    default: {
      return {
        icon: 'fa-solid fa-trophy',
        badge: 'SCORE UPDATE',
        badgeClass: 'badge-default',
        headline: `Current Score: Home ${home} - ${away} Away`,
        detail: `Live match update received.`,
      };
    }
  }
}

