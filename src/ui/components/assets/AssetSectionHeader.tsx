interface AssetSectionHeaderProps {
  /** Mono uppercase label — "LIQUID", "PROPERTY", "VEHICLES", "INVESTMENTS". */
  title: string;
  /** Trailing count phrase ("1 home", "2 holdings"). Hidden when omitted. */
  countLabel?: string;
  /** Optional "+ LABEL" pill on the right — entrance point to the future Shop. */
  pill?: {
    label: string;
    onClick: () => void;
    testId?: string;
  };
  testId?: string;
}

/**
 * Single header row that sits above each Assets section. Carries the
 * mono section label, a quiet count chip ("· 1 home"), and an optional
 * coral "+" pill that opens a future Shop sub-flow. Quiet by design —
 * the rows below are the focus, the header is just orientation.
 */
export function AssetSectionHeader({
  title,
  countLabel,
  pill,
  testId,
}: AssetSectionHeaderProps) {
  return (
    <div
      data-testid={testId}
      className="flex items-center justify-between gap-3 px-1"
    >
      <div className="min-w-0 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-soft">
        <span>{title}</span>
        {countLabel && (
          <span className="font-medium text-ink-faint"> · {countLabel}</span>
        )}
      </div>
      {pill && (
        <button
          type="button"
          onClick={pill.onClick}
          data-testid={pill.testId}
          className="shrink-0 rounded-full border border-coral bg-cream px-2 py-[2px] font-mono text-[9.5px] font-bold uppercase tracking-[0.08em] text-coral transition hover:bg-coral hover:text-cream-light active:scale-[0.98]"
        >
          + {pill.label}
        </button>
      )}
    </div>
  );
}
