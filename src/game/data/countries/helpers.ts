import type {
  Country,
  EducationStage,
  Job,
  City,
} from './schema';

/**
 * Helper functions for Country data lookups. Game systems should use these
 * instead of reaching into COUNTRIES directly.
 */

// =============================================================================
// EDUCATION HELPERS
// =============================================================================

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

// =============================================================================
// CAREER HELPERS
// =============================================================================

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

// =============================================================================
// CITY HELPERS
// =============================================================================

export function getCity(country: Country, cityId: string): City | undefined {
  return country.cities.find((c) => c.id === cityId);
}

export function getCapital(country: Country): City | undefined {
  return country.cities.find((c) => c.isCapital);
}

// =============================================================================
// NAME HELPERS
// =============================================================================

export type Gender = 'male' | 'female';

export function getRandomFirstName(country: Country, gender: Gender): string {
  const names =
    gender === 'male'
      ? country.names.firstNamesMale
      : country.names.firstNamesFemale;
  return names[Math.floor(Math.random() * names.length)] ?? 'Unknown';
}

export function getRandomLastName(country: Country): string {
  const names = country.names.lastNames;
  return names[Math.floor(Math.random() * names.length)] ?? 'Unknown';
}

export function getRandomFullName(country: Country, gender: Gender): string {
  const first = getRandomFirstName(country, gender);
  const last = getRandomLastName(country);

  if (country.culture.nameOrder === 'last_first') {
    return `${last} ${first}`;
  }
  return `${first} ${last}`;
}

/**
 * Pick an age-appropriate first name. Splits the names list into 5 buckets
 * by birth-decade. Assumes the source list is sorted modern → classic
 * (as in nl.ts). Falls back to random for short lists.
 */
export function getNameByAge(
  country: Country,
  age: number,
  gender: Gender,
): string {
  const names =
    gender === 'male'
      ? country.names.firstNamesMale
      : country.names.firstNamesFemale;

  const total = names.length;
  if (total === 0) return 'Unknown';
  if (total < 5) {
    return names[Math.floor(Math.random() * total)] ?? 'Unknown';
  }

  const bucketSize = Math.floor(total / 5);
  let startIdx: number;
  let endIdx: number;

  if (age <= 18) {
    startIdx = 0;
    endIdx = bucketSize;
  } else if (age <= 40) {
    startIdx = bucketSize;
    endIdx = bucketSize * 2;
  } else if (age <= 60) {
    startIdx = bucketSize * 2;
    endIdx = bucketSize * 3;
  } else if (age <= 75) {
    startIdx = bucketSize * 3;
    endIdx = bucketSize * 4;
  } else {
    startIdx = bucketSize * 4;
    endIdx = total;
  }

  const slice = names.slice(startIdx, endIdx);
  if (slice.length === 0) {
    return names[Math.floor(Math.random() * total)] ?? 'Unknown';
  }
  return slice[Math.floor(Math.random() * slice.length)] ?? 'Unknown';
}

// =============================================================================
// CURRENCY HELPERS
// =============================================================================

export function formatMoney(country: Country, amount: number): string {
  const { symbol } = country.currency;

  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return `${symbol}${formatted}`;
}
