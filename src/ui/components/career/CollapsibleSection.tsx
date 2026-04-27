import { type ReactNode } from 'react';

interface CollapsibleSectionProps {
  /** Section heading shown next to the chevron. */
  title: string;
  /** Optional small italic line under the title — sets context. */
  eyebrow?: string;
  /** Optional count or meta string in mono on the title row. */
  meta?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** Stable id used for testIds and the aria-controls hookup. */
  sectionId: string;
}

/**
 * Reusable collapsible block used by the Career screen. Header is a full-
 * width button so the whole row is tappable; the body slides via the
 * grid-rows trick (no JS animation lib needed). Closed sections still
 * render their children inside a clipped grid track so the height anim
 * runs from real measured content rather than guesswork.
 */
export function CollapsibleSection({
  title,
  eyebrow,
  meta,
  open,
  onToggle,
  children,
  sectionId,
}: CollapsibleSectionProps) {
  const bodyId = `career-section-${sectionId}-body`;
  return (
    <section
      data-testid={`career-section-${sectionId}`}
      data-open={open}
      className="border border-cream-dark bg-cream-light rounded-2xl shadow-warm overflow-hidden"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        data-testid={`career-section-${sectionId}-toggle`}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-cream-dark/40"
      >
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[16px] font-semibold tracking-[-0.015em] text-ink">
              {title}
            </span>
            {meta && (
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-ink-faint">
                {meta}
              </span>
            )}
          </div>
          {eyebrow && (
            <p className="mt-[2px] font-sans text-[11.5px] italic leading-snug text-ink-soft">
              {eyebrow}
            </p>
          )}
        </div>
        <span
          aria-hidden="true"
          className={`shrink-0 text-ink-faint transition-transform duration-200 ${
            open ? 'rotate-180' : 'rotate-0'
          }`}
        >
          <Chevron />
        </span>
      </button>
      <div
        id={bodyId}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-cream-dark px-4 py-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Chevron() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9 L12 15 L18 9" />
    </svg>
  );
}
