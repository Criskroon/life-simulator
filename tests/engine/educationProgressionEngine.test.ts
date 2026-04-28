import { describe, expect, it } from 'vitest';
import {
  calculateYearlyGpa,
  chooseNextStage,
  dropOut,
  emptyEducationState,
  getEducationState,
  getTeacherAdvice,
  progressEducation,
  reEnroll,
} from '../../src/game/engine/educationProgressionEngine';
import { ageUp } from '../../src/game/engine/gameLoop';
import { createRng } from '../../src/game/engine/rng';
import { migrateToV3 } from '../../src/game/state/migrations/v3-education-state';
import type { CountryCode, ISCEDLevel } from '../../src/game/types/country';
import type {
  EducationState,
  PlayerState,
  RelationshipState,
} from '../../src/game/types/gameState';
import { getCountry } from '../../src/game/data/countries';

const emptyRel: RelationshipState = {
  partner: null,
  fiance: null,
  spouse: null,
  family: [],
  friends: [],
  significantExes: [],
  casualExes: [],
};

interface FixtureOptions {
  age?: number;
  smarts?: number;
  happiness?: number;
  country?: CountryCode;
  educationState?: Partial<EducationState>;
}

function buildPlayer(opts: FixtureOptions = {}): PlayerState {
  const educationState: EducationState = {
    ...emptyEducationState(),
    ...opts.educationState,
  };
  return {
    id: 'test',
    firstName: 'Test',
    lastName: 'User',
    age: opts.age ?? 0,
    gender: 'female',
    country: opts.country ?? 'NL',
    alive: true,
    birthYear: 2000,
    currentYear: 2000 + (opts.age ?? 0),
    stats: {
      health: 80,
      happiness: opts.happiness ?? 70,
      smarts: opts.smarts ?? 60,
      looks: 50,
    },
    money: 0,
    job: null,
    education: [],
    educationState,
    relationships: [],
    relationshipState: emptyRel,
    assets: [],
    criminalRecord: [],
    history: [],
    triggeredEventIds: [],
    actionsRemainingThisYear: 3,
  };
}

/**
 * Drive a player from `age` until either they reach `untilAge` or status
 * stops being `enrolled`. Each tick uses the supplied `rng`. Used by the
 * "graduate basisschool at age 12" path.
 */
function runEnrolledUntil(
  player: PlayerState,
  rng: ReturnType<typeof createRng>,
  untilAge: number,
): PlayerState {
  let p = player;
  while (p.age < untilAge && getEducationState(p).status === 'enrolled') {
    const result = ageUp(p, [], rng);
    p = result.state;
  }
  return p;
}

describe('Education Progression Engine — auto-enroll', () => {
  it('enrolls NL player in basisschool when ageUp lands them on age 4', () => {
    const player = buildPlayer({ age: 3, country: 'NL' });
    const result = ageUp(player, [], createRng(1));
    const state = getEducationState(result.state);
    expect(state.status).toBe('enrolled');
    expect(state.currentStageId).toBe('basisschool');
    expect(state.yearOfStage).toBe(1);
  });

  it('does not auto-enroll a 5-year-old who never enrolled (window already closed)', () => {
    const player = buildPlayer({ age: 4, country: 'NL' });
    // age increments to 5 — past the schoolStartAge gate
    const result = ageUp(player, [], createRng(1));
    const state = getEducationState(result.state);
    expect(state.status).toBe('not_enrolled');
  });

  it('skips auto-enroll if dropOutReason is dropped_out', () => {
    const player = buildPlayer({
      age: 3,
      country: 'NL',
      educationState: { dropOutReason: 'dropped_out' },
    });
    const result = ageUp(player, [], createRng(1));
    expect(getEducationState(result.state).status).toBe('not_enrolled');
  });

  it('no-ops in countries with no education stages (GB)', () => {
    const player = buildPlayer({ age: 3, country: 'GB' });
    const result = ageUp(player, [], createRng(1));
    const state = getEducationState(result.state);
    expect(state.status).toBe('not_enrolled');
    expect(state.currentStageId).toBeNull();
  });

  it('does not auto-enroll a graduated player even at school start age', () => {
    // Hypothetical reincarnation guard — diplomas means we already played.
    const player = buildPlayer({
      age: 3,
      country: 'NL',
      educationState: {
        dropOutReason: 'graduated',
        diplomas: [
          {
            countryCode: 'NL',
            stageId: 'basisschool',
            iscedLevel: 1 as ISCEDLevel,
            yearObtained: 2000,
            ageObtained: 12,
            finalGpa: 7.5,
            graduated: true,
          },
        ],
      },
    });
    const result = ageUp(player, [], createRng(1));
    expect(getEducationState(result.state).status).toBe('not_enrolled');
  });
});

