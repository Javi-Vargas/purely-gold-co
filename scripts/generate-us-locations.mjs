// Generates lib/us-locations-data.ts (CITIES_BY_STATE) from the US Census
// Population Estimates sub-est file. One-off; NOT run by the build/deploy.
// Source is public domain, no API key.
import { writeFileSync } from 'node:fs'

const SOURCE_URL =
  'https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/cities/totals/sub-est2024.csv'
const CITIES_PER_STATE = 40
const OUT = new URL('../lib/us-locations-data.ts', import.meta.url)

// Full state/DC name -> 2-letter code. 50 states + DC.
const NAME_TO_CODE = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', 'District of Columbia': 'DC',
  Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL',
  Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA',
  Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN',
  Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
  Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI',
  Wyoming: 'WY',
}

// Trailing place-type words to strip from the Census NAME column.
const TYPE_SUFFIXES = [
  'city', 'town', 'village', 'borough', 'municipality', 'township', 'CDP',
]

// Explicit overrides for consolidated city-county / borough governments whose
// Census NAME retains administrative descriptors that the generic per-word
// suffix stripper can't safely remove (multi-word descriptors, or "city and
// borough" which would otherwise leave a dangling "and"). Keyed on the raw
// NAME after windows-1252 decode + control-char strip + paren-strip + trim —
// verified against the raw CSV rows for each of these places.
const NAME_OVERRIDES = {
  'Juneau city and borough': 'Juneau',
  'Sitka city and borough': 'Sitka',
  'Wrangell city and borough': 'Wrangell',
  'Athens-Clarke County unified government': 'Athens',
  'Augusta-Richmond County consolidated government': 'Augusta',
  'Lexington-Fayette urban county': 'Lexington',
  'Louisville/Jefferson County metro government': 'Louisville',
  'Nashville-Davidson metropolitan government': 'Nashville',
  'Ranson corporation': 'Ranson',
  'Urban Honolulu CDP': 'Honolulu',
  // Found during verification of the above (same class of defect — a
  // consolidated city-county name, or a multi-word type suffix where the
  // generic single-word stripper leaves a dangling fragment):
  'Macon-Bibb County': 'Macon', // GA consolidated city-county
  'Anaconda-Deer Lodge County': 'Anaconda', // MT consolidated city-county
  'Kearns metro township': 'Kearns', // UT — "township" strip alone leaves "Kearns metro"
  'Magna metro township': 'Magna', // UT — "township" strip alone leaves "Magna metro"
}

function stripTypeSuffix(name) {
  let out = name
  for (const suffix of TYPE_SUFFIXES) {
    const re = new RegExp(`\\s+${suffix}$`)
    if (re.test(out)) {
      out = out.replace(re, '').trim()
      break
    }
  }
  return out
}

function stripSuffix(name) {
  // Drop control characters (C0 range + DEL) left over from decoding —
  // these show up as mojibake artifacts in a handful of Census rows
  // (e.g. "Utqiag\x1Avik", Alaska).
  let out = name.replace(/[\x00-\x1F\x7F]/g, '')
  out = out.trim()
  out = out.replace(/\s*\([^)]*\)\s*$/, '').trim() // drop trailing "(balance)" etc.
  return NAME_OVERRIDES[out] ?? stripTypeSuffix(out)
}

// Minimal CSV line parser handling quoted fields.
function parseLine(line) {
  const fields = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else { inQuotes = false }
      } else cur += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ',') { fields.push(cur); cur = '' }
      else cur += ch
    }
  }
  fields.push(cur)
  return fields
}

const res = await fetch(SOURCE_URL)
if (!res.ok) throw new Error(`Census fetch failed: HTTP ${res.status} for ${SOURCE_URL}`)
// Census publishes this file as windows-1252, not UTF-8 — decoding as UTF-8
// mangles non-ASCII names (e.g. "Cañon City" -> "Ca�on City").
const buf = await res.arrayBuffer()
const text = new TextDecoder('windows-1252').decode(buf)
const lines = text.split(/\r?\n/).filter(Boolean)
const header = parseLine(lines[0])
const idx = (name) => {
  const i = header.indexOf(name)
  if (i === -1) throw new Error(`column not found: ${name}`)
  return i
}
const iSumlev = idx('SUMLEV')
const iName = idx('NAME')
const iStname = idx('STNAME')
const iPop = idx('POPESTIMATE2024')

// code -> Map<cityName, pop>, keeping the max pop seen per name.
const byState = {}
for (let r = 1; r < lines.length; r++) {
  const f = parseLine(lines[r])
  if (f[iSumlev] !== '162') continue // incorporated places only
  const code = NAME_TO_CODE[f[iStname]]
  if (!code) continue // skip territories we don't cover
  const city = stripSuffix(f[iName])
  if (!city) continue
  const pop = Number(f[iPop]) || 0
  byState[code] ??= new Map()
  if (pop > (byState[code].get(city) ?? 0)) byState[code].set(city, pop)
}

// Top N per state by pop, then alphabetical for display.
const CITIES_BY_STATE = {}
for (const code of Object.values(NAME_TO_CODE)) {
  const m = byState[code]
  CITIES_BY_STATE[code] = m
    ? [...m.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, CITIES_PER_STATE)
        .map(([name]) => name)
        .sort((a, b) => a.localeCompare(b))
    : []
}

const banner = `// GENERATED by scripts/generate-us-locations.mjs — do not edit by hand.
// Source: ${SOURCE_URL}
// Generated: ${new Date().toISOString().slice(0, 10)}
// Method: Census sub-est SUMLEV=162, top ${CITIES_PER_STATE} places per state by
// POPESTIMATE2024, suffix-stripped, sorted alphabetically.
`
const body = `export const CITIES_BY_STATE: Record<string, string[]> = ${JSON.stringify(
  CITIES_BY_STATE,
  null,
  2,
)}\n`

writeFileSync(OUT, banner + '\n' + body)
console.log(`wrote ${OUT.pathname}: ${Object.keys(CITIES_BY_STATE).length} states`)
