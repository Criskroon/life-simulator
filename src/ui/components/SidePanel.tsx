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

type Tab = 'history' | 'job' | 'relationships' | 'assets' | 'crime';

type SelectHandler = (person: Person, type: RelationshipType) => void;

interface SidePanelProps {
  player: PlayerState;
  /** Optional — when present, relationship rows become clickable. */
  onSelect?: SelectHandler;
}

export function SidePanel({ player, onSelect }: SidePanelProps) {
  const [tab, setTab] = useState<Tab>('history');

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="flex border-b border-slate-200 text-xs">
        {(['history', 'job', 'relationships', 'assets', 'crime'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2 capitalize ${
              tab === t
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                : 'text-slate-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-4 max-h-72 overflow-y-auto">
        {tab === 'history' && <LifeHistory history={player.history} />}
        {tab === 'job' && <JobPanel player={player} />}
        {tab === 'relationships' && (
          <RelationshipsPanel player={player} onSelect={onSelect} />
        )}
        {tab === 'assets' && <AssetsPanel player={player} />}
        {tab === 'crime' && <CrimePanel player={player} />}
      </div>
    </div>
  );
}

function JobPanel({ player }: { player: PlayerState }) {
  if (!player.job) return <Empty text="Unemployed." />;
  return (
    <div className="text-sm text-slate-700 space-y-1">
      <div className="font-semibold">{player.job.title}</div>
      <div className="text-slate-500">
        Salary: ${player.job.salary.toLocaleString()}
      </div>
      <div className="text-slate-500">Performance: {player.job.performance}/100</div>
      <div className="text-slate-500">Years at job: {player.job.yearsAtJob}</div>
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
    <div className="space-y-4 text-sm text-slate-700">
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
      <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">
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
        className="w-full flex items-center justify-between text-xs uppercase tracking-wider text-slate-400 mb-1"
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
  children,
}: {
  onClick?: () => void;
  children: React.ReactNode;
}) {
  if (!onClick) {
    return (
      <li className="border-b border-slate-100 pb-1 last:border-0">{children}</li>
    );
  }
  return (
    <li className="border-b border-slate-100 pb-1 last:border-0">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left rounded-lg px-1 py-0.5 -mx-1 hover:bg-slate-50 transition cursor-pointer"
      >
        {children}
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
      <div className="font-medium">{label}</div>
      <div className="text-slate-500">
        {person.firstName} {person.lastName} — age {person.age}
        {!person.alive && ' (deceased)'}
      </div>
      <div className="text-xs text-slate-400">
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
  return (
    <ClickableRow onClick={onSelect ? () => onSelect(member, member.type) : undefined}>
      <div className="font-medium capitalize">{member.type}</div>
      <div className="text-slate-500">
        {member.firstName} {member.lastName} — age {member.age}
        {!member.alive && ' (deceased)'}
      </div>
      <div className="text-xs text-slate-400">
        Closeness: {member.relationshipLevel}/100
      </div>
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
      <div className="font-medium">
        Friend{friend.isBestFriend && <span className="ml-2 text-amber-500">★ best</span>}
      </div>
      <div className="text-slate-500">
        {friend.firstName} {friend.lastName} — age {friend.age}
      </div>
      <div className="text-xs text-slate-400">
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
      <div className="font-medium capitalize">
        {ex.type === 'casualEx' ? 'Casual ex' : 'Significant ex'}
        {ex.formerSlot && (
          <span className="ml-2 text-xs text-slate-400">
            (former {ex.formerSlot})
          </span>
        )}
      </div>
      <div className="text-slate-500">
        {ex.firstName} {ex.lastName} — age {ex.age}
      </div>
      {meta && <div className="text-xs text-slate-400">{meta}</div>}
    </ClickableRow>
  );
}

function AssetsPanel({ player }: { player: PlayerState }) {
  if (player.assets.length === 0) return <Empty text="No assets owned." />;
  return (
    <ul className="text-sm text-slate-700 space-y-1">
      {player.assets.map((a) => (
        <li key={a.id}>
          {a.name} — ${a.currentValue.toLocaleString()}
        </li>
      ))}
    </ul>
  );
}

function CrimePanel({ player }: { player: PlayerState }) {
  if (player.criminalRecord.length === 0) {
    return <Empty text="Clean record. So far." />;
  }
  return (
    <ul className="text-sm text-slate-700 space-y-1">
      {player.criminalRecord.map((c) => (
        <li key={c.id}>
          {c.crime} (age {c.age}) {c.caught ? '— caught' : '— got away'}
        </li>
      ))}
    </ul>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-slate-500 italic text-sm">{text}</div>;
}