describe('Education Progression Engine — yearly progression', () => {
  it('increments yearOfStage on each ageUp while enrolled', () => {
    const player = buildPlayer({
      age: 4,
      country: 'NL',
      educationState: {
        status: 'enrolled',
        currentStageId: 'basisschool',
        yearOfStage: 1,
        currentGpa: 7,
      },
    });
    const result = ageUp(player, [], createRng(7));
    const state = getEducationState(result.state);
    expect(state.yearOfStage).toBe(2);
    expect(state.status).toBe('enrolled');
  });

  it('updates running GPA based on smarts', () => {
    const dumb = progressEducation(
      buildPlayer({
        age: 5,
        smarts: 40,
        happiness: 50,
        educationState: {
          status: 'enrolled',
          currentStageId: 'basisschool',
          yearOfStage: 1,
          currentGpa: 0,
        },
      }),
      createRng(2),
    );
    const smart = progressEducation(
      buildPlayer({
        age: 5,
        smarts: 100,
        happiness: 50,
        educationState: {
          status: 'enrolled',
          currentStageId: 'basisschool',
          yearOfStage: 1,
          currentGpa: 0,
        },
      }),
      createRng(2),
    );
    expect(getEducationState(smart).currentGpa).toBeGreaterThan(
      getEducationState(dumb).currentGpa,
    );
  });

  it('GPA stays clamped to 1.0 — 10.0', () => {
    for (let seed = 0; seed < 25; seed++) {
      const result = progressEducation(
        buildPlayer({
          age: 5,
          smarts: 100,
          happiness: 100,
          educationState: {
            status: 'enrolled',
            currentStageId: 'basisschool',
            yearOfStage: 1,
            currentGpa: 0,
          },
        }),
        createRng(seed),
      );
      const gpa = getEducationState(result).currentGpa;
      expect(gpa).toBeGreaterThanOrEqual(1.0);
      expect(gpa).toBeLessThanOrEqual(10.0);
    }
  });

  it('calculateYearlyGpa is deterministic for a given seed', () => {
    const a = calculateYearlyGpa(70, 60, createRng(42));
    const b = calculateYearlyGpa(70, 60, createRng(42));
    expect(a).toBe(b);
  });
});

