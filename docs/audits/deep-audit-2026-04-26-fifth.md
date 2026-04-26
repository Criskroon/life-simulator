# Deep Audit (Fifth) — 2026-04-26

Verifies commit `7b48c5f` (Tier-systeem voor relationships + quick fixes E1/E2/E3). Adds: tier slot stress tests, migration verification across five synthetic legacy saves, performance probe, dev-mode runtime check.

**Scope:** audit only — no fixes shipped.

## TL;DR

1. **Tier system holds under sustained pressure.** Across the headline 1000-life lifecycle run (seed 7) and a fresh 5-scenario × 200-lives stress test (date marathons, marriage switching, vacation lover, long marriage, family tragedy): **0/2000 lives** ever record >1 spouse, >1 partner, partner+spouse simultaneously, or significantExes overflowing the cap of 10. The slot model is the correct refactor — multi-spouse and zombie-partner classes are gone by construction.
2. **E1, E2 are eliminated. E3 untouched (acknowledged-deferred).** Multi-spouse 27/1000 → 0. Zombie partner+spouse 350/1000 → 0. Money below −1000 still 63/3000 (was 62/3000) — pre-existing, declared out of scope for the tier-system commit.
3. **All five legacy migration saves load cleanly and are idempotent.** Including the worst-case "5 partners + 0 spouses", "2 spouses + 1 partner", and "12 vacation-romances" shapes — all migrate to the right slot semantics, save+reload produces a byte-identical relationshipState.
4. **Performance is not a regression.** 1000 with-AI lives in **0.62 s** (0.62 ms/life). Median life-state JSON: 19 KB. ageUp() over a median state averages 0.001 ms. Headroom for 10× content growth.
5. **Tests 143 → 170 (24 new + 1 in persistence).** All green. TS strict + vite build clean. Dev-mode runtime probe (Birth → Age 56) produced **zero console errors**, single-spouse state intact, valid stats, no NaN.

---

## Section A — Tier-system verification (vs. previous audits)

| Issue | Before | After | Status |
|---|---:|---:|---|
| **E1**: lives with >1 spouse (vierde audit, 1000 lives seed 7) | 27 | **0** | ✅ Resolved by construction |
| **E1 wide scan**: lives with >1 spouse (3000 lives seed 7) | 61 | **0** | ✅ Resolved |
| **E2**: lives with both partner AND spouse (1000 lives seed 7) | 350 | **0** | ✅ Resolved |
| **E2**: lingering partner records on married lives | 1,179 | **0** | ✅ Resolved |
| **E2**: total `rel-activity-partner` records at death | 1,951 | 822 | ⬇ Cut by 58% (down to one per life max — the slot occupant; the rest decay to casualEx) |
| Mean partners at death | 2.65 | **0.43** | ⬇ Reflects single-occupancy partner slot |
| Max partners in one life | 15 | **1** | ✅ Slot enforces |
| Largest casualExes list at death (across stress runs) | n/a | 16 | ✅ Inside expected window (5y decay × ~3 dates/yr) |
| **E3**: lives with money < −1000 (3000 lives seed 7) | 62 | 63 | ⚠ Unchanged — declared out-of-scope for the tier commit |
| **C3** stat saturation (random-walk weird moments) | 11 | 4 | Same root cause; still pre-existing |
| **C4** `edu_uni_party_phase` starvation | 0.9% | 0.9% | Acknowledged-deferred |
| Test count | 143 | **170** | +27 (24 in `relationshipEngine.test.ts`, 1 in `persistence.test.ts`, +2 reframed in `effectsApplier.test.ts`) |

The headline metrics (Multi-spouse 0, Zombie 0) are stable across two independent runs (1000-life lifecycle agent + 1000-life stress runs across 5 scenarios = 2000 lives total).

### Notable observation about the lifecycle metrics

Mean partners/life dropping from 2.65 → 0.43 might read as "the AI is dating less." It isn't. The `rel-activity-partner` baseId still gets added 18.5× per life on average in the date-marathon stress scenario (3,697 adds across 200 lives), but each new add **displaces the prior partner** to the casualEx list with a 5-year decay. So the legacy view's `type === 'partner'` count at death is necessarily 0 or 1 — the slot occupant. Casual exes still exist; they just aren't counted as partners.

### baseId distribution at death (1000 lives, seed 7)

| baseId | After (now) | Before (vierde audit) | Comment |
|---|---:|---:|---|
| `rel-father` | 1000 | 1000 | unchanged — seeded once at birth |
| `rel-activity-partner` | 822 | 1951 | -57% — now mostly casualEx, decays out |
| `rel-spouse` | 440 | 449 | unchanged within noise |
| `rel-sibling` | 513 | 513 | unchanged |
| `rel-gym-friend` | 312 | 1792 | **-83%** — friend-fade decay (8y window) is now active |
| `rel-mother` | 239 | 254 | unchanged within noise |
| `rel-vacation-romance` | 195 | 539 | -64% — slot routing |
| `rel-library-friend` | 165 | 1376 | **-88%** — friend-fade decay |
| `rel-blind-date` | 18 | 82 | -78% — slot routing |

