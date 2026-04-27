import { useState } from 'react';
import { migrateLegacyRelationships } from '../../game/engine/relationshipEngine';
import type {
  CasualEx,
  FamilyMember,
  Friend,
  Person,
  PlayerState,
  RelationshipState,
  RelationshipType,
  SignificantEx,
} from '../../game/types/gameState';
import { PetProfileModal } from './PetProfileModal';
import { MOCK_DECEASED_PETS, MOCK_PETS } from './pets/mockPets';
import { PetAvatar } from './pets/PetAvatar';
import { PetRow } from './pets/PetRow';
import type { DeceasedPet, Pet } from './pets/types';
import { useComingSoon } from './ComingSoonHandler';

interface PeopleScreenWithPetsProps {
  player: PlayerState;
  /** Re-uses the existing relationships flow — clicking a person opens
   *  RelationshipProfileModal via gameStore.openProfile. */
  onSelectPerson: (person: Person, type: RelationshipType) => void;
}

const FAMILY_TIERS: ReadonlyArray<{ min: number; max: number; label: string }> = [
  { min: 0, max: 19, label: 'Distant' },
  { min: 20, max: 39, label: 'Companion' },
  { min: 40, max: 59, label: 'Bonded' },
  { min: 60, max: 79, label: 'Devoted' },
  { min: 80, max: 100, label: 'Inseparable' },
];

function familyTier(level: number): string {
  const c = Math.max(0, Math.min(100, level));
  return FAMILY_TIERS.find((t) => c >= t.min && c <= t.max)!.label;
}

const FAMILY_TYPE_LABELS: Record<FamilyMember['type'], string> = {
  father: 'Father',
  mother: 'Mother',
  sibling: 'Sibling',
  child: 'Child',
};

/**
 * People + Pets surface — replaces the previous SidePanel relationships
 * view. Re-skinned to match the phase-5 mockup vocabulary (PersonRow,
 * collapsible sections, count chips).
 *
 * TODO(engine): pets are mocked — see mockPets.ts. When PlayerState.pets
 * lands, swap MOCK_PETS for player.pets and remove the import.
 */
