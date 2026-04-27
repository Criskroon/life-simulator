import { useEffect } from 'react';
import { getChoicePreview } from '../../game/engine/choicePreview';
import { getActionsFor } from '../../game/engine/interactions';
import type {
  CasualEx,
  Fiance,
  Partner,
  Person,
  PlayerState,
  RelationshipType,
  SignificantEx,
  Spouse,
} from '../../game/types/gameState';
import type {
  ActionDisabledReason,
  AvailableAction,
} from '../../game/types/interactions';
import { HumanAvatar } from './people/HumanAvatar';
import { RelationshipBondMeter } from './people/RelationshipBondMeter';
import {
  ACCENT_CLASS_FOR_FLAVOR,
  eyebrowLabelOf,
  flavorOf,
  isBigTicketAction,
  readVignette,
} from './people/types';

interface RelationshipProfileModalProps {
  player: PlayerState;
  target: Person;
  targetType: RelationshipType;
  onAction: (actionId: string) => void;
  onClose: () => void;
}

const DISABLED_LABELS: Record<ActionDisabledReason, string> = {
  insufficient_actions: 'No actions left this year',
  insufficient_money: 'Not enough money',
  condition_failed: 'Not yet available',
  deceased: 'Deceased',
  on_cooldown: 'Already this year',
};

const FORMER_SLOT_LABELS: Record<'partner' | 'fiance' | 'spouse', string> = {
  partner: 'partner',
  fiance: 'fiancé(e)',
  spouse: 'spouse',
};

/**
 * Per-type extra metadata shown next to age in the profile header. Pure
 * derivation — exported so unit tests can pin the strings without standing
 * up the React tree. Logic preserved verbatim from the pre-1.5b version.
 */
export function getRelationshipMetaLabel(
  target: Person,
  targetType: RelationshipType,
  currentYear: number,
): string | null {
  const yearsFromMet = Math.max(0, currentYear - (target.metYear ?? currentYear));
  switch (targetType) {
    case 'partner':
    case 'fiance': {
      const years = (target as Partner | Fiance).yearsTogether ?? yearsFromMet;
      return `together ${years}y`;
    }
    case 'spouse': {
      const years = (target as Spouse).yearsTogether ?? yearsFromMet;
      return `married ${years}y`;
    }
    case 'friend': {
      return `Friends since ${target.metYear ?? currentYear}`;
    }
    case 'casualEx': {
      const ex = target as CasualEx;
      return `Former ${FORMER_SLOT_LABELS[ex.formerSlot]} · Fades ${ex.decayYear}`;
    }
    case 'significantEx': {
      const ex = target as SignificantEx;
      return `Former ${FORMER_SLOT_LABELS[ex.formerSlot]}`;
    }
    case 'father':
    case 'mother':
    case 'sibling':
    case 'child':
      return null;
  }
}

/**
 * Fullscreen profile for one Person. Re-skinned in 1.5b to match
 * PetProfileModal's Sunny Side vocabulary: cream sheet, gradient avatar
 * ring, bond hero with type-aware tier meter, accent-square action rows.
 *
 * Engine wiring is unchanged from the pre-1.5b version: `getActionsFor`
 * + `getChoicePreview` + the `enabled`/`disabledReason` semantics, plus
 * the exported `getRelationshipMetaLabel` helper, all preserved verbatim.
 */
