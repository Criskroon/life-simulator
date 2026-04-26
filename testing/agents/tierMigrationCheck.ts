/**
 * Tier-system migration check. Builds five synthetic legacy saves, each
 * representing a known pre-tier shape (multi-partner residue, multi-spouse
 * residue, vacation-romance pile-up, minimal, full mix), runs them through
 * the persistence migration, and asserts the post-migration relationshipState
 * matches the user-visible expectations.
 *
 * Idempotency: each loaded save is round-tripped (saved again, loaded again)
 * to verify a second migration pass doesn't change anything.
 */
import { resolve } from 'node:path';
import {
  loadGame,
  saveGame,
  setStorageAdapter,
} from '../../src/game/state/persistence';
import { syncLegacyView } from '../../src/game/engine/relationshipEngine';
import { createMemoryStorageAdapter } from '../fixtures/memoryStorage';
import type {
  PlayerState,
  Relationship,
  RelationshipState,
} from '../../src/game/types/gameState';
import { REPORTS_DIR, relPath, writeReport } from '../lib/report';

const SAVE_KEY = 'reallifesim:save:v1';

function makeLegacyState(rels: Relationship[]): PlayerState {
  return {
    id: 'legacy',
    firstName: 'Test',
    lastName: 'Subject',
    age: 40,
    gender: 'female',
    country: 'NL',
    alive: true,
    birthYear: 1986,
    currentYear: 2026,
    stats: { health: 80, happiness: 70, smarts: 65, looks: 50 },
    money: 5000,
    job: null,
    education: [],
    relationships: rels,
    // legacy-shape — relationshipState left undefined to exercise migrate()
    relationshipState: undefined,
    assets: [],
    criminalRecord: [],
    history: [],
    triggeredEventIds: [],
    actionsRemainingThisYear: 3,
  };
}

function rel(
  id: string,
  type: Relationship['type'],
  firstName: string,
  age = 28,
): Relationship {
  return {
    id,
    type,
    firstName,
    lastName: 'Doe',
    age,
    alive: true,
    relationshipLevel: 60,
  };
}

interface Case {
  id: number;
  title: string;
  legacy: Relationship[];
  expect: (rs: RelationshipState) => string[]; // returns failure messages, empty = pass
}

const CASES: Case[] = [
  {
    id: 1,
    title: 'Save 1 — five partners, no spouse (E2 zombie residue)',
    legacy: [
      rel('rel-mother', 'mother', 'Mom', 60),
      rel('rel-father', 'father', 'Dad', 62),
      rel('rel-date-partner-y2050-n0', 'partner', 'P1'),
      rel('rel-date-partner-y2051-n1', 'partner', 'P2'),
      rel('rel-date-partner-y2052-n2', 'partner', 'P3'),
      rel('rel-date-partner-y2053-n3', 'partner', 'P4'),
      rel('rel-activity-partner-y2054-n4', 'partner', 'P5'),
    ],
    expect: (rs) => {
      const errs: string[] = [];
      if (rs.partner?.firstName !== 'P1') errs.push(`partner expected P1, got ${rs.partner?.firstName}`);
      if (rs.casualExes.length !== 4) errs.push(`expected 4 casualExes, got ${rs.casualExes.length}`);
      if (rs.spouse !== null) errs.push(`expected no spouse`);
      if (rs.family.length !== 2) errs.push(`expected 2 family members, got ${rs.family.length}`);
      return errs;
    },
  },
  {
    id: 2,
    title: 'Save 2 — two spouses + one partner (E1 + E2 residue)',
    legacy: [
      rel('rel-mother', 'mother', 'Mom', 60),
      rel('rel-spouse', 'spouse', 'S1', 30),
      rel('rel-spouse-2', 'spouse', 'S2', 32),
      rel('rel-activity-partner-y2050-n3', 'partner', 'PartnerPerson'),
    ],
    expect: (rs) => {
      const errs: string[] = [];
      if (rs.spouse?.firstName !== 'S1') errs.push(`expected spouse S1, got ${rs.spouse?.firstName}`);
      if (rs.significantExes.length !== 1) errs.push(`expected 1 significantEx (S2), got ${rs.significantExes.length}`);
      if (rs.significantExes[0]?.firstName !== 'S2') errs.push(`expected significantEx S2, got ${rs.significantExes[0]?.firstName}`);
      if (rs.partner?.firstName !== 'PartnerPerson') errs.push(`partner not preserved`);
      return errs;
    },
  },
  {
    id: 3,
    title: 'Save 3 — twelve vacation-romances (old accumulation)',
    legacy: Array.from({ length: 12 }, (_, i) =>
      rel(`rel-vacation-romance-y${2030 + i}-n${i}`, 'partner', `V${i + 1}`),
    ),
    expect: (rs) => {
      const errs: string[] = [];
      if (rs.partner?.firstName !== 'V1') errs.push(`first vacation seated as partner`);
      if (rs.casualExes.length !== 11) errs.push(`expected 11 casualExes, got ${rs.casualExes.length}`);
      // Slot model: legacy view should report exactly 1 partner + 11 casualEx = 12 total.
      const flat = syncLegacyView(rs);
      if (flat.length !== 12) errs.push(`flat view should still have 12 entries, got ${flat.length}`);
      return errs;
    },
  },
  {
    id: 4,
    title: 'Save 4 — minimal (just mother + father)',
    legacy: [
      rel('rel-mother', 'mother', 'M', 60),
      rel('rel-father', 'father', 'F', 62),
    ],
    expect: (rs) => {
      const errs: string[] = [];
      if (rs.family.length !== 2) errs.push(`expected 2 family, got ${rs.family.length}`);
      if (rs.partner !== null || rs.fiance !== null || rs.spouse !== null) {
        errs.push(`no romantic slot should be set`);
      }
      if (rs.friends.length || rs.casualExes.length || rs.significantExes.length) {
        errs.push(`no friend/ex lists should populate`);
      }
      return errs;
    },
  },
  {
    id: 5,
    title: 'Save 5 — full mix (every category represented)',
    legacy: [
      rel('rel-mother', 'mother', 'Mom', 60),
      rel('rel-father', 'father', 'Dad', 62),
      rel('rel-sibling', 'sibling', 'Sib', 25),
      rel('rel-child-1', 'child', 'Kid', 5),
      rel('rel-spouse', 'spouse', 'Sara', 30),
      rel('rel-gym-friend', 'friend', 'Gym', 28),
      rel('rel-library-friend', 'friend', 'Lib', 31),
      rel('rel-park-friend', 'friend', 'Park', 30),
    ],
    expect: (rs) => {
      const errs: string[] = [];
      if (rs.spouse?.firstName !== 'Sara') errs.push(`spouse not seated`);
      if (rs.family.length !== 4) errs.push(`expected 4 family (mom/dad/sib/kid), got ${rs.family.length}`);
      if (rs.friends.length !== 3) errs.push(`expected 3 friends, got ${rs.friends.length}`);
      return errs;
    },
  },
];

