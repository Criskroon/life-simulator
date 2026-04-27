import { useState } from 'react';
import { migrateLegacyRelationships } from '../../game/engine/relationshipEngine';
import type {
  CasualEx,
  FamilyMember,
  Friend,
  PlayerState,
  Person,
  RelationshipState,
  RelationshipType,
  SignificantEx,
} from '../../game/types/gameState';
import { LifeHistory } from './LifeHistory';

const FAMILY_TIERS: Array<{ min: number; max: number; label: string }> = [
  { min: 0, max: 19, label: 'Distant' },
  { min: 20, max: 39, label: 'Companion' },
  { min: 40, max: 59, label: 'Bonded' },
  { min: 60, max: 79, label: 'Devoted' },
  { min: 80, max: 100, label: 'Inseparable' },
];

export function familyClosenessTier(level: number): string {
  const clamped = Math.max(0, Math.min(100, level));
  return FAMILY_TIERS.find((t) => clamped >= t.min && clamped <= t.max)!.label;
}

function ChevronRight() {
  return (
    <span
      data-testid="row-chevron"
      aria-hidden="true"
      className="font-sans text-base text-ink-faint leading-none shrink-0"
    >
      ›
    </span>
  );
}

function BondBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1 w-full rounded-full bg-cream-dark overflow-hidden mt-1">
      <div
        className="h-full bg-section-heart"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

type SidePanelView = 'history' | 'relationships';

type SelectHandler = (person: Person, type: RelationshipType) => void;

interface SidePanelProps {
  player: PlayerState;
  /** Which surface to render — Home shows history, People shows relationships. */
  view: SidePanelView;
  /** Optional — when present, relationship rows become clickable. */
  onSelect?: SelectHandler;
}

export function SidePanel({ player, view, onSelect }: SidePanelProps) {
  return (
    <div
      data-testid={`side-panel-${view}`}
      className="bg-cream-light border border-cream-dark rounded-2xl shadow-warm overflow-hidden"
    >
      <div className="p-4 max-h-[28rem] overflow-y-auto">
        {view === 'history' && <LifeHistory history={player.history} />}
        {view === 'relationships' && (
          <RelationshipsPanel player={player} onSelect={onSelect} />
        )}
      </div>
    </div>
  );
}

function RelationshipsPanel({
  player,
  onSelect,
}: {
  player: PlayerState;
  onSelect?: SelectHandler;
}) {
  const rs: RelationshipState =
    player.relationshipState ?? migrateLegacyRelationships(player.relationships);

  const hasAny =
    rs.partner ||
    rs.fiance ||
    rs.spouse ||
    rs.family.length ||
    rs.friends.length ||
    rs.significantExes.length ||
    rs.casualExes.length;

  if (!hasAny) return <Empty text="No relationships." />;

  return (
    <div className="space-y-4 text-sm text-ink-soft">
      {(rs.partner || rs.fiance || rs.spouse) && (
        <Section title="Active">
          {rs.spouse && (
            <SlotRow
              label="Spouse"
              person={rs.spouse}
              type="spouse"
              onSelect={onSelect}
            />
          )}
          {rs.fiance && (
            <SlotRow
              label="Fiancé(e)"
              person={rs.fiance}
              type="fiance"
              onSelect={onSelect}
            />
          )}
          {rs.partner && (
            <SlotRow
              label="Partner"
              person={rs.partner}
              type="partner"
              onSelect={onSelect}
            />
          )}
        </Section>
      )}

      {rs.family.length > 0 && (
        <Section title="Family">
          {rs.family.map((m) => (
            <FamilyRow key={m.id} member={m} onSelect={onSelect} />
          ))}
        </Section>
      )}

      {rs.friends.length > 0 && (
        <Section title="Friends">
          {rs.friends.map((f) => (
            <FriendRow key={f.id} friend={f} onSelect={onSelect} />
          ))}
        </Section>
      )}

      {rs.significantExes.length > 0 && (
        <Collapsible title={`Significant Exes (${rs.significantExes.length})`}>
          {rs.significantExes.map((e) => (
            <ExRow key={e.id} ex={e} kind="significant" onSelect={onSelect} />
          ))}
        </Collapsible>
      )}

      {rs.casualExes.length > 0 && (
        <Collapsible title={`Casual Exes (${rs.casualExes.length})`}>
          {rs.casualExes.map((e) => (
            <ExRow
              key={e.id}
              ex={e}
              kind="casual"
              currentYear={player.currentYear}
              onSelect={onSelect}
            />
          ))}
        </Collapsible>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-faint mb-1">
        {title}
      </div>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.05em] text-ink-faint mb-1"
      >
        <span>{title}</span>
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open && <ul className="space-y-1">{children}</ul>}
    </div>
  );
}

