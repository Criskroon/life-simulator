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

interface RelationshipProfileModalProps {
  player: PlayerState;
  target: Person;
  targetType: RelationshipType;
  onAction: (actionId: string) => void;
  onClose: () => void;
}

const TYPE_LABELS: Record<RelationshipType, string> = {
  partner: 'Partner',
  fiance: 'Fiancé(e)',
  spouse: 'Spouse',
  father: 'Father',
  mother: 'Mother',
  sibling: 'Sibling',
  child: 'Child',
  friend: 'Friend',
  significantEx: 'Significant ex',
  casualEx: 'Casual ex',
};

const DISABLED_LABELS: Record<ActionDisabledReason, string> = {
  insufficient_actions: 'No actions left this year',
  insufficient_money: 'Not enough money',
  condition_failed: 'Not yet available',
  deceased: 'Deceased',
};

const FORMER_SLOT_LABELS: Record<'partner' | 'fiance' | 'spouse', string> = {
  partner: 'partner',
  fiance: 'fiancé(e)',
  spouse: 'spouse',
};

/**
 * Per-type extra metadata shown next to age in the profile header. Pure
 * derivation — exported so unit tests can pin the strings without standing
 * up the React tree.
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
 * Fullscreen profile for one Person. Mirrors the EventModal/ActivitiesMenu
 * layout so the three player-facing surfaces feel like the same family.
 *
 * The action list is status-aware: filtered by `applicableTo` upstream and
 * annotated with enabled/disabled reasons by the engine. Disabled actions
 * stay clickable-looking but inert with a reason label, matching the
 * disabled pattern from the activities menu.
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
  const typeLabel = TYPE_LABELS[targetType];
  const metaLabel = getRelationshipMetaLabel(target, targetType, player.currentYear);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="relationship-profile-title"
    >
      <div className="w-full max-w-phone bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">
            {typeLabel}
          </div>
          <h3
            id="relationship-profile-title"
            className="text-xl font-semibold text-slate-900"
          >
            {fullName}
          </h3>
          <div className="text-sm text-slate-500 mt-1">
            Age {target.age}
            {metaLabel && ` · ${metaLabel}`}
            {!target.alive && ' · Deceased'}
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs uppercase tracking-wider text-slate-400">
                Bond
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {target.relationshipLevel}/100
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-400 rounded-full transition-all"
                style={{ width: `${Math.max(0, Math.min(100, target.relationshipLevel))}%` }}
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex flex-col gap-2">
          {actions.length === 0 ? (
            <div className="text-sm text-slate-500 italic text-center py-4">
              More actions coming soon.
            </div>
          ) : (
            actions.map((entry) => (
              <ActionRow
                key={entry.action.id}
                entry={entry}
                player={player}
                onPick={onAction}
              />
            ))
          )}
        </div>

        <div className="px-5 pb-5 pt-2 border-t border-slate-100">
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

interface ActionRowProps {
  entry: AvailableAction;
  player: PlayerState;
  onPick: (actionId: string) => void;
}

function ActionRow({ entry, player, onPick }: ActionRowProps) {
  const { action, enabled, disabledReason } = entry;
  const preview = getChoicePreview(
    { label: action.label, cost: action.cost },
    player,
  );
  const negative = preview.adjustedCost !== null && preview.adjustedCost < 0;
  const positive = preview.adjustedCost !== null && preview.adjustedCost > 0;
  const apCost =
    action.tier === 'big' ? (action.actionCost ?? 1) : (action.actionCost ?? 0);

  return (
    <button
      type="button"
      onClick={() => enabled && onPick(action.id)}
      disabled={!enabled}
      className="text-left bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-900 rounded-xl px-4 py-3 transition active:scale-[0.99] flex flex-col gap-1"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium">{action.label}</span>
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {action.tier === 'big'
            ? `${apCost} action${apCost === 1 ? '' : 's'}`
            : 'Free'}
        </span>
      </div>
      {action.description && (
        <p className="text-xs text-slate-500">{action.description}</p>
      )}
      <div className="flex items-center justify-between gap-3 mt-0.5">
        {preview.costLabel ? (
          <span
            className={`text-xs font-semibold ${
              negative
                ? 'text-slate-600'
                : positive
                  ? 'text-emerald-600'
                  : 'text-slate-600'
            }`}
          >
            {preview.costLabel}
          </span>
        ) : (
          <span />
        )}
        {!enabled && disabledReason && (
          <span className="text-xs text-rose-500 font-semibold">
            {DISABLED_LABELS[disabledReason]}
          </span>
        )}
      </div>
    </button>
  );
}
