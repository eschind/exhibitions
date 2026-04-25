// Venue → city lookup. Match is case-insensitive substring on the venue name.
// Order matters only for diagnostics; first match wins.
const VENUE_CITY: Array<[RegExp, string]> = [
  // New York
  [/\b(moma|museum of modern art|p\.?s\.?\s*1|moma ps1)\b/i, 'New York'],
  [/\b(metropolitan museum|the met|met breuer|met cloisters)\b/i, 'New York'],
  [/\bguggenheim\b/i, 'New York'],
  [/\bwhitney\b/i, 'New York'],
  [/\bnew museum\b/i, 'New York'],
  [/\bbrooklyn museum\b/i, 'New York'],
  [/\bfrick\b/i, 'New York'],
  [/\bnoguchi museum\b/i, 'New York'],
  [/\bdia\s*(beacon|chelsea)?\b/i, 'New York'],
  [/\b(gagosian|david zwirner|pace gallery|hauser & wirth)\b.*\bnew york\b/i, 'New York'],
  // Los Angeles
  [/\b(lacma|los angeles county museum)\b/i, 'Los Angeles'],
  [/\bgetty\b/i, 'Los Angeles'],
  [/\bmoca\b/i, 'Los Angeles'],
  [/\bhammer museum\b/i, 'Los Angeles'],
  [/\bbroad\b/i, 'Los Angeles'],
  // SF Bay
  [/\bsfmoma|san francisco museum of modern art\b/i, 'San Francisco'],
  [/\bde young\b/i, 'San Francisco'],
  // Chicago
  [/\bart institute of chicago\b/i, 'Chicago'],
  [/\bmca chicago|museum of contemporary art chicago\b/i, 'Chicago'],
  // Boston
  [/\bmfa boston|museum of fine arts, boston\b/i, 'Boston'],
  [/\bica boston|institute of contemporary art\/?boston\b/i, 'Boston'],
  [/\bisabella stewart gardner\b/i, 'Boston'],
  // DC
  [/\b(hirshhorn|national gallery of art|smithsonian)\b/i, 'Washington, D.C.'],
  // Philadelphia
  [/\bphiladelphia museum of art\b/i, 'Philadelphia'],
  [/\bbarnes foundation\b/i, 'Philadelphia'],
  // Other US
  [/\bwalker art center\b/i, 'Minneapolis'],
  [/\bhigh museum\b/i, 'Atlanta'],
  [/\bmenil\b/i, 'Houston'],
  [/\bnasher\b/i, 'Dallas'],
  [/\bseattle art museum\b/i, 'Seattle'],
  [/\bdetroit institute of arts\b/i, 'Detroit'],
  // London
  [/\btate (modern|britain|liverpool|st ives)\b/i, 'London'],
  [/\bnational gallery\b.*\blondon\b|^\s*the national gallery\s*$/i, 'London'],
  [/\b(serpentine|whitechapel|hayward gallery|barbican|saatchi gallery|royal academy)\b/i, 'London'],
  [/\bv&a|victoria and albert\b/i, 'London'],
  [/\bbritish museum\b/i, 'London'],
  // Paris
  [/\b(centre pompidou|pompidou)\b/i, 'Paris'],
  [/\blouvre\b/i, 'Paris'],
  [/\bmusée d'?orsay|musee d'?orsay\b/i, 'Paris'],
  [/\bfondation louis vuitton\b/i, 'Paris'],
  [/\bpalais de tokyo\b/i, 'Paris'],
  [/\bjeu de paume\b/i, 'Paris'],
  [/\bmusée picasso\b/i, 'Paris'],
  // Amsterdam
  [/\bstedelijk\b/i, 'Amsterdam'],
  [/\brijksmuseum\b/i, 'Amsterdam'],
  [/\bvan gogh museum\b/i, 'Amsterdam'],
  // Berlin
  [/\bhamburger bahnhof\b/i, 'Berlin'],
  [/\bneue nationalgalerie\b/i, 'Berlin'],
  [/\bgropius bau\b/i, 'Berlin'],
  // Other Europe
  [/\bprado\b/i, 'Madrid'],
  [/\breina sof[ií]a\b/i, 'Madrid'],
  [/\bguggenheim bilbao\b/i, 'Bilbao'],
  [/\buffizi\b/i, 'Florence'],
  [/\bvenice biennale|biennale di venezia\b/i, 'Venice'],
  [/\bkunsthaus z[üu]rich\b/i, 'Zürich'],
  [/\bfondation beyeler\b/i, 'Basel'],
  [/\bart basel\b/i, 'Basel'],
  // Asia / Pacific
  [/\bmori art museum\b/i, 'Tokyo'],
  [/\bteamlab\b/i, 'Tokyo'],
  [/\bm\+\b|\bm plus\b/i, 'Hong Kong'],
  [/\bnational gallery singapore\b/i, 'Singapore'],
  [/\bart gallery of new south wales\b/i, 'Sydney'],
]

export function lookupCityFromVenue(venue: string | null | undefined): string | undefined {
  if (!venue) return undefined
  for (const [re, city] of VENUE_CITY) {
    if (re.test(venue)) return city
  }
  return undefined
}
