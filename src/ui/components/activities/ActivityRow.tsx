interface ActivityRowProps {
  label: string;
  description: string;
  /** Pre-formatted, country-adjusted money string ("−€60", "−$8,500"). */
  costLabel?: string;
  apCost: number;
  tier: 'light' | 'big';
  /** Tailwind background class for the leading accent square. */
  accentClass: string;
  disabled?: boolean;
  disabledReason?: string;
  onClick: () => void;
  testId?: string;
}

/**
 * Reusable activity-list row, modelled on `RelationshipProfileModal`'s
 * action rows so the Sections detail screens feel like the same family
 * as Profile sheets. Cream card + ink-bordered accent square + label /
 * description + right-aligned cost stack (money chip on top, AP indicator
 * below). Hollow coral ring signals a free light activity; filled coral
 * dots signal AP-spending activities.
 */
export function ActivityRow({
  label,
  description,
  costLabel,
  apCost,
  tier,
  accentClass,
  disabled,
  disabledReason,
  onClick,
  testId,
}: ActivityRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className="text-left w-full bg-cream border border-cream-dark rounded-[14px] px-3 py-[10px] flex items-center gap-[10px] shadow-[0_2px_0_rgba(0,0,0,0.03)] disabled:opacity-55 disabled:cursor-not-allowed enabled:hover:bg-peach-light/40 enabled:active:scale-[0.99] transition"
    >
      <span
        aria-hidden="true"
        className={`w-9 h-9 rounded-[10px] border border-ink shrink-0 ${accentClass}`}
        style={{ boxShadow: '0 1.5px 0 rgba(0,0,0,0.08)' }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[13.5px] text-ink tracking-[-0.01em] truncate">
          {label}
        </div>
        <div className="text-[11.5px] text-ink-soft mt-[1px] leading-[1.3] truncate">
          {disabled && disabledReason ? disabledReason : description}
        </div>
      </div>
      <div className="flex flex-col items-end gap-[3px] shrink-0">
        {costLabel && (
          <span className="font-mono text-[11px] font-bold tabular-nums text-coral">
            {costLabel}
          </span>
        )}
        <ApCostIndicator cost={apCost} tier={tier} />
      </div>
    </button>
  );
}

/**
 * Mirrors the indicator in `RelationshipProfileModal`: hollow coral
 * ring for light + 0 AP, filled coral dots otherwise. Lets a player
 * skim the list and tell free from costed at a glance.
 */
function ApCostIndicator({
  cost,
  tier,
}: {
  cost: number;
  tier: 'light' | 'big';
}) {
  if (cost === 0 && tier === 'light') {
    return (
      <span
        aria-label="Free"
        className="w-[7px] h-[7px] rounded-full border border-coral inline-block"
      />
    );
  }
  return (
    <span
      aria-label={`${cost} action${cost === 1 ? '' : 's'}`}
      className="flex gap-[2px]"
    >
      {Array.from({ length: Math.max(1, cost) }).map((_, i) => (
        <span
          key={i}
          className="w-[7px] h-[7px] rounded-full bg-coral inline-block"
        />
      ))}
    </span>
  );
}
