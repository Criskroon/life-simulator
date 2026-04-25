import { useState } from 'react';
import type { PlayerState } from '../../game/types/gameState';
import { LifeHistory } from './LifeHistory';

type Tab = 'history' | 'job' | 'relationships' | 'assets' | 'crime';

interface SidePanelProps {
  player: PlayerState;
}

export function SidePanel({ player }: SidePanelProps) {
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
        {tab === 'relationships' && <RelationshipsPanel player={player} />}
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

function RelationshipsPanel({ player }: { player: PlayerState }) {
  if (player.relationships.length === 0) {
    return <Empty text="No relationships." />;
  }
  return (
    <ul className="text-sm text-slate-700 space-y-2">
      {player.relationships.map((r) => (
        <li key={r.id} className="border-b border-slate-100 pb-1 last:border-0">
          <div className="font-medium capitalize">{r.type}</div>
          <div className="text-slate-500">
            {r.firstName} {r.lastName} — age {r.age}
            {!r.alive && ' (deceased)'}
          </div>
          <div className="text-xs text-slate-400">
            Closeness: {r.relationshipLevel}/100
          </div>
        </li>
      ))}
    </ul>
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
