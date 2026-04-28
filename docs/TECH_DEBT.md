# Tech Debt Log

Open punten die bewust uitgesteld zijn. Elk item heeft een eigenaar-sessie:
de eerstvolgende sessie waarin het op te lossen is.

Toevoegregels:
- Bovenaan = nieuwste. Datum + sessie waar het ontstond.
- "Resolves in" = de sessie die het naar verwachting opruimt.
- Als een item gesloten wordt: verplaats naar `docs/audits/` of verwijder met
  een PR-referentie in dit document, zodat de log compact blijft.

---

## 2026-04 — Sessie 2.0a (Country Engine Foundation)

### 1. Legacy `src/game/data/countries.ts` blijft naast nieuwe `countries/` directory

**Wat is uitgesteld**
Opruimen van `src/game/data/countries.ts` (legacy `Country` shape met
`code`/`stats`/`rules`) zodat alleen het nieuwe `src/game/data/countries/`
directory overblijft.

**Waarom uitgesteld**
- Bestaande imports gebruiken `'../data/countries'` en resolveren via
  TypeScript's bundler resolution naar het `.ts` bestand. Beide systemen
  draaien probleemloos naast elkaar.
- Het legacy bestand wordt nog gebruikt door:
  - [`src/game/engine/countryEngine.ts`](../src/game/engine/countryEngine.ts)
  - [`src/game/engine/templates.ts`](../src/game/engine/templates.ts)
  - [`src/game/engine/paths.ts`](../src/game/engine/paths.ts)
  - [`src/game/state/newLife.ts`](../src/game/state/newLife.ts)
  - [`src/ui/components/TopBar.tsx`](../src/ui/components/TopBar.tsx)
  - [`src/ui/screens/NewLifeScreen.tsx`](../src/ui/screens/NewLifeScreen.tsx)
  - [`tests/engine/nameGenerator.test.ts`](../tests/engine/nameGenerator.test.ts)
- Migreren betekent al deze callers omschrijven naar de nieuwe schema-shape
  én een data-mapping voor het verschil in fields (legacy `stats.minimumWage`
  jaarlijks → nieuwe `career.minimumWageMonthly`, etc.).

**Resolves in: Sessie 2.5 (Country selectie UI)**
Bij de UI-rewrite van `NewLifeScreen` en `TopBar` is dit het natuurlijke
moment om alle callers in één pass om te zetten. Tot dan blijven beide
systemen beschikbaar.

**Risico's**
- Twee `Country` types in het project — IDE-autocomplete kan verwarrend zijn.
  Mitigatie: nieuwe code importeert altijd via `'../data/countries/index'` of
  een specifieke submodule. Documentatie in [`src/game/data/countries/index.ts`](../src/game/data/countries/index.ts).
- Niet bedoeld als langetermijn-coexistentie. Sessie 2.5 moet dit oplossen.

---

### 2. V2 country-foundation migration is niet aangesloten op `persistence.ts`

**Wat is uitgesteld**
Aanroep van `migrateToV2` / `needsV2Migration` vanuit
[`src/game/state/persistence.ts`](../src/game/state/persistence.ts) (functie
`migrate()` op regel 64).

**Waarom uitgesteld**
- De migration zet `countryCode` op de `PlayerState`, maar `PlayerState` heeft
  dit veld nog niet. Wiring vereist `countryCode?: CountryCode` toevoegen aan
  [`src/game/types/gameState.ts`](../src/game/types/gameState.ts).
- Belangrijker: de **nieuwe** `CountryCode` (`NL | US | JP | BR | ZA`) sluit
  `'GB'` uit, terwijl het **legacy** `country: CountryCode` veld wel `'GB'`
  ondersteunt. Spelers met een GB-save zouden bij activatie `countryCode: 'NL'`
  krijgen (default fallback) terwijl `country: 'GB'` behouden blijft. Dat is
  prima per design — maar er is nog geen downstream consumer die er iets mee
  doet, dus we gewinnen niets en riskeren verwarring.
- De migration-functie zelf is **gebouwd, klaar, en non-destructief**. Activatie
  is een one-liner in `persistence.ts`.

**Resolves in: Sessie 2.1 (Education Engine)**
De Education Engine wordt de eerste consumer van `countryCode` (om de juiste
country op te halen via `getCountry(state.countryCode)`). Op dat moment:
1. Voeg `countryCode?: CountryCode` (uit `data/countries/schema`) toe aan `PlayerState`
2. Wire `migrateToV2` in `persistence.ts` `migrate()`
3. Nieuwe spelers krijgen `countryCode` direct in `newLife.ts`

**Files betrokken bij activatie**
- [`src/game/state/migrations/v2-country-foundation.ts`](../src/game/state/migrations/v2-country-foundation.ts) — bestaat al, klaar voor gebruik
- [`src/game/state/persistence.ts`](../src/game/state/persistence.ts) — `migrate()` op regel 64
- [`src/game/types/gameState.ts`](../src/game/types/gameState.ts) — voeg veld toe op regel 207
- [`src/game/state/newLife.ts`](../src/game/state/newLife.ts) — set `countryCode` bij character creation

**Risico's**
- Geen. Migration is non-destructief; default 'NL' voor edge cases.
