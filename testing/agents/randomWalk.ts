/**
 * Random-walk life simulator. Plays one full life with completely random
 * choices (event choice + activity pick), as if a player were blind-clicking,
 * and emits a readable narrative report.
 *
 * Generates 5 lives covering a spread of countries and lifespans.
 *
 * Output: testing/reports/random-walk-life-{N}.md, one per scenario.
 */
import { ALL_EVENTS } from '../../src/game/data/events';
import { ALL_ACTIVITIES } from '../../src/game/data/activities';
import { ageUp, endYear, resolveEvent } from '../../src/game/engine/gameLoop';
import {
  executeActivity,
  getAvailableActivities,
} from '../../src/game/engine/activityEngine';
import { createRng, type Rng } from '../../src/game/engine/rng';
import { setStorageAdapter } from '../../src/game/state/persistence';
import { createNewLife } from '../../src/game/state/newLife';
import { createMemoryStorageAdapter } from '../fixtures/memoryStorage';
import type { GameEvent } from '../../src/game/types/events';
import type { PlayerState, Relationship, Stats } from '../../src/game/types/gameState';
import { renderTemplate } from '../../src/game/engine/templates';
import { resolveChoice } from '../../src/game/engine/outcomeResolver';
import { REPORTS_DIR, relPath, writeReport } from '../lib/report';
import { resolve } from 'node:path';

setStorageAdapter(createMemoryStorageAdapter());

interface YearLogEntry {
  age: number;
  year: number;
  eventNarratives: string[];
  activityNarratives: string[];
  statsAtEndOfYear: Stats;
  moneyAtEndOfYear: number;
  jobTitle: string | null;
  weirdMoments: string[];
}

interface RandomWalkResult {
  finalState: PlayerState;
  yearLog: YearLogEntry[];
  scenarioName: string;
  weirdMoments: string[];
}

interface Scenario {
  name: string;
  countryId: string;
  seed: number;
  /** Optional max age cap to bias toward shorter/longer lives. */
  maxAge?: number;
}

const SCENARIOS: Scenario[] = [
  { name: 'NL-young-death', countryId: 'NL', seed: 1001, maxAge: 50 },
  { name: 'NL-average', countryId: 'NL', seed: 2002, maxAge: 80 },
  { name: 'US-old-age', countryId: 'US', seed: 3003, maxAge: 100 },
  { name: 'GB-mixed', countryId: 'GB', seed: 4004 },
  { name: 'NL-random-2', countryId: 'NL', seed: 5005 },
];

function diff(prev: Stats, next: Stats): string[] {
  const parts: string[] = [];
  for (const k of ['health', 'happiness', 'smarts', 'looks'] as const) {
    if (prev[k] !== next[k]) {
      const sign = next[k] > prev[k] ? '+' : '';
      parts.push(`${k} ${sign}${next[k] - prev[k]}`);
    }
  }
  return parts;
}

function moneyDiff(prev: number, next: number): string | null {
  if (prev === next) return null;
  const sign = next > prev ? '+' : '';
  return `money ${sign}${(next - prev).toLocaleString()}`;
}

function relSummary(rels: Relationship[]): string {
  if (rels.length === 0) return '(no relationships)';
  return rels.map((r) => `${r.firstName} ${r.lastName} (${r.type}, age ${r.age}, level ${r.relationshipLevel})`).join('; ');
}

function fmtRels(rels: Relationship[]): string[] {
  return rels.map((r) => {
    const status = r.alive ? '' : ' [deceased]';
    return `- ${r.firstName} ${r.lastName} — ${r.type}, age ${r.age}, lvl ${r.relationshipLevel}${status}`;
  });
}

