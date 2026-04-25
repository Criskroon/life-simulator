# `src/game/data/` — game content & country engine

This directory holds all the **content** of the simulator: events,
careers, names, and the country table. Everything here is data — no
side effects, no DOM, no async. The engine in `../engine/` reads from
these tables; nothing here imports from the engine in return.

## Country data structure

Countries are defined in [`countries.ts`](./countries.ts) using the
`Country` shape declared in
[`../types/country.ts`](../types/country.ts). A country is more than a
display name: it carries economic, social, and legal statistics that the
engine uses to adjust salaries, prices, schooling windows, and event
eligibility.

### Top-level fields

| Field | Type | Purpose |
|---|---|---|
| `code` | ISO-3166-1 alpha-2 (e.g. `"NL"`, `"US"`, `"GB"`) | The single ID stored on PlayerState; everything else is resolved on demand. |
| `name`, `nameLocal` | string | Display name (English) and the country's name in its own language. |
| `continent`, `region`, `culturalCluster` | enum | Used by `getCountriesByContinent()` / `getCountriesByCluster()` and event conditions like `{ path: 'country.continent', op: '==', value: 'Europe' }`. |
| `languages` | ISO 639-1 codes | Drives the name pool via `getNamePool()`. The first language is the primary. |
| `currency` | `{ code, symbol }` | Display only. `symbol` ends up in TopBar. |
| `stats` | `CountryStats` | Real-world numbers — see below. |
| `rules` | `CountryRules` | Legal ages, school window, top tax rate, weed/marriage flags. |

### `stats` — real-world data

These come from public sources (World Bank, OECD, World Happiness
Report, UN HDI, Numbeo). Update with care — the engine assumes:

- `averageSalary` — used to scale baseline salaries (`adjustSalary`).
- `costOfLivingIndex` — used to scale event money values
  (`adjustPrice`).
- `housingPriceIndex` — used to scale house prices
  (`adjustHousePrice`).

**Indices are normalised so 1.0 = the engine's adjustment baseline.**
We anchor that baseline at GB so the existing baseline numbers in
`careers.ts` and event payloads keep their original meaning. If you add
a country whose cost of living is 30% above GB, set
`costOfLivingIndex: 1.30`.

The remaining stats (`gdpPerCapita`, `lifeExpectancy`, `crimeIndex`,
`happinessIndex`, etc.) are not yet wired into mechanics — they're
available for future events and conditions.

### `rules` — flags and legal ages

Used today by `isLegalAge()`, `getSchoolingPeriod()`, and (in the
future) by event conditions and effects.

## Adding a new country

1. **Append a record to `COUNTRIES` in [`countries.ts`](./countries.ts).**
   Use the ISO-2 code, fill every field. Above the record, leave a
   comment listing your sources for the stats — World Bank, OECD,
   national stats agencies. No estimates without a citation.
2. **Verify the languages map to a name pool.** `getNamePool()` in
   `countryEngine.ts` returns `'dutch'` for `nl`, otherwise `'english'`.
   If you add a country whose primary language doesn't have a pool yet,
   either add a new `NameSet` to [`names.ts`](./names.ts) and extend the
   `NamePool` union, or accept the english fallback as a placeholder.
3. **Pick honest indices.** `costOfLivingIndex` and `housingPriceIndex`
   should be relative to GB (1.0). For a quick anchor: use Numbeo's
   "Cost of Living Index" and divide by GB's value.
4. **Re-run the balance simulator.** New countries shift the population
   distribution; check
   `npm run test:balance` to catch outliers.
5. **No UI changes needed.** The `NewLifeScreen` country picker reads
   `COUNTRIES` directly.

## Why country data lives here, not on PlayerState

`PlayerState.country` is just a `CountryCode` (string). The full record
is resolved via `getCountry(code)`. This keeps:

- saves small (just `"NL"`),
- the source of truth single (you can update a country's
  `inflationRate` next year without migrating saves),
- player state pure data, no embedded reference data.

The trade-off: dotted paths like `country.continent` don't work through
plain object traversal. The condition evaluator's
[`getAtPath`](../engine/paths.ts) special-cases the `country.*` prefix
and resolves through `getCountry()`.

## Other content in this directory

- **[`events/`](./events/)** — game events grouped by category. See
  [`CLAUDE.md`](../../../CLAUDE.md) for the event shape and authoring
  rules.
- **[`careers.ts`](./careers.ts)** — careers and their salary ladders.
  Salaries are baseline (GB) USD; the engine country-adjusts them at
  apply-time.
- **[`names.ts`](./names.ts)** — first-name and surname pools by
  language family. Add a pool here before adding a country that needs
  it.
