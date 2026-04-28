import type { Country } from '../../../game/types/country';
import type { DiplomaRecord } from '../../../game/types/gameState';
import { formatSpecialization, stageDisplayName } from './educationFormat';

interface DiplomaHistorySectionProps {
  diplomas: DiplomaRecord[];
  country: Country;
}

/**
 * Read-only list of diplomas the player has earned. Empty until the first
 * stage graduation lands. Click-through detail modal lands later — for
 * now this is a flat summary list.
 */
export function DiplomaHistorySection({ diplomas, country }: DiplomaHistorySectionProps) {
  if (diplomas.length === 0) return null;

  return (
    <section
      data-testid="diploma-history"
      className="rounded-2xl border border-cream-dark bg-cream-light px-4 py-3 shadow-warm"
    >
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-brass">
        Diplomas earned
      </div>
      <ul className="mt-2 space-y-2">
        {diplomas.map((d, i) => (
          <li
            key={`${d.stageId}-${d.yearObtained}-${i}`}
            data-testid={`diploma-row-${d.stageId}`}
            className="rounded-2xl border border-cream-dark bg-cream px-3 py-2"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display text-[14px] font-bold tracking-[-0.01em] text-ink">
                {stageDisplayName(d.stageId, country)}
              </span>
              <span className="font-mono text-[11px] font-semibold tabular-nums text-ink-soft">
                ISCED {d.iscedLevel}
              </span>
            </div>
            <div className="mt-[2px] font-sans text-[12px] leading-snug text-ink-soft">
              {d.yearObtained} · GPA {d.finalGpa.toFixed(1)}
              {d.specialization ? ` · ${formatSpecialization(d.specialization)}` : ''}
              {!d.graduated ? ' · dropped out' : ''}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
