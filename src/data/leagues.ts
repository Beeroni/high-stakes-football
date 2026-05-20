export type StakeType = "relegation" | "title" | "continental";

export interface League {
  id: string;
  name: string;
  country: string;
  region: "Europe" | "Latin America" | "Asia";
  flag: string;
  /** TheSportsDB idLeague used for fixture/standings sync */
  sportsdbId: string;
  /** Total teams in the league (used to compute relegation zone) */
  size: number;
  /** Number of relegation slots (bottom N) */
  relegationSlots: number;
  /** Number of continental qualification slots (top N below title, e.g. UCL/UEL spots) */
  continentalSlots: number;
}

export const LEAGUES: League[] = [
  // Europe
  { id: "epl", name: "Premier League", country: "England", region: "Europe", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", sportsdbId: "4328", size: 20, relegationSlots: 3, continentalSlots: 6 },
  { id: "laliga", name: "La Liga", country: "Spain", region: "Europe", flag: "🇪🇸", sportsdbId: "4335", size: 20, relegationSlots: 3, continentalSlots: 6 },
  { id: "seriea", name: "Serie A", country: "Italy", region: "Europe", flag: "🇮🇹", sportsdbId: "4332", size: 20, relegationSlots: 3, continentalSlots: 6 },
  { id: "bundes", name: "Bundesliga", country: "Germany", region: "Europe", flag: "🇩🇪", sportsdbId: "4331", size: 18, relegationSlots: 2, continentalSlots: 6 },
  { id: "ligue1", name: "Ligue 1", country: "France", region: "Europe", flag: "🇫🇷", sportsdbId: "4334", size: 18, relegationSlots: 2, continentalSlots: 5 },
  { id: "eredivisie", name: "Eredivisie", country: "Netherlands", region: "Europe", flag: "🇳🇱", sportsdbId: "4337", size: 18, relegationSlots: 1, continentalSlots: 5 },
  { id: "primeira", name: "Primeira Liga", country: "Portugal", region: "Europe", flag: "🇵🇹", sportsdbId: "4344", size: 18, relegationSlots: 2, continentalSlots: 4 },
  { id: "spl", name: "Scottish Premiership", country: "Scotland", region: "Europe", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", sportsdbId: "4330", size: 12, relegationSlots: 1, continentalSlots: 4 },
  { id: "belgian", name: "Pro League", country: "Belgium", region: "Europe", flag: "🇧🇪", sportsdbId: "4341", size: 16, relegationSlots: 1, continentalSlots: 5 },
  { id: "turkish", name: "Süper Lig", country: "Turkey", region: "Europe", flag: "🇹🇷", sportsdbId: "4339", size: 19, relegationSlots: 4, continentalSlots: 4 },
  { id: "greek", name: "Super League", country: "Greece", region: "Europe", flag: "🇬🇷", sportsdbId: "4484", size: 14, relegationSlots: 1, continentalSlots: 4 },
  { id: "austrian", name: "Bundesliga", country: "Austria", region: "Europe", flag: "🇦🇹", sportsdbId: "4406", size: 12, relegationSlots: 1, continentalSlots: 3 },
  { id: "swiss", name: "Super League", country: "Switzerland", region: "Europe", flag: "🇨🇭", sportsdbId: "4719", size: 12, relegationSlots: 1, continentalSlots: 3 },
  { id: "danish", name: "Superliga", country: "Denmark", region: "Europe", flag: "🇩🇰", sportsdbId: "4350", size: 12, relegationSlots: 1, continentalSlots: 3 },
  { id: "championship", name: "Championship", country: "England", region: "Europe", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", sportsdbId: "4329", size: 24, relegationSlots: 3, continentalSlots: 0 },

  // Latin America
  { id: "brasileirao", name: "Brasileirão", country: "Brazil", region: "Latin America", flag: "🇧🇷", sportsdbId: "4351", size: 20, relegationSlots: 4, continentalSlots: 6 },
  { id: "ligamx", name: "Liga MX", country: "Mexico", region: "Latin America", flag: "🇲🇽", sportsdbId: "4347", size: 18, relegationSlots: 0, continentalSlots: 8 },
  { id: "argentina", name: "Liga Profesional", country: "Argentina", region: "Latin America", flag: "🇦🇷", sportsdbId: "4393", size: 28, relegationSlots: 2, continentalSlots: 8 },
  { id: "colombia", name: "Liga BetPlay", country: "Colombia", region: "Latin America", flag: "🇨🇴", sportsdbId: "4615", size: 20, relegationSlots: 2, continentalSlots: 4 },
  { id: "chile", name: "Primera División", country: "Chile", region: "Latin America", flag: "🇨🇱", sportsdbId: "4762", size: 16, relegationSlots: 2, continentalSlots: 4 },

  // Asia
  { id: "jleague", name: "J1 League", country: "Japan", region: "Asia", flag: "🇯🇵", sportsdbId: "4346", size: 20, relegationSlots: 3, continentalSlots: 3 },
  { id: "saudi", name: "Saudi Pro League", country: "Saudi Arabia", region: "Asia", flag: "🇸🇦", sportsdbId: "4687", size: 18, relegationSlots: 3, continentalSlots: 4 },
  { id: "kleague", name: "K League 1", country: "South Korea", region: "Asia", flag: "🇰🇷", sportsdbId: "4689", size: 12, relegationSlots: 1, continentalSlots: 3 },
  { id: "csl", name: "Chinese Super League", country: "China", region: "Asia", flag: "🇨🇳", sportsdbId: "4359", size: 16, relegationSlots: 2, continentalSlots: 2 },
  { id: "aleague", name: "A-League", country: "Australia", region: "Asia", flag: "🇦🇺", sportsdbId: "4356", size: 13, relegationSlots: 0, continentalSlots: 4 },
];
