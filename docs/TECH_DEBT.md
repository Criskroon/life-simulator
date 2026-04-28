# Tech Debt Log

Open punten die bewust uitgesteld zijn. Elk item heeft een eigenaar-sessie:
de eerstvolgende sessie waarin het op te lossen is.

Toevoegregels:
- Bovenaan = nieuwste. Datum + sessie waar het ontstond.
- "Resolves in" = de sessie die het naar verwachting opruimt.
- Als een item gesloten wordt: verplaats naar `docs/audits/` of verwijder met
  een PR-referentie in dit document, zodat de log compact blijft.

---

## 2026-04 — Sessie 2.1 (Country Engine Consolidation) — RESOLVED

Beide items uit Sessie 2.0a zijn opgelost in Sessie 2.1:

1. **Legacy `countries.ts` naast nieuwe `countries/` directory**
   → Geconsolideerd tot één rijke `Country` interface in `src/game/types/country.ts`
   en één `COUNTRIES` array in `src/game/data/countries.ts`. Het oude
   `src/game/data/countries/` directory is verwijderd; alle data (9 NL education
   stages, 18 NL jobs, 5 cities, 135 namen, holidays, climate) is meegekomen.

2. **V2 country-foundation migration was niet aangesloten op `persistence.ts`**
   → Migration verwijderd in plaats van geactiveerd. `PlayerState.country`
   IS al de `CountryCode`; een tweede `countryCode` veld zou alleen duplicatie
   geven zonder downstream consumer. De `'UK' → 'GB'` rewrite die eerder al in
   `persistence.ts` zat blijft staan en dekt de enige reële save-migration die
   we nodig hebben.

Files veranderd in Sessie 2.1:
- `src/game/types/country.ts` (volledig herzien — economics + demographics +
  education + career + cities + housing + healthcare + legal + culture + names)
- `src/game/data/countries.ts` (6 landen: NL volledig, US/GB met economics +
  stubs, JP/BR/ZA stubs)
- `src/game/engine/educationEngine.ts` (NIEUW)
- `src/game/engine/careerEngine.ts` (NIEUW)
- `src/game/engine/countryEngine.ts` (nieuwe veld-paden + name/city/format helpers)
- `src/game/engine/activityEngine.ts` (`country.rules.gambling` → `country.legal.gamblingLegal`)
- `src/game/data/names/index.ts` (Partial<Record<CountryCode, NameSet>> voor JP/BR/ZA fallback)
- `tests/data/countries.test.ts` (NIEUW — verhuisd uit `__tests__/`, 51 tests)
- `tests/engine/countryEngine.test.ts` (path-test geüpdatet, schooling NL=4)

Verwijderd:
- `src/game/data/countries/` (schema/helpers/index/nl/us/jp/br/za + tests)
- `src/game/state/migrations/v2-country-foundation.ts`
