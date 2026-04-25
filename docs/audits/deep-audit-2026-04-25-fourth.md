# Deep Audit (Fourth) — 2026-04-25

Verifies commit `b98609a` (Fix removeRelationship regression + procedural NPC name generation). Adds: per-country name diversity, relationship lifecycle deep-dive, random-walk life simulator, programmatic invariant scan.

**Scope:** audit only — no fixes shipped.

## TL;DR

1. **Naming fix is fully successful.** Sam Park / Jordan Reyes / Alex Rivera / Robin Hayes all dropped to **0/1002 lives** (was 73% / multiple). Diversity ratio (unique full-name combos / records) is **98–99% across all three countries**. Country pools read culturally as themselves: NL surnames like `van Beek`, `Schoenmaker`, US has `Sullivan` / `Medina`, GB has `Williams` / `Hughes` / `Patel`. ✅
2. **Partner-removal fix is mostly successful, with two new bugs the third audit didn't predict.** Mean partners-per-life dropped from 5.0 → **2.65** (target ≤ 2.5 — close). But:
   - **27 lives ended with 2 spouses** in the lifecycle run (1000 lives), **61 lives in the wider 3000-life scan (2.0%)**. Always exactly 2, never more. Confirms a path is adding `rel-spouse` without first clearing the existing spouse record.
   - **350/1000 lives (35%) end with both a partner record AND a spouse** — i.e. lingering partners on married lives. **1951 `rel-activity-partner` records** still alive at death across 1000 lives — find_date partners pile up because breakup events don't fire often enough to keep up with how often `find_date` is selected by the AI.
3. **All 143 tests still green; no regressions on coverage.** All 75 events still trigger ≥ 1×; all 12 activities still picked ≥ 1×; education chain reachable; no stat-bound violations across 3000 lives; no NaN, no duplicate ids, no empty names. ✅
4. **One new edge-case found in 3000 lives: 62 lives (2.0%) end with money below the −1000 overdraft buffer**, lowest seen `−8990`. Low player impact (death-state only) but indicates an unchecked spend somewhere — likely an event/activity cost that isn't gated on affordability.

---

## Section A — Status of third-audit findings

| Third-audit issue | Status | Evidence |
|---|---|---|
| **C1**: `removeRelationship` silently no-ops post-fbedbed | ✅ Fixed | baseId field added; mean partners 5.0 → 2.65; max-partners-per-life still high (15) but median is 2 |
| **C2 / Section A**: 12 hardcoded names across 6 files (Sam Park, Jordan Reyes, …) | ✅ Fixed | 0/1002 occurrences for all four named offenders. Procedural country-keyed pools used. |
| **C2**: `rel_have_a_kid` empty `lastName` | ✅ Fixed | Children inherit player's `lastName` via `nameGenerator.ts:82`. No empty-name lives in the 3000-life scan. |
| **C3**: Stat saturation (3 of 4 stats parked at ceiling with-AI) | ⚠ Unchanged | With-AI mean smarts 98.2, happiness 97.9, health 88.0. Acknowledged-deferred per third audit's Section D. |
| **C4**: `edu_uni_party_phase` starves (1.3% / 0.3% trigger rate) | ⚠ Unchanged | Now 1.1% / 0.9%. Acknowledged-deferred. |
| **C6**: 22 events over-trigger >70% of lives | ⚠ Unchanged | Now 24 events over-trigger. Tuning, not a bug — same status as before. |

No regressions on previously-fixed issues.

---

## Section B — Naming diversity results

Source: `testing/agents/nameDiversityPerCountry.ts`, 1002 lives (334 per country), seed 42.

### Hardcoded-name regression check

| Hardcoded name (3rd audit baseline) | Was | Now | Status |
|---|---:|---:|---|
| Sam Park | 73 / 100 lives (73%) | **0 / 1002 (0.00%)** | ✅ |
| Jordan Reyes | unmeasured (4 spouse paths) | **0 / 1002** | ✅ |
| Alex Rivera | 285 records / 100 lives | **0 / 1002** | ✅ |
| Robin Hayes | 134 records / 100 lives | **0 / 1002** | ✅ |