/** Detect a few suspicious patterns in a single year and return them as strings. */
function detectWeirdMoments(
  prevState: PlayerState,
  nextState: PlayerState,
  eventNarratives: string[],
  activityNarratives: string[],
): string[] {
  const moments: string[] = [];
  // Stat saturation pop: stat at 100 stays at 100 even after a "negative" event
  for (const k of ['health', 'happiness', 'smarts', 'looks'] as const) {
    if (prevState.stats[k] === 100 && nextState.stats[k] === 100 && eventNarratives.length > 0) {
      // not necessarily weird — only flag if narrative implied a hit
      const narrativeText = eventNarratives.join(' ').toLowerCase();
      if (narrativeText.includes('illness') || narrativeText.includes('sick') || narrativeText.includes('hospital') || narrativeText.includes('accident')) {
        moments.push(`${k} stayed at 100 despite negative event`);
      }
    }
  }
  // Negative money where unexpected
  if (prevState.money >= 0 && nextState.money < 0 && nextState.money < -1000) {
    moments.push(`money went negative: ${nextState.money}`);
  }
  // Two same-type relationship events in same year
  if (eventNarratives.length >= 4) {
    moments.push(`${eventNarratives.length} events in a single year — flooded`);
  }
  // Multiple spouses (clear bug)
  const spouses = nextState.relationships.filter((r) => r.type === 'spouse');
  if (spouses.length > 1) {
    moments.push(`${spouses.length} spouses in state simultaneously: ${spouses.map((s) => `${s.firstName} ${s.lastName}`).join(', ')}`);
  }
  // Both partner and spouse
  const partners = nextState.relationships.filter((r) => r.type === 'partner');
  if (spouses.length > 0 && partners.length > 0 && eventNarratives.length > 0) {
    // Only flag this on the year a marriage event ran (so we know an old partner wasn't cleared)
    const narrativeText = eventNarratives.join(' ').toLowerCase();
    if (narrativeText.includes('marri') || narrativeText.includes('propos') || narrativeText.includes('wedding') || narrativeText.includes('spouse')) {
      moments.push(`married event fired but ${partners.length} partner record(s) lingering: ${partners.map((p) => `${p.firstName} ${p.lastName}`).join(', ')}`);
    }
  }
  // NaN
  for (const k of ['health', 'happiness', 'smarts', 'looks'] as const) {
    if (Number.isNaN(nextState.stats[k])) {
      moments.push(`NaN in stats.${k}`);
    }
  }
  if (Number.isNaN(nextState.money)) moments.push('NaN in money');
  // Birth-year/age inconsistency
  if (nextState.currentYear - nextState.birthYear !== nextState.age) {
    moments.push(`age (${nextState.age}) ≠ currentYear (${nextState.currentYear}) - birthYear (${nextState.birthYear})`);
  }
  return moments;
}

function runRandomLife(scenario: Scenario): RandomWalkResult {
  const rng = createRng(scenario.seed);
  let state = createNewLife(rng, { countryId: scenario.countryId });
  const yearLog: YearLogEntry[] = [];
  const allWeirdMoments: string[] = [];
  const maxAge = scenario.maxAge ?? 130;

  while (state.alive && state.age < maxAge) {
    const prevState = state;
    const ageResult = ageUp(state, ALL_EVENTS, rng);
    state = ageResult.state;
    const budgetThisYear = state.actionsRemainingThisYear;

    const eventNarratives: string[] = [];
    const activityNarratives: string[] = [];

    for (const event of ageResult.pendingEvents) {
      const idx = rng.int(0, event.choices.length - 1);
      const safeIdx = Math.min(Math.max(0, idx), event.choices.length - 1);
      const choice = event.choices[safeIdx];
      const before = state;
      const result = resolveEvent(state, event, safeIdx, rng);
      state = result.state;
      const renderedTitle = renderTemplate(event.title, state);
      const renderedDesc = renderTemplate(event.description, state);
      const choiceLabel = choice?.label ?? '(no label)';
      const narrative = result.resolved.narrative ?? '';
      const statShift = diff(before.stats, state.stats);
      const moneyShift = moneyDiff(before.money, state.money);
      const shifts = [...statShift, ...(moneyShift ? [moneyShift] : [])];
      const shiftStr = shifts.length > 0 ? ` [${shifts.join(', ')}]` : '';
      const narrPart = narrative ? ` — ${narrative}` : '';
      eventNarratives.push(`**${renderedTitle}**: ${renderedDesc} → chose "${choiceLabel}"${narrPart}${shiftStr}`);
      if (!state.alive) break;
    }

    if (!state.alive) break;

    // Random-walk activities: 50% chance to engage, then pick fully random
    if (rng.next() < 0.5) {
      let safety = 0;
      while (state.actionsRemainingThisYear > 0 && safety < 10) {
        safety++;
        const available = getAvailableActivities(state).filter((a) => {
          if (state.actionsRemainingThisYear < a.actionCost) return false;
          if (a.cost && a.cost < 0 && state.money + a.cost < -1000) return false;
          return true;
        });
        if (available.length === 0) break;
        const pick = available[rng.int(0, available.length - 1)]!;
        const before = state;
        const result = executeActivity(state, pick.id, rng);
        if (!result.ok) break;
        state = result.state;
        const statShift = diff(before.stats, state.stats);
        const moneyShift = moneyDiff(before.money, state.money);
        const shifts = [...statShift, ...(moneyShift ? [moneyShift] : [])];
        const shiftStr = shifts.length > 0 ? ` [${shifts.join(', ')}]` : '';
        const narrative = result.outcomeNarrative ?? '(no narrative)';
        activityNarratives.push(`*${pick.label}* → ${narrative}${shiftStr}`);
      }
    }

    state = endYear(state, rng);

    const weirdMoments = detectWeirdMoments(prevState, state, eventNarratives, activityNarratives);
    if (weirdMoments.length > 0) {
      for (const m of weirdMoments) allWeirdMoments.push(`Age ${state.age}: ${m}`);
    }

    yearLog.push({
      age: state.age,
      year: state.currentYear,
      eventNarratives,
      activityNarratives,
      statsAtEndOfYear: { ...state.stats },
      moneyAtEndOfYear: state.money,
      jobTitle: state.job?.title ?? null,
      weirdMoments,
    });
  }

  return {
    finalState: state,
    yearLog,
    scenarioName: scenario.name,
    weirdMoments: allWeirdMoments,
  };
}