The friend-fade decay is doing more cleanup than initially expected — `rel-gym-friend` and `rel-library-friend` were piling up cumulatively before, now they age out of contact within the 8-year fade window.

---

## Section B — Stress test results

Source: `testing/agents/tierStressTest.ts`, 5 scenarios × 200 lives = 1000 lives total. Generated in 0.58 s.

### Slot invariants — every scenario, every life

| Scenario | Lives | Avg age | Multi-spouse | Multi-partner | Partner+Spouse | SignificantEx>10 |
|---|---:|---:|---:|---:|---:|---:|
| A — Date Marathon | 200 | 68.8 | **0** | **0** | **0** | **0** |
| B — Marriage Switching | 200 | 70.7 | **0** | **0** | **0** | **0** |
| C — Vacation Lover | 200 | 69.5 | **0** | **0** | **0** | **0** |
| D — Long Marriage | 200 | 71.0 | **0** | **0** | **0** | **0** |
| E — Family Tragedy | 200 | 70.8 | **0** | **0** | **0** | **0** |

All scenarios: **PASS**. No invariant tripped during any of the 1,000 lives, regardless of how aggressively the AI pushed the partner/marriage paths.

### Final-state lists per scenario

| Scenario | Mean casualExes | Max casualExes | Mean significantExes | Max significantExes |
|---|---:|---:|---:|---:|
| A — Date Marathon | **8.74** | 16 | 0.00 | 0 |
| B — Marriage Switching | 8.77 | 16 | 0.00 | 0 |
| C — Vacation Lover | 1.56 | 5 | 0.00 | 0 |
| D — Long Marriage | 0.01 | 1 | 0.00 | 0 |
| E — Family Tragedy | 0.03 | 1 | 0.00 | 0 |

### Custom counters (throughput, sanity)

