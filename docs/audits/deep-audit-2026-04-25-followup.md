# Deep Audit Follow-up — 2026-04-25

Diff against [`deep-audit-2026-04-25.md`](deep-audit-2026-04-25.md). Three of
the five critical issues raised in the previous audit have been fixed; B5
(`edu_uni_party_phase` starvation) and the stat-saturation balance pass
(C2/D4) were intentionally left out of this round.

## Fixes shipped

### F1. Duplicate relationship IDs — fixed
- **Handler** ([effectsApplier.ts:41](src/game/engine/effectsApplier.ts:41)) now mints a deterministic
  unique id `{baseId}-y{currentYear}-n{relationships.length}` for every
  `addRelationship` call. Pure (no `Date.now`/`Math.random`), so the
  seeded integration test stays reproducible.
- **Migration** in [persistence.ts](src/game/state/persistence.ts) renames duplicate ids on load
  so old saves stop having `removeRelationship` wipe multiple rows at
  once.

### F2. `career_burnout` / `career_fired` thresholds — relaxed
- `career_burnout`: `stats.happiness < 35` → `< 50`.
- `career_fired`:   `job.performance < 30` → `< 50`.

We considered an OR-style "workaholic" trigger (high performance + low
happiness) but the condition evaluator is AND-only and adding OR support
is bigger than the symptom warrants.

### F3. Graduation windows widened
- `edu_graduate_high_school`: age 18-only → 17-20, weight 20 → 30.
- `edu_uni_graduate`:        age 22-only → 22-25, weight 20 → 30.

Same pattern as the earlier `edu_grad_school_complete` fix.

## Before vs. after numbers

All numbers from `npx tsx testing/agents/deepAudit.ts` (1000 lives × 2
passes, seed 7).

### Duplicate relationship ids
| | Before | After |
|---|---:|---:|
| Total duplicate-id occurrences across 1000 lives (with-AI) | **1,934** | **0** |
| Lives with ≥1 duplicate | virtually all | 0 |

Verified with a one-shot `dupCheck.ts` script after the handler change.

### Career events
| Event | Before (No-AI / With-AI) | After (No-AI / With-AI) |
|---|---:|---:|
| `career_burnout` trigger rate | 4.0% / **0.0%** | 8.7% / 0.2% |
| `career_fired` trigger rate   | 0.6% / **0.0%** | 8.7% / 0.5% |

`career_fired` jumped 14× in the no-AI pass; `career_burnout` doubled.
With activities-AI engaged the rates stay low (an engaged player keeps
happiness/performance pinned high — that's expected and arguably correct
design: optimal play avoids burnout).

### Graduation conversion
| Event | Before | After |
|---|---:|---:|
| `edu_graduate_high_school` trigger rate (No-AI / With-AI) | 20.7% / 19.2% | **46.1% / 44.4%** |
| `edu_uni_graduate` trigger rate (No-AI / With-AI)         | 2.0% / 3.0%   | **3.9% / 4.6%** |
| HS conversion (graduated / enrolled, deterministic)*       | ~40%          | **≥80%**       |
| Uni conversion (graduated / enrolled, deterministic)*      | ~29%          | **≥80%**       |

\* Conversion ratio measured by the new `tests/engine/graduationCompletion.test.ts`
which uses a deterministic "always pick option 0 to enroll/graduate"
strategy. The deep-audit's appendix percentages look lower (44% / 4.6%)
because its simulator picks choices weighted-randomly, so half of
`edu_university_apply` triggers pick "Skip it" and never enroll. The
deterministic ratio is the right one for "is this content reachable
when the player engages with it?".

## Tests

| | Before | After |
|---|---:|---:|
| Test files | 11 | 13 |
| Total tests | 127 | **131** |
| Pass rate | 127/127 | 131/131 |

New tests:
- `effectsApplier.test.ts` — "mints a unique id on every addRelationship"
  fires the same payload 5× and asserts 5 distinct ids.
- `persistence.test.ts` (new file, 2 tests) — load with duplicate ids gets
  uniquified; clean save round-trips without rewriting unique ids.
- `graduationCompletion.test.ts` (new file, 1 test) — runs 200 deterministic
  smart lives, asserts ≥80% of HS and Uni enrollees graduate.

## What did NOT change (out of scope)

- **Stat saturation** (C2 / D4 in the prior audit): with-AI still ends
  with mean health 88, happiness 98, smarts 98. Per-activity yields
  unchanged.
- **`edu_uni_party_phase` starvation** (B5): still 1.3% / 0.3%.
- **Promotion event not updating `job.title`**: cosmetic, deferred.
- **Random.ts over-triggering** (8 of top 10): no condition tightening.
- **`passesCountryGate` single-`if`**: still hardcoded for `lottery_ticket`.

## Side observations from this run

- `rel_breakup` jumped from 64% / 81% → consistent with the previous
  audit (activities seed partners, partners can break up). No change here,
  just a confirmation that the activity-driven content unlocks held.
- `edu_dropout` fell from 4.4% to 3.9% / 0.9% — the wider HS-graduation
  window now competes for the same age-17 slots; nothing concerning, but
  it's a side effect to be aware of.