async function runCase(c: Case): Promise<{
  case: Case;
  initialResult: string[];
  idempotencyDiff: string | null;
}> {
  const adapter = createMemoryStorageAdapter();
  setStorageAdapter(adapter);
  const legacy = makeLegacyState(c.legacy);
  await adapter.set(SAVE_KEY, JSON.stringify(legacy));

  const loaded = await loadGame();
  if (!loaded) {
    return { case: c, initialResult: ['load returned null'], idempotencyDiff: null };
  }
  if (!loaded.relationshipState) {
    return { case: c, initialResult: ['relationshipState not populated post-migration'], idempotencyDiff: null };
  }
  const errs = c.expect(loaded.relationshipState);

  // Idempotency: save the migrated state, load it again, diff the
  // relationshipState. Any difference = migration is not stable.
  await saveGame(loaded);
  const reloaded = await loadGame();
  let idempotencyDiff: string | null = null;
  if (!reloaded || !reloaded.relationshipState) {
    idempotencyDiff = 'second load lost relationshipState';
  } else {
    const a = JSON.stringify(loaded.relationshipState);
    const b = JSON.stringify(reloaded.relationshipState);
    if (a !== b) {
      idempotencyDiff = `relationshipState differs across reloads (${a.length} vs ${b.length} chars)`;
    }
  }
  return { case: c, initialResult: errs, idempotencyDiff };
}

async function main(): Promise<void> {
  const lines: string[] = [];
  lines.push(`# Tier Migration Check — ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');
  lines.push(`Five synthetic legacy saves run through persistence.migrate(); each verified against expected post-migration shape, then saved + reloaded for idempotency.`);
  lines.push('');
  lines.push('## Results');
  lines.push('');
  lines.push('| # | Case | Initial migration | Idempotent? | Notes |');
  lines.push('|---:|---|---|---|---|');

  let allPass = true;
  for (const c of CASES) {
    const r = await runCase(c);
    const initOk = r.initialResult.length === 0;
    const idemOk = r.idempotencyDiff === null;
    if (!initOk || !idemOk) allPass = false;
    const initLabel = initOk ? '✅' : `❌ ${r.initialResult.join('; ')}`;
    const idemLabel = idemOk ? '✅' : `❌ ${r.idempotencyDiff}`;
    lines.push(`| ${c.id} | ${c.title} | ${initLabel} | ${idemLabel} | |`);
  }
  lines.push('');
  lines.push(`**Verdict:** ${allPass ? '✅ all 5 saves migrate cleanly and idempotently' : '❌ failures present — see above'}`);
  lines.push('');

  const path = resolve(REPORTS_DIR, 'tier-migration-2026-04-26.md');
  writeReport(path, lines.join('\n') + '\n');
  console.log(`Report: ${relPath(path)}`);
  console.log(allPass ? 'ALL PASS' : 'FAILURES PRESENT');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