/**
 * Wraps a row in a clickable button when an `onSelect` callback is provided,
 * otherwise renders a plain list item — keeps the SidePanel usable in
 * surfaces without interaction support (e.g. the death screen recap).
 */
function ClickableRow({
  onClick,
  showChevron = false,
  children,
}: {
  onClick?: () => void;
  showChevron?: boolean;
  children: React.ReactNode;
}) {
  if (!onClick) {
    return (
      <li className="border-b border-cream-dark pb-1 last:border-0">{children}</li>
    );
  }
  return (
    <li className="border-b border-cream-dark pb-1 last:border-0">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left rounded-lg px-1 py-0.5 -mx-1 hover:bg-cream-dark/40 transition cursor-pointer flex items-center gap-2"
      >
        <div className="flex-1 min-w-0">{children}</div>
        {showChevron && <ChevronRight />}
      </button>
    </li>
  );
}

function SlotRow({
  label,
  person,
  type,
  onSelect,
}: {
  label: string;
  person: Person;
  type: RelationshipType;
  onSelect?: SelectHandler;
}) {
  return (
    <ClickableRow onClick={onSelect ? () => onSelect(person, type) : undefined}>
      <div className="font-medium text-ink">{label}</div>
      <div className="text-ink-soft">
        {person.firstName} {person.lastName} — age {person.age}
        {!person.alive && ' (deceased)'}
      </div>
      <div className="font-mono text-[11px] text-ink-faint">
        Bond: {person.relationshipLevel}/100
      </div>
    </ClickableRow>
  );
}

function FamilyRow({
  member,
  onSelect,
}: {
  member: FamilyMember;
  onSelect?: SelectHandler;
}) {
  const tier = familyClosenessTier(member.relationshipLevel);
  return (
    <ClickableRow
      onClick={onSelect ? () => onSelect(member, member.type) : undefined}
      showChevron={Boolean(onSelect)}
    >
      <div className="font-medium capitalize text-ink">{member.type}</div>
      <div className="text-ink-soft">
        {member.firstName} {member.lastName} — age {member.age}
        {!member.alive && ' (deceased)'}
      </div>
      <div
        data-testid={`family-tier-${member.id}`}
        className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-faint"
      >
        {tier}
      </div>
      <BondBar value={member.relationshipLevel} />
    </ClickableRow>
  );
}

function FriendRow({
  friend,
  onSelect,
}: {
  friend: Friend;
  onSelect?: SelectHandler;
}) {
  return (
    <ClickableRow onClick={onSelect ? () => onSelect(friend, 'friend') : undefined}>
      <div className="font-medium text-ink">
        Friend{friend.isBestFriend && <span className="ml-2 text-brass">★ best</span>}
      </div>
      <div className="text-ink-soft">
        {friend.firstName} {friend.lastName} — age {friend.age}
      </div>
      <div className="font-mono text-[11px] text-ink-faint">
        Closeness: {friend.relationshipLevel}/100
        {friend.yearsSinceContact > 1 &&
          ` · last spoke ${friend.yearsSinceContact}y ago`}
      </div>
    </ClickableRow>
  );
}

function ExRow({
  ex,
  kind,
  currentYear,
  onSelect,
}: {
  ex: CasualEx | SignificantEx;
  kind: 'casual' | 'significant';
  currentYear?: number;
  onSelect?: SelectHandler;
}) {
  const meta =
    kind === 'casual' && currentYear !== undefined
      ? `fades in ${Math.max(0, (ex as CasualEx).decayYear - currentYear)}y`
      : kind === 'significant'
        ? `since ${(ex as SignificantEx).endYear || '—'}`
        : '';
  const exType: RelationshipType = kind === 'casual' ? 'casualEx' : 'significantEx';
  return (
    <ClickableRow onClick={onSelect ? () => onSelect(ex, exType) : undefined}>
      <div className="font-medium capitalize text-ink">
        {ex.type === 'casualEx' ? 'Casual ex' : 'Significant ex'}
        {ex.formerSlot && (
          <span className="ml-2 font-mono text-[11px] text-ink-faint">
            (former {ex.formerSlot})
          </span>
        )}
      </div>
      <div className="text-ink-soft">
        {ex.firstName} {ex.lastName} — age {ex.age}
      </div>
      {meta && <div className="font-mono text-[11px] text-ink-faint">{meta}</div>}
    </ClickableRow>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-ink-faint italic text-sm">{text}</div>;
}