### Per-country diversity

| Country | Lives | Records | Unique full names | Records/life | Diversity ratio |
|---|---:|---:|---:|---:|---:|
| NL | 334 | 2333 | 2296 | 6.99 | **98.4%** |
| US | 334 | 2375 | 2356 | 7.11 | **99.2%** |
| GB | 334 | 2270 | 2234 | 6.80 | **98.4%** |

98–99% of NPC records have a unique full-name combination. The remaining 1–2% are intra-life duplicates from random pool collisions, which is expected from a probabilistic draw.

### Cultural fit per country (top 5 first names + surnames)

| | First names | Surnames |
|---|---|---|
| NL | Sara, Lev, Anna, Bo, Tess | van Beek, Schoenmaker, van Gent, Bouwhuis, Ramautar |
| US | Sofia, Elijah, Veronica, Imani, Andrea | Sullivan, Wallace, Gray, Kelly, Medina |
| GB | Nia, Ada, Florence, Anna, Adam | Williams, Hughes, Bailey, Bennett, Ross |

NL reads as authentically Dutch (van-prefixes, Schoenmaker, Bouwhuis, plus a Surinamese surname like Ramautar in line with real NL demographics). US has the deliberate mix the pool was designed for (Anglo + Hispanic + AAA-name diversity). GB shows the British mix including the South-Asian surnames the pool intentionally seeded (Patel, Khan, Ali appear in the long tail). **No outliers** of the "wrong-country name" kind — the few outliers detected are inherited from rotating parent country pools (a player's parents in some lives carry surnames from the player's previous country) and that's by design.

---

## Section C — Relationship lifecycle

Source: `testing/agents/relationshipLifecycle.ts`, 1000 lives, seed 7.

### Headline numbers

| Metric | Third audit | Now | Δ |
|---|---:|---:|---:|
| Mean partners/life | 5.0 | **2.65** | −2.35 |
| Median partners/life | (unreported) | **2** | – |
| Max partners in one life | 12 | 15 | +3 |
| Lives with >1 spouse | (unreported) | **27** ⚠ | – |
| Lives with both partner AND spouse | (unreported) | **350** ⚠ | – |
| Total partner records lingering on married lives | (unreported) | **1179** ⚠ | – |

### Partner count distribution

| Partners at death | Lives | % |
|---|---:|---:|
| 0 | 209 | 20.9% |
| 1 | 177 | 17.7% |
| 2 | 167 | 16.7% |
| 3-4 | 248 | 24.8% |
| 5-9 | 186 | 18.6% |
| 10+ | 13 | 1.3% |

**38.6% of lives end with 0–1 partners (target). 24.8% end with 3–4. 19.9% end with 5+.** A long tail remains.

### Spouse count distribution

| Spouses at death | Lives | % |
|---|---:|---:|
| 0 | 578 | 57.8% |
| 1 | 395 | 39.5% |
| **2** | **27** | **2.7%** ⚠ |
| 3+ | 0 | 0.0% |

The **2-spouse cluster is real and reproducible**. Always exactly 2, never more. Indicates one specific path adds a second spouse without first clearing the prior one.

### Top baseId persistence at death

| baseId | Records (1000 lives) | Comment |
|---|---:|---|
| `rel-activity-partner` | **1951** ⚠ | find_date partners — top offender |
| `rel-gym-friend` | 1792 | gym-met friends — expected to persist |
| `rel-library-friend` | 1376 | library-met friends — expected |
| `rel-father` | 1000 | seeded once at birth — expected |
| `rel-vacation-romance` | 539 | vacation romance — expected to be transient, isn't |
| `rel-sibling` | 513 | seeded — expected |
| `rel-spouse` | 449 | spouses — see multi-spouse note |
| `rel-mother` | 254 | mothers (parents that died are removed; surviving mothers stay) |
| `rel-park-friend` | 177 | childhood event — expected |
| `rel-blind-date` | 82 | activity — expected to be transient |
| `rel-coworker-partner` | 55 | career romance — partial cleanup |
| `rel-date-partner` | 20 | first-date — partial cleanup |

