interface JobListingProps {
  title: string;
  /** Short, observed line — Sunny Side voice. */
  hook: string;
  /** Right-rail trailing string: salary for Find Work, gate for Special. */
  meta: string;
  onClick: () => void;
  testId?: string;
}

/**
 * Single listing row used by both Find Work and Special Careers. Mirrors
 * the visual rhythm of `ActivityRow` (cream card, ink-bordered, subtle
 * drop shadow) so the Career screen reads as part of the same family
 * even though the leading affordance is text instead of an icon block.
 */
export function JobListing({ title, hook, meta, onClick, testId }: JobListingProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="flex w-full items-center gap-3 rounded-[14px] border border-cream-dark bg-cream px-3 py-[10px] text-left shadow-[0_2px_0_rgba(0,0,0,0.03)] transition hover:bg-peach-light/40 active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold text-[13.5px] tracking-[-0.01em] text-ink">
          {title}
        </div>
        <div className="mt-[1px] truncate text-[11.5px] leading-[1.3] text-ink-soft">
          {hook}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] text-brass">
          {meta}
        </span>
      </div>
    </button>
  );
}