- **A — Date Marathon**: 3,697 partner-adds total across 200 lives (18.48/life) — slot displaces every one. End-state casualExes mean = 8.74 ≈ ~5 years of dating at peak frequency, which matches the 5-year decay window.
- **C — Vacation Lover**: 765 partner-adds total (3.83/life) — vacation-romance outcome fires ~15% of the time, lower throughput than find_date.
- **D — Long Marriage**: 0 activity-partner adds (the AI doesn't run find_date in this scenario), spouse persists across the full 70-year arc.
- **E — Family Tragedy**: 148 parent deaths observed across 200 lives — about the expected baseline.

### Family-list integrity

| Scenario | Lives w/ dead-parent-in-family | Lives w/ orphan legacy refs |
|---|---:|---:|
| A | 0 (0.0%) | 0 (0.0%) |
| B | 0 (0.0%) | 0 (0.0%) |
| C | 0 (0.0%) | 0 (0.0%) |
| D | 0 (0.0%) | 0 (0.0%) |
| E | 0 (0.0%) | 0 (0.0%) |

Family list cleanup is 100% across the 1000 stress lives. `rel_parent_dies` correctly removes the parent from `family[]` via the legacy shim → `removePersonByBase`.

### Caveat: B — Marriage Switching couldn't fully exercise re-marriage

`rel_propose` and `rel_received_proposal` are both `oncePerLife: true`. The AI marries successfully but cannot re-marry once divorced/widowed — there's no second propose path in the existing content. Result: significantExes count is 0 across all 200 B lives, because the spouse never gets vacated by another marriage attempt. This is a **content gap**, not an engine bug. The slot logic is exercised by the failover paths in scenarios A and C anyway.

---

## Section C — Random-walk observations

Source: `testing/agents/randomWalk.ts`, 5 scenarios. Reports at `testing/reports/random-walk-life-tier-{1..5}.md`.

| # | Scenario | Subject | Years | Cause | Weird moments |
|---:|---|---|---:|---|---:|
| 1 | NL-young-death (cap 50) | Rik van der Linden | 50 | (cap) | 2 |
| 2 | NL-average (cap 80) | Wassim Vermeijden | 80 | (cap) | 2 |
| 3 | US-old-age (cap 100) | Alfred Schmidt | 90 | old age | **0** |
| 4 | GB-mixed (no cap) | Nancy Mitchell | 41 | freak accident | **0** |
| 5 | NL-random-2 (no cap) | Suze Heimans | 90 | old age | **0** |

**4 weird moments across 5 lives**, all of them `stat-saturation-on-negative-event` (the third-audit's C3 / fourth-audit's E4 pre-existing issue). **Zero relationship-related moments** — no multi-spouse, no zombie partners, no orphan family rows. Three of five lives ran completely clean.

The weird moments compared to the fourth audit:

| Audit | Weird moments / 5 lives | Composition |
|---|---:|---|
| Fourth | 11 | Mostly stat-saturation + 5× married-with-partner-lingering |
| **Fifth** | **4** | Stat-saturation only |

The married-with-partner-lingering class is gone, as expected.

---

## Section D — Migration verification

Source: `testing/agents/tierMigrationCheck.ts`, 5 synthetic legacy saves, idempotency check.

| # | Case | Initial migration | Idempotent (save→reload) |
|---:|---|---|---|
| 1 | Five partners, no spouse (E2 zombie residue) | ✅ first → partner slot, rest 4 → casualExes | ✅ |
| 2 | Two spouses + one partner (E1 + E2 residue) | ✅ first → spouse, second → significantEx, partner kept | ✅ |
| 3 | Twelve vacation-romances (old accumulation) | ✅ first → partner, 11 → casualExes; legacy view still 12 entries | ✅ |
| 4 | Minimal (mother + father only) | ✅ both → family list, no romantic slots | ✅ |
| 5 | Full mix (every category) | ✅ spouse seated, 4 family, 3 friends, all preserved | ✅ |

**Verdict: all 5 saves migrate cleanly and idempotently.** Saving a migrated state and reloading produces a byte-identical `relationshipState`.

The migration is conservative: it never drops data. Anything in the legacy array shows up somewhere in the slot model afterwards (slot, list, or ex bucket). Save 3 (12 vacation romances) is the most informative — the post-migration state has 1 partner + 11 casualExes, and the synced legacy view round-trips back to 12 entries. No information loss.

---

## Section E — New issues found in this audit

### E1 (fifth). ⚠ MEDIUM — `rel_propose` `oncePerLife` blocks re-marriage content paths

Discovered in stress scenario B (marriage switching). Both `rel_propose` and `rel_received_proposal` are `oncePerLife: true`. Once a player divorces (or is widowed via `rel_parent_dies`-style death — though that doesn't currently apply to spouses), there's no event in the content that lets them re-propose or receive another proposal.

**Player impact:** the scenario "married, divorced, married again" is **structurally impossible** in current content. The slot engine supports it (`addSpouse` after `divorceSpouse` works in tests), but no event emits it.

**Fix shape:** drop `oncePerLife` from `rel_received_proposal` and add a `lacks 'spouse'` condition to it. `rel_propose` likely also needs `oncePerLife` removed since the player can break-up + re-couple multiple times in a life. Single-spouse-per-life isn't a design decision — it's an artifact of the propose-once shape.

### E2 (fifth). ⚠ LOW — `casualExes` can grow large on date-marathon lives

Stress scenario A peaks at 16 casual exes at death. With the 5-year decay window this is consistent with ~3 partner-displacements per year for the last 5 years of life — not a bug, but the UI's collapsible casual exes section will be visually long for those lives. Worth a thought when surfacing this list:
- Option A: compact the rows to a single line per ex.
- Option B: hide entirely past N entries with a "+N more" affordance.
- Option C: leave as-is (collapsible already hides by default).

### E3 (fifth). ⚠ LOW — `friends[]` decays even when the AI calls `call_friend`

The friend-fade rule is `yearsSinceContact + 1` per tick, with no reset path. The activity `call_friend` is in scope but doesn't currently reset the contact counter. Result: even a player who diligently calls friends loses them eventually after 8 years. The cleanup is healthy at scale (rel-gym-friend down 83%, rel-library-friend down 88%), but the per-friend persistence story is "they fade no matter what."

**Fix shape:** add a `resetFriendContact` special and have `call_friend` and `family_time` invoke it. Or: make `call_friend`'s effect chain include the special. One-line content addition once the special exists.

### Confirmed not happening (across 3000 lives + 1000 stress lives = 4000 total)

- No NaN in stats or money
- No empty firstName/lastName
- No duplicate relationship ids within a single life
- No invalid relationship types (after the scanner update for `casualEx`/`significantEx`)
- No relationship ages outside 0..200
- No multi-spouse, no multi-partner, no >10 significantExes, no orphan legacy refs
- No console errors during a 56-year dev-mode run

---

## Section F — Performance

Source: `testing/agents/perfCheck.ts`, 1000 with-AI lives, fresh seeds.

| Metric | Value |
|---|---|
| 1000 with-AI lives, wall time | **0.62 s** (0.62 ms/life) |
| State size at death (JSON bytes) | min 1,759, **median 19,030**, mean 18,315, max 26,329 |
| `ageUp` over median state, 1000 runs | 1 ms total (**0.001 ms/call**) |
| `npm test` (170 tests) | 1.30 s |
| `npm run build` (tsc strict + vite) | 0.80 s |
| Bundle size | 280 KB JS / 84.6 KB gzipped |

**Comparison to fourth audit:** the fourth audit didn't publish a wall-time benchmark for the simulator. Best available proxy is the `deepAudit.ts` run: fourth audit doesn't quote a number, fifth runs in **0.93 s** for 2000 lives total (2 passes × 1000). Headroom is ample — adding a 5× content multiplier would still keep batch runs under 5 seconds.

**No optimisation work needed.** The slot model adds two list operations per `addRelationship` (one for the slot mutation, one for the legacy-view sync), and the legacy view is a fresh `Relationship[]` build per mutation. At ~80 events × 18 partner adds × 1000 lives, that's a few hundred thousand calls; it's not even visible in the wall time.

### State-size note

19 KB median is bigger than the legacy ~12–14 KB because `relationshipState` and the synced `relationships` view are both serialised. If save-payload size becomes a concern (it shouldn't — localStorage is good for several MB), the engine could be taught to drop `relationships` at save time and rebuild on load via `syncLegacyView`. **Not recommended yet** — the cost of storing both is trivial, and the dual-write keeps debugging easy because both views are visible in any tool that opens the save JSON.

---

## Section G — Recommendations for next session

### Top 3 to fix first (by content-design impact)

1. **Re-marriage content path** (Section E1 / fifth). Remove `oncePerLife` from `rel_received_proposal` (and likely from `rel_propose`), add `lacks 'spouse'` conditions. Unlocks "widowed and re-married" and "divorced and re-married" lives — both common BitLife shapes that are structurally blocked today. Low effort; high narrative payoff.
2. **`call_friend` / `family_time` reset friend contact**. Add a `resetFriendContact` special with payload `{ baseId }`, hook it into the `call_friend` activity's deterministic effects (and optionally as a probabilistic outcome on `rel_meet_old_friend` when the player chooses "make the call"). Eliminates the "friends fade no matter what you do" pattern.
3. **E3 money clamp** (carry-over from fourth audit). 63/3000 lives still end below −1000. Either clamp money at 0 or add a money-affordability gate to event choices' `cost` field. Likely a half-day fix; eliminates a class of weird-state moments.

### Top 3 to defer

1. **Stat saturation** (C3 / E4). Same status as previous audits. Needs a balance pass on activity yields; not a bug. Random-walk fifth still surfaces it as the only "weird moment" class.
2. **Over-triggered events**. Still 22 events firing >70% of lives (random_found_money 95%, random_weird_dream 94%, etc.). Tuning, not a bug. Wait for next content batch.
3. **`edu_uni_party_phase` starvation**. 0.9% trigger rate. Single content gap; ride along with the next education-events expansion.

### Top 3 design questions for human decision

1. **Engagement window**. The slot model has a `fiance` slot (and the `addFiance` special) that **no current event uses**. Either ship a content path that goes partner → fiance → spouse (engagement events with a 1–3 year window), or remove the slot and special. The asymmetry is fine for now but accumulates as dead code if left untouched.
2. **CasualEx UI surfacing**. The list peaks at 16 in stress scenarios. Worth deciding now whether the panel should collapse at N entries, summarise, or stay verbose. (My take: collapse at N=5 with "+more".)
3. **Friend-fade tunability**. 8 years until a friend is dropped is opinionated. Surface it as a country rule (`friendshipResilience: number`) so the cultural difference between "friends since elementary school still call" and "moved to a new city, started over" can be modelled.

---

## Appendix — Reproducing this audit

All scripts under `testing/agents/`. Reports go to `testing/reports/` (gitignored).

```bash
# Headline lifecycle (1000 lives, seed 7)
npx tsx testing/agents/relationshipLifecycle.ts

# Tier slot stress (5 × 200 lives)
npx tsx testing/agents/tierStressTest.ts

# Synthetic legacy migration (5 cases)
npx tsx testing/agents/tierMigrationCheck.ts

# Performance probe (1000 with-AI lives)
npx tsx testing/agents/perfCheck.ts

# Edge-case / invariant scan (3000 lives, seed 7)
npx tsx testing/agents/edgeCaseScan.ts

# Random-walk (5 scenarios; reports written with -tier-N suffix)
npx tsx testing/agents/randomWalk.ts
# (then: cp testing/reports/random-walk-life-N.md testing/reports/random-walk-life-tier-N.md)
```

New scripts added in this audit:
- [testing/agents/tierStressTest.ts](testing/agents/tierStressTest.ts)
- [testing/agents/tierMigrationCheck.ts](testing/agents/tierMigrationCheck.ts)
- [testing/agents/perfCheck.ts](testing/agents/perfCheck.ts)