export function RelationshipProfileModal({
  player,
  target,
  targetType,
  onAction,
  onClose,
}: RelationshipProfileModalProps) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const actions = getActionsFor(target, targetType, player);
  const fullName = `${target.firstName} ${target.lastName}`.trim() || 'Unknown';
  const eyebrow = eyebrowLabelOf(target, targetType);
  const metaLabel = getRelationshipMetaLabel(target, targetType, player.currentYear);
  const flavor = flavorOf(targetType);
  const vignette = readVignette(target);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="relationship-profile-title"
      data-testid="relationship-profile-modal"
    >
      <div className="w-full max-w-phone bg-cream-light rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-[14px]">
          <HumanAvatar
            firstName={target.firstName}
            lastName={target.lastName}
            size={72}
            ringed
          />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[11px] font-extrabold uppercase tracking-[0.1em] text-ink-soft mb-[2px]">
              <RenderEyebrow label={eyebrow} />
            </div>
            <h3
              id="relationship-profile-title"
              className="font-display font-bold text-[24px] leading-[1.05] tracking-[-0.02em] text-ink truncate"
            >
              {fullName}
            </h3>
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft mt-1 truncate">
              Age {target.age}
              {metaLabel && ` · ${metaLabel}`}
              {!target.alive && ' · Deceased'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            data-testid="relationship-profile-close"
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
                <span
                  className="font-display font-extrabold text-[28px] text-ink leading-none tabular-nums tracking-[-0.02em]"
                  data-testid="relationship-bond-value"
                >
                  {target.relationshipLevel}
                </span>
              </div>
              <div className="mt-2">
                <RelationshipBondMeter
                  value={target.relationshipLevel}
                  type={targetType}
                />
              </div>
              {vignette && (
                <div className="mt-[10px] text-[12px] text-ink-soft leading-[1.45] italic">
                  &ldquo;{vignette}&rdquo;
                </div>
              )}
            </Card>
          </div>

          {/* Actions */}
          <div className="px-5 pb-[14px]">
            <div className="flex items-baseline gap-2 mb-2 px-1">
              <span className="font-display text-[16px] font-bold text-ink tracking-[-0.015em]">
                With {target.firstName}
              </span>
              <span className="font-mono text-[10px] text-ink-faint font-medium tracking-[0.04em]">
                this year
              </span>
            </div>
            {actions.length === 0 ? (
              <div className="bg-cream-light border border-cream-dark border-dashed rounded-2xl px-3 py-3 text-[12px] text-ink-faint italic text-center">
                More actions coming soon.
              </div>
            ) : (
              <div className="flex flex-col gap-[6px]">
                {actions.map((entry) => (
                  <ActionRow
                    key={entry.action.id}
                    entry={entry}
                    player={player}
                    flavor={flavor}
                    onPick={onAction}
                  />
                ))}
              </div>
            )}
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

/**
 * Splits the trailing heart on romantic eyebrows so the symbol can be
 * tinted with `text-section-heart` while the rest of the label stays
 * `text-ink-soft`. Pure presentation — no logic depends on this split.
 */
function RenderEyebrow({ label }: { label: string }) {
  if (label.endsWith('♡')) {
    const head = label.slice(0, -1).trimEnd();
    return (
      <span>
        {head}
        <span className="text-section-heart ml-[2px]">♡</span>
      </span>
    );
  }
  return <span>{label}</span>;
}

interface ActionRowProps {
  entry: AvailableAction;
  player: PlayerState;
  flavor: ReturnType<typeof flavorOf>;
  onPick: (actionId: string) => void;
}

function ActionRow({ entry, player, flavor, onPick }: ActionRowProps) {
  const { action, enabled, disabledReason } = entry;
  const preview = getChoicePreview(
    { label: action.label, cost: action.cost },
    player,
  );
  const apCost =
    action.tier === 'big' ? (action.actionCost ?? 1) : (action.actionCost ?? 0);

  const accentClass = !enabled
    ? 'bg-cream-dark'
    : isBigTicketAction(action)
      ? 'bg-coral'
      : ACCENT_CLASS_FOR_FLAVOR[flavor];

  // costLabel comes from getChoicePreview — already country-adjusted and
  // formatted (e.g. "−€194", "+€2,000"). We only re-color it to match
  // the Sunny Side tone (coral for spends, success for gains).
  const costLabel = preview.costLabel;
  const costPositive =
    preview.adjustedCost !== null && preview.adjustedCost > 0;

  return (
    <button
      type="button"
      onClick={() => enabled && onPick(action.id)}
      disabled={!enabled}
      data-testid={`relationship-action-${action.id}`}
      className="text-left w-full bg-cream border border-cream-dark rounded-[14px] px-3 py-[10px] flex items-center gap-[10px] shadow-[0_2px_0_rgba(0,0,0,0.03)] disabled:opacity-55 disabled:cursor-not-allowed enabled:hover:bg-peach-light/40 enabled:active:scale-[0.99] transition"
    >
      <span
        aria-hidden="true"
        className={`w-8 h-8 rounded-[10px] border border-ink shrink-0 ${accentClass}`}
        style={{ boxShadow: '0 1.5px 0 rgba(0,0,0,0.08)' }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[13px] text-ink tracking-[-0.01em] truncate">
          {action.label}
        </div>
        <div className="text-[11px] text-ink-soft mt-[1px] leading-[1.3]">
          {!enabled && disabledReason
            ? DISABLED_LABELS[disabledReason]
            : (action.description ?? '\u00A0')}
        </div>
      </div>
      <div className="flex flex-col items-end gap-[3px] shrink-0">
        {costLabel && (
          // If `text-success` isn't generated by Tailwind, swap to
          // `text-emerald-600` (the pre-1.5b value). See HANDOFF.md
          // “Verify on integration”.
          <span
            className={`font-mono text-[11px] font-bold tabular-nums ${
              costPositive ? 'text-success' : 'text-coral'
            }`}
          >
            {costLabel}
          </span>
        )}
        <ApCostIndicator cost={apCost} tier={action.tier} />
      </div>
    </button>
  );
}

/**
 * AP cost indicator. Visually distinguishes the three tiers we care about:
 *   - light + 0 AP → single hollow ring ("Free")
 *   - big + N AP   → N filled coral dots
 *   - light + N AP → N filled coral dots (rare; engine treats as big-ish)
 *
 * The hollow-vs-filled distinction lets a player skim a list and tell at
 * a glance which actions cost from their yearly action budget.
 */
function ApCostIndicator({
  cost,
  tier,
}: {
  cost: number;
  tier: 'big' | 'light';
}) {
  if (cost === 0 && tier === 'light') {
    return (
      <span
        aria-label="Free"
        className="w-[7px] h-[7px] rounded-full border border-coral inline-block"
      />
    );
  }
  return (
    <span
      aria-label={`${cost} action${cost === 1 ? '' : 's'}`}
      className="flex gap-[2px]"
    >
      {Array.from({ length: Math.max(1, cost) }).map((_, i) => (
        <span
          key={i}
          className="w-[7px] h-[7px] rounded-full bg-coral inline-block"
        />
      ))}
    </span>
  );
}

/* ── Local primitives ─────────────────────────────────────────────────────
 * Duplicated verbatim from `PetProfileModal.tsx` rather than extracted to
 * a shared `profile/` module — keeps the 1.5b diff inside the allowed
 * file boundaries (only `src/ui/components/` and `src/ui/components/people/`).
 * Promote to `src/ui/components/profile/primitives.tsx` in a follow-up
 * cleanup session. See HANDOFF.md "Follow-ups". */

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
