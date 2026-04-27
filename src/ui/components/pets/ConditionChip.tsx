import type { PetCondition } from './types';

const MAP: Record<PetCondition, { label: string; bg: string; fg: string }> = {
  healthy: { label: 'Healthy', bg: '#dff0dc', fg: '#2f7a3a' },
  sick: { label: 'Sick', bg: '#fbd9d9', fg: '#a33' },
  old: { label: 'Old', bg: '#f1e1c8', fg: '#7a5a2a' },
  young: { label: 'Puppy', bg: '#fde2cc', fg: '#a8541a' },
};

/**
 * Small status chip shown next to a pet's name (in PetRow) or as a Health
 * card header annotation (in PetProfileModal). Sourced from kit5.jsx —
 * colors are slightly out-of-system on purpose so health states pop
 * against the warm cream surface without re-using brand accents.
 */
export function ConditionChip({ condition }: { condition: PetCondition }) {
  const m = MAP[condition];
  return (
    <span
      data-testid={`condition-chip-${condition}`}
      className="inline-block font-mono text-[10px] font-bold uppercase tracking-[0.04em] rounded-full px-[7px] py-[2px]"
      style={{ background: m.bg, color: m.fg }}
    >
      {m.label}
    </span>
  );
}
