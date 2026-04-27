import { MOCK_CAREER_HISTORY, type CareerHistoryEntry } from './careerData';

interface CareerHistorySectionProps {
  /**
   * History rows to display. Defaults to the mock ledger because the
   * engine has no past-jobs concept yet — once `player.pastJobs` lands,
   * `CareerScreen` passes it through and this default goes away.
   */
  entries?: ReadonlyArray<CareerHistoryEntry>;
}

/**
 * "HISTORY · {n} jobs" section pinned below all collapsible career
 * sections. Always visible (no toggle) per the mockup; the rows are
 * deliberately quieter than Current Position so the eye still lands on
 * the live job at the top of the screen. Empty state shows a single
 * italic line — no CTA, since the only path to history is to live some.
 */
export function CareerHistorySection({
  entries = MOCK_CAREER_HISTORY,
}: CareerHistorySectionProps) {
  const count = entries.length;
  return (
    <section
      data-testid="career-history"
      className="rounded-2xl border border-cream-dark bg-cream-light shadow-warm overflow-hidden"
    >
      <header className="flex items-baseline justify-between gap-3 px-4 pt-3 pb-2">
        <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-soft">
          History
        </span>
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-ink-faint">
          {count} {count === 1 ? 'job' : 'jobs'}
        </span>
      </header>
      {count === 0 ? (
        <div className="border-t border-cream-dark px-4 py-4">
          <p className="font-sans text-[12px] italic leading-snug text-ink-soft">
            No previous jobs yet.
          </p>
        </div>
      ) : (
        <div className="border-t border-cream-dark divide-y divide-cream-dark">
          {entries.map((entry) => (
            <div
              key={entry.id}
              data-testid={`career-history-row-${entry.id}`}
              className="px-4 py-[10px]"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-bold text-[13px] tracking-[-0.01em] text-ink">
                  {entry.title}
                </div>
                <div className="font-mono text-[10px] font-medium tabular-nums text-ink-faint">
                  {entry.startYear}–{entry.endYear}
                </div>
              </div>
              <div className="mt-[1px] truncate font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
                {entry.company}
              </div>
              <div className="mt-[2px] text-[11.5px] leading-[1.3] italic text-ink-soft">
                {entry.reason}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
