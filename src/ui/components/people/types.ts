// UI-only people types. Mirrors the structure of `pets/types.ts`: the
// engine has the source-of-truth `Person`/`RelationshipType` shapes, and
// this file holds the *presentation* derivations (tier ladders, eyebrow
// labels, accent flavors) that only the People surfaces need.
//
// TODO(engine): if any of these labels graduate into engine logic
//               (e.g. event copy keying off "Soulmate" tier), promote
//               them to `src/game/types/gameState.ts` and re-export.

import type {
  CasualEx,
  Friend,
  Person,
  RelationshipType,
  SignificantEx,
} from '../../../game/types/gameState';
import type { RelationshipAction } from '../../../game/types/interactions';

/**
 * Visual flavor of a relationship — drives both the meter palette and the
 * action-row accent square color. Collapsing the 10 RelationshipTypes into
 * 4 flavors keeps the design system small.
 */
export type RelationshipFlavor = 'romantic' | 'family' | 'friend' | 'ex';

export function flavorOf(type: RelationshipType): RelationshipFlavor {
  switch (type) {
    case 'partner':
    case 'fiance':
    case 'spouse':
      return 'romantic';
    case 'father':
    case 'mother':
    case 'sibling':
    case 'child':
      return 'family';
    case 'friend':
      return 'friend';
    case 'casualEx':
    case 'significantEx':
      return 'ex';
  }
}

/**
 * 5-stop bond ladders. Asymmetric with the pet 4-stop on purpose — humans
 * carry more emotional resolution than pets, by design.
 *
 * `ex` is intentionally absent. Ex bonds render as numerical only ("emotional
 * residue is messy", per brief). Callers should switch on `flavorOf(...)`
 * and skip the meter for `'ex'`.
 */
export const TIER_SETS: Record<
  Exclude<RelationshipFlavor, 'ex'>,
  readonly [string, string, string, string, string]
> = {
  romantic: ['STRANGERS', 'WARM', 'CLOSE', 'DEEP', 'SOULMATE'],
  family: ['DISTANT', 'COMPANION', 'BONDED', 'DEVOTED', 'INSEPARABLE'],
  friend: [
    'ACQUAINTANCE',
    'FRIEND',
    'CLOSE FRIEND',
    'CONFIDANT',
    'INNER CIRCLE',
  ],
};

/**
 * Tailwind class for the meter fill. The romantic/family/friend tokens
 * already exist in tailwind.config.js (section.heart / section.body /
 * brass — same palette `PeopleScreenWithPets` already uses for badges).
 */
export const FILL_CLASS_FOR_FLAVOR: Record<RelationshipFlavor, string> = {
  romantic: 'bg-section-heart',
  family: 'bg-section-body',
  friend: 'bg-brass',
  ex: 'bg-ink-faint',
};

/**
 * Action-row leading-square accent class. Mirrors PetProfileModal's
 * `accentClass` field but type-driven instead of action-driven, since
 * relationship actions don't carry inherent color the way pet actions do.
 *
 * Big-ticket actions (propose, divorce, renew vows, etc.) override this
 * with `bg-coral` directly in the modal — see `BIG_TICKET_ACTION_IDS`.
 */
export const ACCENT_CLASS_FOR_FLAVOR: Record<RelationshipFlavor, string> = {
  romantic: 'bg-section-heart',
  family: 'bg-section-body',
  friend: 'bg-brass',
  ex: 'bg-ink-faint',
};

/**
 * Big-ticket actions get the coral accent square (load-bearing visual
 * weight). Source of truth: the engine's `tier` field on each
 * `RelationshipAction`.
 *
 *   - 'big'   → load-bearing (propose, marry, divorce, renew vows,
 *               have-kid, cancel engagement, suggest vacation when
 *               costed) → coral
 *   - 'light' → routine (compliment, gift, deep conversation, argue)
 *               → flavor accent (heart / body / brass / faint)
 *
 * Delegates the editorial call to `actions.ts` where it belongs. New
 * actions added in later sessions inherit the right treatment
 * automatically via their authored `tier` — no UI change required.
 *
 * Verified against ACTIONS_BY_TYPE (commit 2294076) — every authored
 * 'big' action is correctly load-bearing (propose/marry/divorce/renew/
 * have-kid/cancel-engagement/suggest-vacation), every 'light' action is
 * correctly routine (gift/compliment/deep-conversation/argue/spend-time/
 * plan-wedding).
 */
export function isBigTicketAction(action: RelationshipAction): boolean {
  return action.tier === 'big';
}

/**
 * Eyebrow string shown above the name in the modal header. Capitalized
 * with the heart suffix on romantic slots and the best-friend distinction
 * on friends. The ex variants encode the *former* slot so the player can
 * tell at a glance whether they're looking at a ghost of a partner or a
 * ghost of a marriage.
 */
export function eyebrowLabelOf(
  target: Person,
  type: RelationshipType,
): string {
  switch (type) {
    case 'partner':
      return 'PARTNER ♡';
    case 'fiance':
      return 'FIANCÉ ♡';
    case 'spouse':
      return 'SPOUSE ♡';
    case 'father':
      return 'FATHER';
    case 'mother':
      return 'MOTHER';
    case 'sibling':
      return 'SIBLING';
    case 'child':
      return 'CHILD';
    case 'friend':
      return (target as Friend).isBestFriend ? 'BEST FRIEND' : 'FRIEND';
    case 'significantEx': {
      const slot = (target as SignificantEx).formerSlot;
      return slot === 'spouse' ? 'EX-SPOUSE' : 'EX-FIANCÉ';
    }
    case 'casualEx': {
      const slot = (target as CasualEx).formerSlot;
      return slot === 'fiance' ? 'EX-FIANCÉ' : 'EX-PARTNER';
    }
  }
}

/**
 * Caption shown beneath the numerical bond on `ex` profiles in place of
 * the tier strip. Soft-spoken on purpose — past relationships shouldn't
 * pretend to a tidy ladder.
 */
export const EX_BOND_CAPTION = 'emotional residue';

/**
 * Runtime-only: detects the future `vignette` field on a Person without
 * forcing the engine type to declare it yet. Lets the modal light up
 * automatically once the engine grows the field, with zero UI churn.
 */
export function readVignette(target: Person): string | null {
  const v = (target as Person & { vignette?: unknown }).vignette;
  return typeof v === 'string' && v.trim().length > 0 ? v : null;
}
