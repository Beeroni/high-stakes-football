import type { StakeType } from "./leagues";

export interface Match {
  id: string;
  leagueId: string;
  date: string; // ISO
  status: "upcoming" | "live";
  liveMinute?: number;
  homeScore?: number;
  awayScore?: number;
  home: { name: string; short: string; position: number; points: number; color: string; threshold?: Threshold };
  away: { name: string; short: string; position: number; points: number; color: string; threshold?: Threshold };
  stakes: StakeType[];
  stakesLabel: string;
  stakesExplainer: string;
}

export interface Threshold {
  // e.g. "+2 above safety", "-3 from Europe", "+1 UCL cushion", "Leader", "-4 to title"
  label: string;
  // Positive = cushion / safe; negative = needs to make up ground; 0 = on the line
  delta: number;
  kind: "title" | "continental" | "relegation" | "neutral";
}

// Realistic run-in fixtures for the 2025–26 season (mid-to-late May 2026).
// Reflects: Barcelona champions of LaLiga, Inter champions of Serie A,
// Bayern champions of Bundesliga, PSG champions of Ligue 1 (Nantes & Metz
// relegated), Arsenal vs Man City PL title race, Burnley & Wolves already
// relegated from the PL with Spurs vs West Ham fighting the final drop spot.
export const MATCHES: Match[] = [
  // ===== Premier League =====
  {
    id: "epl-1",
    leagueId: "epl",
    date: "2026-05-17T15:30:00Z",
    status: "live",
    liveMinute: 58,
    homeScore: 2,
    awayScore: 1,
    home: { name: "Arsenal", short: "ARS", position: 1, points: 84, color: "#EF0107" },
    away: { name: "Aston Villa", short: "AVL", position: 7, points: 60, color: "#670E36" },
    stakes: ["title"],
    stakesLabel: "Title Race — Matchday 37",
    stakesExplainer: "A win clinches Arsenal's first Premier League title since 2003-04. Anything else and Man City stay alive going into the final weekend.",
  },
  {
    id: "epl-2",
    leagueId: "epl",
    date: "2026-05-17T13:00:00Z",
    status: "upcoming",
    home: { name: "Manchester City", short: "MCI", position: 2, points: 81, color: "#6CABDD" },
    away: { name: "Bournemouth", short: "BOU", position: 9, points: 54, color: "#DA291C" },
    stakes: ["title"],
    stakesLabel: "Title Race — Keep Pressure On",
    stakesExplainer: "City must win and hope Arsenal slip. Drop points and the four-in-a-row dream is over.",
  },
  {
    id: "epl-3",
    leagueId: "epl",
    date: "2026-05-17T15:30:00Z",
    status: "upcoming",
    home: { name: "Tottenham", short: "TOT", position: 17, points: 35, color: "#132257" },
    away: { name: "West Ham", short: "WHU", position: 18, points: 33, color: "#7A263A" },
    stakes: ["relegation"],
    stakesLabel: "Survival Six-Pointer",
    stakesExplainer: "With Burnley and Wolves already down, the loser here is all but relegated. A Spurs draw effectively saves them; West Ham must win at all costs.",
  },
  {
    id: "epl-4",
    leagueId: "epl",
    date: "2026-05-18T19:00:00Z",
    status: "upcoming",
    home: { name: "Chelsea", short: "CHE", position: 4, points: 68, color: "#034694" },
    away: { name: "Newcastle", short: "NEW", position: 5, points: 66, color: "#241F20" },
    stakes: ["continental"],
    stakesLabel: "Champions League Spot Battle",
    stakesExplainer: "Both inside the top five for now, but only one can be safe from a final-day swing. Loser drops into Europa League territory.",
  },

  // ===== La Liga (Barcelona already crowned) =====
  {
    id: "lal-1",
    leagueId: "laliga",
    date: "2026-05-17T19:00:00Z",
    status: "upcoming",
    home: { name: "Villarreal", short: "VIL", position: 4, points: 67, color: "#FFE667" },
    away: { name: "Athletic Club", short: "ATH", position: 5, points: 65, color: "#EE2523" },
    stakes: ["continental"],
    stakesLabel: "Champions League Qualification",
    stakesExplainer: "Real Madrid, Barça and Atlético are safe in the top three. This decides who joins them in next season's Champions League.",
  },
  {
    id: "lal-2",
    leagueId: "laliga",
    date: "2026-05-18T18:00:00Z",
    status: "upcoming",
    home: { name: "Real Oviedo", short: "OVI", position: 18, points: 36, color: "#0072CE" },
    away: { name: "Leganés", short: "LEG", position: 17, points: 38, color: "#005CA9" },
    stakes: ["relegation"],
    stakesLabel: "Relegation Six-Pointer",
    stakesExplainer: "Oviedo's return to LaLiga is on the line — a win lifts them out of the drop zone on head-to-head. A draw sends them down with one game left.",
  },

  // ===== Serie A (Inter champions, 21st Scudetto) =====
  {
    id: "ser-1",
    leagueId: "seriea",
    date: "2026-05-17T18:45:00Z",
    status: "upcoming",
    home: { name: "Roma", short: "ROM", position: 4, points: 67, color: "#8E1F2F" },
    away: { name: "Lazio", short: "LAZ", position: 6, points: 63, color: "#87CEEB" },
    stakes: ["continental"],
    stakesLabel: "Derby della Capitale — UCL Spot",
    stakesExplainer: "Roma can lock down a Champions League berth with a win. Lazio need three points to leapfrog Atalanta and Bologna for the final UCL place.",
  },
  {
    id: "ser-2",
    leagueId: "seriea",
    date: "2026-05-18T18:45:00Z",
    status: "upcoming",
    home: { name: "Lecce", short: "LEC", position: 17, points: 32, color: "#FFE600" },
    away: { name: "Hellas Verona", short: "VER", position: 18, points: 30, color: "#FFE600" },
    stakes: ["relegation"],
    stakesLabel: "Salvezza Six-Pointer",
    stakesExplainer: "Verona must win to climb above Lecce on the table. A draw leaves both within a point of the drop with the final weekend to play.",
  },

  // ===== Bundesliga (Bayern champions, 35th) =====
  {
    id: "bun-1",
    leagueId: "bundes",
    date: "2026-05-16T13:30:00Z",
    status: "live",
    liveMinute: 71,
    homeScore: 1,
    awayScore: 1,
    home: { name: "Heidenheim", short: "FCH", position: 18, points: 23, color: "#E2001A" },
    away: { name: "St. Pauli", short: "STP", position: 16, points: 31, color: "#614F3F" },
    stakes: ["relegation"],
    stakesLabel: "Final-Day Survival",
    stakesExplainer: "Heidenheim are rock-bottom and need to win to force the relegation play-off. St. Pauli need a point to escape it.",
  },
  {
    id: "bun-2",
    leagueId: "bundes",
    date: "2026-05-16T15:30:00Z",
    status: "upcoming",
    home: { name: "RB Leipzig", short: "RBL", position: 3, points: 64, color: "#DD0741" },
    away: { name: "Borussia Dortmund", short: "BVB", position: 4, points: 62, color: "#FDE100" },
    stakes: ["continental"],
    stakesLabel: "Champions League Direct Spot",
    stakesExplainer: "Winner secures a top-four finish and direct UCL qualification. Loser falls into the Europa League race.",
  },
  {
    id: "bun-3",
    leagueId: "bundes",
    date: "2026-05-16T13:30:00Z",
    status: "upcoming",
    home: { name: "Mainz 05", short: "M05", position: 15, points: 32, color: "#C3141E" },
    away: { name: "Werder Bremen", short: "SVW", position: 14, points: 33, color: "#1D9053" },
    stakes: ["relegation"],
    stakesLabel: "Relegation Play-off Avoidance",
    stakesExplainer: "Both clubs are one defeat from the play-off spot. A win for either pulls them clear of the drop with the season ending today.",
  },

  // ===== Ligue 1 (final matchday — PSG champion, Nantes & Metz down) =====
  {
    id: "lig-1",
    leagueId: "ligue1",
    date: "2026-05-17T19:05:00Z",
    status: "upcoming",
    home: { name: "Marseille", short: "OM", position: 3, points: 65, color: "#2FAEE0" },
    away: { name: "Monaco", short: "ASM", position: 4, points: 63, color: "#E2001A" },
    stakes: ["continental"],
    stakesLabel: "UCL Qualifier vs Europa",
    stakesExplainer: "PSG and Lens are already in the Champions League. Winner here grabs the third UCL place; loser slides to Europa League.",
  },
  {
    id: "lig-2",
    leagueId: "ligue1",
    date: "2026-05-17T19:05:00Z",
    status: "upcoming",
    home: { name: "Lyon", short: "OL", position: 7, points: 53, color: "#003DA5" },
    away: { name: "Strasbourg", short: "RCS", position: 6, points: 55, color: "#003DA5" },
    stakes: ["continental"],
    stakesLabel: "Conference League Play-off Spot",
    stakesExplainer: "Final European place on the line. Lyon win and they're in Europe; Strasbourg need only a point to lock it up.",
  },

  // ===== Eredivisie (PSV champion) =====
  {
    id: "ere-1",
    leagueId: "eredivisie",
    date: "2026-05-17T12:15:00Z",
    status: "upcoming",
    home: { name: "NEC", short: "NEC", position: 3, points: 56, color: "#E30613" },
    away: { name: "FC Twente", short: "TWE", position: 4, points: 53, color: "#E30613" },
    stakes: ["continental"],
    stakesLabel: "Champions League Qualifying Round",
    stakesExplainer: "Feyenoord locked in 2nd. This decides who gets the UCL qualifying-round entry — a huge financial windfall.",
  },
  {
    id: "ere-2",
    leagueId: "eredivisie",
    date: "2026-05-17T14:30:00Z",
    status: "upcoming",
    home: { name: "AZ Alkmaar", short: "AZ", position: 6, points: 48, color: "#E30613" },
    away: { name: "Ajax", short: "AJA", position: 5, points: 51, color: "#D2122E" },
    stakes: ["continental"],
    stakesLabel: "Europa League Spot",
    stakesExplainer: "Ajax's worst season in a decade still has a Europa League ticket on offer. AZ win and they leapfrog into Europe.",
  },

  // ===== Primeira Liga =====
  {
    id: "pri-1",
    leagueId: "primeira",
    date: "2026-05-17T20:30:00Z",
    status: "upcoming",
    home: { name: "Sporting CP", short: "SCP", position: 2, points: 78, color: "#008542" },
    away: { name: "FC Porto", short: "POR", position: 1, points: 80, color: "#00428C" },
    stakes: ["title"],
    stakesLabel: "Title Decider — O Clássico",
    stakesExplainer: "Porto lead by two with two games left. A draw or win at Alvalade and the title is theirs; Sporting must win to take it to the final round.",
  },

  // ===== Scottish Premiership =====
  {
    id: "spl-1",
    leagueId: "spl",
    date: "2026-05-17T11:30:00Z",
    status: "upcoming",
    home: { name: "Celtic", short: "CEL", position: 1, points: 88, color: "#008842" },
    away: { name: "Hearts", short: "HEA", position: 3, points: 67, color: "#7D1F2C" },
    stakes: ["continental"],
    stakesLabel: "UCL Qualifying Spot",
    stakesExplainer: "Celtic already champions. Hearts need a result to lock the 3rd-place UCL qualifying-round berth ahead of Aberdeen.",
  },

  // ===== Championship (playoff race) =====
  {
    id: "cha-1",
    leagueId: "championship",
    date: "2026-05-17T11:30:00Z",
    status: "upcoming",
    home: { name: "Coventry", short: "COV", position: 4, points: 84, color: "#87CEEB" },
    away: { name: "Middlesbrough", short: "MID", position: 5, points: 82, color: "#E11B22" },
    stakes: ["title"],
    stakesLabel: "Play-off Semi — 2nd Leg",
    stakesExplainer: "Aggregate level at 1-1 from the first leg. Winner faces Norwich at Wembley for a £200m Premier League promotion.",
  },
  {
    id: "cha-2",
    leagueId: "championship",
    date: "2026-05-18T18:45:00Z",
    status: "upcoming",
    home: { name: "Norwich", short: "NOR", position: 2, points: 92, color: "#FFF200" },
    away: { name: "Sheffield Wednesday", short: "SHW", position: 6, points: 78, color: "#0033A0" },
    stakes: ["title"],
    stakesLabel: "Promotion Play-off Semi",
    stakesExplainer: "Norwich went up automatically; Wednesday chase the play-off final. Aggregate tied — winner takes all at Wembley.",
  },

  // ===== Belgian Pro League (Championship play-off) =====
  {
    id: "bel-1",
    leagueId: "belgian",
    date: "2026-05-17T17:30:00Z",
    status: "upcoming",
    home: { name: "Union SG", short: "USG", position: 1, points: 51, color: "#FFE600" },
    away: { name: "Genk", short: "GNK", position: 2, points: 48, color: "#0067B1" },
    stakes: ["title"],
    stakesLabel: "Championship Play-off Decider",
    stakesExplainer: "Union SG can clinch back-to-back titles with a win. Genk need all three points to take it to the final round.",
  },

  // ===== Süper Lig (Galatasaray vs Fener title race) =====
  {
    id: "tur-1",
    leagueId: "turkish",
    date: "2026-05-17T18:00:00Z",
    status: "upcoming",
    home: { name: "Galatasaray", short: "GAL", position: 1, points: 92, color: "#A90432" },
    away: { name: "Fenerbahçe", short: "FEN", position: 2, points: 89, color: "#FFED00" },
    stakes: ["title"],
    stakesLabel: "Süper Lig Title Decider",
    stakesExplainer: "Three-point gap with two to play. Galatasaray win the derby and seal a third straight title; Fener win and the race goes to the wire.",
  },

  // ===== Greek Super League =====
  {
    id: "gre-1",
    leagueId: "greek",
    date: "2026-05-18T17:00:00Z",
    status: "upcoming",
    home: { name: "Olympiacos", short: "OLY", position: 1, points: 78, color: "#E30613" },
    away: { name: "PAOK", short: "PAOK", position: 2, points: 75, color: "#000000" },
    stakes: ["title", "continental"],
    stakesLabel: "Title & UCL Spot",
    stakesExplainer: "Top-two clash in the championship play-off. Winner takes the title race to the final matchday and the direct UCL berth.",
  },

  // ===== Austrian Bundesliga =====
  {
    id: "aut-1",
    leagueId: "austrian",
    date: "2026-05-17T14:30:00Z",
    status: "upcoming",
    home: { name: "Red Bull Salzburg", short: "RBS", position: 2, points: 60, color: "#D60037" },
    away: { name: "Sturm Graz", short: "STU", position: 1, points: 63, color: "#000000" },
    stakes: ["title"],
    stakesLabel: "Title Decider",
    stakesExplainer: "Sturm Graz can wrap up back-to-back titles with a draw. Salzburg must win to keep their dynasty alive.",
  },

  // ===== Swiss Super League =====
  {
    id: "swi-1",
    leagueId: "swiss",
    date: "2026-05-17T14:15:00Z",
    status: "upcoming",
    home: { name: "Yverdon", short: "YVE", position: 11, points: 28, color: "#003DA5" },
    away: { name: "Winterthur", short: "WIN", position: 12, points: 26, color: "#E30613" },
    stakes: ["relegation"],
    stakesLabel: "Relegation Play-off Avoidance",
    stakesExplainer: "12th plays a Challenge League promotion final. Yverdon need a point to climb above Winterthur and escape the play-off.",
  },

  // ===== Danish Superliga =====
  {
    id: "dan-1",
    leagueId: "danish",
    date: "2026-05-17T16:00:00Z",
    status: "upcoming",
    home: { name: "FC Midtjylland", short: "FCM", position: 1, points: 73, color: "#000000" },
    away: { name: "FC København", short: "FCK", position: 2, points: 71, color: "#003DA5" },
    stakes: ["title"],
    stakesLabel: "Superliga Title Decider",
    stakesExplainer: "Two-point gap in the championship round. Midtjylland win and they're champions; FCK win and it goes to the final day.",
  },

  // ===== Brasileirão (early season, ~matchday 7) =====
  {
    id: "bra-1",
    leagueId: "brasileirao",
    date: "2026-05-17T22:00:00Z",
    status: "upcoming",
    home: { name: "Flamengo", short: "FLA", position: 1, points: 16, color: "#E30613" },
    away: { name: "Palmeiras", short: "PAL", position: 3, points: 13, color: "#006437" },
    stakes: ["title", "continental"],
    stakesLabel: "Early-Season Top-of-Table",
    stakesExplainer: "Two of Brazil's biggest clubs already pulling clear. Winner takes a meaningful early lead in both the title and Libertadores race.",
  },
  {
    id: "bra-2",
    leagueId: "brasileirao",
    date: "2026-05-18T21:30:00Z",
    status: "upcoming",
    home: { name: "Sport Recife", short: "SPT", position: 19, points: 3, color: "#E30613" },
    away: { name: "Vitória", short: "VIT", position: 18, points: 4, color: "#E30613" },
    stakes: ["relegation"],
    stakesLabel: "Early Relegation Battle",
    stakesExplainer: "Both winless after 7 rounds. Loser's relegation odds tip past 70% — a long season looks even longer.",
  },

  // ===== Liga MX (Clausura 2026 Liguilla Final) =====
  {
    id: "mex-1",
    leagueId: "ligamx",
    date: "2026-05-18T03:00:00Z",
    status: "upcoming",
    home: { name: "Cruz Azul", short: "CAZ", position: 2, points: 38, color: "#003DA5" },
    away: { name: "América", short: "AME", position: 1, points: 41, color: "#FFD700" },
    stakes: ["title"],
    stakesLabel: "Liguilla Final — 2nd Leg",
    stakesExplainer: "Clásico Joven final. América lead 2-1 from the first leg; Cruz Azul need to overturn it at home to end a 28-year title drought.",
  },

  // ===== Argentina (Apertura, top of table) =====
  {
    id: "arg-1",
    leagueId: "argentina",
    date: "2026-05-17T23:00:00Z",
    status: "upcoming",
    home: { name: "River Plate", short: "RIV", position: 1, points: 30, color: "#E30613" },
    away: { name: "Boca Juniors", short: "BOC", position: 3, points: 27, color: "#003F87" },
    stakes: ["title", "continental"],
    stakesLabel: "Superclásico — Group Leaders",
    stakesExplainer: "Top of their zone with the Apertura play-offs looming. Winner all but locks in a Libertadores 2027 berth and a #1 seed.",
  },

  // ===== Colombia (Apertura semifinal) =====
  {
    id: "col-1",
    leagueId: "colombia",
    date: "2026-05-19T00:00:00Z",
    status: "upcoming",
    home: { name: "Atlético Nacional", short: "NAC", position: 1, points: 35, color: "#00853F" },
    away: { name: "Millonarios", short: "MIL", position: 4, points: 30, color: "#003DA5" },
    stakes: ["title"],
    stakesLabel: "Apertura Semifinal — 2nd Leg",
    stakesExplainer: "Aggregate level after a 1-1 first leg. Winner faces Junior in the Apertura final; loser bows out.",
  },

  // ===== Chile (Apertura early season) =====
  {
    id: "chi-1",
    leagueId: "chile",
    date: "2026-05-18T22:00:00Z",
    status: "upcoming",
    home: { name: "U. de Chile", short: "UCH", position: 1, points: 26, color: "#003DA5" },
    away: { name: "Colo-Colo", short: "COL", position: 4, points: 21, color: "#000000" },
    stakes: ["title", "continental"],
    stakesLabel: "Superclásico — Title Leaders",
    stakesExplainer: "La U leading the table; Colo-Colo trying to stay in touch. A defeat for the leaders blows the title race wide open.",
  },

  // ===== J1 League (mid-season, ~matchday 15) =====
  {
    id: "jpn-1",
    leagueId: "jleague",
    date: "2026-05-17T05:00:00Z",
    status: "upcoming",
    home: { name: "Vissel Kobe", short: "VIS", position: 2, points: 30, color: "#9B1B1F" },
    away: { name: "Sanfrecce Hiroshima", short: "SAN", position: 3, points: 28, color: "#582C83" },
    stakes: ["title", "continental"],
    stakesLabel: "ACL Elite Spot Race",
    stakesExplainer: "Top-three clash. Winner closes on Kashima at the top and locks in an AFC Champions League Elite ticket.",
  },
  {
    id: "jpn-2",
    leagueId: "jleague",
    date: "2026-05-17T08:00:00Z",
    status: "upcoming",
    home: { name: "Albirex Niigata", short: "NII", position: 19, points: 8, color: "#FF7900" },
    away: { name: "Yokohama FC", short: "YFC", position: 20, points: 6, color: "#003DA5" },
    stakes: ["relegation"],
    stakesLabel: "Bottom-of-Table Six-Pointer",
    stakesExplainer: "Both winless at home in 2026. Loser drifts further from safety with two-thirds of the season still to come.",
  },

  // ===== Saudi Pro League =====
  {
    id: "sau-1",
    leagueId: "saudi",
    date: "2026-05-17T18:00:00Z",
    status: "live",
    liveMinute: 23,
    homeScore: 1,
    awayScore: 0,
    home: { name: "Al-Hilal", short: "HIL", position: 2, points: 78, color: "#003DA5" },
    away: { name: "Al-Nassr", short: "NSR", position: 1, points: 80, color: "#FFD700" },
    stakes: ["title"],
    stakesLabel: "Title Decider — Ronaldo vs Mitrović",
    stakesExplainer: "Two-point gap with one matchday to play. Al-Hilal must win; a draw or Al-Nassr win and Ronaldo finally lifts the Saudi league crown.",
  },

  // ===== K League 1 =====
  {
    id: "kor-1",
    leagueId: "kleague",
    date: "2026-05-17T10:00:00Z",
    status: "upcoming",
    home: { name: "Ulsan HD", short: "ULS", position: 1, points: 28, color: "#0033A0" },
    away: { name: "Jeonbuk Hyundai", short: "JEO", position: 2, points: 26, color: "#1A8949" },
    stakes: ["title", "continental"],
    stakesLabel: "Title & ACL Pole Position",
    stakesExplainer: "K League heavyweights tied near the top. Winner sits in pole for both the title and a direct ACL Elite berth.",
  },

  // ===== Chinese Super League =====
  {
    id: "chn-1",
    leagueId: "csl",
    date: "2026-05-17T11:30:00Z",
    status: "upcoming",
    home: { name: "Shanghai Port", short: "SHP", position: 1, points: 26, color: "#E60012" },
    away: { name: "Beijing Guoan", short: "BEJ", position: 2, points: 23, color: "#00843D" },
    stakes: ["title"],
    stakesLabel: "Defending Champions vs Capital",
    stakesExplainer: "Shanghai Port chasing back-to-back titles. Beijing Guoan need a win away from home to close the gap to nothing.",
  },

  // ===== A-League (Finals Series) =====
  {
    id: "aus-1",
    leagueId: "aleague",
    date: "2026-05-17T08:45:00Z",
    status: "upcoming",
    home: { name: "Melbourne Victory", short: "MVC", position: 2, points: 52, color: "#000040" },
    away: { name: "Auckland FC", short: "AFC", position: 1, points: 58, color: "#000000" },
    stakes: ["title"],
    stakesLabel: "Grand Final — Championship Decider",
    stakesExplainer: "Premiers Auckland FC face Victory at AAMI Park. Winner lifts the A-League Championship trophy.",
  },
];
