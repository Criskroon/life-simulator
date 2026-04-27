import { useEffect } from 'react';
import { useComingSoon } from './ComingSoonHandler';
import { BondTierMeter } from './pets/BondTierMeter';
import { ConditionChip } from './pets/ConditionChip';
import { PetAvatar } from './pets/PetAvatar';
import type { Pet } from './pets/types';

interface PetProfileModalProps {
  pet: Pet;
  onClose: () => void;
}

interface PetActionSpec {
  id: string;
  label: string;
  detail: string;
  /** Money cost in dollars (positive number — UI prefixes with "−$"). */
  money?: number;
  /** Action-point cost. Defaults to 1. */
  apCost?: number;
  /** Tailwind class for the leading accent square's background. Pulled
   *  from the existing Sunny Side `section.*` / `brass` / `danger`
   *  palette — no new tokens needed. */
  accentClass: string;
  disabled?: boolean;
  disabledReason?: string;
}

const PET_ACTIONS: PetActionSpec[] = [
  {
    id: 'long-walk',
    label: 'Long walk',
    detail: '+Bond, +Health',
    accentClass: 'bg-section-body',
  },
  {
    id: 'bring-treat',
    label: 'Bring a treat',
    detail: '+Bond',
    money: 20,
    accentClass: 'bg-brass',
  },
  {
    id: 'vet-checkup',
    label: 'Vet checkup',
    detail: 'Annual — overdue by 1y',
    money: 180,
    accentClass: 'bg-section-mind',
  },
  {
    id: 'photo',
    label: 'Take a photo together',
    detail: 'A quiet moment to keep',
    accentClass: 'bg-section-heart',
  },
  {
    id: 'rehome',
    label: 'Rehome',
    detail: 'Hard choice. Saved when their needs exceed yours.',
    accentClass: 'bg-danger',
    disabled: true,
    disabledReason: 'Unlocked when Bond < 30 or your circumstances change',
  },
];

/**
 * Full-screen pet profile sheet. Mirrors the layout/cadence of
 * RelationshipProfileModal so the two surfaces feel like the same family:
 * header → bond hero → health card → action list → bottom strip → close.
 *
 * TODO(engine): every action button currently routes through
 * useComingSoon(). When the engine grows pet actions, swap the body of
 * `handleAction` for a dispatch through gameStore (mirror
 * executeRelationshipAction).
 */
