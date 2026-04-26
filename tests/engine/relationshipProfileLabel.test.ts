import { describe, expect, it } from 'vitest';
import { getRelationshipMetaLabel } from '../../src/ui/components/RelationshipProfileModal';
import type {
  CasualEx,
  FamilyMember,
  Fiance,
  Friend,
  Partner,
  Person,
  SignificantEx,
  Spouse,
} from '../../src/game/types/gameState';

/**
 * Pure derivation tested without rendering. Each branch must produce a
 * string the modal can drop in next to "Age N", or null for family rows
 * where the type-label header already covers the relationship.
 */

const basePerson: Person = {
  id: 'rel-test',
  baseId: 'rel-test',
  firstName: 'Sam',
  lastName: 'Smith',
  age: 30,
  alive: true,
  relationshipLevel: 70,
  metYear: 2020,
};

describe('getRelationshipMetaLabel', () => {
  it('partner → "together Xy" using yearsTogether', () => {
    const partner: Partner = { ...basePerson, type: 'partner', yearsTogether: 4 };
    expect(getRelationshipMetaLabel(partner, 'partner', 2025)).toBe('together 4y');
  });

  it('partner → falls back to currentYear - metYear when yearsTogether absent', () => {
    const partner = { ...basePerson, type: 'partner' as const };
    expect(getRelationshipMetaLabel(partner, 'partner', 2025)).toBe('together 5y');
  });

  it('fiance → "together Xy"', () => {
    const fiance: Fiance = { ...basePerson, type: 'fiance', yearsTogether: 1 };
    expect(getRelationshipMetaLabel(fiance, 'fiance', 2025)).toBe('together 1y');
  });

  it('spouse → "married Xy" using yearsTogether', () => {
    const spouse: Spouse = {
      ...basePerson,
      type: 'spouse',
      metYear: 2022,
      yearsTogether: 3,
    };
    expect(getRelationshipMetaLabel(spouse, 'spouse', 2025)).toBe('married 3y');
  });

  it('spouse → falls back to currentYear - metYear when yearsTogether absent', () => {
    const spouse: Spouse = { ...basePerson, type: 'spouse', metYear: 2022 };
    expect(getRelationshipMetaLabel(spouse, 'spouse', 2025)).toBe('married 3y');
  });

  it('friend → "Friends since YYYY"', () => {
    const friend: Friend = {
      ...basePerson,
      type: 'friend',
      metYear: 2018,
      yearsSinceContact: 0,
    };
    expect(getRelationshipMetaLabel(friend, 'friend', 2025)).toBe(
      'Friends since 2018',
    );
  });

  it('casualEx → "Former <slot> · Fades YYYY"', () => {
    const ex: CasualEx = {
      ...basePerson,
      type: 'casualEx',
      formerSlot: 'partner',
      decayYear: 2030,
    };
    expect(getRelationshipMetaLabel(ex, 'casualEx', 2025)).toBe(
      'Former partner · Fades 2030',
    );

    const fianceEx: CasualEx = { ...ex, formerSlot: 'fiance' };
    expect(getRelationshipMetaLabel(fianceEx, 'casualEx', 2025)).toBe(
      'Former fiancé(e) · Fades 2030',
    );
  });

  it('significantEx → "Former <slot>" without fade', () => {
    const ex: SignificantEx = {
      ...basePerson,
      type: 'significantEx',
      formerSlot: 'spouse',
      endYear: 2024,
    };
    expect(getRelationshipMetaLabel(ex, 'significantEx', 2025)).toBe(
      'Former spouse',
    );

    const fianceEx: SignificantEx = { ...ex, formerSlot: 'fiance' };
    expect(getRelationshipMetaLabel(fianceEx, 'significantEx', 2025)).toBe(
      'Former fiancé(e)',
    );
  });

  it('family rows → null (type-label header covers it)', () => {
    const father: FamilyMember = { ...basePerson, type: 'father' };
    const mother: FamilyMember = { ...basePerson, type: 'mother' };
    const sibling: FamilyMember = { ...basePerson, type: 'sibling' };
    const child: FamilyMember = { ...basePerson, type: 'child' };
    expect(getRelationshipMetaLabel(father, 'father', 2025)).toBeNull();
    expect(getRelationshipMetaLabel(mother, 'mother', 2025)).toBeNull();
    expect(getRelationshipMetaLabel(sibling, 'sibling', 2025)).toBeNull();
    expect(getRelationshipMetaLabel(child, 'child', 2025)).toBeNull();
  });

  it('clamps negative deltas to 0 (metYear in the future)', () => {
    const partner = { ...basePerson, type: 'partner' as const, metYear: 2030 };
    expect(getRelationshipMetaLabel(partner, 'partner', 2025)).toBe('together 0y');
  });
});
