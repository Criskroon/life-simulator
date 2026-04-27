import type { RelationshipType } from '../../../game/types/gameState';
import { BondTierMeter } from '../pets/BondTierMeter';
import {
  EX_BOND_CAPTION,
  FILL_CLASS_FOR_FLAVOR,
  TIER_SETS,
  flavorOf,
} from './types';

interface RelationshipBondMeterProps {
  /** Bond value 0..100. Same scale as `Person.relationshipLevel`. */
  value: number;
  /** Drives tier ladder + meter fill via `flavorOf`. */
  type: RelationshipType;
}

/**
 * Bond meter dispatcher. Picks the right ladder + fill for the four
 * relationship flavors, and renders an "emotional residue" caption
 * instead of a meter for `ex` flavors — past relationships don't pretend
 * to a tidy ladder.
 *
 * Wraps `pets/BondTierMeter` rather than re-implementing it: the bar
 * geometry is identical between Pet and Human surfaces, only the labels
 * and color change.
 */
export function RelationshipBondMeter({
  value,
  type,
}: RelationshipBondMeterProps) {
  const flavor = flavorOf(type);

  if (flavor === 'ex') {
    return (
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ink-faint">
        {EX_BOND_CAPTION}
      </div>
    );
  }

  return (
    <BondTierMeter
      value={value}
      tiers={TIER_SETS[flavor]}
      fillClass={FILL_CLASS_FOR_FLAVOR[flavor]}
    />
  );
}
