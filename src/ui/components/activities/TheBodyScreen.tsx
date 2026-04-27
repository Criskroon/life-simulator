import { useEffect } from 'react';
import { adjustPrice, getCurrentCountry } from '../../../game/engine/countryEngine';
import type { PlayerState } from '../../../game/types/gameState';
import { useComingSoon } from '../ComingSoonHandler';
import { ActivityRow } from './ActivityRow';
import { BODY_ACTIVITIES, type BodyActivitySpec } from './bodyActivities';
import { SectionIcon } from './SectionIcons';

interface TheBodyScreenProps {
  player: PlayerState;
  /** Return to the Activities Menu (modal-replace pattern). */
  onBack: () => void;
  /** Close the entire activities flow. */
  onClose: () => void;
}

const TOTAL_ACTIONS = 3;

/**
 * Section detail surface — first of the eight Sections to be wired up.
 * Same chrome vocabulary as `ActivitiesMenuV2` (cream-light sheet,
 * rounded-3xl, ink/60 backdrop, max-w-phone) so the modal-replace
 * transition feels like a single surface deepening rather than a
 * second screen popping in.
 *
 * Header carries: back arrow → Activities Menu, X → close everything,
 * THE BODY eyebrow in section-body sage, headline + tagline. Below the
 * header sits the action-point bar; below that the scrollable list of
 * activity rows. Every row currently fires the Coming-soon toast —
 * engine wiring happens in a later session.
 */
export function TheBodyScreen({ player, onBack, onClose }: TheBodyScreenProps) {
  const { showComingSoon } = useComingSoon();
  const remaining = player.actionsRemainingThisYear;
  const country = getCurrentCountry(player);
  const symbol = country.currency.symbol;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const formatCost = (activity: BodyActivitySpec): string | undefined => {
    if (typeof activity.money !== 'number' || activity.money === 0)
      return undefined;
    const adjusted = Math.abs(adjustPrice(activity.money, country));
    return `−${symbol}${adjusted.toLocaleString()}`;
  };

  return (
    <div
      data-testid="the-body-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="the-body-title"
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/60 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="flex max-h-[92vh] w-full max-w-phone flex-col overflow-hidden rounded-3xl border border-cream-dark bg-cream shadow-warm-lg">
        {/* Header chrome — back / close + eyebrow + headline + tagline */}
        <header className="px-5 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              data-testid="the-body-back"
              aria-label="Back to all sections"
              className="inline-flex items-center gap-[3px] font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft transition hover:text-ink"
            >
              <BackGlyph />
              All sections
            </button>
            <button
              type="button"
              onClick={onClose}
              data-testid="the-body-close"
              aria-label="Close activities"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition hover:bg-cream-dark/60"
            >
              <CloseGlyph />
            </button>
          </div>

          <div className="mt-3 flex items-end gap-3">
            <span
              aria-hidden="true"
              className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-ink/10 bg-section-body text-cream-light shadow-[0_2px_0_rgba(0,0,0,0.08)]"
            >
              <SectionIcon iconKey="gym" size={26} />
            </span>
            <div className="min-w-0">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-section-body">
                The Body
              </div>
              <h2
                id="the-body-title"
                className="mt-[2px] font-display text-[24px] font-bold leading-[1.05] tracking-[-0.025em] text-ink"
              >
                Care, repair, alter.
              </h2>
            </div>
          </div>

          <p className="mt-2 font-sans text-[12.5px] italic leading-snug text-ink-soft">
            What you do with the only one you get.
          </p>
        </header>

        {/* Action-point strip */}
        <div className="flex items-center justify-between px-5 pb-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-ink-soft">
            {BODY_ACTIVITIES.length} activities
          </span>
          <div className="flex items-center gap-[6px]">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ink-faint">
              Have
            </span>
            <ActionPointPips remaining={remaining} total={TOTAL_ACTIONS} />
          </div>
        </div>

        {/* Activity list */}
        <div
          data-testid="the-body-list"
          className="flex flex-col gap-[6px] overflow-y-auto px-4 pb-5 pt-1"
        >
          {BODY_ACTIVITIES.map((activity) => (
            <ActivityRow
              key={activity.id}
              testId={`body-activity-${activity.id}`}
              label={activity.label}
              description={activity.description}
              costLabel={formatCost(activity)}
              apCost={activity.apCost}
              tier={activity.tier}
              accentClass={
                activity.tier === 'big' ? 'bg-coral' : 'bg-section-body'
              }
              onClick={() =>
                showComingSoon(activity.label, 'Body activities arrive next session.')
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ActionPointPipsProps {
  remaining: number;
  total: number;
}

function ActionPointPips({ remaining, total }: ActionPointPipsProps) {
  const filled = Math.max(0, Math.min(total, remaining));
  return (
    <div
      aria-label={`${filled} of ${total} actions left`}
      className="flex items-center gap-[5px]"
    >
      {Array.from({ length: total }, (_, i) => i < filled).map((isFilled, i) => (
        <span
          key={i}
          className={`block h-[10px] w-[10px] rounded-full border ${
            isFilled
              ? 'border-coral bg-coral'
              : 'border-cream-dark bg-transparent'
          }`}
        />
      ))}
    </div>
  );
}

function BackGlyph() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 6 L9 12 L15 18" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6 L18 18 M18 6 L6 18" />
    </svg>
  );
}
