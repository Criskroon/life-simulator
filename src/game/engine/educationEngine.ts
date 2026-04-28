import type { Country, EducationStage } from '../types/country';

/**
 * Education engine — pure helpers for resolving education stages and
 * checking whether a player can enter a stage.
 *
 * Sessie 2.2 will add the yearly progression logic on top of this; for now
 * these are read-only helpers that the consolidation tests exercise.
 */

export function getEducationStage(
  country: Country,
  stageId: string,
): EducationStage | undefined {
  return country.education.stages.find((s) => s.id === stageId);
}

export function getNextStages(
  country: Country,
  currentStageId: string,
): EducationStage[] {
  const current = getEducationStage(country, currentStageId);
  if (!current) return [];
  return current.nextStages
    .map((id) => getEducationStage(country, id))
    .filter((s): s is EducationStage => s !== undefined);
}

export function canEnterStage(
  country: Country,
  stageId: string,
  completedStageIds: string[],
  smarts: number,
): boolean {
  const stage = getEducationStage(country, stageId);
  if (!stage) return false;

  const hasPrereqs = stage.prerequisites.every((p) =>
    completedStageIds.includes(p),
  );
  if (!hasPrereqs) return false;

  if (stage.requirements?.minSmarts && smarts < stage.requirements.minSmarts) {
    return false;
  }

  return true;
}