The `rel-activity-partner` and `rel-vacation-romance` totals are the smoking gun: these are *casual* partners that should be cleaned up by `rel_breakup` or by marriage. They aren't.

### Why this is happening

Looking at `src/game/data/events/relationships.ts:120-170`, `rel_propose` correctly sweeps `rel-date-partner`, `rel-coworker-partner`, `rel-blind-date`, `rel-vacation-romance`, `rel-activity-partner` on every accept/refusal path. **But:**

1. **Multi-spouse cause:** `rel_propose` is `oncePerLife: true` (line 103), but `rel_received_proposal` (line 380+) does **not** explicitly require `lacks 'spouse'` on its condition list. If the player breaks up post-marriage and ends up partnered again, then receives a proposal, a second `rel-spouse` is added without first removing the first spouse. The propose paths add `rel-spouse` but never `removeRelationship({id: 'rel-spouse'})`.
2. **Zombie-partner cause:** `rel_breakup` fires on `has partner`, which any of the partner-baseIds satisfies. But `find_date` activity adds new `rel-activity-partner` records continuously (with-AI picks `find_date` 9850 times across 1000 lives). The breakup event sweeps all `rel-activity-partner` baseIds correctly when it fires, but breakup doesn't fire often enough to keep up — so the steady-state count grows. Over a 70-year life with 10× find_date hits and 4× breakup hits, you accumulate.

---

## Section D — Random-walk observations

Source: `testing/agents/randomWalk.ts`, 5 lives across NL/US/GB scenarios. Reports at `testing/reports/random-walk-life-{1..5}.md`.

### Summary of the 5 lives

| # | Scenario | Subject | Years | Cause | Weird moments |
|---:|---|---|---:|---|---:|
| 1 | NL-young-death (cap 50) | Rik van der Linden | 50 | (cap) | 1 |
| 2 | NL-average (cap 80) | Wassim Vermeijden | 80 | (cap) | 3 |
| 3 | US-old-age (cap 100) | Alfred Schmidt | 88 | old age | 5 |
| 4 | GB-mixed (no cap) | Nancy Mitchell | 87 | old age | **0** |
| 5 | NL-random-2 (no cap) | Suze Heimans | 69 | old age | 2 |

11 weird moments across 5 lives, **all of them within the two known issue classes** (stat-saturation-on-negative-event, and married-with-lingering-partner). One life (Nancy Mitchell, GB) ran completely clean.

### Top observations

- **Names look right.** Wassim Vermeijden (NL — Surinamese-Dutch first name + Dutch surname — culturally plausible). Alfred Schmidt (US — Schmidt is a top-100 US surname). Nia / Florence / Bennett in GB. The b98609a fix is working in narrative play.
- **Married-with-partner-lingering is hot in life 3.** Alfred Schmidt's life shows the bug across 5 different ages (53, 66, 72, 74, 77) — once a partner is left over from before the marriage, every subsequent event-resolve year that touches relationships logs it. Genesis McDonald and Gary Mendoza accumulate as lingering partners alongside the spouse.
- **Stat saturation visibly distorts narrative coherence.** When smarts/happiness sit at 100, "negative" events have no mechanical effect, which means the narrative says "your studies suffer" while the smarts stat doesn't move. Player will read this as the game being broken, not as them being already-saturated. This is the third-audit's C3 observation made narratively-concrete.
- **Some events are very chatty.** Years with 4+ events fired in the same year occasionally happen at adolescence (15-25) when both `edu_*` and `rel_*` and `random_*` selectors all hit. Not flagged as a bug but worth noting for pacing.
- **Activities feel mostly silent under random-walk.** With a 50% engage rate and random pick (no scoring bias), the activity narratives end up being one-line outcome strings; there's no narrative thread connecting them. This is fine for the engine, but with-AI play feels much richer — see Section E1 for tradeoff.

