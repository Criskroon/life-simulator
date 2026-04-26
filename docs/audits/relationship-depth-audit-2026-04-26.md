# Relationship Depth Audit — 2026-04-26

Goal: measure how *alive* relationships feel during gameplay, not just whether
they exist in state. The fifth audit verified the tier system is structurally
correct (no multi-spouse, no zombie partners). This audit asks the next
question: do relationships *get gameplay*, or do they sit quietly in state
while the player ages past them?

**Scope:** audit only — no fixes shipped.

Source agent: [testing/agents/relationshipDepthAudit.ts](testing/agents/relationshipDepthAudit.ts).
Run: 1000 lives, seed 7, activities-AI on. Wall time 1.11 s.

## TL;DR — top 5 findings

1. **Marriage is event-starved.** Mean **0.093 spouse-targeted events per
   married year** — a married couple gets one spouse-specific moment every
   ~11 years. 9.1% of marriages (40/438) end with **zero** spouse-targeted
   events ever firing. The spouse is technically tracked, narratively absent.
2. **Father is a content ghost.** Across 1000 lives the father gets **0
   event-touches** — no event in the codebase has a `has 'father'` condition.
   Every father appearance is either via the unspecific `family_time` activity
   or the relationship list. Mother gets 2,788 event-touches; sibling 400
   (childhood-only); father zero. Pure content asymmetry.
3. **Divorce is structurally impossible.** 437/438 marriages (99.8%) end in
   "still-married-at-death". Only one divorce fired across 1000 lives, and
   that was the deceased spouse aging out of the slot. `rel_breakup`
   gates on `has 'partner'`, not `has 'spouse'`, so a married player has no
   exit. The engine supports `divorceSpouse`; no event emits it.
4. **97.6% of lives end with at least one silent relationship.** Defined as
   a relationship that lived in state for >5 years with the longest gap-
   without-touch also >5 years. Spouse silence rate **97.7%**, sibling
   **96.5%**, father **97.2%**, friend **75.9%**. Family relationships are
   long-lived and quiet.
5. **The relationship system is wider than its content.** 11.9 instances per
   life on average; only ~7 events and 2 activities can target any of them
   by type. The tier-engine refactor unlocked structural correctness, but
   content has not caught up — an effect visible as the same handful of
   targeting events doing all the work (`rel_friendship_drifts` 2,217 fires,
   `rel_family_argument` 2,038, `rel_anniversary` 1,489).

---

## A. Lifecycle data

### A.1 Distribution by initial type

| Initial type | Instances | Per life avg | % of all instances |
|---|---:|---:|---:|
| `partner` | 3,598 | 3.60 | 30.2% |
| `friend` | 3,354 | 3.35 | 28.2% |
| `casualEx` | 1,922 | 1.92 | 16.2% |
| `father` | 1,000 | 1.00 | 8.4% |
| `mother` | 1,000 | 1.00 | 8.4% |
| `sibling` | 513 | 0.51 | 4.3% |
| `spouse` | 439 | 0.44 | 3.7% |
| `child` | 73 | 0.07 | 0.6% |

`casualEx` instances appear here because `find_date` (and other partner-
forming activities) routes the new partner directly into the casualEx bucket
when a spouse is already seated — the slot model's E2 mitigation. So the
"initial type" is `casualEx` for those, not `partner`.

### A.2 Sources of instances

Where each tracked instance came from (`birth` = seeded by `createNewLife`):

| Source | Kind | Instances |
|---|---|---:|
| `find_date` | activity | 3,827 |
| `createNewLife` | birth | 2,513 |
| `gym` | activity | 1,739 |
| `library` | activity | 1,432 |
| `vacation` | activity | 800 |
| `rel_blind_date` | event | 399 |
| `career_workplace_romance` | event | 253 |
| `rel_propose` | event | 242 |
| `rel_first_date` | event | 241 |
| `rel_received_proposal` | event | 197 |
| `child_park_friend` | event | 183 |
| `rel_have_a_kid` | event | 73 |

Activities (find_date, gym, library, vacation) account for **65.4%** of all
non-birth instances. The "make a new relationship" half of the system is
healthy — it's the post-formation half that's hollow.