export function PetProfileModal({ pet, onClose }: PetProfileModalProps) {
  const { showComingSoon } = useComingSoon();

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const handleAction = (action: PetActionSpec) => {
    if (action.disabled) return;
    showComingSoon(`${action.label} — ${pet.name}`, 'Pet actions wire up in 1.5b.');
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pet-profile-title"
      data-testid="pet-profile-modal"
    >
      <div className="w-full max-w-phone bg-cream-light rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-[14px]">
          <div
            className="rounded-full p-[3px] bg-gradient-to-br from-brass to-coral"
          >
            <div className="bg-cream rounded-full p-[2px]">
              <PetAvatar species={pet.kind} color={pet.color} size={68} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id="pet-profile-title"
              className="font-display font-bold text-[24px] leading-[1.05] tracking-[-0.02em] text-ink truncate"
            >
              {pet.name}
            </h3>
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft mt-1 truncate">
              {pet.breed} · {pet.age}y · adopted '
              {String(pet.adoptedYear).slice(-2)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            data-testid="pet-profile-close"
            className="bg-transparent border-none p-[6px] cursor-pointer text-ink-faint hover:text-ink transition"
          >
            <CloseGlyph />
          </button>
        </div>

        <div className="overflow-y-auto flex flex-col">
          {/* Bond hero */}
          <div className="px-5 pb-[14px]">
            <Card>
              <div className="flex justify-between items-baseline">
                <Eyebrow>Bond</Eyebrow>
                <span className="font-display font-extrabold text-[28px] text-ink leading-none tabular-nums tracking-[-0.02em]">
                  {pet.bond}
                </span>
              </div>
              <div className="mt-2">
                <BondTierMeter value={pet.bond} />
              </div>
              {pet.vignette && (
                <div className="mt-[10px] text-[12px] text-ink-soft leading-[1.45] italic">
                  &ldquo;{pet.vignette}&rdquo;
                </div>
              )}
            </Card>
          </div>

          {/* Health card */}
          <div className="px-5 pb-[14px]">
            <Card>
              <div className="flex items-center justify-between mb-2">
                <Eyebrow>Health</Eyebrow>
                <ConditionChip condition={pet.condition} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <HealthStat label="Vigor" value={String(pet.vigor)} />
                <HealthStat
                  label="Est. Left"
                  value={`~${pet.estLifeLeft}y`}
                  bordered
                />
                <HealthStat label="Last Vet" value={pet.lastVet} />
              </div>
            </Card>
          </div>

          {/* Actions */}
          <div className="px-5 pb-[14px]">
            <div className="flex items-baseline gap-2 mb-2 px-1">
              <span className="font-display text-[16px] font-bold text-ink tracking-[-0.015em]">
                With {pet.name}
              </span>
              <span className="font-mono text-[10px] text-ink-faint font-medium tracking-[0.04em]">
                this year
              </span>
            </div>
            <div className="flex flex-col gap-[6px]">
              {PET_ACTIONS.map((action) => (
                <PetActionRow
                  key={action.id}
                  action={action}
                  onPick={() => handleAction(action)}
                />
              ))}
            </div>
          </div>

          {/* Story strip */}
          <div className="px-5 pb-4 pt-1">
            <button
              type="button"
              onClick={() =>
                showComingSoon(
                  `${pet.name}'s milestones`,
                  'Pet history view wires up later.',
                )
              }
              className="w-full bg-cream border border-cream-dark rounded-2xl px-3 py-[10px] flex items-center gap-[10px] hover:bg-peach-light/40 transition cursor-pointer text-left"
            >
              <RibbonGlyph />
              <div className="flex-1 text-[12px] text-ink leading-[1.4]">
                {pet.age} years together
                {pet.milestonesRecorded != null &&
                  ` · ${pet.milestonesRecorded} milestones recorded`}
              </div>
              <ChevronRightGlyph />
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 pt-2 border-t border-cream-dark">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-3 transition active:scale-[0.99] font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-cream border border-cream-dark rounded-[18px] px-[14px] py-3 shadow-[0_3px_0_rgba(0,0,0,0.04)]">
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[11px] font-extrabold uppercase tracking-[0.1em] text-ink-soft">
      {children}
    </span>
  );
}

function HealthStat({
  label,
  value,
  bordered = false,
}: {
  label: string;
  value: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={`text-center ${
        bordered
          ? 'border-l border-r border-dashed border-cream-dark'
          : ''
      }`}
    >
      <div className="font-display font-bold text-[18px] text-ink tabular-nums">
        {value}
      </div>
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.06em] text-ink-faint mt-[1px]">
        {label}
      </div>
    </div>
  );
}

function PetActionRow({
  action,
  onPick,
}: {
  action: PetActionSpec;
  onPick: () => void;
}) {
  const apCost = action.apCost ?? 1;
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={action.disabled}
      className="text-left w-full bg-cream border border-cream-dark rounded-[14px] px-3 py-[10px] flex items-center gap-[10px] shadow-[0_2px_0_rgba(0,0,0,0.03)] disabled:opacity-55 disabled:cursor-not-allowed enabled:hover:bg-peach-light/40 enabled:active:scale-[0.99] transition"
    >
      <span
        aria-hidden="true"
        className={`w-8 h-8 rounded-[10px] border border-ink shrink-0 ${action.accentClass}`}
        style={{ boxShadow: '0 1.5px 0 rgba(0,0,0,0.08)' }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[13px] text-ink tracking-[-0.01em]">
          {action.label}
        </div>
        <div className="text-[11px] text-ink-soft mt-[1px] leading-[1.3]">
          {action.disabled ? action.disabledReason : action.detail}
        </div>
      </div>
      <div className="flex flex-col items-end gap-[3px] shrink-0">
        {action.money != null && (
          <span className="font-mono text-[11px] font-bold text-coral tabular-nums">
            −${action.money}
          </span>
        )}
        <span className="flex gap-[2px]">
          {Array.from({ length: apCost }).map((_, i) => (
            <span
              key={i}
              className="w-[7px] h-[7px] rounded-full bg-coral inline-block"
            />
          ))}
        </span>
      </div>
    </button>
  );
}

function CloseGlyph() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6 L18 18 M18 6 L6 18"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

function RibbonGlyph() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-coral shrink-0"
      aria-hidden="true"
    >
      <path d="M8 4 H16 L17 9 L12 13 L7 9 Z" />
      <path d="M9 13 L7 21 L12 18 L17 21 L15 13" />
    </svg>
  );
}

function ChevronRightGlyph() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-ink-faint shrink-0"
      aria-hidden="true"
    >
      <path d="M9 6 L15 12 L9 18" />
    </svg>
  );
}
