import { ConditionChip } from './ConditionChip';
import { PetAvatar } from './PetAvatar';
import type { Pet } from './types';

interface PetRowProps {
  pet: Pet;
  onClick?: () => void;
}

function MiniBondBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1 w-full rounded-full bg-cream-dark overflow-hidden">
      <div
        className="h-full bg-section-heart"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * Single pet entry in the People + Pets surface. Mirrors the family /
 * friend row style but leads with PetAvatar (illustration, not initials)
 * and trails with a numeric bond + mini bar instead of the textual
 * "Bond X/100" line on people rows.
 */
export function PetRow({ pet, onClick }: PetRowProps) {
  const inner = (
    <div className="flex items-center gap-[10px] w-full">
      <PetAvatar species={pet.kind} color={pet.color} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-[6px]">
          <span className="font-medium text-[14px] text-ink leading-tight tracking-tight truncate">
            {pet.name}
          </span>
          <ConditionChip condition={pet.condition} />
        </div>
        <div className="font-mono text-[11px] text-ink-faint font-semibold uppercase tracking-[0.04em] mt-[2px]">
          {pet.breed} · {pet.age}y
        </div>
      </div>
      <div className="w-[60px] flex flex-col items-end gap-[3px] shrink-0">
        <span
          className="font-display font-bold text-[16px] text-ink leading-none tabular-nums tracking-tight"
          data-testid={`pet-bond-${pet.id}`}
        >
          {pet.bond}
        </span>
        <MiniBondBar value={pet.bond} />
      </div>
    </div>
  );

  if (!onClick) {
    return (
      <div
        data-testid={`pet-row-${pet.id}`}
        className="bg-cream-light border border-cream-dark rounded-2xl px-3 py-2 shadow-[0_2px_0_rgba(0,0,0,0.03)]"
      >
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`pet-row-${pet.id}`}
      className="text-left w-full bg-cream-light border border-cream-dark rounded-2xl px-3 py-2 shadow-[0_2px_0_rgba(0,0,0,0.03)] hover:bg-peach-light/40 transition active:scale-[0.99]"
    >
      {inner}
    </button>
  );
}