describe('Education Progression Engine — stage completion', () => {
  it('graduates basisschool after 8 ageUps from year 1', () => {
    const player = buildPlayer({
      age: 4,
      country: 'NL',
      smarts: 80,
      educationState: {
        status: 'enrolled',
        currentStageId: 'basisschool',
        yearOfStage: 1,
        currentGpa: 0,
      },
    });
    // ages 4 → 12: that's 8 ageUps; the 8th completes the stage
    const final = runEnrolledUntil(player, createRng(123), 13);
    const state = getEducationState(final);
    expect(state.status).toBe('choosing_next');
    expect(final.age).toBe(12);
  });

  it('records a diploma on graduation', () => {
    const player = buildPlayer({
      age: 4,
      country: 'NL',
      smarts: 75,
      educationState: {
        status: 'enrolled',
        currentStageId: 'basisschool',
        yearOfStage: 1,
        currentGpa: 0,
      },
    });
    const final = runEnrolledUntil(player, createRng(7), 13);
    const state = getEducationState(final);
    expect(state.diplomas).toHaveLength(1);
    expect(state.diplomas[0]?.stageId).toBe('basisschool');
    expect(state.diplomas[0]?.graduated).toBe(true);
    expect(state.diplomas[0]?.iscedLevel).toBe(1);
  });

  it('high smarts (≥70) opens VWO in availableNextStages', () => {
    const player = buildPlayer({
      age: 4,
      country: 'NL',
      smarts: 85,
      educationState: {
        status: 'enrolled',
        currentStageId: 'basisschool',
        yearOfStage: 1,
        currentGpa: 0,
      },
    });
    const final = runEnrolledUntil(player, createRng(11), 13);
    const state = getEducationState(final);
    expect(state.availableNextStages).toContain('vwo');
    expect(state.availableNextStages).toContain('havo');
    expect(state.availableNextStages).toContain('vmbo');
  });

  it('low smarts (<50) gates VWO and HAVO out', () => {
    const player = buildPlayer({
      age: 4,
      country: 'NL',
      smarts: 35,
      educationState: {
        status: 'enrolled',
        currentStageId: 'basisschool',
        yearOfStage: 1,
        currentGpa: 0,
      },
    });
    const final = runEnrolledUntil(player, createRng(13), 13);
    const state = getEducationState(final);
    expect(state.availableNextStages).not.toContain('vwo');
    expect(state.availableNextStages).not.toContain('havo');
    expect(state.availableNextStages).toContain('vmbo');
  });

  it('teacher advice tracks GPA: vmbo / havo / vwo', () => {
    const stage = getCountry('NL').education.stages.find(
      (s) => s.id === 'basisschool',
    )!;
    expect(getTeacherAdvice(5.5, stage)).toBe('vmbo');
    expect(getTeacherAdvice(7.2, stage)).toBe('havo');
    expect(getTeacherAdvice(8.5, stage)).toBe('vwo');
  });

  it('teacher advice is empty for non-basisschool stages', () => {
    const stage = getCountry('NL').education.stages.find((s) => s.id === 'havo')!;
    expect(getTeacherAdvice(8.5, stage)).toBe('');
  });

  it('PhD has no nextStages so graduation drops to not_enrolled, not choosing_next', () => {
    const player = buildPlayer({
      age: 23,
      country: 'NL',
      smarts: 95,
      educationState: {
        status: 'enrolled',
        currentStageId: 'phd',
        yearOfStage: 4,
        currentGpa: 8,
      },
    });
    const result = ageUp(player, [], createRng(1));
    const state = getEducationState(result.state);
    expect(state.status).toBe('not_enrolled');
    expect(state.dropOutReason).toBe('graduated');
    expect(state.diplomas.at(-1)?.stageId).toBe('phd');
  });
});

describe('Education Progression Engine — chooseNextStage', () => {
  it('transitions choosing_next → enrolled for an offered stage', () => {
    const player = buildPlayer({
      age: 12,
      country: 'NL',
      smarts: 80,
      educationState: {
        status: 'choosing_next',
        currentStageId: 'basisschool',
        yearOfStage: 0,
        currentGpa: 8,
        availableNextStages: ['vmbo', 'havo', 'vwo'],
      },
    });
    const next = chooseNextStage(player, 'vwo');
    const state = getEducationState(next);
    expect(state.status).toBe('enrolled');
    expect(state.currentStageId).toBe('vwo');
    expect(state.yearOfStage).toBe(1);
    expect(state.availableNextStages).toBeUndefined();
  });

  it('persists specialization for stages that have hasSpecialization', () => {
    const player = buildPlayer({
      age: 12,
      country: 'NL',
      smarts: 80,
      educationState: {
        status: 'choosing_next',
        currentStageId: 'basisschool',
        yearOfStage: 0,
        currentGpa: 8,
        availableNextStages: ['vmbo', 'havo', 'vwo'],
      },
    });
    const next = chooseNextStage(player, 'havo', 'science');
    expect(getEducationState(next).currentSpecialization).toBe('science');
  });

  it('rejects stages not in availableNextStages', () => {
    const player = buildPlayer({
      age: 12,
      country: 'NL',
      educationState: {
        status: 'choosing_next',
        currentStageId: 'basisschool',
        yearOfStage: 0,
        currentGpa: 6,
        availableNextStages: ['vmbo'],
      },
    });
    const next = chooseNextStage(player, 'vwo');
    // unchanged
    expect(getEducationState(next).status).toBe('choosing_next');
    expect(getEducationState(next).currentStageId).toBe('basisschool');
  });

  it('no-ops if status is not choosing_next', () => {
    const player = buildPlayer({
      age: 4,
      educationState: {
        status: 'enrolled',
        currentStageId: 'basisschool',
        yearOfStage: 1,
        currentGpa: 0,
      },
    });
    const next = chooseNextStage(player, 'vwo');
    expect(next).toEqual(player);
  });
});

