export type StakeType = "relegation" | "title" | "continental";

export interface League {
  id: string;
  name: string;
  country: string;
  region: "Europe" | "Latin America" | "Asia";
  flag: string;
}

export const LEAGUES: League[] = [
  // Europe (15)
  { id: "epl", name: "Premier League", country: "England", region: "Europe", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: "laliga", name: "La Liga", country: "Spain", region: "Europe", flag: "🇪🇸" },
  { id: "seriea", name: "Serie A", country: "Italy", region: "Europe", flag: "🇮🇹" },
  { id: "bundes", name: "Bundesliga", country: "Germany", region: "Europe", flag: "🇩🇪" },
  { id: "ligue1", name: "Ligue 1", country: "France", region: "Europe", flag: "🇫🇷" },
  { id: "eredivisie", name: "Eredivisie", country: "Netherlands", region: "Europe", flag: "🇳🇱" },
  { id: "primeira", name: "Primeira Liga", country: "Portugal", region: "Europe", flag: "🇵🇹" },
  { id: "spl", name: "Scottish Premiership", country: "Scotland", region: "Europe", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { id: "belgian", name: "Pro League", country: "Belgium", region: "Europe", flag: "🇧🇪" },
  { id: "turkish", name: "Süper Lig", country: "Turkey", region: "Europe", flag: "🇹🇷" },
  { id: "greek", name: "Super League", country: "Greece", region: "Europe", flag: "🇬🇷" },
  { id: "austrian", name: "Bundesliga", country: "Austria", region: "Europe", flag: "🇦🇹" },
  { id: "swiss", name: "Super League", country: "Switzerland", region: "Europe", flag: "🇨🇭" },
  { id: "danish", name: "Superliga", country: "Denmark", region: "Europe", flag: "🇩🇰" },
  { id: "championship", name: "Championship", country: "England", region: "Europe", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },

  // Latin America (5)
  { id: "brasileirao", name: "Brasileirão", country: "Brazil", region: "Latin America", flag: "🇧🇷" },
  { id: "ligamx", name: "Liga MX", country: "Mexico", region: "Latin America", flag: "🇲🇽" },
  { id: "argentina", name: "Liga Profesional", country: "Argentina", region: "Latin America", flag: "🇦🇷" },
  { id: "colombia", name: "Liga BetPlay", country: "Colombia", region: "Latin America", flag: "🇨🇴" },
  { id: "chile", name: "Primera División", country: "Chile", region: "Latin America", flag: "🇨🇱" },

  // Asia (5)
  { id: "jleague", name: "J1 League", country: "Japan", region: "Asia", flag: "🇯🇵" },
  { id: "saudi", name: "Saudi Pro League", country: "Saudi Arabia", region: "Asia", flag: "🇸🇦" },
  { id: "kleague", name: "K League 1", country: "South Korea", region: "Asia", flag: "🇰🇷" },
  { id: "csl", name: "Chinese Super League", country: "China", region: "Asia", flag: "🇨🇳" },
  { id: "aleague", name: "A-League", country: "Australia", region: "Asia", flag: "🇦🇺" },
];
