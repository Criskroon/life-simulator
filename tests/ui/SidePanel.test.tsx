import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SidePanel,
  familyClosenessTier,
} from '../../src/ui/components/SidePanel';
import type {
  FamilyMember,
  PlayerState,
  RelationshipState,
} from '../../src/game/types/gameState';

afterEach(() => {
  cleanup();
});

function family(level: number, overrides: Partial<FamilyMember> = {}): FamilyMember {
  return {
    id: 'fam-1',
    type: 'mother',
    firstName: 'Lotte',
    lastName: 'Roelofsen',
    age: 30,
    alive: true,
    relationshipLevel: level,
    ...overrides,
  } as FamilyMember;
}

function player(family: FamilyMember[]): PlayerState {
  const rs: RelationshipState = {
    partner: null,
    fiance: null,
    spouse: null,
    family,
    friends: [],
    significantExes: [],
    casualExes: [],
  } as unknown as RelationshipState;
  return {
    relationshipState: rs,
    relationships: [],
    history: [],
    currentYear: 2030,
  } as unknown as PlayerState;
}

describe('familyClosenessTier', () => {
  it('maps low closeness to Distant', () => {
    expect(familyClosenessTier(0)).toBe('Distant');
    expect(familyClosenessTier(19)).toBe('Distant');
  });
  it('maps mid-low closeness to Companion', () => {
    expect(familyClosenessTier(20)).toBe('Companion');
    expect(familyClosenessTier(39)).toBe('Companion');
  });
  it('maps mid closeness to Bonded', () => {
    expect(familyClosenessTier(40)).toBe('Bonded');
    expect(familyClosenessTier(59)).toBe('Bonded');
  });
  it('maps mid-high closeness to Devoted', () => {
    expect(familyClosenessTier(60)).toBe('Devoted');
    expect(familyClosenessTier(79)).toBe('Devoted');
  });
  it('maps top closeness to Inseparable', () => {
    expect(familyClosenessTier(80)).toBe('Inseparable');
    expect(familyClosenessTier(100)).toBe('Inseparable');
  });
  it('clamps out-of-range values', () => {
    expect(familyClosenessTier(-5)).toBe('Distant');
    expect(familyClosenessTier(150)).toBe('Inseparable');
  });
});

describe('SidePanel — family rows', () => {
  it('renders the tier label instead of "Closeness: N/100"', () => {
    const { container, getByTestId } = render(
      <SidePanel
        player={player([family(70, { id: 'father-1', type: 'father' })])}
        view="relationships"
        onSelect={vi.fn()}
      />,
    );
    expect(getByTestId('family-tier-father-1').textContent).toBe('Devoted');
    expect(container.textContent ?? '').not.toMatch(/Closeness:\s*\d+\/100/);
  });

  it('renders a chevron at the end of each clickable family row', () => {
    const { getAllByTestId } = render(
      <SidePanel
        player={player([family(50)])}
        view="relationships"
        onSelect={vi.fn()}
      />,
    );
    expect(getAllByTestId('row-chevron').length).toBeGreaterThan(0);
  });

  it('omits the chevron when no onSelect handler is supplied', () => {
    const { queryByTestId } = render(
      <SidePanel
        player={player([family(50)])}
        view="relationships"
      />,
    );
    expect(queryByTestId('row-chevron')).toBeNull();
  });
});