describe('Education Progression Engine — dropOut', () => {
  it('transitions enrolled → not_enrolled with reason dropped_out', () => {
    const player = buildPlayer({
      age: 14,
      educationState: {
        status: 'enrolled',
        currentStageId: 'havo',
        yearOfStage: 2,
        currentGpa: 7,
        diplomas: [],
      },
    });
    const next = dropOut(player);
    const state = getEducationState(next);
    expect(state.status).toBe('not_enrolled');
    expect(state.dropOutReason).toBe('dropped_out');
    expect(state.currentStageId).toBeNull();
  });

  it('preserves diplomas through drop out', () => {
    const player = buildPlayer({
      age: 16,
      educationState: {
        status: 'enrolled',
        currentStageId: 'havo',
        yearOfStage: 4,
        currentGpa: 7,
        diplomas: [
          {
            countryCode: 'NL',
            stageId: 'basisschool',
            iscedLevel: 1 as ISCEDLevel,
            yearObtained: 2010,
            ageObtained: 12,
            finalGpa: 7.0,
            graduated: true,
          },
        ],
      },
    });
    const next = dropOut(player);
    expect(getEducationState(next).diplomas).toHaveLength(1);
    expect(getEducationState(next).diplomas[0]?.stageId).toBe('basisschool');
  });

  it('drop out from choosing_next also works', () => {
    const player = buildPlayer({
      age: 12,
      educationState: {
        status: 'choosing_next',
        currentStageId: 'basisschool',
        yearOfStage: 0,
        currentGpa: 6,
        availableNextStages: ['vmbo'],
      },
    });
    const next = dropOut(player);
    expect(getEducationState(next).status).toBe('not_enrolled');
    expect(getEducationState(next).availableNextStages).toBeUndefined();
  });
});

describe('Education Progression Engine — reEnroll', () => {
  it('re-enrolls in MBO from not_enrolled with VMBO diploma', () => {
    const player = buildPlayer({
      age: 17,
      smarts: 60,
      educationState: {
        status: 'not_enrolled',
        currentStageId: null,
        yearOfStage: 0,
        currentGpa: 0,
        dropOutReason: 'graduated',
        diplomas: [
          {
            countryCode: 'NL',
            stageId: 'basisschool',
            iscedLevel: 1 as ISCEDLevel,
            yearObtained: 2008,
            ageObtained: 12,
            finalGpa: 6.5,
            graduated: true,
          },
          {
            countryCode: 'NL',
            stageId: 'vmbo',
            iscedLevel: 2 as ISCEDLevel,
            yearObtained: 2012,
            ageObtained: 16,
            finalGpa: 7.0,
            graduated: true,
          },
        ],
      },
    });
    const next = reEnroll(player, 'mbo', 'engineering');
    const state = getEducationState(next);
    expect(state.status).toBe('enrolled');
    expect(state.currentStageId).toBe('mbo');
    expect(state.currentSpecialization).toBe('engineering');
  });

  it('rejects stages whose prereqs are missing', () => {
    const player = buildPlayer({
      age: 18,
      smarts: 80,
      educationState: {
        status: 'not_enrolled',
        currentStageId: null,
        yearOfStage: 0,
        currentGpa: 0,
        dropOutReason: 'never_enrolled',
        diplomas: [],
      },
    });
    // no diplomas — can't enrol in WO bachelor
    const next = reEnroll(player, 'wo_bachelor', 'science');
    expect(next).toEqual(player);
  });

  it('no-ops when currently enrolled', () => {
    const player = buildPlayer({
      age: 4,
      educationState: {
        status: 'enrolled',
        currentStageId: 'basisschool',
        yearOfStage: 1,
        currentGpa: 0,
      },
    });
    expect(reEnroll(player, 'havo')).toEqual(player);
  });
});

