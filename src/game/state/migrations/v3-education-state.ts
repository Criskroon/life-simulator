import type { ISCEDLevel } from '../../types/country';
import type {
  DiplomaRecord,
  EducationRecord,
  EducationState,
  PlayerState,
} from '../../types/gameState';

/**
 * v3 — education state structure (Sessie 2.2).
 *
 * Pre-2.2 saves carry only the flat `education: EducationRecord[]` list. The
 * 2.2 engine works off the richer `educationState` (status machine, running
 * GPA, diploma registry). This migration synthesises an `educationState`
 * from whatever the old list told us. The flat list is preserved unchanged
 * so legacy reads keep working — `educationState` is the authoritative
 * source going forward; `education` is a synced view for back-compat.
 *
 * The inference is conservative — we don't try to recover details we can't
 * verify (e.g. the precise yearOfStage), we just place the player in a
 * plausible state and let progression resume from there.
 */
export function migrateToV3(state: PlayerState): PlayerState {
  if (state.educationState) return state;

  const oldEducation: EducationRecord[] = state.education ?? [];
  const educationState = inferEducationState(oldEducation, state);

  return {
    ...state,
    educationState,
    education: oldEducation,
  };
}

export function needsV3Migration(state: PlayerState): boolean {
  return !state.educationState;
}

function inferEducationState(
  oldEducation: EducationRecord[],
  state: PlayerState,
): EducationState {
  const diplomas: DiplomaRecord[] = oldEducation
    .filter((e) => e.graduated)
    .map((e) => ({
      countryCode: state.country,
      stageId: levelToStageId(e.level),
      iscedLevel: levelToIsced(e.level),
      yearObtained: e.endYear ?? state.currentYear,
      ageObtained: state.age,
      finalGpa: clampGpa(e.gpa),
      graduated: true,
    }));

  const current = oldEducation.find((e) => !e.graduated);
  if (current) {
    return {
      status: 'enrolled',
      currentStageId: levelToStageId(current.level),
      yearOfStage: 1,
      currentGpa: clampGpa(current.gpa),
      diplomas,
    };
  }

  return {
    status: 'not_enrolled',
    currentStageId: null,
    yearOfStage: 0,
    currentGpa: 0,
    diplomas,
    dropOutReason: diplomas.length > 0 ? 'graduated' : 'never_enrolled',
  };
}

const LEVEL_TO_STAGE: Record<string, string> = {
  primary: 'basisschool',
  middle: 'vmbo',
  high_school: 'havo',
  community_college: 'mbo',
  university: 'wo_bachelor',
  graduate: 'wo_master',
};

function levelToStageId(level: string): string {
  return LEVEL_TO_STAGE[level] ?? 'basisschool';
}

const LEVEL_TO_ISCED: Record<string, ISCEDLevel> = {
  primary: 1,
  middle: 2,
  high_school: 3,
  community_college: 4,
  university: 6,
  graduate: 7,
};

function levelToIsced(level: string): ISCEDLevel {
  return LEVEL_TO_ISCED[level] ?? 1;
}

/**
 * Older saves stored GPA on a 0–100 percentage; the new system uses NL_10
 * (1.0–10.0). Squash anything ≥ 10 down to the NL scale and clamp at the
 * edges so a freshly migrated diploma renders sensibly.
 */
function clampGpa(gpa: number): number {
  if (!Number.isFinite(gpa)) return 6.0;
  if (gpa > 10) return Math.max(1, Math.min(10, gpa / 10));
  return Math.max(1, Math.min(10, gpa));
}
