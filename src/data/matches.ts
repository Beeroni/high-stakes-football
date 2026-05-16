import type { StakeType } from "./leagues";

export interface Match {
  id: string;
  leagueId: string;
  date: string; // ISO
  status: "upcoming" | "live";
  liveMinute?: number;
  homeScore?: number;
  awayScore?: number;
  home: { name: string; short: string; position: number; points: number; color: string };
  away: { name: string; short: string; position: number; points: number; color: string };
  stakes: StakeType[];
  stakesLabel: string;
  stakesExplainer: string;
}

export const MATCHES: Match[] = [
  // Premier League
  {
    id: "m1",
    leagueId: "epl",
    date: "2026-05-17T14:00:00Z",
    status: "upcoming",
    home: { name: "Everton", short: "EVE", position: 18, points: 31, color: "#003399" },
    away: { name: "Burnley", short: "BUR", position: 19, points: 28, color: "#6C1D45" },
    stakes: ["relegation"],
    stakesLabel: "Relegation Six-Pointer",
    stakesExplainer: "If Everton wins, they clear the drop zone by 2 pts. A Burnley win pulls them level with Everton with a game in hand.",
  },
  {
    id: "m2",
    leagueId: "epl",
    date: "2026-05-17T16:30:00Z",
    status: "live",
    liveMinute: 67,
    homeScore: 1,
    awayScore: 1,
    home: { name: "Arsenal", short: "ARS", position: 2, points: 82, color: "#EF0107" },
    away: { name: "Liverpool", short: "LIV", position: 1, points: 84, color: "#C8102E" },
    stakes: ["title"],
    stakesLabel: "Title Race Decider",
    stakesExplainer: "Arsenal must win to keep their title hopes alive — a draw effectively hands Liverpool the trophy.",
  },
  {
    id: "m3",
    leagueId: "epl",
    date: "2026-05-18T13:00:00Z",
    status: "upcoming",
    home: { name: "Aston Villa", short: "AVL", position: 5, points: 64, color: "#670E36" },
    away: { name: "Newcastle", short: "NEW", position: 6, points: 62, color: "#241F20" },
    stakes: ["continental"],
    stakesLabel: "Champions League Spot Battle",
    stakesExplainer: "Winner takes the 5th place Champions League spot. Loser drops to Europa League contention.",
  },

  // La Liga
  {
    id: "m4",
    leagueId: "laliga",
    date: "2026-05-18T19:00:00Z",
    status: "upcoming",
    home: { name: "Cádiz", short: "CAD", position: 17, points: 33, color: "#FFE600" },
    away: { name: "Granada", short: "GRA", position: 18, points: 30, color: "#C0282D" },
    stakes: ["relegation"],
    stakesLabel: "Relegation Six-Pointer",
    stakesExplainer: "Granada must win to escape the bottom three. A draw keeps them down with only 2 matchdays left.",
  },
  {
    id: "m5",
    leagueId: "laliga",
    date: "2026-05-19T20:00:00Z",
    status: "upcoming",
    home: { name: "Real Sociedad", short: "RSO", position: 7, points: 58, color: "#0067B1" },
    away: { name: "Real Betis", short: "BET", position: 8, points: 56, color: "#0BB363" },
    stakes: ["continental"],
    stakesLabel: "Europa League Spot",
    stakesExplainer: "Both clubs fighting for the last Europa League berth. Goal difference is razor-thin.",
  },

  // Serie A
  {
    id: "m6",
    leagueId: "seriea",
    date: "2026-05-17T18:45:00Z",
    status: "upcoming",
    home: { name: "Inter", short: "INT", position: 1, points: 86, color: "#0066CC" },
    away: { name: "Juventus", short: "JUV", position: 2, points: 81, color: "#000000" },
    stakes: ["title"],
    stakesLabel: "Scudetto Decider",
    stakesExplainer: "Juventus must win to keep the title race mathematically alive going into the final week.",
  },
  {
    id: "m7",
    leagueId: "seriea",
    date: "2026-05-18T15:00:00Z",
    status: "upcoming",
    home: { name: "Frosinone", short: "FRO", position: 19, points: 29, color: "#FFD700" },
    away: { name: "Empoli", short: "EMP", position: 17, points: 32, color: "#1E78BD" },
    stakes: ["relegation"],
    stakesLabel: "Relegation Six-Pointer",
    stakesExplainer: "Frosinone need a win to leapfrog Empoli and pull out of the drop zone on goal difference.",
  },

  // Bundesliga
  {
    id: "m8",
    leagueId: "bundes",
    date: "2026-05-17T13:30:00Z",
    status: "upcoming",
    home: { name: "Bayer Leverkusen", short: "B04", position: 1, points: 85, color: "#E32221" },
    away: { name: "Bayern Munich", short: "FCB", position: 2, points: 78, color: "#DC052D" },
    stakes: ["title"],
    stakesLabel: "Meisterschale Decider",
    stakesExplainer: "Leverkusen lift the Schale with a win. Bayern need to win to push it to the final matchday.",
  },
  {
    id: "m9",
    leagueId: "bundes",
    date: "2026-05-18T16:30:00Z",
    status: "upcoming",
    home: { name: "Union Berlin", short: "FCU", position: 15, points: 32, color: "#EB1923" },
    away: { name: "Mainz 05", short: "M05", position: 16, points: 30, color: "#C3141E" },
    stakes: ["relegation"],
    stakesLabel: "Relegation Play-off Battle",
    stakesExplainer: "Loser drops into the automatic relegation zone. Mainz win sends Union into the play-off spot.",
  },

  // Ligue 1
  {
    id: "m10",
    leagueId: "ligue1",
    date: "2026-05-19T19:00:00Z",
    status: "upcoming",
    home: { name: "Monaco", short: "ASM", position: 3, points: 64, color: "#E2001A" },
    away: { name: "Lille", short: "LIL", position: 4, points: 62, color: "#D71920" },
    stakes: ["continental"],
    stakesLabel: "Champions League Spot Battle",
    stakesExplainer: "Winner secures direct UCL qualification. Loser falls into the qualifying round.",
  },

  // Eredivisie
  {
    id: "m11",
    leagueId: "eredivisie",
    date: "2026-05-18T12:15:00Z",
    status: "upcoming",
    home: { name: "PSV", short: "PSV", position: 1, points: 87, color: "#ED1C24" },
    away: { name: "Feyenoord", short: "FEY", position: 2, points: 78, color: "#CC0033" },
    stakes: ["title"],
    stakesLabel: "Eredivisie Title Decider",
    stakesExplainer: "PSV clinch the title with a draw. Feyenoord must win and overturn an 8-goal swing in GD.",
  },

  // Primeira
  {
    id: "m12",
    leagueId: "primeira",
    date: "2026-05-17T20:30:00Z",
    status: "upcoming",
    home: { name: "Sporting CP", short: "SCP", position: 1, points: 85, color: "#008542" },
    away: { name: "Benfica", short: "SLB", position: 2, points: 82, color: "#E30613" },
    stakes: ["title"],
    stakesLabel: "O Clássico — Title on the Line",
    stakesExplainer: "Sporting need 1 point to seal the league. Benfica win and it goes to the final matchday.",
  },

  // SPL
  {
    id: "m13",
    leagueId: "spl",
    date: "2026-05-18T11:30:00Z",
    status: "upcoming",
    home: { name: "Celtic", short: "CEL", position: 1, points: 88, color: "#008842" },
    away: { name: "Rangers", short: "RAN", position: 2, points: 85, color: "#1B458F" },
    stakes: ["title"],
    stakesLabel: "Old Firm Title Decider",
    stakesExplainer: "Rangers must win to keep the league race alive. Celtic clinch with a draw or win.",
  },

  // Championship
  {
    id: "m14",
    leagueId: "championship",
    date: "2026-05-19T19:45:00Z",
    status: "upcoming",
    home: { name: "Leeds", short: "LEE", position: 3, points: 87, color: "#FFFFFF" },
    away: { name: "Ipswich", short: "IPS", position: 2, points: 89, color: "#3764A4" },
    stakes: ["title"],
    stakesLabel: "Promotion Race",
    stakesExplainer: "Winner secures automatic promotion to the Premier League. Loser into the play-offs.",
  },

  // Belgian
  {
    id: "m15",
    leagueId: "belgian",
    date: "2026-05-18T18:30:00Z",
    status: "upcoming",
    home: { name: "Anderlecht", short: "AND", position: 3, points: 49, color: "#582C83" },
    away: { name: "Club Brugge", short: "CLB", position: 4, points: 48, color: "#005BAC" },
    stakes: ["continental"],
    stakesLabel: "Europa Conference Spot",
    stakesExplainer: "Final European spot in the Championship play-off. Loser misses out on continental football.",
  },

  // Turkish
  {
    id: "m16",
    leagueId: "turkish",
    date: "2026-05-17T18:00:00Z",
    status: "upcoming",
    home: { name: "Galatasaray", short: "GAL", position: 1, points: 95, color: "#A90432" },
    away: { name: "Fenerbahçe", short: "FEN", position: 2, points: 93, color: "#FFED00" },
    stakes: ["title"],
    stakesLabel: "Süper Lig Title Decider",
    stakesExplainer: "Direct title shootout — winner takes the championship with 2 games to play.",
  },

  // Greek
  {
    id: "m17",
    leagueId: "greek",
    date: "2026-05-18T17:00:00Z",
    status: "upcoming",
    home: { name: "Olympiacos", short: "OLY", position: 3, points: 58, color: "#E30613" },
    away: { name: "AEK Athens", short: "AEK", position: 4, points: 56, color: "#FFD700" },
    stakes: ["continental"],
    stakesLabel: "Champions League Qualifier Spot",
    stakesExplainer: "Winner enters the Champions League qualifying rounds. Loser drops to Conference League path.",
  },

  // Austrian
  {
    id: "m18",
    leagueId: "austrian",
    date: "2026-05-19T18:30:00Z",
    status: "upcoming",
    home: { name: "Sturm Graz", short: "STU", position: 1, points: 64, color: "#000000" },
    away: { name: "Red Bull Salzburg", short: "RBS", position: 2, points: 62, color: "#D60037" },
    stakes: ["title"],
    stakesLabel: "Bundesliga Title Decider",
    stakesExplainer: "Sturm Graz one win away from a historic title. Salzburg must win to keep streak alive.",
  },

  // Swiss
  {
    id: "m19",
    leagueId: "swiss",
    date: "2026-05-17T16:30:00Z",
    status: "upcoming",
    home: { name: "Lausanne", short: "LAU", position: 10, points: 30, color: "#003DA5" },
    away: { name: "Stade Lausanne", short: "SLO", position: 11, points: 28, color: "#FFFFFF" },
    stakes: ["relegation"],
    stakesLabel: "Relegation Play-off Battle",
    stakesExplainer: "Loser plays the Challenge League play-off. A win moves the victor safely clear.",
  },

  // Danish
  {
    id: "m20",
    leagueId: "danish",
    date: "2026-05-18T16:00:00Z",
    status: "upcoming",
    home: { name: "FC Midtjylland", short: "FCM", position: 1, points: 70, color: "#000000" },
    away: { name: "FC København", short: "FCK", position: 2, points: 68, color: "#FFFFFF" },
    stakes: ["title"],
    stakesLabel: "Superliga Title Decider",
    stakesExplainer: "Top-of-the-table clash with the championship on the line. Two points separate them.",
  },

  // Brasileirao
  {
    id: "m21",
    leagueId: "brasileirao",
    date: "2026-05-19T22:00:00Z",
    status: "upcoming",
    home: { name: "Palmeiras", short: "PAL", position: 2, points: 24, color: "#006437" },
    away: { name: "Flamengo", short: "FLA", position: 1, points: 26, color: "#E30613" },
    stakes: ["title", "continental"],
    stakesLabel: "Libertadores Spot + Title Race",
    stakesExplainer: "Top-of-the-table early season — winner sets the pace and seals an early Libertadores spot.",
  },
  {
    id: "m22",
    leagueId: "brasileirao",
    date: "2026-05-18T21:00:00Z",
    status: "upcoming",
    home: { name: "Cuiabá", short: "CUI", position: 19, points: 8, color: "#006633" },
    away: { name: "Atlético-GO", short: "ACG", position: 20, points: 6, color: "#FF0000" },
    stakes: ["relegation"],
    stakesLabel: "Early Relegation Six-Pointer",
    stakesExplainer: "Both sides desperate for points to escape the early-season relegation zone.",
  },

  // Liga MX
  {
    id: "m23",
    leagueId: "ligamx",
    date: "2026-05-17T03:00:00Z",
    status: "upcoming",
    home: { name: "América", short: "AME", position: 1, points: 38, color: "#FFD700" },
    away: { name: "Monterrey", short: "MTY", position: 3, points: 33, color: "#003DA5" },
    stakes: ["title"],
    stakesLabel: "Liguilla Final Decider",
    stakesExplainer: "Liguilla semi-final 2nd leg — América lead 1-0 on aggregate. Monterrey must score twice.",
  },

  // Argentina
  {
    id: "m24",
    leagueId: "argentina",
    date: "2026-05-18T23:00:00Z",
    status: "upcoming",
    home: { name: "River Plate", short: "RIV", position: 2, points: 32, color: "#FFFFFF" },
    away: { name: "Boca Juniors", short: "BOC", position: 4, points: 28, color: "#003F87" },
    stakes: ["continental"],
    stakesLabel: "Copa Libertadores Spot",
    stakesExplainer: "Superclásico with continental implications — both fighting for a Libertadores group stage berth.",
  },

  // Colombia
  {
    id: "m25",
    leagueId: "colombia",
    date: "2026-05-19T00:00:00Z",
    status: "upcoming",
    home: { name: "Atlético Nacional", short: "NAC", position: 1, points: 35, color: "#00853F" },
    away: { name: "Millonarios", short: "MIL", position: 2, points: 33, color: "#003DA5" },
    stakes: ["title"],
    stakesLabel: "Apertura Title Race",
    stakesExplainer: "Top-of-the-table clash decides who tops the Apertura standings going into the final.",
  },

  // Chile
  {
    id: "m26",
    leagueId: "chile",
    date: "2026-05-18T20:00:00Z",
    status: "upcoming",
    home: { name: "Colo-Colo", short: "COL", position: 14, points: 8, color: "#FFFFFF" },
    away: { name: "Cobresal", short: "COB", position: 15, points: 7, color: "#FF6600" },
    stakes: ["relegation"],
    stakesLabel: "Relegation Battle",
    stakesExplainer: "Both clubs near the drop. Loser slides into the relegation play-off positions.",
  },

  // J-League
  {
    id: "m27",
    leagueId: "jleague",
    date: "2026-05-17T05:00:00Z",
    status: "upcoming",
    home: { name: "Kashima Antlers", short: "KAS", position: 4, points: 24, color: "#9B1B1F" },
    away: { name: "Urawa Reds", short: "URA", position: 5, points: 22, color: "#E60012" },
    stakes: ["continental"],
    stakesLabel: "AFC Champions League Spot",
    stakesExplainer: "Both pushing for the AFC Champions League Elite places. Decisive 6-pointer in May.",
  },
  {
    id: "m28",
    leagueId: "jleague",
    date: "2026-05-18T05:00:00Z",
    status: "upcoming",
    home: { name: "Sagan Tosu", short: "SAG", position: 17, points: 8, color: "#FF69B4" },
    away: { name: "Júbilo Iwata", short: "JUB", position: 18, points: 7, color: "#003F87" },
    stakes: ["relegation"],
    stakesLabel: "Relegation Six-Pointer",
    stakesExplainer: "Both anchored at the bottom — loser plunges deeper into the relegation mire.",
  },

  // Saudi
  {
    id: "m29",
    leagueId: "saudi",
    date: "2026-05-17T18:00:00Z",
    status: "live",
    liveMinute: 32,
    homeScore: 0,
    awayScore: 0,
    home: { name: "Al-Hilal", short: "HIL", position: 1, points: 88, color: "#003DA5" },
    away: { name: "Al-Nassr", short: "NSR", position: 2, points: 80, color: "#FFD700" },
    stakes: ["title"],
    stakesLabel: "Saudi Pro League Title Decider",
    stakesExplainer: "Ronaldo vs Neymar — Al-Hilal can wrap up the title with a draw. Al-Nassr need all 3 points.",
  },

  // K-League
  {
    id: "m30",
    leagueId: "kleague",
    date: "2026-05-18T10:30:00Z",
    status: "upcoming",
    home: { name: "Ulsan HD", short: "ULS", position: 1, points: 28, color: "#0033A0" },
    away: { name: "Pohang Steelers", short: "POH", position: 2, points: 26, color: "#E60012" },
    stakes: ["title", "continental"],
    stakesLabel: "Title + ACL Spot",
    stakesExplainer: "Top-2 clash — winner sits in pole for both the K-League title and a guaranteed ACL spot.",
  },

  // CSL
  {
    id: "m31",
    leagueId: "csl",
    date: "2026-05-17T11:00:00Z",
    status: "upcoming",
    home: { name: "Shanghai Port", short: "SHA", position: 1, points: 25, color: "#E60012" },
    away: { name: "Shandong Taishan", short: "SHD", position: 3, points: 21, color: "#FF6600" },
    stakes: ["title"],
    stakesLabel: "CSL Title Race",
    stakesExplainer: "Reigning champions Shanghai face their closest challenger — early season but pivotal.",
  },

  // A-League
  {
    id: "m32",
    leagueId: "aleague",
    date: "2026-05-17T08:45:00Z",
    status: "upcoming",
    home: { name: "Melbourne City", short: "MCY", position: 5, points: 38, color: "#6CABDD" },
    away: { name: "Sydney FC", short: "SYD", position: 6, points: 37, color: "#0099CC" },
    stakes: ["continental"],
    stakesLabel: "Finals Series Spot",
    stakesExplainer: "Final Finals Series qualification spot. Loser misses the postseason entirely.",
  },
];
