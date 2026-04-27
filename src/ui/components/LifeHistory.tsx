import type { HistoryEntry } from '../../game/types/gameState';

interface LifeHistoryProps {
  history: HistoryEntry[];
}

export function LifeHistory({ history }: LifeHistoryProps) {
  if (history.length === 0) {
    return <div className="text-ink-faint text-sm italic">No history yet.</div>;
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
        <div key={age} className="border-l-2 border-cream-dark pl-3">
          <div className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-faint mb-1">
            Age {age}
          </div>
          {byAge.get(age)!.map((entry, idx) => (
            <div
              key={`${entry.eventId}-${idx}`}
              className="text-sm text-ink-soft mb-2"
            >
              <div>{entry.description}</div>
              {entry.choiceLabel && (
                <div className="text-xs text-ink-faint italic">
                  → {entry.choiceLabel}
                </div>
              )}
              {entry.outcomeNarrative && (
                <div className="text-xs text-ink-soft italic mt-0.5">
                  “{entry.outcomeNarrative}”
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
