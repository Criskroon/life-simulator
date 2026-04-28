import { getEducationStage } from '../../../game/engine/educationEngine';
import type { Country, SpecializationField } from '../../../game/types/country';

/**
 * Display helpers for the education UI. Centralised so cards, modals, and
 * history rows agree on labels — the engine works in technical IDs
 * ('basisschool', 'computer_science'), the UI uses the local name.
 */

const SPECIALIZATION_LABELS: Record<SpecializationField, string> = {
  general: 'General',
  computer_science: 'Computer Science',
  engineering: 'Engineering',
  science: 'Science',
  social_sciences: 'Social Sciences',
  humanities: 'Humanities',
  health: 'Health',
  medicine: 'Medicine',
  economics: 'Economics',
  business: 'Business',
  law: 'Law',
  agriculture: 'Agriculture',
  creative: 'Creative',
  education: 'Education',
};

export function formatSpecialization(spec: SpecializationField): string {
  return SPECIALIZATION_LABELS[spec];
}

export function stageDisplayName(
  stageId: string | null | undefined,
  country: Country,
): string {
  if (!stageId) return '—';
  const stage = getEducationStage(country, stageId);
  return stage?.nameLocal ?? stage?.name ?? stageId;
}
