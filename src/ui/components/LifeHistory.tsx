import type { HistoryEntry } from '../../game/types/gameState';

interface LifeHistoryProps {
  history: HistoryEntry[];
}

export function LifeHistory({ history }: LifeHistoryProps) {
  if (history.length === 0) {
    return <div className="text-slate-500 text-sm italic">No history yet.</div>;
  }
  // Group by age so the timeline reads top-down by year.
  const byAge = new Map<number, HistoryEntry[]>();
  for (const entry of history) {
    const list = byAge.get(entry.age) ?? [];
    list.push(entry);
    byAge.set(entry.age, list);
  }
  const ages = Array.from(byAge.keys()).sort((a, b) => b - a);

  return (
    <div className="flex flex-col gap-3">
      {ages.map((age) => (
        <div key={age} className="border-l-2 border-slate-300 pl-3">
          <div className="text-xs font-semibold text-slate-500 mb-1">
            Age {age}
          </div>
          {byAge.get(age)!.map((entry, idx) => (
            <div
              key={`${entry.eventId}-${idx}`}
              className="text-sm text-slate-700 mb-1"
            >
              <div>{entry.description}</div>
              {entry.choiceLabel && (
                <div className="text-xs text-slate-500 italic">
                  → {entry.choiceLabel}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
