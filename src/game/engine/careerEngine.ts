import type { Country, Job } from '../types/country';

/**
 * Career engine — pure helpers for resolving jobs and access checks.
 *
 * Sessie 2.3 will add job offers, promotions, and tenure logic on top of
 * this; for now these are read-only helpers that the consolidation tests
 * exercise.
 */

export function getJob(country: Country, jobId: string): Job | undefined {
  return country.career.jobs.find((j) => j.id === jobId);
}

export function getJobsForEducation(
  country: Country,
  completedStageIds: string[],
): Job[] {
  return country.career.jobs.filter((job) =>
    job.educationRequired.some((req) => completedStageIds.includes(req)),
  );
}

export function getJobsForCategory(
  country: Country,
  category: Job['category'],
): Job[] {
  return country.career.jobs.filter((j) => j.category === category);
}

export interface JobAccessCheck {
  age: number;
  smarts: number;
  looks?: number;
  completedEducationStageIds: string[];
}

export function canAccessJob(job: Job, player: JobAccessCheck): boolean {
  if (player.age < job.ageRange.min || player.age > job.ageRange.max) {
    return false;
  }

  const hasEducation = job.educationRequired.some((req) =>
    player.completedEducationStageIds.includes(req),
  );
  if (!hasEducation) return false;

  if (job.prerequisites) {
    if (
      job.prerequisites.minSmarts !== undefined &&
      player.smarts < job.prerequisites.minSmarts
    ) {
      return false;
    }
    if (
      job.prerequisites.minLooks !== undefined &&
      player.looks !== undefined &&
      player.looks < job.prerequisites.minLooks
    ) {
      return false;
    }
    if (
      job.prerequisites.minAge !== undefined &&
      player.age < job.prerequisites.minAge
    ) {
      return false;
    }
  }

  return true;
}