export function PeopleScreenWithPets({
  player,
  onSelectPerson,
}: PeopleScreenWithPetsProps) {
  const [openPet, setOpenPet] = useState<Pet | null>(null);
  const { showComingSoon } = useComingSoon();

  const rs: RelationshipState =
    player.relationshipState ?? migrateLegacyRelationships(player.relationships);

  // TODO(engine): replace with player.pets
  const pets = MOCK_PETS;
  const deceasedPets = MOCK_DECEASED_PETS;

  // Header: "{humans} humans · {pets} pets · {year}"
  const humansCount =
    (rs.partner ? 1 : 0) +
    (rs.fiance ? 1 : 0) +
    (rs.spouse ? 1 : 0) +
    rs.family.length +
    rs.friends.length +
    rs.significantExes.length +
    rs.casualExes.length;

  const togetherSlot = rs.spouse ?? rs.fiance ?? rs.partner ?? null;
  const togetherLabel = rs.spouse
    ? 'Spouse'
    : rs.fiance
      ? 'Fiancé(e)'
      : rs.partner
        ? 'Partner'
        : null;
  const togetherYears = togetherSlot
    ? Math.max(0, player.currentYear - (togetherSlot.metYear ?? player.currentYear))
    : 0;

  return (
    <div data-testid="people-screen-with-pets" className="flex flex-col gap-[14px]">
      {/* Header strip — sub line. Title is supplied by the parent
          GameScreen's HeaderStrip; we only render the sub. */}
      <div
        data-testid="people-screen-summary"
        className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint -mt-2 mb-1"
      >
        {humansCount} humans · {pets.length} pets · {player.currentYear}
      </div>

      {togetherSlot && togetherLabel && (
        <Section title="Together" accent="text-section-heart">
          <PersonRow
            role={togetherLabel}
            sub={`${togetherYears}y · ${togetherSlot.age}`}
            person={togetherSlot}
            onClick={() => onSelectPerson(togetherSlot, togetherSlot.type)}
            heart
          />
        </Section>
      )}

      {/* Pets — the new first-class section */}
      <Section
        title="Pets"
        count={pets.length}
        action={
          <PillButton
            onClick={() => showComingSoon('Adopt a pet', 'Pet adoption flow lands later.')}
          >
            <PawGlyph />
            Adopt
          </PillButton>
        }
      >
        {pets.length === 0 ? (
          <Empty>No pets yet.</Empty>
        ) : (
          <div className="flex flex-col gap-[5px]">
            {pets.map((pet) => (
              <PetRow key={pet.id} pet={pet} onClick={() => setOpenPet(pet)} />
            ))}
          </div>
        )}
      </Section>

      {rs.family.length > 0 && (
        <Section title="Family" count={rs.family.length}>
          <div className="flex flex-col gap-[5px]">
            {rs.family.map((m) => (
              <FamilyRow
                key={m.id}
                member={m}
                onClick={() => onSelectPerson(m, m.type)}
              />
            ))}
          </div>
        </Section>
      )}

      {rs.friends.length > 0 && (
        <Section title="Friends" count={rs.friends.length}>
          <div className="flex flex-col gap-[5px]">
            {rs.friends.map((f) => (
              <FriendRow
                key={f.id}
                friend={f}
                onClick={() => onSelectPerson(f, 'friend')}
              />
            ))}
          </div>
        </Section>
      )}

      {rs.significantExes.length > 0 && (
        <CollapsibleSection
          title="Significant exes"
          count={rs.significantExes.length}
        >
          <div className="flex flex-col gap-[5px]">
            {rs.significantExes.map((ex) => (
              <ExRow
                key={ex.id}
                ex={ex}
                kind="significant"
                onClick={() => onSelectPerson(ex, 'significantEx')}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {rs.casualExes.length > 0 && (
        <CollapsibleSection title="Casual exes" count={rs.casualExes.length}>
          <div className="flex flex-col gap-[5px]">
            {rs.casualExes.map((ex) => (
              <ExRow
                key={ex.id}
                ex={ex}
                kind="casual"
                currentYear={player.currentYear}
                onClick={() => onSelectPerson(ex, 'casualEx')}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {deceasedPets.length > 0 && (
        <Section
          title="In memoriam"
          count={deceasedPets.length}
          action={
            <span className="font-mono text-[10px] text-ink-faint italic">
              they were good
            </span>
          }
        >
          <div className="flex flex-col gap-[5px]">
            {deceasedPets.map((d) => (
              <MemoriamRow key={d.id} pet={d} />
            ))}
          </div>
        </Section>
      )}

      {openPet && (
        <PetProfileModal pet={openPet} onClose={() => setOpenPet(null)} />
      )}
    </div>
  );
}

/* ── Section primitives ────────────────────────────────────────────────── */

function Section({
  title,
  count,
  action,
  accent = 'text-ink',
  children,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex justify-between items-center px-1 pb-2">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-display text-[16px] font-bold tracking-[-0.015em] ${accent}`}
          >
            {title}
          </span>
          {count != null && (
            <span className="font-mono text-[10px] text-ink-faint font-medium tracking-[0.04em]">
              {count}
            </span>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function CollapsibleSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex justify-between items-center px-1 pb-2 cursor-pointer bg-transparent border-none"
      >
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[16px] font-bold tracking-[-0.015em] text-ink">
            {title}
          </span>
          {count != null && (
            <span className="font-mono text-[10px] text-ink-faint font-medium tracking-[0.04em]">
              {count}
            </span>
          )}
        </div>
        <span className="font-mono text-[12px] text-ink-faint">
          {open ? '▾' : '▸'}
        </span>
      </button>
      {open && children}
    </div>
  );
}

function PillButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-[5px] bg-cream border border-cream-dark rounded-full px-[10px] py-[3px] font-mono text-[10px] font-bold uppercase tracking-[0.04em] text-ink-soft hover:bg-peach-light transition cursor-pointer"
    >
      {children}
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-cream-light border border-cream-dark border-dashed rounded-2xl px-3 py-3 text-[12px] text-ink-faint italic">
      {children}
    </div>
  );
}

/* ── Person rows (kit5 style) ──────────────────────────────────────────── */

function PersonAvatar({ initials }: { initials: string }) {
  return (
    <div
      aria-hidden="true"
      className="w-10 h-10 rounded-full bg-peach-light border border-cream-dark flex items-center justify-center font-display text-[14px] font-bold text-coral shrink-0 tracking-tight"
    >
      {initials}
    </div>
  );
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

function PersonRowChrome({
  initials,
  role,
  sub,
  bond,
  bondLabel,
  badge,
  trailing,
  onClick,
  testId,
  deceased,
}: {
  initials: string;
  role: string;
  sub: string;
  bond?: number;
  bondLabel?: string;
  badge?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  testId?: string;
  deceased?: boolean;
}) {
  const inner = (
    <div className="flex items-center gap-[10px] w-full">
      <PersonAvatar initials={initials} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-[6px]">
          <span className="font-medium text-[14px] text-ink leading-tight tracking-tight truncate">
            {role}
          </span>
          {badge}
          {deceased && (
            <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-ink-faint">
              · deceased
            </span>
          )}
        </div>
        <div className="font-mono text-[11px] text-ink-faint font-semibold uppercase tracking-[0.04em] mt-[2px] truncate">
          {sub}
        </div>
      </div>
      {trailing ?? (
        bond != null && (
          <div className="w-[60px] flex flex-col items-end gap-[3px] shrink-0">
            <span className="font-display font-bold text-[16px] text-ink leading-none tabular-nums tracking-tight">
              {bond}
            </span>
            <MiniBondBar value={bond} />
            {bondLabel && (
              <span className="font-mono text-[9px] uppercase tracking-[0.04em] text-ink-faint">
                {bondLabel}
              </span>
            )}
          </div>
        )
      )}
    </div>
  );

  const className =
    'bg-cream-light border border-cream-dark rounded-2xl px-3 py-2 shadow-[0_2px_0_rgba(0,0,0,0.03)]';

  if (!onClick) {
    return (
      <div data-testid={testId} className={className}>
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`text-left w-full ${className} hover:bg-peach-light/40 transition active:scale-[0.99]`}
    >
      {inner}
    </button>
  );
}

function initialsOf(p: { firstName: string; lastName: string }): string {
  const f = (p.firstName || '?').charAt(0);
  const l = (p.lastName || '').charAt(0);
  return `${f}${l}`.toUpperCase();
}

function PersonRow({
  role,
  sub,
  person,
  onClick,
  heart = false,
}: {
  role: string;
  sub: string;
  person: Person;
  onClick: () => void;
  heart?: boolean;
}) {
  return (
    <PersonRowChrome
      testId={`person-row-${person.id}`}
      initials={initialsOf(person)}
      role={`${role} · ${person.firstName} ${person.lastName}`.trim()}
      sub={sub}
      bond={person.relationshipLevel}
      onClick={onClick}
      deceased={!person.alive}
      badge={heart ? <HeartGlyph /> : undefined}
    />
  );
}

function FamilyRow({
  member,
  onClick,
}: {
  member: FamilyMember;
  onClick: () => void;
}) {
  const tier = familyTier(member.relationshipLevel);
  return (
    <PersonRowChrome
      testId={`family-row-${member.id}`}
      initials={initialsOf(member)}
      role={`${FAMILY_TYPE_LABELS[member.type]} · ${member.firstName} ${member.lastName}`.trim()}
      sub={`${member.age}`}
      bond={member.relationshipLevel}
      bondLabel={tier}
      onClick={onClick}
      deceased={!member.alive}
    />
  );
}

function FriendRow({
  friend,
  onClick,
}: {
  friend: Friend;
  onClick: () => void;
}) {
  const role = friend.isBestFriend ? 'Best friend' : 'Friend';
  const sub =
    friend.yearsSinceContact > 1
      ? `${friend.age} · last spoke ${friend.yearsSinceContact}y ago`
      : `${friend.age}`;
  return (
    <PersonRowChrome
      testId={`friend-row-${friend.id}`}
      initials={initialsOf(friend)}
      role={`${role} · ${friend.firstName} ${friend.lastName}`.trim()}
      sub={sub}
      bond={friend.relationshipLevel}
      onClick={onClick}
      deceased={!friend.alive}
      badge={friend.isBestFriend ? <StarGlyph /> : undefined}
    />
  );
}

function ExRow({
  ex,
  kind,
  currentYear,
  onClick,
}: {
  ex: CasualEx | SignificantEx;
  kind: 'casual' | 'significant';
  currentYear?: number;
  onClick: () => void;
}) {
  const role =
    kind === 'casual' ? 'Casual ex' : 'Significant ex';
  const sub =
    kind === 'casual' && currentYear !== undefined
      ? `${ex.age} · fades in ${Math.max(0, (ex as CasualEx).decayYear - currentYear)}y`
      : kind === 'significant'
        ? `${ex.age} · since ${(ex as SignificantEx).endYear || '—'}`
        : `${ex.age}`;
  return (
    <PersonRowChrome
      testId={`ex-row-${ex.id}`}
      initials={initialsOf(ex)}
      role={`${role} · ${ex.firstName} ${ex.lastName}`.trim()}
      sub={sub}
      bond={ex.relationshipLevel}
      onClick={onClick}
      deceased={!ex.alive}
    />
  );
}

function MemoriamRow({ pet }: { pet: DeceasedPet }) {
  return (
    <div
      data-testid={`memoriam-row-${pet.id}`}
      className="bg-cream border border-cream-dark border-dashed rounded-2xl px-3 py-2 flex items-center gap-[10px] opacity-85"
    >
      <PetAvatar species={pet.kind} color={pet.color} size={36} />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[13px] text-ink truncate">{pet.name}</div>
        <div className="font-mono text-[11px] text-ink-faint font-semibold tracking-[0.02em] truncate">
          {pet.breed} · '{String(pet.bornYear).slice(-2)} – '
          {String(pet.diedYear).slice(-2)} · {pet.yearsTogether} years together
        </div>
      </div>
      <UrnGlyph />
    </div>
  );
}

/* ── Glyphs ────────────────────────────────────────────────────────────── */

function HeartGlyph() {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-section-heart shrink-0"
      aria-hidden="true"
    >
      <path d="M12 21 Q4 14 4 9 Q4 5 8 5 Q11 5 12 8 Q13 5 16 5 Q20 5 20 9 Q20 14 12 21 Z" />
    </svg>
  );
}

function StarGlyph() {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-brass shrink-0"
      aria-hidden="true"
    >
      <path d="M12 3 L14.5 9 L21 9.6 L16 14 L17.5 20.5 L12 17 L6.5 20.5 L8 14 L3 9.6 L9.5 9 Z" />
    </svg>
  );
}

function PawGlyph() {
  return (
    <svg
      width={10}
      height={10}
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-ink-soft shrink-0"
      aria-hidden="true"
    >
      <ellipse cx={12} cy={16} rx={5} ry={4} />
      <circle cx={6.5} cy={11} r={1.8} />
      <circle cx={17.5} cy={11} r={1.8} />
      <circle cx={9} cy={7} r={1.6} />
      <circle cx={15} cy={7} r={1.6} />
    </svg>
  );
}

function UrnGlyph() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-ink-faint shrink-0"
      aria-hidden="true"
    >
      <path d="M6 8 H18 V10 Q18 12 16 12 H8 Q6 12 6 10 Z" />
      <path d="M7 12 Q7 16 9 19 H15 Q17 16 17 12" />
      <path d="M10 8 V5 H14 V8" />
    </svg>
  );
}