function buildReport(result: RandomWalkResult): string {
  const lines: string[] = [];
  const s = result.finalState;
  lines.push(`# Random-walk life — ${result.scenarioName}`);
  lines.push('');
  lines.push(`**${s.firstName} ${s.lastName}** | ${s.country} | born ${s.birthYear}, died ${s.currentYear} at age ${s.age} | cause: ${s.causeOfDeath ?? '(still alive at cap)'}`);
  lines.push('');

  lines.push('## Final stats');
  lines.push('');
  lines.push(`- Health: ${s.stats.health}`);
  lines.push(`- Happiness: ${s.stats.happiness}`);
  lines.push(`- Smarts: ${s.stats.smarts}`);
  lines.push(`- Looks: ${s.stats.looks}`);
  lines.push(`- Money: ${s.money.toLocaleString()}`);
  lines.push(`- Job: ${s.job?.title ?? 'none'}`);
  lines.push('');

  lines.push('## Final relationships');
  lines.push('');
  for (const line of fmtRels(s.relationships)) lines.push(line);
  if (s.relationships.length === 0) lines.push('_None_');
  lines.push('');

  lines.push('## Education');
  lines.push('');
  if (s.education.length === 0) {
    lines.push('_None_');
  } else {
    for (const e of s.education) {
      lines.push(`- ${e.level} (${e.institutionName}): ${e.startYear}–${e.endYear ?? '?'}, GPA ${e.gpa.toFixed(2)}, ${e.graduated ? '✓ graduated' : '✗ did not graduate'}`);
    }
  }
  lines.push('');

  if (result.weirdMoments.length > 0) {
    lines.push('## ⚠ Weird moments');
    lines.push('');
    lines.push('Suspicious patterns detected during the simulation:');
    lines.push('');
    for (const m of result.weirdMoments) lines.push(`- ${m}`);
    lines.push('');
  }

  lines.push('## Year-by-year story');
  lines.push('');
  for (const yr of result.yearLog) {
    if (yr.eventNarratives.length === 0 && yr.activityNarratives.length === 0) continue;
    lines.push(`### Age ${yr.age} (${yr.year})`);
    lines.push('');
    if (yr.eventNarratives.length > 0) {
      lines.push('**Events:**');
      for (const n of yr.eventNarratives) lines.push(`- ${n}`);
      lines.push('');
    }
    if (yr.activityNarratives.length > 0) {
      lines.push('**Activities:**');
      for (const n of yr.activityNarratives) lines.push(`- ${n}`);
      lines.push('');
    }
    if (yr.weirdMoments.length > 0) {
      lines.push('**Weird:**');
      for (const m of yr.weirdMoments) lines.push(`- ⚠ ${m}`);
      lines.push('');
    }
    lines.push(`*End of year — H${yr.statsAtEndOfYear.health} Hp${yr.statsAtEndOfYear.happiness} S${yr.statsAtEndOfYear.smarts} L${yr.statsAtEndOfYear.looks} | money ${yr.moneyAtEndOfYear.toLocaleString()}${yr.jobTitle ? ` | job: ${yr.jobTitle}` : ''}*`);
    lines.push('');
  }

  return lines.join('\n');
}

async function main() {
  console.log(`Random-walk simulator — ${SCENARIOS.length} lives`);
  let allWeirdCount = 0;

  for (let i = 0; i < SCENARIOS.length; i++) {
    const scenario = SCENARIOS[i]!;
    console.log(`\n[${i + 1}/${SCENARIOS.length}] ${scenario.name} — country=${scenario.countryId}, seed=${scenario.seed}, maxAge=${scenario.maxAge ?? '∞'}`);
    const result = runRandomLife(scenario);
    const md = buildReport(result);
    const outPath = resolve(REPORTS_DIR, `random-walk-life-${i + 1}.md`);
    const written = writeReport(outPath, md);
    console.log(`  ${result.finalState.firstName} ${result.finalState.lastName}, age ${result.finalState.age}, ${result.weirdMoments.length} weird moments`);
    console.log(`  Report: ${relPath(written)}`);
    allWeirdCount += result.weirdMoments.length;
  }

  console.log(`\nTotal weird moments across ${SCENARIOS.length} lives: ${allWeirdCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
