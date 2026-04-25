# Test agents

Vier scripts die het spel testen op verschillende niveaus. Allemaal te
draaien met één commando vanuit de project-root. Output landt in
`testing/reports/` (gitignored — niet bedoeld om te committen).

| Script | Wanneer? | Wat krijg je? | Hoe lang? |
|---|---|---|---|
| `npm run test:smoke` | Snel checken of de app überhaupt opent en speelt | Markdown rapport + 4 screenshots | ~10s |
| `npm run test:play` | Wil je een volledig leven spelen en lezen | Verhaal van geboorte tot dood, eindstats, event-frequentie | ~1–3 min |
| `npm run test:balance` | Voor je een nieuw event of career pusht — check de cijfers | Tabellen met levensduur, doodsoorzaken, event-frequentie, geld, careers | ~5s voor 1000 levens |
| `npm run test:regression` | Na een commit, voor je pusht — focus op wat veranderd is | Doelgerichte checks per type wijziging | 5s–1min |
| `npm run test:all` | "Run de hele suite" | Samenvattend rapport met links naar de individuele rapporten | ~3 min |

## Wat doet elk script precies?

### `smokeTest.ts` — Gezondheidscheck (browser)

Start de dev server (port 5180), opent een browservenster (zichtbaar by
default zodat je kunt meekijken), maakt een nieuw leven aan en speelt
10 jaar. Controleert:

- Geen JavaScript errors in de console
- Stats blijven binnen 0..100
- Events worden gerenderd
- De **Age +1** knop doet wat 'ie moet doen

Maakt screenshots bij start, jaar 5 en jaar 10.

```bash
npm run test:smoke                 # zichtbare browser, lokale dev server
npm run test:smoke -- --headless   # zonder browservenster (sneller)
npm run test:smoke -- --target=vercel  # tegen de live Vercel deploy
```

### `fullPlaythrough.ts` — Compleet leven (browser)

Speelt een leven van geboorte tot dood. Gebruikt seeded RNG (default
`--seed=42`) zodat de keuzes reproduceerbaar zijn. Het rapport bevat:

- Het hele leven-verhaal in chronologische volgorde
- Eindstats (geld, gezondheid, geluk, criminele records, …)
- Doodsoorzaak en leeftijd
- Welke events meermaals voorkwamen vs. één keer

```bash
npm run test:play                          # zichtbare browser, seed 42
npm run test:play -- --headless --seed=99  # andere seed, geen venster
npm run test:play -- --target=vercel       # speel op de Vercel-deploy
```

### `balanceSimulation.ts` — Statistieken (geen browser)

Draait N levens via de engine direct (geen browser) — supersnel, ~3 ms
per leven. Geeft je:

- Levensduur distributie (mean, median, p10, p90, min, max)
- Top-10 doodsoorzaken
- Event-trigger-frequentie als percentage van levens
- Gemiddelde happiness per leeftijd (per decennium)
- Geld-distributie aan einde van leven
- Career-progressie: hoeveel mensen halen het topniveau
- ⚠ **Outlier-waarschuwing** voor events die <1% of >50% van de tijd
  triggeren (waarschijnlijk te zeldzaam of te vaak)

```bash
npm run test:balance                  # 1000 levens
npm run test:balance -- --lives=10000 # zwaarder, fijner signaal
npm run test:balance -- --seed=123    # andere set levens
```

### `regressionTest.ts` — Alleen wat is veranderd

Kijkt naar `git diff --name-only HEAD~1 HEAD`, classificeert de
wijzigingen en draait gericht:

- **Engine code** of **types** gewijzigd → vitest + 100 levens
- **Event data** gewijzigd → 100 levens, telt hoe vaak elk gewijzigd
  event triggert
- **UI code** gewijzigd → smoke test
- **Niets actionable** → vitest als sanity check

```bash
npm run test:regression                       # vergelijk met vorige commit
npm run test:regression -- --base=HEAD~3      # tegen 3 commits geleden
npm run test:regression -- --headless         # geen browservenster
```

### `runAll.ts` — Alles in één

Draait de vier scripts achter elkaar in deze volgorde: smoke →
regression → balance → playthrough. Schrijft één samenvattend rapport
dat naar de individuele rapporten linkt.

```bash
npm run test:all                       # alle vier, browser zichtbaar
npm run test:all -- --headless         # alle vier, geen venster
npm run test:all -- --lives=5000       # zwaardere balance-run
```

## Belangrijk

- **Geen browser-window verstoort je gewone spel:** alle browser-tests
  gebruiken een verse Chromium instance. De localStorage van je echte
  game (Safari/Chrome) wordt niet aangeraakt. Tests die de engine
  direct importeren gebruiken een in-memory storage adapter.
- **De dev server hoeft niet te draaien:** als poort 5180 vrij is, start
  het smoke/play-script er zelf één en stopt 'm aan het einde. Draait er
  al een, dan haakt 'ie daarop in.
- **Reproduceerbaarheid:** elke agent accepteert een `--seed=N` flag
  (of gebruikt een fixed default uit `testing/fixtures/seeds.ts`). Bij
  een fout kan je dezelfde seed opnieuw draaien om de bug te reproduceren.
- **Rapporten zijn lokaal:** `testing/reports/` staat in `.gitignore`.
  Wil je een rapport delen, kopieer 'm dan handmatig.

## Mappen

```
testing/
├── agents/          ← de vier scripts
├── lib/             ← gedeelde helpers (devServer, simulator, report)
├── fixtures/        ← seeds + in-memory storage adapter
├── reports/         ← markdown + screenshot output (gitignored)
├── runAll.ts        ← orchestrator
└── README.md        ← dit bestand
```