### A.3 Endings by initial type

| Type | event | activity | fade | still at death | total |
|---|---:|---:|---:|---:|---:|
| `partner` | 1,611 | 0 | 1,301 | 686 | 3,598 |
| `friend` | 0 | 0 | 2,151 | 1,203 | 3,354 |
| `casualEx` | 0 | 0 | 1,622 | 300 | 1,922 |
| `father` | 0 | 0 | 0 | 1,000 | 1,000 |
| `mother` | 750 | 0 | 0 | 250 | 1,000 |
| `sibling` | 0 | 0 | 0 | 513 | 513 |
| `spouse` | 1 | 0 | 0 | 438 | 439 |
| `child` | 0 | 0 | 0 | 73 | 73 |

The end-distribution per type tells a clear story:

- **Friends fade.** 64.1% of friends drop out via the 8-year fade rule.
- **Partners break up or get promoted.** 1,611 partner-ends are mostly
  `rel_breakup` and partner→spouse via propose/accept.
- **Casual exes age out.** 1,622 casualExes hit the 5-year decay window.
- **Mothers die in 75% of lives** via `rel_parent_dies`.
- **Fathers, siblings, children: never end.** They sit in the relationships
  list from birth (or from formation) until the player dies. There is no
  `has 'father'` event, no `has 'sibling'` event past age 12, and no
  `has 'child'` event at all.

---

## B. Silence analysis

A relationship is "silent" when it exists in state for more than 5 years AND
its longest gap-without-touch is also more than 5 years. This captures the
BitLife player's "wait, who is that person in my relationships panel again?"
moment.

**976 / 1,000 lives (97.6%)** end with at least one silent relationship in
their history. Silence is the norm, not the exception.

### B.1 Silence rate by type

Touches split into **event-touches** (a `has 'X'` event fired) and
**activity-touches** (`family_time` or `call_friend`).

| Type | Instances | Silent | % silent | Mean lifetime | Mean max-silence | Mean event-touches | Mean activity-touches | Total event-touches |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `partner` | 3,598 | 2,315 | 64.3% | 8.5 | 7.8 | 0.57 | 0.00 | 2,045 |
| `friend` | 3,354 | 2,547 | 75.9% | 17.1 | 7.1 | 0.66 | 4.19 | 2,217 |
| `casualEx` | 1,922 | 1,622 | 84.4% | 5.5 | 5.5 | 0.00 | 0.00 | 0 |
| `father` | 1,000 | 972 | 97.2% | 73.5 | 14.4 | **0.00** | 26.53 | **0** |
| `mother` | 1,000 | 904 | 90.4% | 50.9 | 10.2 | 2.79 | 21.00 | 2,788 |
| `sibling` | 513 | 495 | 96.5% | 73.0 | 14.2 | 0.78 | 26.77 | 400 |
| `spouse` | 439 | 429 | 97.7% | 39.6 | 19.6 | 3.71 | 0.00 | 1,629 |
| `child` | 73 | 71 | 97.3% | 39.5 | 12.8 | 0.00 | 9.19 | 0 |

Interpretation:

- **Spouse 97.7% silent** with 19.6-year mean max-silence is the worst: the
  longest gap-without-touch in the average marriage is nearly two decades.
- **Father 100% event-silent**: zero events touch father across 1,000 lives.
  Every recorded touch is from `family_time`.
- **Sibling falls off a cliff at age 12**: only `child_sibling_fight` targets
  siblings, and it's gated to `maxAge: 12`. After childhood, siblings are
  pure background.
- **Friend silence is high (75.9%)** even with the 8-year fade pruning out
  inactive ones. Still many friends sit in state past the threshold without
  triggering any of the two friend-targeting hooks.

### B.2 Per-event/activity targeting throughput

Which events and activities actually contribute touches?

