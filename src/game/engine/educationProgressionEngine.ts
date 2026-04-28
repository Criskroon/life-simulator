import { getCountry } from '../data/countries';
import type {
  Country,
  EducationStage,
  SpecializationField,
} from '../types/country';
import type {
  DiplomaRecord,
  EducationState,
  PlayerState,
} from '../types/gameState';
import { canEnterStage, getEducationStage } from './educationEngine';
import type { Rng } from './rng';

/**
 * Education progression engine. Pure functions that walk the player through
 * the education ladder one year at a time.
 *
 * Hooks into ageUp() in three places:
 *   1. ageUp checks `educationState.status === 'choosing_next'` and returns
 *      early — the UI must resolve the choice before the year can advance.
 *   2. After the age increment, ageUp calls `progressEducation` which
 *      auto-enrols at school-start age, advances enrolled players' year,
 *      or graduates them (and switches to choosing_next).
 *   3. UI calls `chooseNextStage` / `dropOut` / `reEnroll` to resolve a
 *      pending choice or reshape the state from outside ageUp.
 *
 * All randomness flows through the supplied `Rng` so tests stay
 * deterministic.
 */

/** Default empty education state — used when the field is missing. */
export function emptyEducationState(): EducationState {
  return {
    status: 'not_enrolled',
    currentStageId: null,
    yearOfStage: 0,
    currentGpa: 0,
    diplomas: [],
    dropOutReason: 'never_enrolled',
  };
}

/** Reads `educationState`, falling back to a fresh empty state. */
export function getEducationState(player: PlayerState): EducationState {
  return player.educationState ?? emptyEducationState();
}

/**
 * Apply a year of education progress. Called from ageUp() AFTER the age
 * increment so `player.age` already reflects the year just started.
 *
 * Three branches:
 *   - status === 'choosing_next': no-op (ageUp shouldn't even reach here)
 *   - status === 'not_enrolled' AND age === schoolStartAge AND
 *     dropOutReason === 'never_enrolled': auto-enroll in the first stage
 *   - status === 'enrolled': progress the year, graduate if duration met
 */
export function progressEducation(player: PlayerState, rng: Rng): PlayerState {
  const state = getEducationState(player);
  const country = getCountry(player.country);

  if (state.status === 'choosing_next') {
    return player;
  }

  if (
    state.status === 'not_enrolled' &&
    state.dropOutReason === 'never_enrolled' &&
    player.age === country.education.schoolStartAge
  ) {
    return autoEnrollInFirstStage(player, country, state);
  }

  if (state.status === 'enrolled' && state.currentStageId) {
    return progressEnrolledYear(player, country, state, rng);
  }

  return player;
}

function autoEnrollInFirstStage(
  player: PlayerState,
  country: Country,
  state: EducationState,
): PlayerState {
  const firstStage = country.education.stages.find(
    (s) =>
      s.ageStart === country.education.schoolStartAge &&
      s.prerequisites.length === 0,
  );
  if (!firstStage) return player;

  return {
    ...player,
    educationState: {
      ...state,
      status: 'enrolled',
      currentStageId: firstStage.id,
      yearOfStage: 1,
      currentGpa: 0,
      currentSpecialization: undefined,
      dropOutReason: undefined,
    },
  };
}

function progressEnrolledYear(
  player: PlayerState,
  country: Country,
  state: EducationState,
  rng: Rng,
): PlayerState {
  const stage = getEducationStage(country, state.currentStageId!);
  if (!stage) return player;

  const yearGpa = calculateYearlyGpa(player.stats.smarts, player.stats.happiness, rng);
  const completedYears = state.yearOfStage; // years already counted in running average
  const runningGpa =
    completedYears === 0
      ? yearGpa
      : (state.currentGpa * completedYears + yearGpa) / (completedYears + 1);
  const newYearOfStage = state.yearOfStage + 1;

  if (newYearOfStage > stage.duration) {
    return graduateFromStage(player, country, stage, runningGpa, state);
  }

  return {
    ...player,
    educationState: {
      ...state,
      yearOfStage: newYearOfStage,
      currentGpa: runningGpa,
    },
  };
}

function graduateFromStage(
  player: PlayerState,
  country: Country,
  stage: EducationStage,
  finalGpa: number,
  state: EducationState,
): PlayerState {
  const diploma: DiplomaRecord = {
    countryCode: player.country,
    stageId: stage.id,
    iscedLevel: stage.iscedLevel,
    iscedSubTrack: stage.iscedSubTrack,
    specialization: state.currentSpecialization,
    yearObtained: player.currentYear,
    ageObtained: player.age,
    finalGpa,
    graduated: true,
  };

  const completedStageIds = [
    ...state.diplomas.filter((d) => d.graduated).map((d) => d.stageId),
    stage.id,
  ];
  const availableNext = stage.nextStages.filter((nextId) =>
    canEnterStage(country, nextId, completedStageIds, player.stats.smarts),
  );

  // No path forward — final stage on the ladder, or smarts gates everything
  // out. Drop the player into a graduated, not-enrolled state.
  if (availableNext.length === 0) {
    return {
      ...player,
      educationState: {
        ...state,
        status: 'not_enrolled',
        currentStageId: null,
        yearOfStage: 0,
        currentGpa: 0,
        currentSpecialization: undefined,
        diplomas: [...state.diplomas, diploma],
        availableNextStages: undefined,
        teacherAdvice: undefined,
        dropOutReason: 'graduated',
      },
    };
  }

  return {
    ...player,
    educationState: {
      ...state,
      status: 'choosing_next',
      currentStageId: stage.id,
      yearOfStage: 0,
      currentGpa: finalGpa,
      currentSpecialization: undefined,
      diplomas: [...state.diplomas, diploma],
      availableNextStages: availableNext,
      teacherAdvice: getTeacherAdvice(finalGpa, stage),
      dropOutReason: undefined,
    },
  };
}