### Coverage gaps observed in random-walk

Across 5 random-walk lives, never seen:
- `rel_have_a_kid` (12.6% across 1000-life run, but with random choices the "yes" branch only fires ~6% of the time)
- `edu_grad_school` (0.5% baseline)
- `edu_uni_party_phase` (0.9% baseline — third-audit's "structurally reachable but never fires")
- `career_burnout` (0% with-AI, only fires when no activities save you)

Not flagged as new issues — these are confirmed-rare from the 1000-life run.

---

## Section E — New issues found in this audit

### E1. ⚠ HIGH — Multi-spouse bug

Source: `testing/agents/edgeCaseScan.ts`, 3000 lives.

**61 / 3000 lives (2.0%) end with exactly 2 spouses.** Always 2, never 3+. Affects all three countries.

| Sample | Country | Age@death | Spouses |
|---|---|---:|---|
| seed 7007952 | NL | 91 | Esmee Belhadj, Kaj Bouwhuis |
| seed 7007956 | US | 76 | Quinn Thomas, Tamika Webb |
| seed 7008059 | GB | 84 | Michael Campbell, Philip Dawson |
| seed 7008185 | GB | 92 | Ewan Brookes, Arthur Khan |

**Cause:** `rel_received_proposal` ([relationships.ts:380](src/game/data/events/relationships.ts:380)+) condition list does not include `{ path: 'relationships', op: 'lacks', value: 'spouse' }`. The propose paths add `rel-spouse` but never `removeRelationship({id: 'rel-spouse'})` first. So if the player marries (rel_propose), then later somehow ends up with a partner and receives a proposal, a second spouse is appended.

Fix shape: either (a) add `lacks spouse` to `rel_received_proposal` conditions, or (b) every spouse-add path should `removeRelationship({id: 'rel-spouse'})` first to enforce uniqueness, or (c) treat spouse-ness as a separate state field, not a relationship type.

### E2. ⚠ HIGH — Zombie partners on married lives

**350 / 1000 lives (35.0%)** end with both a `partner` record AND a `spouse` record. Total of **1179 lingering partner records** on married lives. Of those, the bulk is `rel-activity-partner` (find_date) which the AI accumulates faster than breakup events clear.

**Cause:** `find_date` activity (`activities.ts:232+`) adds a `rel-activity-partner` on every successful outcome (~30% per pick × ~10 picks/life). `rel_breakup` and `rel_propose` correctly sweep them when they fire, but breakup fires only 74.1% of lives total (and once per fire), while find_date hits ~10× per life. Steady-state, partners pile up.

Fix shape: either (a) make `find_date` add `rel-activity-partner` only if the player doesn't already have one (skip-if-exists), (b) have the action of getting a new activity-partner displace the prior one (single-slot model), or (c) make `rel_breakup` weight scale with the partner count so it fires more often when there's more to clear.

### E3. ⚠ MEDIUM — Money below overdraft buffer

**62 / 3000 lives (2.0%)** end with money < −1000 (the engine's overdraft buffer). Lowest seen: −8990.

Distribution across ages: hits at age 9, 12, 14, 16, 20, 21, 25, 54 — i.e. a child is going more than €1000 in debt, which is suspicious. A child has no salary, no overdraft, and no source of income unless allowance is being applied somewhere.

**Likely cause:** an event or activity with a flat `money: -X` effect where X > current money + buffer. The activity-affordability check (`activityCanBeAfforded` in the simulator) prevents activities from running when they'd push the player below −1000, but events have no equivalent gate.

Fix shape: either (a) clamp `money` at 0 (BitLife model — debt is a separate construct), (b) gate event choices on cost, like activities are gated, or (c) accept negative money as "in debt" but cap the magnitude.

### E4. ⚠ LOW — Stat saturation breaks narrative coherence

Same finding as third-audit's C3, but newly-illustrated by the random-walk reports: when stats are pegged at 100, negative events read as "your studies suffer" without any stat movement. Player reads this as the game being broken. Not new but worth re-flagging because the random-walk made it visceral.

### E5. ✅ Confirmed not happening

Going down the third-audit's open concerns and verifying:
- No NaN in stats or money across 3000 lives
- No empty firstName/lastName across 3000 lives (the `rel_have_a_kid` empty-lastName fix held)
- No duplicate relationship ids within a single life across 3000 lives
- No invalid relationship types
- No relationship ages outside 0..200
- All 75 events trigger at least once across the 1000+1000 deep-audit pass
- All 12 activities picked ≥1× by the AI

---

## Section F — Recommendations

### Top 3 to fix first (by impact)

1. **E1 multi-spouse.** 2% of lives is high enough that streamers / alpha-testers will hit it within a session and screenshot it. The fix is one-line: add `{ path: 'relationships', op: 'lacks', value: 'spouse' }` to `rel_received_proposal` conditions, plus add `removeRelationship({id: 'rel-spouse'})` to all four spouse-add paths defensively. Also add a regression test (third-audit's C1 fix added `removeRelCheck.ts` — same shape works here).
2. **E2 zombie partners.** 35% of married lives carrying lingering partner records is the highest player-impact issue in this audit — the UI's relationship list will show "spouse: Wassim" alongside "partner: Lev" on a third of lives. Recommend going with the single-slot find_date model (option (a)/(b) — `find_date` displaces the prior `rel-activity-partner` rather than appending).
3. **E3 negative money in childhood.** Less common (2%) but logically wrong (child with €−8990 makes no sense). One-line fix: clamp money at 0 in `effectsApplier.ts`, OR add a money-affordability gate to event choices' `cost` field.

### Top 3 to defer

1. **C3 stat saturation.** Same as third-audit. Needs balance pass on activity yields, not a bug fix. Random-walk shows it's narratively visible but not crash-worthy.
2. **C4 `edu_uni_party_phase` starvation.** Single content gap. Ride along with the next education-events expansion.
3. **C6 over-triggering events.** 24 events fire >70% of lives. Tuning not a bug. Wait for next content batch.

### Top 3 design questions for human decision

1. **Spouse-as-relationship vs. spouse-as-state.** The 2-spouse bug is a symptom of treating "spouse" as a relationship type. If "currentSpouseId" were a field on PlayerState instead, you couldn't have two by construction. Bigger refactor but eliminates the whole class of bug.
2. **Activity partner persistence model.** Do find_date partners accumulate (current), displace each other (single-slot), or auto-decay (time-based) when not interacted with? Affects E2 fix shape and the third-audit's "ephemeral vs persistent" question.
3. **Money model.** Negative money / debt as a thing? BitLife clamps to 0; this engine currently allows arbitrary negative numbers. If debt isn't a planned feature, clamp now.

---

## Appendix — Reproducing this audit

All scripts under `testing/agents/`. Reports go to `testing/reports/` (gitignored).

```bash
# Standard deep audit (1000 × 2 passes)
npx tsx testing/agents/deepAudit.ts

# Per-country name diversity (1002 lives, seed 42)
npx tsx testing/agents/nameDiversityPerCountry.ts

# Relationship lifecycle (1000 lives, seed 7)
npx tsx testing/agents/relationshipLifecycle.ts

# Random-walk life simulator (5 scenarios)
npx tsx testing/agents/randomWalk.ts

# Edge-case / invariant scan (3000 lives, seed 7)
npx tsx testing/agents/edgeCaseScan.ts
```

New scripts added in this audit:
- [testing/agents/nameDiversityPerCountry.ts](testing/agents/nameDiversityPerCountry.ts)
- [testing/agents/relationshipLifecycle.ts](testing/agents/relationshipLifecycle.ts)
- [testing/agents/randomWalk.ts](testing/agents/randomWalk.ts)
- [testing/agents/edgeCaseScan.ts](testing/agents/edgeCaseScan.ts)