| Event | Targets | Fires | Touches attributed |
|---|---|---:|---:|
| `rel_friendship_drifts` | friend | 1,339 | 2,217 |
| `rel_family_argument` | mother | 2,042 | 2,038 |
| `rel_anniversary` | spouse | 1,489 | 1,489 |
| `rel_breakup` | partner | 1,033 | 1,023 |
| `rel_parent_dies` | mother | 750 | 750 |
| `rel_propose` | partner | 646 | 643 |
| `child_sibling_fight` | sibling | 400 | 400 |
| `rel_received_proposal` | partner | 384 | 379 |
| `rel_have_a_kid` | spouse | 140 | 140 |

| Activity | Targets | Runs | Touches attributed |
|---|---|---:|---:|
| `family_time` | mother, father, sibling, child | 26,533 | 61,939 |
| `call_friend` | friend | 9,003 | 14,049 |

Untargeted relationship-themed events (formation/ambient — they create
relationships but don't deepen existing ones):

| Event | Fires | Notes |
|---|---:|---|
| `rel_first_date` | 998 | forms `rel-date-partner` |
| `rel_friend_wedding` | 1,164 | ambient/formation |
| `rel_meet_old_friend` | 3,989 | ambient/formation |
| `rel_blind_date` | 772 | forms `rel-blind-date` |

Notable: only **9 events** can ever touch an existing relationship, and four
of them are partner-gates (propose, breakup, received_proposal, blind_date).
For long-lived relationship types — spouse, parent, sibling, child — there
are at most 2-3 hooks each.

---

## C. Spouse depth

| Metric | Value |
|---|---|
| Lives that ever marry | **438 / 1,000 (43.8%)** |
| Marriage length, mean | **39.5 yrs** |
| Marriage length, median | 40 yrs |
| Marriage length, max | 72 yrs |
| Touches during marriage, mean | 3.71 |
| Touches during marriage, median | 4 |
| Touches during marriage, max | 11 |
| Touches per married year, mean | **0.093** |
| Touches per married year, median | 0.091 |
| Marriages with zero spouse-targeted events ever | **40 / 438 (9.1%)** |

A 30-year marriage receives, on average, **3-4 spouse-specific events total**.
The two hooks in current content are `rel_anniversary` (annual roll) and
`rel_have_a_kid` (one-shot, but no `oncePerLife` gate so it can re-fire). At
peak engagement (the (0.5, 1.0] bucket) one married life out of 438 hit one
event per married year — the rest are far below.

### C.1 Marriage end reasons

| Reason | Count | % of married lives |
|---|---:|---:|
| still-married-at-death | 437 | 99.8% |
| divorce | 1 | 0.2% |

### C.2 Touches-per-married-year distribution

| Touches / married year | Marriages | % |
|---|---:|---:|
| 0 | 36 | 8.3% |
| (0, 0.1] | 218 | 50.2% |
| (0.1, 0.25] | 178 | 41.0% |
| (0.25, 0.5] | 1 | 0.2% |
| (0.5, 1.0] | 1 | 0.2% |
| >1.0 | 0 | 0.0% |

50% of marriages get fewer than 1 spouse-event per 10 years.

### C.3 Comparison to BitLife

In BitLife, a married player can initiate spouse interactions every year:
compliment, gift, romantic getaway, argue, ask about the day, suspect of
cheating, joint career decision, talk about kids, etc. Plus passive yearly
events: in-laws visit, spouse promotion, spouse health scare, kids-related
sub-events, milestone birthdays. Conservatively that's 8-15 spouse-touch
opportunities per year of marriage. **We have 2 events on the books, both
gated only by `has 'spouse'` and `weight < 0.7` — so most years roll past
without any spouse beat.**

---

## D. Friend depth

| Metric | Value |
|---|---|
| Friend instances across 1,000 lives | **3,354** |
| Friend instances per life, mean | 3.35 |
| Friend instances per life, median | 3 |
| Friend instances per life, max | 13 |
| Friend lifetime (yrs), mean | 17.97 |
| Friend lifetime (yrs), median | 15 |
| Friend lifetime (yrs), max | 80 |
| Friend touches over lifetime, mean | 4.85 |
| Friend touches over lifetime, median | 3 |
| Friends with **zero touches** ever | **497 / 3,354 (14.8%)** |

### D.1 Friend distribution per life

| Friends ever in life | Lives | % |
|---|---:|---:|
| 0 | 77 | 7.7% |
| 1 | 132 | 13.2% |
| 2 | 186 | 18.6% |
| 3-4 | 333 | 33.3% |
| 5-9 | 263 | 26.3% |
| 10+ | 9 | 0.9% |

### D.2 Engagement quality

Friends get the most diverse touch sources of any non-formation type:

- `call_friend` activity (frequent, but resets *all* friends, not one)
- `rel_friendship_drifts` event (~2.4× per life on average; abstract — picks
  no specific friend)
- The 8-year fade decay (passive — not a touch)

There is **no event/activity that targets a specific friend by `id` or
`baseId`**. Friendships are therefore homogeneous from the player's POV:
every friend has identical possible interactions because every interaction
treats "friend" as a class, not as a specific person. A player's "best friend"
has no system distinction beyond the (currently unused) `isBestFriend` flag.

`rel_meet_old_friend` is technically untargeted — it doesn't touch any
existing friend; it creates a new transient relationship moment with an
unspecified party. So even the highest-firing relationship-themed event
(3,989 fires) doesn't deepen any tracked instance.

---

## E. Diagnosis

### E.1 Which relationship types feel alive?

Defining "alive" loosely as "average instance gets ≥0.3 touches per year of
existence in state":

| Type | Touches per year (event+activity) | Verdict |
|---|---:|---|
| Partner | 0.067 | Empty |
| Spouse | 0.094 | Empty |
| Mother | 0.468 | Borderline (mostly via `family_time`) |
| Father | 0.361 | Empty (100% via `family_time`, 0 events) |
| Sibling | 0.377 | Borderline (mostly via `family_time`) |
| Friend | 0.283 | Borderline |
| Child | 0.233 | Empty |

If we restrict to **event** touches only (the events that actually generate
narrative beats), nothing crosses 0.1 touches/year. Activities provide a
volume floor but no narrative variety — `family_time`'s outcome list is the
same regardless of how the player feels about their family.

### E.2 Concrete content gaps

1. **Spouse content (worst gap).** 2 spouse-conditioned events for a 30+
   year marriage. Current set: anniversary (yearly hook) + have-a-kid (life
   transition). Missing: arguments, compliments, gifts, joint financial
   decisions, in-law conflicts, romantic moments, suspicions, parenting
   sub-events, illness/hardship.
2. **Father content (worst asymmetry).** Zero `has 'father'` events. The
   mother has both a death event (`rel_parent_dies`) and a friction event
   (`rel_family_argument`). The father has neither.
3. **Sibling adult content.** `child_sibling_fight` is the only sibling
   event, and it caps at age 12. From 13-onward (60+ years for most lives),
   siblings are inert.
4. **Child events (zero).** Once `rel_have_a_kid` fires, the child sits in
   state with no event ever targeting `has 'child'`. No first-day-of-school,
   no teenage rebellion, no graduation, no leaving home.
5. **Divorce path.** No event emits `divorceSpouse` or `breakUpPartner` on
   a spouse. The engine supports it; content does not.
6. **Engagement (fiance) window.** The `addFiance` special and `fiance` slot
   are dead code — no event uses them.
7. **Per-friend interaction.** Two friend-touching mechanisms exist
   (`call_friend`, `rel_friendship_drifts`) and both treat all friends as
   interchangeable. There's no way to "hang out with [specific friend]" or
   to have one friendship grow while another fades.
8. **`rel_have_a_kid` re-fire bug-adjacent.** No `oncePerLife` gate; if the
   player keeps choosing "yes, let's try" the same `rel-child-1` baseId
   fires repeatedly (the engine deduplicates so only one child appears, but
   the choice keeps reappearing).

### E.3 What does feel alive?

The **formation** side of relationships works well. Activity-driven
romance via `find_date`/`vacation`/`gym`, plus event-driven via
`rel_first_date`/`rel_blind_date`/`career_workplace_romance`, generates a
healthy 3,598 partner instances across 1,000 lives. Players who actively
play through their 20s see their dating life reflected in state.

`rel_friendship_drifts` and `call_friend` together give friendship a
heartbeat, even if the granularity is "all friends at once."

---

## F. Recommendations

### F.1 Top 3 missing content categories

1. **Spouse-touch event batch (~8 events).** Highest impact / lowest cost.
   Mirror BitLife's spouse menu as event-driven beats:
   `rel_spouse_argument`, `rel_spouse_compliment`, `rel_spouse_gift`,
   `rel_spouse_busy_at_work`, `rel_spouse_in_laws_visit`,
   `rel_spouse_health_scare`, `rel_spouse_career_choice`,
   `rel_spouse_child_milestone` (gated `has 'child'`). Conservative weights
   (0.3-0.6) bring touches/married-year up to ~0.3-0.5.
2. **Father events (3-5 events).** Mirror existing mother content:
   `rel_father_dies` (mirror of `rel_parent_dies`), `rel_father_argument`
   (mirror of `rel_family_argument`), `rel_father_advice`,
   `rel_father_proud_moment`. Pure content addition — no engine changes.
3. **Adult-sibling and child events (4-6 events).** `rel_sibling_milestone`,
   `rel_sibling_borrows_money`, `rel_child_school_problem`,
   `rel_child_graduates`, `rel_child_moves_out`. Currently both types
   become inert after early gating.

### F.2 Top 3 systems gaps

1. **Per-instance targeting.** Add a way for events to address *one specific*
   relationship instance by id/baseId from a payload. E.g. an event picks
   "your closest friend" (highest `relationshipLevel`) and applies effects
   only to them. Without this, friend depth is capped at "homogeneous group."
2. **Relationship-level dynamics.** `relationshipLevel` is set on add and
   never adjusted. Add an `adjustRelationshipLevel` special so event outcomes
   can move it: anniversaries +5, arguments -8, gifts +3. Opens the door
   to level-conditional events ("your spouse hasn't trusted you in years").
3. **Engagement (fiance) chain.** Either ship the partner→fiance→spouse
   content (engagement events with a 1-3 year window) or remove the dead
   slot/special. The asymmetry is fine for now; it accumulates as dead code
   if left untouched.

### F.3 Prioritization

**First — pure content (highest ROI, no engine changes):**
1. Spouse-touch event batch (F.1.1)
2. Father events (F.1.2)
3. Adult-sibling and child events (F.1.3)
4. Divorce / re-marriage event (E.2.5) — needs only `divorceSpouse` and
   `breakUpPartner` specials, both already exist.

**Second — small engine extension:**
5. Per-instance targeting (F.2.1) — modest type changes to Effect/Condition
   shape; opens up dozens of content opportunities.

**Third — broader engine work:**
6. Relationship-level dynamics (F.2.2) and engagement window (F.2.3) — only
   worth doing once the content gap is closed and player feedback identifies
   the next bottleneck.

---

## Appendix — methodology

Source: [testing/agents/relationshipDepthAudit.ts](testing/agents/relationshipDepthAudit.ts). Tracks every relationship instance by stable `Person.id` across the full life of the run, including slot transitions (partner → casualEx, spouse → significantEx). Each instance retains its `instanceId` across slot moves, so a partner-displaced-to-casualEx is still the same tracked person.

A "touch" is recorded only when the firing event/activity has a condition that explicitly requires that instance's relationship type (e.g. `has 'spouse'`), OR when `family_time` runs (intrinsically family-targeted in narrative content). Untargeted relationship-themed events (`rel_first_date`, `rel_friend_wedding`, `rel_meet_old_friend`, `rel_blind_date`) are excluded from the touch model — they are formation/ambient events, not depth events on existing instances.

This is conservative. A real player's experience may include some implicit relationship reinforcement from outcome narratives that mention a partner/spouse without a hard condition gate, but those wouldn't show up in the metric. The numbers here are floors, not estimates.

### Reproduce

```bash
npx tsx testing/agents/relationshipDepthAudit.ts
```

Report writes to `testing/reports/relationship-depth-audit-YYYY-MM-DD.md`
(gitignored). The cured version of this audit lives in `docs/audits/`.