/**
 * Yearly GPA on the NL_10 scale (1.0 — 10.0).
 *   - smarts 40 → 5.0, smarts 100 → 9.0 (linear)
 *   - happiness modifier ±0.5 around 50
 *   - random variance ±0.75
 *
 * Smarts is clamped at 40 on the low end so a baby with 0 smarts doesn't
 * collapse the curve; below 40 maps to the same 5.0 floor.
 */
export function calculateYearlyGpa(
  smarts: number,
  happiness: number,
  rng: Rng,
): number {
  const baseFromSmarts = 5.0 + (Math.max(40, smarts) - 40) / 60 * 4;
  const happinessModifier = (happiness - 50) / 100;
  const variance = (rng.next() - 0.5) * 1.5;
  return Math.max(1.0, Math.min(10.0, baseFromSmarts + happinessModifier + variance));
}

/**
 * Teacher's recommendation after basisschool. Higher GPA points the player
 * at VWO, mid-band at HAVO, lower at VMBO. Empty string for non-basisschool
 * stages — the field is just an extra hint for the player, not gameplay.
 */
export function getTeacherAdvice(gpa: number, currentStage: EducationStage): string {
  if (currentStage.id !== 'basisschool') return '';
  if (gpa >= 8.0) return 'vwo';
  if (gpa >= 7.0) return 'havo';
  return 'vmbo';
}

/**
 * Player resolves a `choosing_next` decision by enrolling in `stageId`.
 * Optional `specialization` is only persisted when the target stage actually
 * has specialisations.
 */
export function chooseNextStage(
  player: PlayerState,
  stageId: string,
  specialization?: SpecializationField,
): PlayerState {
  const state = getEducationState(player);
  if (state.status !== 'choosing_next') return player;

  const country = getCountry(player.country);
  const stage = getEducationStage(country, stageId);
  if (!stage) return player;
  if (!state.availableNextStages?.includes(stageId)) return player;

  return {
    ...player,
    educationState: {
      ...state,
      status: 'enrolled',
      currentStageId: stageId,
      yearOfStage: 1,
      currentGpa: 0,
      currentSpecialization: stage.hasSpecialization ? specialization : undefined,
      availableNextStages: undefined,
      teacherAdvice: undefined,
      dropOutReason: undefined,
    },
  };
}

/**
 * Player drops out — works from `enrolled` (mid-stage drop-out, no diploma)
 * and `choosing_next` (graduated this stage but declines the next one). In
 * both cases the resulting state is `not_enrolled` with reason
 * `dropped_out`. From `not_enrolled` already, this is a no-op.
 */
export function dropOut(player: PlayerState): PlayerState {
  const state = getEducationState(player);
  if (state.status === 'not_enrolled') return player;

  return {
    ...player,
    educationState: {
      ...state,
      status: 'not_enrolled',
      currentStageId: null,
      yearOfStage: 0,
      currentGpa: 0,
      currentSpecialization: undefined,
      availableNextStages: undefined,
      teacherAdvice: undefined,
      dropOutReason: 'dropped_out',
    },
  };
}

/**
 * Player re-enrols in a chosen stage from the `not_enrolled` state. UI is
 * responsible for offering only stages that pass `canEnterStage`; this
 * helper still validates so a stale UI can't slip through.
 */
export function reEnroll(
  player: PlayerState,
  stageId: string,
  specialization?: SpecializationField,
): PlayerState {
  const state = getEducationState(player);
  if (state.status !== 'not_enrolled') return player;

  const country = getCountry(player.country);
  const stage = getEducationStage(country, stageId);
  if (!stage) return player;

  const completedStageIds = state.diplomas
    .filter((d) => d.graduated)
    .map((d) => d.stageId);
  if (!canEnterStage(country, stageId, completedStageIds, player.stats.smarts)) {
    return player;
  }

  return {
    ...player,
    educationState: {
      ...state,
      status: 'enrolled',
      currentStageId: stageId,
      yearOfStage: 1,
      currentGpa: 0,
      currentSpecialization: stage.hasSpecialization ? specialization : undefined,
      availableNextStages: undefined,
      teacherAdvice: undefined,
      dropOutReason: undefined,
    },
  };
}