describe('Education Progression Engine — ageUp blocking', () => {
  it('ageUp returns unchanged state while choosing_next', () => {
    const player = buildPlayer({
      age: 12,
      educationState: {
        status: 'choosing_next',
        currentStageId: 'basisschool',
        yearOfStage: 0,
        currentGpa: 7,
        availableNextStages: ['vmbo', 'havo'],
      },
    });
    const result = ageUp(player, [], createRng(1));
    expect(result.state).toBe(player);
    expect(result.pendingEvents).toHaveLength(0);
  });

  it('after chooseNextStage, ageUp can resume', () => {
    const player = buildPlayer({
      age: 12,
      smarts: 65,
      educationState: {
        status: 'choosing_next',
        currentStageId: 'basisschool',
        yearOfStage: 0,
        currentGpa: 7,
        availableNextStages: ['vmbo', 'havo'],
      },
    });
    const chosen = chooseNextStage(player, 'havo');
    const result = ageUp(chosen, [], createRng(1));
    expect(result.state.age).toBe(13);
    expect(getEducationState(result.state).status).toBe('enrolled');
    expect(getEducationState(result.state).yearOfStage).toBe(2);
  });
});

describe('Education Progression Engine — v3 migration', () => {
  it('synthesises an enrolled state from a current EducationRecord', () => {
    const player: PlayerState = {
      ...buildPlayer({ age: 10, country: 'NL' }),
      educationState: undefined,
      education: [
        {
          level: 'primary',
          institutionName: 'Test School',
          startYear: 2000,
          endYear: null,
          graduated: false,
          gpa: 7.2,
        },
      ],
    };
    const migrated = migrateToV3(player);
    expect(migrated.educationState?.status).toBe('enrolled');
    expect(migrated.educationState?.currentStageId).toBe('basisschool');
    expect(migrated.educationState?.currentGpa).toBeCloseTo(7.2, 1);
  });

  it('builds diplomas from graduated EducationRecords', () => {
    const player: PlayerState = {
      ...buildPlayer({ age: 13, country: 'NL', educationState: undefined }),
      educationState: undefined,
      education: [
        {
          level: 'primary',
          institutionName: 'Test School',
          startYear: 2000,
          endYear: 2012,
          graduated: true,
          gpa: 7.5,
        },
      ],
    };
    const migrated = migrateToV3(player);
    expect(migrated.educationState?.diplomas).toHaveLength(1);
    expect(migrated.educationState?.diplomas[0]?.stageId).toBe('basisschool');
    expect(migrated.educationState?.diplomas[0]?.graduated).toBe(true);
  });

  it('skips migration if educationState already exists', () => {
    const player = buildPlayer({
      age: 5,
      educationState: {
        status: 'enrolled',
        currentStageId: 'basisschool',
        yearOfStage: 2,
        currentGpa: 6,
      },
    });
    const migrated = migrateToV3(player);
    expect(migrated).toBe(player);
  });

  it('falls back to not_enrolled with never_enrolled when education is empty', () => {
    const player: PlayerState = {
      ...buildPlayer({ age: 1 }),
      educationState: undefined,
      education: [],
    };
    const migrated = migrateToV3(player);
    expect(migrated.educationState?.status).toBe('not_enrolled');
    expect(migrated.educationState?.dropOutReason).toBe('never_enrolled');
  });

  it('squashes legacy 0-100 GPA scale down to NL_10', () => {
    const player: PlayerState = {
      ...buildPlayer({ age: 13, country: 'NL', educationState: undefined }),
      educationState: undefined,
      education: [
        {
          level: 'primary',
          institutionName: 'Test School',
          startYear: 2000,
          endYear: 2012,
          graduated: true,
          gpa: 75, // legacy percentage
        },
      ],
    };
    const migrated = migrateToV3(player);
    expect(migrated.educationState?.diplomas[0]?.finalGpa).toBeCloseTo(7.5, 1);
  });
});

describe('Education Progression Engine — full birth-to-graduation flow', () => {
  it('an NL player auto-enrolls and graduates basisschool by age 12', () => {
    const player = buildPlayer({
      age: 3,
      country: 'NL',
      smarts: 75,
    });
    const rng = createRng(99);
    let p = player;
    while (p.age < 12 && getEducationState(p).status !== 'choosing_next') {
      p = ageUp(p, [], rng).state;
    }
    expect(p.age).toBe(12);
    const state = getEducationState(p);
    expect(state.status).toBe('choosing_next');
    expect(state.diplomas).toHaveLength(1);
    expect(state.diplomas[0]?.stageId).toBe('basisschool');
    // Pick a stage and continue — confirms the flow keeps working
    const continued = ageUp(chooseNextStage(p, 'havo'), [], rng).state;
    expect(continued.age).toBe(13);
    expect(getEducationState(continued).currentStageId).toBe('havo');
  });
});
